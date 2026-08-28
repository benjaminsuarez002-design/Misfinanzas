package com.misfinanzas.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Captura un movimiento por voz y lo deja pendiente en Mis Finanzas. */
public class VoiceCaptureActivity extends Activity implements RecognitionListener {
    private static final int REQUEST_AUDIO = 41;
    private static final String PREFS = "misfinanzas_voice";
    private static final String TOKEN = "voice_token";
    private static final String CAPTURE_URL = "https://misfinanzas-carga-rapida.benjaminsuarez002.workers.dev/capture";
    private SpeechRecognizer recognizer;
    private TextView status;
    private ProgressBar progress;
    private String pendingText;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.voice_capture);
        status = findViewById(R.id.voiceStatus);
        progress = findViewById(R.id.voiceProgress);
        CharSequence supplied = getIntent().getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
        pendingText = supplied == null ? null : supplied.toString().trim();
        String token = getSharedPreferences(PREFS, MODE_PRIVATE).getString(TOKEN, "");
        if (token.isEmpty()) askForToken(); else if (pendingText != null && !pendingText.isEmpty()) sendCapture(pendingText); else startListening();
    }

    private void askForToken() {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setHint("Clave de Mis Finanzas");
        new android.app.AlertDialog.Builder(this)
            .setTitle("Configurar carga rápida")
            .setMessage("Copiá la clave desde Configuración → Carga rápida con Siri.")
            .setView(input)
            .setPositiveButton("Guardar", (d, w) -> {
                String value = input.getText().toString().trim();
                if (value.isEmpty()) { Toast.makeText(this, "Falta la clave", Toast.LENGTH_SHORT).show(); finish(); return; }
                getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(TOKEN, value).apply();
                if (pendingText != null && !pendingText.isEmpty()) sendCapture(pendingText); else startListening();
            })
            .setNegativeButton("Cancelar", (d, w) -> finish())
            .setOnCancelListener(d -> finish()).show();
    }

    private void startListening() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) { requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQUEST_AUDIO); return; }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { showError("El reconocimiento de voz no está disponible"); return; }
        status.setText("Escuchando… decí tu gasto");
        progress.setVisibility(ProgressBar.VISIBLE);
        recognizer = SpeechRecognizer.createSpeechRecognizer(this);
        recognizer.setRecognitionListener(this);
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-AR");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        recognizer.startListening(intent);
    }

    @Override public void onRequestPermissionsResult(int request, String[] permissions, int[] results) { super.onRequestPermissionsResult(request, permissions, results); if (request == REQUEST_AUDIO && results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) startListening(); else showError("Necesito permiso para usar el micrófono"); }
    @Override public void onResults(Bundle results) { ArrayList<String> values = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION); if (values == null || values.isEmpty()) { showError("No entendí el movimiento"); return; } sendCapture(values.get(0)); }

    private void sendCapture(String text) {
        if (recognizer != null) recognizer.stopListening();
        status.setText("Guardando…");
        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(CAPTURE_URL).openConnection();
                connection.setRequestMethod("POST"); connection.setConnectTimeout(10000); connection.setReadTimeout(10000); connection.setDoOutput(true); connection.setRequestProperty("Content-Type", "application/json");
                String token = getSharedPreferences(PREFS, MODE_PRIVATE).getString(TOKEN, "");
                String json = "{\"token\":\"" + escape(token) + "\",\"text\":\"" + escape(text) + "\"}";
                try (OutputStream out = connection.getOutputStream()) { out.write(json.getBytes(StandardCharsets.UTF_8)); }
                int code = connection.getResponseCode(); InputStream stream = code >= 400 ? connection.getErrorStream() : connection.getInputStream();
                String response = read(stream); boolean ok = code >= 200 && code < 300 && response.contains("\"ok\":true");
                runOnUiThread(() -> { if (ok) { Toast.makeText(this, "✅ Gasto anotado", Toast.LENGTH_SHORT).show(); finish(); } else showError("No se pudo guardar. Revisá la clave."); });
            } catch (Exception e) { runOnUiThread(() -> showError("Sin conexión. Intentá de nuevo.")); } finally { if (connection != null) connection.disconnect(); }
        });
    }
    private static String read(InputStream stream) throws Exception { if (stream == null) return ""; StringBuilder b = new StringBuilder(); try (BufferedReader r = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) { String line; while ((line = r.readLine()) != null) b.append(line); } return b.toString(); }
    private static String escape(String value) { return String.valueOf(value).replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "\\r").replace("\n", "\\n"); }
    private void showError(String message) { if (status != null) status.setText(message); if (progress != null) progress.setVisibility(ProgressBar.INVISIBLE); Toast.makeText(this, message, Toast.LENGTH_LONG).show(); }
    @Override protected void onDestroy() { if (recognizer != null) recognizer.destroy(); executor.shutdownNow(); super.onDestroy(); }
    @Override public void onReadyForSpeech(Bundle p) {} @Override public void onBeginningOfSpeech() {} @Override public void onRmsChanged(float v) {} @Override public void onBufferReceived(byte[] b) {} @Override public void onEndOfSpeech() { if (status != null) status.setText("Procesando…"); } @Override public void onError(int e) { showError("No entendí. Probá otra vez."); } @Override public void onPartialResults(Bundle b) {} @Override public void onEvent(int e, Bundle b) {}
}

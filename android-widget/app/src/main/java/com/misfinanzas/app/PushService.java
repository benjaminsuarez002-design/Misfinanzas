package com.misfinanzas.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class PushService extends FirebaseMessagingService {
    static final String CHANNEL = "misfinanzas_avisos";

    static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            context.getSystemService(NotificationManager.class).createNotificationChannel(
                new NotificationChannel(CHANNEL, "Recordatorios de Mis Finanzas", NotificationManager.IMPORTANCE_DEFAULT));
        }
    }

    @Override public void onNewToken(String token) {
        getSharedPreferences("misfinanzas_push", MODE_PRIVATE).edit().putString("token", token).apply();
    }

    @Override public void onMessageReceived(RemoteMessage message) {
        // Android displays notification payloads itself when the app is in the background.
        if (message.getNotification() == null) return;
        createChannel(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
        String eventId = message.getData().get("eventId");
        String key = eventId == null ? message.getMessageId() : eventId;
        int id = (key == null ? "misfinanzas" : key).hashCode();
        Intent intent = new Intent(this, MainActivity.class).putExtra("push", true);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending = PendingIntent.getActivity(this, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        builder.setSmallIcon(R.drawable.ic_money).setContentTitle(message.getNotification().getTitle())
            .setContentText(message.getNotification().getBody()).setAutoCancel(true).setContentIntent(pending);
        getSystemService(NotificationManager.class).notify(id, builder.build());
    }
}

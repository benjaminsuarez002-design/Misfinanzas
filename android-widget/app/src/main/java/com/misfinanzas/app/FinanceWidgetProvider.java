package com.misfinanzas.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/** Compact home-screen microphone widget. */
public class FinanceWidgetProvider extends AppWidgetProvider {
    private static final int FLAGS = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateWidget(context, manager, id);
    }
    private static void updateWidget(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finance_widget);
        views.setOnClickPendingIntent(R.id.widgetMicBar, openVoice(context, 105));
        manager.updateAppWidget(id, views);
    }
    private static PendingIntent openVoice(Context context, int requestCode) {
        Intent intent = new Intent(context, VoiceCaptureActivity.class)
            .setAction("com.misfinanzas.app.ANOTAR_GASTO")
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, requestCode, intent, FLAGS);
    }
}

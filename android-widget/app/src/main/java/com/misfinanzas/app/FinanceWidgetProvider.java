package com.misfinanzas.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/** Home-screen widget with the four existing quick movement buttons. */
public class FinanceWidgetProvider extends AppWidgetProvider {
    private static final int FLAGS = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateWidget(context, manager, id);
    }
    @Override public void onEnabled(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        onUpdate(context, manager, manager.getAppWidgetIds(new ComponentName(context, FinanceWidgetProvider.class)));
    }
    private static void updateWidget(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finance_widget);
        views.setOnClickPendingIntent(R.id.widgetHeader, openApp(context, null, 100));
        views.setOnClickPendingIntent(R.id.widgetIngreso, openApp(context, "ingreso", 101));
        views.setOnClickPendingIntent(R.id.widgetGasto, openApp(context, "gasto", 102));
        views.setOnClickPendingIntent(R.id.widgetCredito, openApp(context, "credito", 103));
        views.setOnClickPendingIntent(R.id.widgetFijo, openApp(context, "fijo", 104));
        manager.updateAppWidget(id, views);
    }
    private static PendingIntent openApp(Context context, String type, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (type != null) intent.putExtra(MainActivity.EXTRA_MOVEMENT_TYPE, type);
        return PendingIntent.getActivity(context, requestCode, intent, FLAGS);
    }
}

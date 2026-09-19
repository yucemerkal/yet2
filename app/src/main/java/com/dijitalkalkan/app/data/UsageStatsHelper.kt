package com.dijitalkalkan.app.data

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import java.util.Calendar

data class AppUsage(
    val packageName: String,
    val appLabel: String,
    val minutesToday: Long
)

/**
 * Android'in UsageStatsManager API'sini kullanarak bugünkü uygulama kullanım
 * sürelerini okur.
 *
 * ÖNEMLİ GERÇEK KISITLAMA: Bu veriye erişim için kullanıcının Ayarlar >
 * Özel erişim > Kullanım verilerine erişim ekranından bu uygulamaya elle
 * izin vermesi gerekir. Bu izin normal "runtime permission" diyalogları gibi
 * kod ile otomatik istenemez; sadece ilgili ayar ekranına yönlendirilebilir.
 */
object UsageStatsHelper {

    fun hasUsagePermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.unsafeCheckOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun openUsageAccessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    /** Bugün gün başlangıcından şu ana kadar, uygulama başına kullanım (dakika). */
    fun getTodayUsage(context: Context): List<AppUsage> {
        if (!hasUsagePermission(context)) return emptyList()

        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        val statsList = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY, startTime, endTime
        ) ?: return emptyList()

        val pm = context.packageManager

        return statsList
            .filter { it.totalTimeInForeground > 0 }
            .map { stat ->
                val label = try {
                    val appInfo = pm.getApplicationInfo(stat.packageName, 0)
                    pm.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    stat.packageName
                }
                AppUsage(
                    packageName = stat.packageName,
                    appLabel = label,
                    minutesToday = stat.totalTimeInForeground / 1000 / 60
                )
            }
            .sortedByDescending { it.minutesToday }
    }

    fun getTotalMinutesToday(context: Context): Long =
        getTodayUsage(context).sumOf { it.minutesToday }
}

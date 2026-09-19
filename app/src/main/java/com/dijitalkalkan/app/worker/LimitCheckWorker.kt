package com.dijitalkalkan.app.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.dijitalkalkan.app.data.PrefsManager
import com.dijitalkalkan.app.data.UsageStatsHelper
import com.dijitalkalkan.app.notification.NotificationHelper
import java.util.concurrent.TimeUnit

/**
 * Her 15 dakikada bir (Android WorkManager'ın izin verdiği asgari periyot budur,
 * daha sık kontrol için gerçek zamanlı bir foreground servis gerekir) bugünkü
 * kullanım verisini limitlerle karşılaştırır ve gerekirse bildirim gönderir.
 */
class LimitCheckWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val prefs = PrefsManager(applicationContext)
        val limits = prefs.getLimits()
        if (limits.isEmpty()) return Result.success()

        val usage = UsageStatsHelper.getTodayUsage(applicationContext)
        val usageMap = usage.associateBy { it.packageName }

        limits.forEach { (packageName, limitMinutes) ->
            val used = usageMap[packageName]?.minutesToday ?: 0L
            val label = usageMap[packageName]?.appLabel ?: packageName
            val remaining = limitMinutes - used

            when {
                remaining <= 0 -> NotificationHelper.sendLimitNotification(
                    applicationContext,
                    notifId = packageName.hashCode(),
                    title = "Günlük limite ulaşıldı",
                    text = "$label için bugünkü kullanım limitine ulaştın."
                )
                remaining in 1..15 -> NotificationHelper.sendLimitNotification(
                    applicationContext,
                    notifId = packageName.hashCode(),
                    title = "Süre azalıyor",
                    text = "$label için ${remaining} dakika kullanım süren kaldı."
                )
            }
        }

        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "dijitalkalkan_limit_check"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<LimitCheckWorker>(15, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}

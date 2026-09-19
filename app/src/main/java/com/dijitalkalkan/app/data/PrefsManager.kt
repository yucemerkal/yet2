package com.dijitalkalkan.app.data

import android.content.Context
import org.json.JSONObject

/**
 * Basit SharedPreferences tabanlı yerel veri saklama.
 * MVP'de tek cihaz üzerinde çalışır: ebeveyn burada limit belirler,
 * aynı cihaz üzerindeki "Çocuk Modu" bu limitleri okur ve uygular.
 *
 * İleride: bu sınıfın yerini Firebase Firestore alabilir, böylece
 * ebeveyn ve çocuk farklı cihazlarda olsa bile veriler senkronize olur.
 */
class PrefsManager(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences("dijitalkalkan_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_LIMITS = "app_limits_json" // { "com.paket": dakika }
        private const val KEY_SLEEP_START = "sleep_start_hour"
        private const val KEY_SLEEP_END = "sleep_end_hour"
        private const val KEY_SLEEP_ENABLED = "sleep_enabled"
    }

    fun getLimits(): Map<String, Int> {
        val raw = prefs.getString(KEY_LIMITS, null) ?: return emptyMap()
        val json = JSONObject(raw)
        val map = mutableMapOf<String, Int>()
        json.keys().forEach { key -> map[key] = json.getInt(key) }
        return map
    }

    fun setLimit(packageName: String, minutes: Int) {
        val current = getLimits().toMutableMap()
        if (minutes <= 0) current.remove(packageName) else current[packageName] = minutes
        val json = JSONObject()
        current.forEach { (k, v) -> json.put(k, v) }
        prefs.edit().putString(KEY_LIMITS, json.toString()).apply()
    }

    fun getSleepEnabled(): Boolean = prefs.getBoolean(KEY_SLEEP_ENABLED, false)

    fun setSleepWindow(enabled: Boolean, startHour: Int, endHour: Int) {
        prefs.edit()
            .putBoolean(KEY_SLEEP_ENABLED, enabled)
            .putInt(KEY_SLEEP_START, startHour)
            .putInt(KEY_SLEEP_END, endHour)
            .apply()
    }

    fun getSleepStartHour(): Int = prefs.getInt(KEY_SLEEP_START, 21)
    fun getSleepEndHour(): Int = prefs.getInt(KEY_SLEEP_END, 7)
}

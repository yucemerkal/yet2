package com.dijitalkalkan.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Divider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.dijitalkalkan.app.data.PrefsManager
import com.dijitalkalkan.app.data.UsageStatsHelper

/**
 * Kullanımı gözlemlenen uygulamalar sabit bir liste olarak tutuluyor (MVP basitliği için).
 * Gerçek bir sürümde bu liste, cihazda yüklü uygulamalardan dinamik olarak
 * (PackageManager.getInstalledApplications) oluşturulabilir.
 */
private val TRACKED_APPS = listOf(
    "com.google.android.youtube" to "YouTube",
    "com.zhiliaoapp.musically" to "TikTok",
    "com.instagram.android" to "Instagram",
    "com.android.chrome" to "Chrome"
)

@Composable
fun ParentSetupScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { PrefsManager(context) }
    var limits by remember { mutableStateOf(prefs.getLimits()) }
    var sleepEnabled by remember { mutableStateOf(prefs.getSleepEnabled()) }
    var sleepStart by remember { mutableStateOf(prefs.getSleepStartHour().toString()) }
    var sleepEnd by remember { mutableStateOf(prefs.getSleepEndHour().toString()) }
    val hasPermission = UsageStatsHelper.hasUsagePermission(context)

    Scaffold(
        topBar = { TopAppBar(title = { Text("Ebeveyn Paneli") }) }
    ) { padding: PaddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            if (!hasPermission) {
                item {
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Kullanım verilerini okuyabilmek için önce izin vermelisin.")
                            Button(
                                onClick = { UsageStatsHelper.openUsageAccessSettings(context) },
                                modifier = Modifier.padding(top = 8.dp)
                            ) {
                                Text("Kullanım Erişimi Ayarlarını Aç")
                            }
                        }
                    }
                }
            }

            item {
                Text(text = "Günlük Uygulama Limitleri (dakika)")
                Divider(modifier = Modifier.padding(vertical = 8.dp))
            }

            items(TRACKED_APPS) { (packageName, label) ->
                var value by remember(packageName) {
                    mutableStateOf((limits[packageName] ?: 0).let { if (it == 0) "" else it.toString() })
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = label, modifier = Modifier.padding(top = 14.dp))
                    OutlinedTextField(
                        value = value,
                        onValueChange = {
                            value = it.filter { c -> c.isDigit() }
                            val minutes = value.toIntOrNull() ?: 0
                            prefs.setLimit(packageName, minutes)
                            limits = prefs.getLimits()
                        },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                            keyboardType = KeyboardType.Number
                        ),
                        modifier = Modifier.width(100.dp),
                        singleLine = true
                    )
                }
            }

            item {
                Divider(modifier = Modifier.padding(vertical = 16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Uyku Modu")
                    Switch(
                        checked = sleepEnabled,
                        onCheckedChange = {
                            sleepEnabled = it
                            prefs.setSleepWindow(
                                it,
                                sleepStart.toIntOrNull() ?: 21,
                                sleepEnd.toIntOrNull() ?: 7
                            )
                        }
                    )
                }
                if (sleepEnabled) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        OutlinedTextField(
                            value = sleepStart,
                            onValueChange = {
                                sleepStart = it.filter { c -> c.isDigit() }
                                prefs.setSleepWindow(
                                    sleepEnabled,
                                    sleepStart.toIntOrNull() ?: 21,
                                    sleepEnd.toIntOrNull() ?: 7
                                )
                            },
                            label = { Text("Başlangıç (saat)") },
                            modifier = Modifier.width(150.dp)
                        )
                        OutlinedTextField(
                            value = sleepEnd,
                            onValueChange = {
                                sleepEnd = it.filter { c -> c.isDigit() }
                                prefs.setSleepWindow(
                                    sleepEnabled,
                                    sleepStart.toIntOrNull() ?: 21,
                                    sleepEnd.toIntOrNull() ?: 7
                                )
                            },
                            label = { Text("Bitiş (saat)") },
                            modifier = Modifier.width(150.dp)
                        )
                    }
                }
            }

            item {
                Button(onClick = onBack, modifier = Modifier.padding(top = 24.dp)) {
                    Text("Geri")
                }
            }
        }
    }
}

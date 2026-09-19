package com.dijitalkalkan.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Divider
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.dijitalkalkan.app.data.AppUsage
import com.dijitalkalkan.app.data.PrefsManager
import com.dijitalkalkan.app.data.UsageStatsHelper

@Composable
fun ChildMonitorScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { PrefsManager(context) }
    val hasPermission = UsageStatsHelper.hasUsagePermission(context)
    var usage by remember { mutableStateOf<List<AppUsage>>(emptyList()) }
    val limits = remember { prefs.getLimits() }

    if (hasPermission && usage.isEmpty()) {
        usage = UsageStatsHelper.getTodayUsage(context)
    }

    val totalMinutes = usage.sumOf { it.minutesToday }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Bugünkü Kullanımım") }) }
    ) { padding: PaddingValues ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {

            if (!hasPermission) {
                Text("Kullanım verilerini göstermek için izin gerekiyor.")
                Button(
                    onClick = { UsageStatsHelper.openUsageAccessSettings(context) },
                    modifier = Modifier.padding(top = 12.dp)
                ) {
                    Text("İzin Ver")
                }
            } else {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Toplam: ${totalMinutes / 60} sa ${totalMinutes % 60} dk")
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 16.dp))

                LazyColumn {
                    items(usage) { app ->
                        val limit = limits[app.packageName]
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = app.appLabel)
                            val limitText = if (limit != null) " / ${limit} dk limit" else ""
                            Text(text = "${app.minutesToday} dk$limitText")
                        }
                    }
                }
            }

            Button(onClick = onBack, modifier = Modifier.padding(top = 24.dp)) {
                Text("Geri")
            }
        }
    }
}

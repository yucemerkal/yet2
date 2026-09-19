package com.dijitalkalkan.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChildCare
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun HomeScreen(
    onParentModeClick: () -> Unit,
    onChildModeClick: () -> Unit
) {
    Scaffold { padding: PaddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "DijitalKalkan",
                fontSize = 28.sp
            )
            Text(
                text = "Sağlıklı ekran süresi yönetimi",
                modifier = Modifier.padding(top = 4.dp, bottom = 40.dp)
            )

            Button(
                onClick = onParentModeClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
            ) {
                Icon(Icons.Filled.Shield, contentDescription = null)
                Text(text = "  Ebeveyn Modu", modifier = Modifier.padding(start = 8.dp))
            }

            Button(
                onClick = onChildModeClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(top = 16.dp)
            ) {
                Icon(Icons.Filled.ChildCare, contentDescription = null)
                Text(text = "  Çocuk Modu", modifier = Modifier.padding(start = 8.dp))
            }
        }
    }
}

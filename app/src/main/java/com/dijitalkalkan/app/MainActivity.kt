package com.dijitalkalkan.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.dijitalkalkan.app.ui.screens.ChildMonitorScreen
import com.dijitalkalkan.app.ui.screens.HomeScreen
import com.dijitalkalkan.app.ui.screens.ParentSetupScreen
import com.dijitalkalkan.app.ui.theme.DijitalKalkanTheme
import com.dijitalkalkan.app.worker.LimitCheckWorker

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Limit kontrol işini planla (arka planda periyodik çalışır)
        LimitCheckWorker.schedule(applicationContext)

        setContent {
            DijitalKalkanTheme {
                DijitalKalkanApp()
            }
        }
    }
}

@Composable
fun DijitalKalkanApp() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onParentModeClick = { navController.navigate("parent_setup") },
                onChildModeClick = { navController.navigate("child_monitor") }
            )
        }
        composable("parent_setup") {
            ParentSetupScreen(onBack = { navController.popBackStack() })
        }
        composable("child_monitor") {
            ChildMonitorScreen(onBack = { navController.popBackStack() })
        }
    }
}

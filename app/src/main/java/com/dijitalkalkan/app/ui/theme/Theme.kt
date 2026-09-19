package com.dijitalkalkan.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val PrimaryBlue = Color(0xFF1E3A5F)
private val AccentSky = Color(0xFF4FC3F7)
private val ChildOrange = Color(0xFFFF8A65)

private val LightColors = lightColorScheme(
    primary = PrimaryBlue,
    secondary = AccentSky,
    tertiary = ChildOrange
)

private val DarkColors = darkColorScheme(
    primary = AccentSky,
    secondary = PrimaryBlue,
    tertiary = ChildOrange
)

@Composable
fun DijitalKalkanTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}

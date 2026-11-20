# TravelBuddy

Prototipo de aplicación de escritorio (HTML, CSS y JS puro, sin dependencias).

## Subir a GitHub Pages
1. Crea un repositorio nuevo en GitHub (por ejemplo `travelbuddy`).
2. Sube el contenido de esta carpeta (`index.html`, `css/`, `js/`, `assets/`, `README.md`) a la rama `main`.
3. En el repositorio: **Settings → Pages → Build and deployment**. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`, y pulsa **Save**.
4. En 1-2 minutos estará en `https://TU-USUARIO.github.io/travelbuddy/`.

## Vuelos de la demo (ficticios)
- **TB1234** · Madrid (MAD) → París (CDG) · Airbus A320-200
- **TB2026** · Barcelona (BCN) → Lisboa (LIS) · Boeing 737-800

Se aceptan mayúsculas, minúsculas y espacios (`tb 1234`).

## Qué incluye
- Registro e inicio de sesión simulados (`localStorage`). No uses contraseñas reales.
- Tutorial que ilumina cada opción del menú. Se repite desde Perfil.
- Mi viaje: ficha del vuelo, detalles de la aeronave, seguimiento familiar e itinerario (sitios, comida y actividades).
- Mapa: plano 2D y vista 3D interior del aeropuerto (flechas del teclado, botones o arrastrar), con avisos de documentación, distancia y tiempo a la puerta.
- Social: logros con progreso, foro con preguntas y respuestas de ejemplo (puedes publicar preguntas) y mapamundi que se colorea.

## Personalizar
- Foto de la portada: guarda `assets/hero.jpg` y se mostrará sola.
- Textos provisionales (subrayados con puntos): nombre del equipo; faltan `og:image` y `og:url`.
- Los datos de vuelos e itinerarios están en `js/flights.js`.

## Mejoras futuras
Backend y cuentas reales, API de vuelos, fotos 360° reales del interior del aeropuerto, mapamundi con fronteras reales, foro con respuestas, notificaciones a familiares.

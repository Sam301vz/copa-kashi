# Scorekeeper Robot Game · Copa Kashi 2026

Scorekeeper web para el **Robot Game de FIRST LEGO League Challenge – MASTERPIECE (2023-24)**:
5 equipos, 4 intentos cada uno, **dos mesas simultáneas**, referees anotando desde tablets, HUD para transmisión
y un enlace público que muestra **solo la clasificación**.

| Página | Para quién | Qué hace |
|---|---|---|
| `control.html` | Scorekeeper | Temporizador 2:30, carga de partidos, orden, resultados, exportar/importar |
| `referee.html?mesa=A&referee=1` (hasta `referee=3`) | Referees (tablet) | Hoja digital compartida por mesa; el referee 1 envía |
| `hud.html` | OBS / proyector | Marcador con reloj LEGO, animación del pintor con el resultado de cada partido y clasificación |
| `leaderboard.html` | **Público** | Clasificación en vivo, solo lectura |

Ranking según el reglamento oficial: **mejor puntaje de los 4 intentos**; desempate con el **2.º** y luego el **3.º** mejor.

---

## 1. Crear la base de datos en Firebase (gratis, 10 minutos)

1. Entra a <https://console.firebase.google.com> → **Crear un proyecto** (puedes desactivar Google Analytics).
2. Menú **Compilación → Realtime Database → Crear base de datos** → elige ubicación → **Comenzar en modo bloqueado**.
3. En la pestaña **Reglas** de Realtime Database borra todo, pega el contenido de `database.rules.json` y pulsa **Publicar**:
   ```json
   { "rules": { ".read": true, ".write": "auth != null" } }
   ```
   Cualquiera puede *leer* (necesario para el enlace público y el HUD); solo el staff con sesión puede *escribir*.
4. Menú **Compilación → Authentication → Comenzar** → pestaña **Método de acceso** → habilita **Correo electrónico/contraseña**.
5. Pestaña **Usuarios → Agregar usuario**: crea la cuenta del staff (ej. `staff@copakashi.com`). Esa cuenta la usan control y referees.
6. Engranaje ⚙ → **Configuración del proyecto → Tus apps → Web `</>`** → registra la app → copia el objeto `firebaseConfig`.
7. Abre `config.js` y pega los valores. **Revisa que `databaseURL` no esté vacío** (si falta, cópialo de la parte de arriba de Realtime Database, termina en `firebaseio.com` o `firebasedatabase.app`).

## 2. Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube **todos los archivos** de esta carpeta a la raíz (esta versión no tiene subcarpetas, así se puede subir desde el celular).
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**.
3. En 1-2 minutos tendrás la dirección `https://TU_USUARIO.github.io/TU_REPO/`.
4. Vuelve a Firebase → **Authentication → Configuración → Dominios autorizados → Agregar dominio** → `TU_USUARIO.github.io`.

> Sin `config.js` configurado, la app funciona en **Modo local** (aviso amarillo): sirve para practicar, pero solo sincroniza entre pestañas del mismo navegador.

## 3. Enlaces del día del evento

En `control.html` → sección **Pantalla del público** están todos listos para copiar:

- **Referee mesa A / B** → ábrelos en cada tablet e inicia sesión con la cuenta del staff.
- **Público** → `leaderboard.html`. Es el único que compartes (conviértelo en QR). No pide sesión y no tiene controles.
- **HUD** → para OBS o el proyector.

## 4. HUD en OBS

1. **Fuente → Navegador** → URL: `https://…/hud.html` → Ancho **1920**, Alto **1080**.
2. Marca **Controlar audio mediante OBS** para que salgan los sonidos por la transmisión.
3. Fondo transparente por defecto. Opciones: `hud.html?bg=green` (croma verde), `hud.html?bg=dark` (fondo oscuro para proyector), `&voz=0` quita la voz "3, 2, 1, LEGO".
4. Si abres el HUD en un navegador normal, pulsa **Activar sonido** una vez (los navegadores bloquean el audio hasta un clic).

## 5. Flujo de cada partido

La mesa de control tiene pestañas: **En vivo · Orden · Resultados · Enlaces · Ajustes**.

1. **Ajustes**: nombre del evento, **referees por mesa (1 a 3)** y los 5 equipos (solo nombre, sin número). Se genera el orden: 10 partidos, dos mesas a la vez.
2. **En vivo → Siguiente partido**: las hojas de los referees se limpian y muestran el equipo e intento.
3. **Iniciar**: la transmisión cambia sola al contador, cuenta 3-2-1 con sonido y "¡LEGO!". El reloj conserva sus ladrillos LEGO; el marco va verde (listo), amarillo (en juego) y rojo (últimos 30 s y final).
4. **Referees**: hasta 3 por mesa, todos sobre **la misma hoja en tiempo real**. El **referee 1 es el principal** y es el único que envía o corrige. Cada tablet muestra quién está conectado. La primera vez aparece una guía de 7 pasos (botón **Guía** para verla otra vez).
5. Cuando **las dos mesas envían**, control abre la ventana **"Puntajes enviados"** con el total y el detalle por misión de cada mesa. Verifica y pulsa **▶ Mostrar animación**: en la transmisión el pintor se voltea, pinta el cuadro con el resultado, se voltea y celebra.
6. **Resultado del partido** (pestaña En vivo) repite la animación cuando quieras; **Clasificación** muestra la tabla completa.
7. Correcciones: el referee principal pulsa **Corregir puntaje**, o en **Resultados** borras el intento con ✕. Si una tablet falla: **Guardar sin la tablet**.
8. Al final: **Resultados → CSV / Respaldo JSON**.

### Corredores LEGO
Mientras se juega el partido (sobre la barra del marcador) y en la pantalla de clasificación, dos personajes 3D corren y saltan pilas de ladrillos, al estilo del juego del dinosaurio. Cada 13 s entra otra pareja: pintor y bailarina, director y músico, ingeniero de sonido y pintor… Para quitarlos: `hud.html?corredores=0`.

### Sonido de la transmisión
- En **OBS** el sonido está siempre activo (marca "Controlar audio mediante OBS").
- En un **navegador normal** (proyector), Chrome bloquea el audio hasta el primer toque: el HUD muestra un aviso pequeño y basta un clic una vez. Para que suene sin tocar nada, abre el HUD en Chrome con el acceso directo:
  `chrome.exe --autoplay-policy=no-user-gesture-required --kiosk https://…/hud.html?bg=dark`

### Horarios y PDF
En **Orden** escribe la hora del primer partido y los minutos entre partidos → **Calcular todos los horarios**; luego puedes cambiar cualquier hora a mano. **Descargar horario en PDF** genera una hoja A4 con el estilo del evento. El público ve los mismos horarios en la pestaña **Partidos** de su enlace (se puede filtrar por equipo).

### Pantalla de PC o proyector
Usa el enlace **Pantalla de PC o proyector** (`hud.html?bg=dark`) y pulsa **F11** para pantalla completa. La escena se ajusta y se centra en cualquier pantalla; en OBS usa el enlace normal (fondo transparente) a 1920×1080.

## 6. Misiones

`missions.json` tiene los puntajes oficiales de MASTERPIECE (Robot Game Rulebook 2023-24) y se puede editar sin tocar código:
`bool` (sí/no), `choice` (opciones), `count` (contador con `max` y `maxFrom`), `requires` (bonus que depende de otra casilla).

Nota sobre **M14**: el texto de la misión y sus ejemplos dan **5 puntos por destino**, pero una de las hojas del reglamento dice 10.
La app usa **5** (el texto manda sobre la hoja). Si tu referee principal decide otra cosa, cambia `"pointsEach"` de `m14_dest`.

El **bonus de M02** (escenas iguales en ambas mesas) lo marca cada referee; la hoja le muestra en vivo qué color marcó la otra mesa.

## 7. Probar sin internet

Los módulos del navegador no funcionan abriendo el archivo con doble clic. Usa un servidor local:
```
python -m http.server 8000
```
y abre `http://localhost:8000/control.html`.

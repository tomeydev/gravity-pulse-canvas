🌌 Gravity Pulse – GitHub Copilot Guide
---------------------------------------

📁 Estructura Modular Base
Copilot debe ayudar a mantener la siguiente estructura en el desarrollo:

/core/
  - physics.js        -> Lógica de físicas 2D personalizadas o integradas (Planck.js)
/entities/
  - player.js         -> Comportamiento de Elyon (carga, impulso, control aéreo)
/levels/
  - levelData.js      -> Layout modular de niveles (zonas, obstáculos, orbes)
/ui/
  - hud.js            -> Interfaz: carga, energía, altura, power-ups disponibles
/assets/
  - sprites/, audio/, fx/ (uso futuro)
/main.js              -> Loop central, orquestación de lógica y render

🎮 Librerías de apoyo
Copilot debe preferir sugerencias que usen o sean compatibles con:

✔ Planck.js           -> para físicas 2D: impulsos, colisiones, gravedad personalizable
✔ TSParticles         -> sistema visual de partículas para carga, detonación y entorno
✔ dat.GUI             -> panel de debugging para modificar variables en tiempo real
✔ Stats.js            -> monitoreo de FPS y rendimiento

📐 Buenas prácticas sugeridas
Copilot debe seguir estas prácticas al sugerir o completar código:

✔ Separar lógica de renderizado, físicas y UI
✔ No mezclar código de input con actualizaciones de estado directamente
✔ Promover uso de constantes para ajustes de gameplay (GRAVITY, MAX_CHARGE)
✔ Priorizar claridad sobre optimización prematura
✔ Usar funciones puras cuando sea posible
✔ Documentar brevemente cada función nueva que sugiera

📚 Documentación MCP/Notion:
Este proyecto está conectado vía MCP a la documentación del juego Gravity Pulse en Notion.

Copilot debe tratar de alinear su asistencia con las reglas de diseño, mecánicas, estados del personaje y progresión de niveles descritos en el GDD.

🗃️ Control de versiones y convenciones
Copilot debe sugerir y respetar:

✔ Commits semánticos (Ej: `feat: add charge animation to Elyon`, `fix: resolve airDetonation bug`)
✔ Archivos nombrados en **camelCase** (ej: `levelData.js`, `chargeMechanic.js`)
✔ Funciones en **camelCase**
✔ Clases en **PascalCase** (ej: `Player`, `Platform`)
✔ Constantes en **UPPER_SNAKE_CASE** (ej: `MAX_CHARGE`)
✔ Ramificación por tipo de tarea si se aplica (ej: `feature/detonation-logic`, `refactor/entity-structure`)
✔ Comentarios en inglés para consistencia del repo si se publica

🏁 Metas:
1. Crear un prototipo funcional con jugabilidad vertical usando canvas.
2. Validar mecánicas de carga y detonación aérea.
3. Mantener escalabilidad para futura migración a Unity.
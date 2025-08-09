// core/planckWorld.js
// Planck.js world setup for Gravity Pulse (API oficial)
// Usar planck global (window.planck) para compatibilidad navegador
const planck = window.planck;

// Crea el mundo de físicas con gravedad hacia abajo (y positiva)
export const world = new planck.World(new planck.Vec2(0, 10)); // 10 m/s^2, óptimo para Planck.js

// Función para avanzar el mundo de físicas
export function stepWorld(dt = 1/60) {
  world.step(dt);
}

// No exportar planck como módulo, ya es global

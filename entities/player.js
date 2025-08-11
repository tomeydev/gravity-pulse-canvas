// entities/player.js
// Lógica y estado del jugador Elyon usando Planck.js
import { MAX_JUMP_CHARGE } from '../core/physics.js';
import { world } from '../core/planckWorld.js';
const planck = window.planck;

/**
 * Crea el cuerpo físico de Elyon en el mundo de Planck.js y asocia su estado de gameplay.
 * @param {Object} basePlatform - Plataforma base para posicionar a Elyon.
 * @returns {planck.Body} Cuerpo dinámico de Elyon con estado custom.
 */
export function createPlayer(basePlatform) {
  // Posición inicial centrada sobre la plataforma base
  const startX = (basePlatform.x + basePlatform.width / 2) / 30; // Escala canvas->mundo
  const startY = (basePlatform.y - 15) / 30;
  const radius = 15 / 30;
  // Crea el cuerpo dinámico
  const body = world.createBody({
    type: 'dynamic',
    position: new planck.Vec2(startX, startY),
    fixedRotation: true,
    userData: { type: 'elyon' }
  });
  body.createFixture(planck.Circle(radius), {
    density: 1,
    friction: 0.2,
    restitution: 0.0
  });
  // Ajusta damping para simular inercia levitante
  body.setLinearDamping(0.08);
  // Estado custom para gameplay
  body.elyon = {
    radius: 15,
    charge: 0,
    isCharging: false,
    isOnPlatform: false,
    airDetonations: 0,
    color: '#00ffff',
    coreColor: '#ff00ff',
    airDetonationColor: '#00ff00'
  };
  return body;
}

// Actualiza la carga del salto
export function updateCharge(elyonBody) {
  const e = elyonBody.elyon;
  if ((e.isCharging || e.isChargingDouble) && e.charge < MAX_JUMP_CHARGE) {
    e.charge += 2;
  }
}

// entities/player.js
// Lógica y estado del jugador Elyon
import { MAX_JUMP_CHARGE } from '../core/physics.js';

export function createPlayer(basePlatform) {
  return {
    x: basePlatform.x + basePlatform.width / 2,
    y: basePlatform.y - 15,
    radius: 15,
    vx: 0,
    vy: 0,
    charge: 0,
    isCharging: false,
    isOnPlatform: false,
    airDetonations: 0,
    color: '#00ffff',
    coreColor: '#ff00ff',
    airDetonationColor: '#00ff00'
  };
}

// Actualiza la carga del salto
export function updateCharge(player) {
  if ((player.isCharging || player.isChargingDouble) && player.charge < MAX_JUMP_CHARGE) {
    player.charge += 2;
  }
}

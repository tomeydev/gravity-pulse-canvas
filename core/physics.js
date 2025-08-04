// core/physics.js
// Constantes y funciones de físicas globales para Gravity Pulse

export const GRAVITY = 0.5;
export const GROUND_FRICTION = 0.85;
export const AIR_FRICTION = 0.98;
export const MOVE_SPEED = 0.8;
export const AIR_MOVE_SPEED = 0.4;
export const MAX_SPEED_X = 7;
export const JUMP_CHARGE_RATE = 2;
export const MAX_JUMP_CHARGE = 150;
export const JUMP_POWER = 0.1;
export const DOUBLE_JUMP_POWER = 0.075;

// Físicas básicas (pueden ser reemplazadas por Planck.js en el futuro)
export function applyGravity(vy) {
  return vy + GRAVITY;
}

export function applyFriction(vx, isOnPlatform) {
  return vx * (isOnPlatform ? GROUND_FRICTION : AIR_FRICTION);
}

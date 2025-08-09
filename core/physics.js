// core/physics.js
// Constantes y funciones de físicas globales para Gravity Pulse

// Escala física recomendada para Planck.js
export const PIXELS_PER_METER = 30;
export const GRAVITY = 10; // m/s²
export const GROUND_FRICTION = 0.85; // No usado directamente, pero útil para referencia
export const AIR_FRICTION = 0.98;
export const MOVE_SPEED = 8; // m/s
export const AIR_MOVE_SPEED = 4; // m/s
export const MAX_SPEED_X = 10; // m/s
export const JUMP_CHARGE_RATE = 2;
export const MAX_JUMP_CHARGE = 150;
export const JUMP_POWER = 18; // m/s
export const DOUBLE_JUMP_POWER = 12; // m/s

// Físicas básicas (pueden ser reemplazadas por Planck.js en el futuro)
export function applyGravity(vy) {
  return vy + GRAVITY;
}

export function applyFriction(vx, isOnPlatform) {
  return vx * (isOnPlatform ? GROUND_FRICTION : AIR_FRICTION);
}

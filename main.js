import { GRAVITY, MOVE_SPEED, AIR_MOVE_SPEED, MAX_SPEED_X, MAX_JUMP_CHARGE, JUMP_POWER, DOUBLE_JUMP_POWER } from './core/physics.js';
import { createPlayer, updateCharge } from './entities/player.js';
import { levels } from './levels/levelData.js';
import { updateHUD } from './ui/hud.js';
import { world, stepWorld } from './core/planckWorld.js';
const planck = window.planck;

// --- SETUP ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');
let width, height;

// --- UI ELEMENTS ---
const scoreElement = document.getElementById('score');
const chargeIndicator = document.getElementById('charge-indicator');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const detonationsLeftElement = document.getElementById('detonations-left');

// --- GAME VARIABLES ---
let player, platforms, particles, stars, trail;
let obstacles, powerUps;
let basePlatformY = 0;
let keys = {};
let cameraY = 0;
let highestY = 0;
let isGameOver = false;
let idleAnimationTimer = 0;
let platformBounce = 0;
let platformBounceVelocity = 0;
let platformBounceTarget = 0;
let currentLevel = 0;
const LEVEL_LIMIT_METERS = 600;
const WORLD_BORDER_WIDTH = 12;
  // Dibuja marco completo tipo nave espacial
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.shadowColor = '#00fff6';
  ctx.shadowBlur = 32;
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#00fff6';
  ctx.beginPath();
  ctx.roundRect(7, 7, width - 14, height - 14, 32);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Detalles internos del marco
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.roundRect(18, 18, width - 36, height - 36, 24);
  ctx.stroke();
  ctx.restore();

function resizeCanvas() {
    width = container.clientWidth || 400;
    height = container.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;
}

function createPlatform(x, y, w, color = '#8e44ad') {
    return {
        x: x,
        y: y,
        width: w,
        height: 20,
        color: color
    };
}

function createParticle(x, y, color, count = 30) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 3 + 1,
            life: 50,
            color: color
        });
    }
}

function createStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height * 2,
            radius: Math.random() * 1.5
        });
    }
}

function detonate(player) {
  const e = player.elyon;
  if (e.isOnPlatform) {
    let power = 2 + Math.sqrt(e.charge) * JUMP_POWER;
    player.setLinearVelocity(new planck.Vec2(player.getLinearVelocity().x, -power / 2));
    e.isOnPlatform = false;
    createExplosionEffect(e.x, e.y, e.coreColor);
  } else if (e.airDetonations > 0) {
    let power = 1 + Math.sqrt(e.charge) * DOUBLE_JUMP_POWER;
    player.setLinearVelocity(new planck.Vec2(player.getLinearVelocity().x, -power / 2));
    e.airDetonations--;
    createExplosionEffect(e.x, e.y, e.airDetonationColor);
  }
  e.charge = 0;
}

function createExplosionEffect(x, y, color) {
    createParticle(x, y, color, 60);
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: 0,
        maxRadius: 40,
        life: 8,
        color: '#fff',
        isFlash: true
    });
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: 12,
        maxRadius: 70,
        life: 16,
        color: color,
        isWave: true
    });
}

// Crea un cuerpo estático de Planck.js para la plataforma y asocia datos de render
/**
 * Crea un cuerpo estático de Planck.js para la plataforma, alineado exactamente con la visualización canvas.
 * El centro físico coincide con el centro visual de la plataforma.
 */
function createPlatformBody(platform) {
  // Centro de la plataforma en píxeles
  const centerX = platform.x + platform.width / 2;
  const centerY = platform.y + platform.height / 2;
  // Convertir a metros
  const posX = centerX / 30;
  const posY = centerY / 30;
  const halfWidth = platform.width / 2 / 30;
  const halfHeight = platform.height / 2 / 30;
  const body = world.createBody({
    type: 'static',
    position: new planck.Vec2(posX, posY)
  });
  body.createFixture(planck.Box(halfWidth, halfHeight));
  // Guarda datos de render
  body.renderData = {
    width: platform.width,
    height: platform.height,
    color: platform.color || '#8e44ad'
  };
  return body;
}

function update() {
    if (isGameOver) return;
    idleAnimationTimer++;

    // --- INPUT & MOVIMIENTO HORIZONTAL ---
    const e = player.elyon;
    const vel = player.getLinearVelocity();
    let vx = vel.x, vy = vel.y;
    const currentMoveSpeed = e.isOnPlatform ? MOVE_SPEED : AIR_MOVE_SPEED;
    // Ajuste dinámico de damping
    if (e.isOnPlatform) {
      player.setLinearDamping(0.08); // Inercia baja en plataforma
    } else {
      player.setLinearDamping(0.22); // Más fricción/inercia en el aire
    }
    if (keys['ArrowLeft'] || keys['KeyA']) {
        if (vx > -MAX_SPEED_X / 30) vx -= currentMoveSpeed / 30;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        if (vx < MAX_SPEED_X / 30) vx += currentMoveSpeed / 30;
    }
    // Limitar velocidad horizontal
    if (vx < -MAX_SPEED_X / 30) vx = -MAX_SPEED_X / 30;
    if (vx > MAX_SPEED_X / 30) vx = MAX_SPEED_X / 30;
    player.setLinearVelocity(new planck.Vec2(vx, vy));

    // Step de físicas
    stepWorld(1/60);

    // Sincronizar estado de Elyon para render
    const pos = player.getPosition();
    e.x = pos.x * 30;
    e.y = pos.y * 30;
    e.vx = player.getLinearVelocity().x * 30;
    e.vy = player.getLinearVelocity().y * 30;

    // Detección de contacto con plataformas usando Planck.js
    let onPlatform = false;
    for (let contact = player.getContactList(); contact; contact = contact.next) {
      const other = contact.other;
      if (window.platformBodies && window.platformBodies.includes(other)) {
        // Solo cuenta si el contacto es por debajo (Elyon cayendo)
        const normal = contact.contact.getManifold().localNormal;
        if (normal && normal.y < 0) {
          onPlatform = true;
        }
      }
    }
    const wasOnPlatform = e.isOnPlatform;
    e.isOnPlatform = onPlatform;

    // Efecto de partículas y rebote al aterrizar
    if (!wasOnPlatform && e.isOnPlatform) {
      createParticle(e.x, e.y + e.radius, '#00ffcc', 20);
      // Simula peso de Elyon al aterrizar
      platformBounceTarget = 12; // desplazamiento hacia abajo
    }
    // Rebote al detonar (solo si está en plataforma)
    if (wasOnPlatform && !e.isOnPlatform && e.vy < 0) {
      platformBounceTarget = -18; // desplazamiento hacia arriba
    }
    // Interpolación suave hacia el objetivo
    platformBounce += (platformBounceTarget - platformBounce) * 0.18;
    // Recupera la posición original lentamente
    platformBounceTarget += (0 - platformBounceTarget) * 0.12;

    // --- POWER-UPS ---
    if (powerUps) {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const pu = powerUps[i];
            const dx = e.x - pu.x;
            const dy = e.y - pu.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < e.radius + pu.radius) {
                if (pu.type === 'jump') {
                    e.airDetonations++;
                    createParticle(pu.x, pu.y, '#00ff66', 40);
                }
                powerUps.splice(i, 1);
            }
        }
    }

    updateCharge(player);

  // --- COLISIÓN CON PAREDES DEL CONTENEDOR ---
  const BORDER_OFFSET = 14; // Debe coincidir con el marco visual
  if (e.x - e.radius < BORDER_OFFSET) {
    // Rebote físico contra la pared izquierda
    player.setPosition(new planck.Vec2((BORDER_OFFSET + e.radius) / 30, pos.y));
    player.setLinearVelocity(new planck.Vec2(Math.abs(player.getLinearVelocity().x) * 0.5, player.getLinearVelocity().y * 0.7));
    createParticle(e.x, e.y, '#00fff6', 8);
  }
  if (e.x + e.radius > width - BORDER_OFFSET) {
    // Rebote físico contra la pared derecha
    player.setPosition(new planck.Vec2((width - BORDER_OFFSET - e.radius) / 30, pos.y));
    player.setLinearVelocity(new planck.Vec2(-Math.abs(player.getLinearVelocity().x) * 0.5, player.getLinearVelocity().y * 0.7));
    createParticle(e.x, e.y, '#00fff6', 8);
  }

  // --- CÁMARA Y ALTURA ---
  const targetCameraY = -e.y + height / 1.5;
  cameraY += (targetCameraY - cameraY) * 0.08;

  const currentHeight = Math.max(0, Math.floor((basePlatformY - e.y) / 10));
  if (currentHeight > highestY) {
    highestY = currentHeight;
  }
  // Límite de nivel
  if (currentHeight >= LEVEL_LIMIT_METERS) {
    isGameOver = true;
    finalScoreElement.textContent = highestY;
    gameOverScreen.style.display = 'flex';
    // Aquí podrías mostrar mensaje de avance de nivel
  }

    // --- PARTÍCULAS Y TRAIL ---
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.isWave) {
            p.radius += (p.maxRadius - p.radius) * 0.18;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        } else if (p.isFlash) {
            p.radius += (p.maxRadius - p.radius) * 0.5;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        } else {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    if (!e.isOnPlatform && e.vy < 0) {
        trail.push({ x: e.x, y: e.y, radius: e.radius * 0.8, life: 25 });
    }
    trail.forEach((t, index) => {
        t.life--;
        t.radius *= 0.95;
        if (t.life <= 0) trail.splice(index, 1);
    });

    if (e.y - e.radius > height) {
        isGameOver = true;
        finalScoreElement.textContent = highestY;
        gameOverScreen.style.display = 'flex';
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    // Dibuja marco visual tipo nave espacial
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#00fff6';
    ctx.shadowBlur = 32;
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#00fff6';
    ctx.beginPath();
    ctx.roundRect(7, 7, width - 14, height - 14, 32);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Detalles internos del marco
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(18, 18, width - 36, height - 36, 24);
    ctx.stroke();
    ctx.restore();
    // Continúa con el renderizado del juego
    ctx.save();
    ctx.translate(0, cameraY);
    ctx.fillStyle = 'white';
    if (stars) {
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // Dibuja plataforma energética centrada horizontalmente
    if (platforms) {
    platforms.forEach((body, idx) => {
  const pos = body.getPosition();
  const r = body.renderData;
  // Render en la posición física real del cuerpo
  const x = pos.x * 30 - r.width / 2;
  const y = pos.y * 30 - r.height / 2;
  let bounceY = y;
  if (idx === 0) bounceY += platformBounce;
        // Fondo oscuro
        ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, bounceY, r.width, r.height, 12);
  const grad = ctx.createLinearGradient(x, bounceY, x + r.width, bounceY + r.height);
        grad.addColorStop(0, '#222a44');
        grad.addColorStop(0.5, '#2b2b4a');
        grad.addColorStop(1, '#222a44');
        ctx.fillStyle = grad;
        ctx.fill();
        // Líneas de energía animadas a lo largo de la plataforma, sin sobresalir del borde derecho
        const numLines = 8;
        const lineLength = 16;
        for (let i = 0; i < numLines; i++) {
          ctx.save();
          ctx.globalAlpha = 0.45 + 0.45 * Math.sin(idleAnimationTimer * 0.18 + i * 0.7);
          ctx.strokeStyle = '#00ffcc';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          // Calcula la posición inicial para que la última línea no sobresalga
          const margin = 10;
          const availableWidth = r.width - 2 * margin - lineLength;
          const startX = x + margin + i * (availableWidth / (numLines - 1));
          ctx.moveTo(startX, bounceY + 6);
          ctx.lineTo(startX + lineLength, bounceY + r.height - 6);
          ctx.stroke();
          ctx.restore();
        }
        // Borde animado con destellos
        ctx.save();
        ctx.shadowColor = '#00fff6';
  ctx.shadowBlur = 18 + 8 * Math.sin(idleAnimationTimer * 0.18);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#00fff6';
  ctx.beginPath();
  ctx.roundRect(x, bounceY, r.width, r.height, 12);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
      });
    }
    // Dibuja power-ups
    if (powerUps) {
      powerUps.forEach(pu => {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
        ctx.fillStyle = pu.type === 'jump' ? '#00ff66' : '#ffcc00';
        ctx.shadowColor = pu.type === 'jump' ? '#00ff66' : '#ffcc00';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      });
    }
    // Dibuja Elyon según cuerpo físico
    if (player && player.elyon) {
      let drawY = player.elyon.y;
      let coreSizeMultiplier = 1;
      const chargeRatio = player.elyon.charge / MAX_JUMP_CHARGE;
      if (player.elyon.isOnPlatform && !player.elyon.isCharging && !player.elyon.isChargingDouble) {
        const idleLevitateAmplitude = 4;
        const idleLevitateSpeed = 0.05;
        const idlePulseAmplitude = 0.25;
        const idlePulseSpeed = 0.08;
        const levitationOffset = Math.sin(idleAnimationTimer * idleLevitateSpeed) * idleLevitateAmplitude;
        drawY -= levitationOffset;
        const pulse = (Math.sin(idleAnimationTimer * idlePulseSpeed) + 1) / 2;
        coreSizeMultiplier = 1 + pulse * idlePulseAmplitude;
      } else if (player.elyon.isCharging || player.elyon.isChargingDouble) {
        coreSizeMultiplier = 1 + chargeRatio * 1.2;
      }
      const coreRadius = player.elyon.radius * 0.5 * coreSizeMultiplier;
      ctx.fillStyle = player.elyon.color;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(player.elyon.x, drawY, player.elyon.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      let coreChargeColor;
      if (player.elyon.isCharging) {
        coreChargeColor = `rgb(${200 + 55 * chargeRatio}, ${255 * (1-chargeRatio)}, 255)`;
      } else if (player.elyon.isChargingDouble) {
        coreChargeColor = `rgb(0, 255, ${200 + 55 * chargeRatio})`;
      } else {
        coreChargeColor = player.elyon.coreColor;
      }
      ctx.fillStyle = coreChargeColor;
      ctx.beginPath();
      ctx.arc(player.elyon.x, drawY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = coreChargeColor;
      ctx.shadowBlur = (player.elyon.isCharging || player.elyon.isChargingDouble) ? 20 : 10 + (coreSizeMultiplier - 1) * 50;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    particles.forEach(p => {
        if (p.isWave) {
            ctx.save();
            ctx.globalAlpha = p.life / 16 * 0.35;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (p.isFlash) {
            ctx.save();
            ctx.globalAlpha = p.life / 8 * 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.restore();
        } else {
            ctx.globalAlpha = p.life / 50;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });

    ctx.restore();
    if (player && player.elyon) {
      updateHUD(scoreElement, chargeIndicator, detonationsLeftElement, player.elyon, highestY, MAX_JUMP_CHARGE);
    }
}

function animate() {
    if (!isGameOver) {
        requestAnimationFrame(animate);
    }
    update();
    draw();
}

function resetGame() {
    isGameOver = false;
    gameOverScreen.style.display = 'none';
    highestY = 0;
    scoreElement.textContent = '0m';
    cameraY = 0;
    idleAnimationTimer = 0;

    const level = levels[currentLevel];
    player = createPlayer(level.platforms[0]);
    // Crea cuerpos físicos para plataformas
    if (window.platformBodies) {
      window.platformBodies.forEach(b => world.destroyBody(b));
    }
    window.platformBodies = level.platforms.map(p => createPlatformBody(p));
    platforms = window.platformBodies; // Para render y lógica
    obstacles = level.obstacles ? level.obstacles.map(o => ({...o})) : [];
    powerUps = level.powerUps ? level.powerUps.map(pu => ({...pu})) : [];
    particles = [];
    trail = [];
    stars = [];
    createStars();
    basePlatformY = level.platforms[0].y;
    animate();
}

window.addEventListener('resize', () => {
    resizeCanvas();
    resetGame();
});

restartButton.addEventListener('click', () => {
    resizeCanvas();
    resetGame();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isGameOver) {
        if (!player.elyon.isCharging) {
            if (player.elyon.isOnPlatform || player.elyon.airDetonations > 0) {
                player.elyon.isCharging = true;
                player.elyon.charge = 0;
            }
        }
    } else {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && !isGameOver) {
        if (player.elyon.isCharging) {
            player.elyon.isCharging = false;
            detonate(player);
        }
    } else {
        keys[e.code] = false;
    }
});

resizeCanvas();
resetGame();

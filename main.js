
import { GRAVITY, GROUND_FRICTION, AIR_FRICTION, MOVE_SPEED, AIR_MOVE_SPEED, MAX_SPEED_X, JUMP_CHARGE_RATE, MAX_JUMP_CHARGE, JUMP_POWER, DOUBLE_JUMP_POWER } from './core/physics.js';
import { createPlayer, updateCharge } from './entities/player.js';
import { levels, LEVEL_HEIGHT_LIMIT } from './levels/levelData.js';
import { updateHUD } from './ui/hud.js';

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
let currentLevel = 0;

function resizeCanvas() {
    width = container.clientWidth;
    height = container.clientHeight;
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
    if (player.isOnPlatform) {
        let power = 10 + player.charge * JUMP_POWER;
        player.vy = -power;
        player.isOnPlatform = false;
        createExplosionEffect(player.x, player.y, player.coreColor);
    } else if (player.airDetonations > 0) {
        let power = 5 + player.charge * DOUBLE_JUMP_POWER;
        player.vy = -power;
        player.airDetonations--;
        createExplosionEffect(player.x, player.y, player.airDetonationColor);
    }
    player.charge = 0;
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

function update() {
    if (isGameOver) return;
    idleAnimationTimer++;

    const currentMoveSpeed = player.isOnPlatform ? MOVE_SPEED : AIR_MOVE_SPEED;
    if (keys['ArrowLeft'] || keys['KeyA']) {
        if (player.vx > -MAX_SPEED_X) player.vx -= currentMoveSpeed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        if (player.vx < MAX_SPEED_X) player.vx += currentMoveSpeed;
    }

    player.vx *= player.isOnPlatform ? GROUND_FRICTION : AIR_FRICTION;
    player.x += player.vx;

    player.vy += GRAVITY;
    player.y += player.vy;
    const wasOnPlatform = player.isOnPlatform;
    player.isOnPlatform = false;

    platforms.forEach(p => {
        if (
            player.vy > 0 &&
            player.x + player.radius > p.x && player.x - player.radius < p.x + p.width &&
            player.y + player.radius >= p.y && player.y + player.radius - player.vy < p.y + p.height
        ) {
            player.vy = 0;
            player.y = p.y - player.radius;
            player.isOnPlatform = true;
            if (!wasOnPlatform) {
                createParticle(player.x, player.y + player.radius, '#00ffcc', 20);
            }
        }
    });

    if (powerUps) {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const pu = powerUps[i];
            const dx = player.x - pu.x;
            const dy = player.y - pu.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.radius + pu.radius) {
                if (pu.type === 'jump') {
                    player.airDetonations++;
                    createParticle(pu.x, pu.y, '#00ff66', 40);
                }
                powerUps.splice(i, 1);
            }
        }
    }

    if (player.y <= LEVEL_HEIGHT_LIMIT) {
        isGameOver = true;
        finalScoreElement.textContent = highestY;
        gameOverScreen.style.display = 'flex';
        gameOverScreen.querySelector('h2').textContent = '¡Nivel Superado!';
        gameOverScreen.querySelector('p').innerHTML = `Altura máxima: <span id="final-score">${highestY}</span>m`;
        return;
    }

    updateCharge(player);

    if (player.x - player.radius < 0) {
        player.x = player.radius;
        player.vx = 0;
    }
    if (player.x + player.radius > width) {
        player.x = width - player.radius;
        player.vx = 0;
    }

    const targetCameraY = -player.y + height / 1.5;
    cameraY += (targetCameraY - cameraY) * 0.08;

    const currentHeight = Math.max(0, Math.floor((basePlatformY - player.y) / 10));
    if (currentHeight > highestY) {
        highestY = currentHeight;
    }

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

    if (!player.isOnPlatform && player.vy < 0) {
        trail.push({ x: player.x, y: player.y, radius: player.radius * 0.8, life: 25 });
    }
    trail.forEach((t, index) => {
        t.life--;
        t.radius *= 0.95;
        if (t.life <= 0) trail.splice(index, 1);
    });

    if (player.y - player.radius > height) {
        isGameOver = true;
        finalScoreElement.textContent = highestY;
        gameOverScreen.style.display = 'flex';
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(0, cameraY);

    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    platforms.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    if (obstacles) {
        obstacles.forEach(o => {
            ctx.save();
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.restore();
        });
    }

    if (powerUps) {
        powerUps.forEach(pu => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, pu.radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = '#222';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
            ctx.fillStyle = pu.type === 'jump' ? '#00ff66' : '#00ffff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.restore();
        });
    }

    trail.forEach(t => {
        ctx.globalAlpha = t.life / 25 * 0.5;
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

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

    let drawY = player.y;
    let coreSizeMultiplier = 1;
    const chargeRatio = player.charge / MAX_JUMP_CHARGE;

    if (player.isOnPlatform && !player.isCharging && !player.isChargingDouble) {
        const idleLevitateAmplitude = 4;
        const idleLevitateSpeed = 0.05;
        const idlePulseAmplitude = 0.25;
        const idlePulseSpeed = 0.08;
        const levitationOffset = Math.sin(idleAnimationTimer * idleLevitateSpeed) * idleLevitateAmplitude;
        drawY -= levitationOffset;
        const pulse = (Math.sin(idleAnimationTimer * idlePulseSpeed) + 1) / 2;
        coreSizeMultiplier = 1 + pulse * idlePulseAmplitude;
    } else if (player.isCharging || player.isChargingDouble) {
        coreSizeMultiplier = 1 + chargeRatio * 1.2;
    }

    const coreRadius = player.radius * 0.5 * coreSizeMultiplier;
    ctx.fillStyle = player.color;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(player.x, drawY, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    let coreChargeColor;
    if (player.isCharging) {
        coreChargeColor = `rgb(${200 + 55 * chargeRatio}, ${255 * (1-chargeRatio)}, 255)`;
    } else if (player.isChargingDouble) {
        coreChargeColor = `rgb(0, 255, ${200 + 55 * chargeRatio})`;
    } else {
        coreChargeColor = player.coreColor;
    }

    ctx.fillStyle = coreChargeColor;
    ctx.beginPath();
    ctx.arc(player.x, drawY, coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = coreChargeColor;
    ctx.shadowBlur = (player.isCharging || player.isChargingDouble) ? 20 : 10 + (coreSizeMultiplier - 1) * 50;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    updateHUD(scoreElement, chargeIndicator, detonationsLeftElement, player, highestY, MAX_JUMP_CHARGE);
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
    platforms = level.platforms.map(p => createPlatform(p.x, p.y, p.width));
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
        if (!player.isCharging) {
            if (player.isOnPlatform || player.airDetonations > 0) {
                player.isCharging = true;
                player.charge = 0;
            }
        }
    } else {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && !isGameOver) {
        if (player.isCharging) {
            player.isCharging = false;
            detonate(player);
        }
    } else {
        keys[e.code] = false;
    }
});

resizeCanvas();
resetGame();

// ui/hud.js
// Lógica de UI y HUD para Gravity Pulse

export function updateHUD(scoreElement, chargeIndicator, detonationsLeftElement, player, highestY, maxJumpCharge) {
  scoreElement.textContent = `${highestY}m`;
  const chargeRatio = player.charge / maxJumpCharge;
  chargeIndicator.style.width = `${chargeRatio * 100}%`;
  let circles = '';
  let detColor = player.isOnPlatform ? '#00ffcc' : '#00ff00';
  for (let i = 0; i < player.airDetonations; i++) {
    circles += `<span style="color:${detColor};font-size:1.5em;margin-right:2px;">⬤</span>`;
  }
  if (player.airDetonations === 0) {
    detonationsLeftElement.innerHTML = '<span style="color:#888;font-size:1.5em;">✖</span>';
  } else {
    detonationsLeftElement.innerHTML = circles;
  }
}

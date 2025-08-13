// levels/levelData.js
// Layout modular de niveles para Gravity Pulse

/**
 * Platform layout based on GDD (Notion):
 * - Spacing increases with height (progressive difficulty)
 * - Alternating X positions for variety
 * - Y in pixels (negative = higher)
 * - BASE at y=0, top at y=-1600px (example)
 * - Conversion: 1m ≈ 9.5px (empirical, see core/physics.js)
 */
export const levels = [
  {
    platforms: [
      { x: 200, y: 0, width: 300, height: 20 },      // Base
      { x: 320, y: -240, width: 120, height: 20 },   // Easy jump
      { x: 120, y: -520, width: 100, height: 20 },   // Medium jump
      { x: 260, y: -840, width: 80, height: 20 },    // Medium-high
      { x: 180, y: -1200, width: 70, height: 20 },   // Harder
      { x: 340, y: -1600, width: 50, height: 20 }    // Top platform (goal)
    ],
    obstacles: [],
    powerUps: [
      { x: 200, y: -350, radius: 12, type: 'jump' },
      { x: 120, y: -100, radius: 12, type: 'jump' },
      { x: 320, y: -30, radius: 12, type: 'jump' },
      { x: 180, y: -250, radius: 12, type: 'jump' },
      { x: 80, y: -400, radius: 12, type: 'jump' },
      { x: 300, y: -600, radius: 12, type: 'jump' },
      { x: 220, y: -800, radius: 12, type: 'jump' },
      { x: 120, y: -1000, radius: 12, type: 'jump' },
      { x: 320, y: -1200, radius: 12, type: 'jump' }
    ]
  }
];

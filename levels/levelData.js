// levels/levelData.js
// Layout modular de niveles para Gravity Pulse

export const LEVEL_HEIGHT_LIMIT = -1500;
export const levels = [
  {
    platforms: [
      { x: 75, y: 550, width: 300 }
    ],
    obstacles: [],
    powerUps: [
      { x: 200, y: 250, radius: 12, type: 'jump' },
      { x: 120, y: 100, radius: 12, type: 'jump' },
      { x: 320, y: -80, radius: 12, type: 'jump' },
      { x: 180, y: -250, radius: 12, type: 'jump' },
      { x: 80, y: -400, radius: 12, type: 'jump' },
      { x: 300, y: -600, radius: 12, type: 'jump' },
      { x: 220, y: -800, radius: 12, type: 'jump' },
      { x: 120, y: -1000, radius: 12, type: 'jump' },
      { x: 320, y: -1200, radius: 12, type: 'jump' }
    ]
  }
];

// utils.js
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- balance global ---
const PLAYER_SPEED_MULT = 1.0; // -30%
const ENEMY_SPEED_MULT  = 1.0; // -30%


function generateId() {
  return crypto.randomUUID();
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}
function randSpawnOutside(size) {
  const margin = 30;
  const side = Math.random() < 0.5 ? "left" : "right";
  const y = Math.random() * (canvas.height - size);
  const x = side === "left" ? -margin : canvas.width + margin;
  return { x, y };
}
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1, vy = y2 - y1;
  const wx = px - x1, wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - x1, py - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - x2, py - y2);
  const t = c1 / c2;
  const projx = x1 + t * vx;
  const projy = y1 + t * vy;
  return Math.hypot(px - projx, py - projy);
}

function pct01(n) {
  return `${Math.round(clamp(n, 0, 1) * 100)}%`;
}

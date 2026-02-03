// hud.js
const messages = [];

function showMessage(text, options = {}) {
  messages.push({
    text,
    color: options.color || "white",
    duration: options.duration || 1800,
    start: performance.now()
  });
}

function drawMessages() {
  const now = performance.now();
  ctx.font = "16px Arial";
  ctx.textAlign = "center";

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const elapsed = now - m.start;
    const life = elapsed / m.duration;

    if (life >= 1) {
      messages.splice(i, 1);
      continue;
    }

    let alpha = 1;
    if (life < 0.15) alpha = life / 0.15;
    else if (life > 0.85) alpha = (1 - life) / 0.15;

    ctx.globalAlpha = alpha;

    const padding = 10;
    const textWidth = ctx.measureText(m.text).width;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 28;

    const x = canvas.width / 2;
    const y = canvas.height * 0.15 + i * 34;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x - boxWidth / 2, y - boxHeight + 6, boxWidth, boxHeight);

    ctx.fillStyle = m.color;
    ctx.fillText(m.text, x, y);

    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "left";
}

function drawHpBar(entity, fillColor = "yellow") {
  const bw = entity.size;
  const bh = 5;
  const ratio = clamp(entity.hp / entity.maxHp, 0, 1);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(entity.x, entity.y - 8, bw, bh);

  ctx.fillStyle = fillColor;
  ctx.fillRect(entity.x, entity.y - 8, bw * ratio, bh);

  ctx.strokeStyle = "black";
  ctx.strokeRect(entity.x, entity.y - 8, bw, bh);
}

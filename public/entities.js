// entities.js
class Entity {
  constructor(x, y, color = "white", size = 20) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y, "cyan", 20);

    this.baseSpeed = 3 * PLAYER_SPEED_MULT;

    this.slowUntil = 0;
    this.slowFactor = 1;

    // vida
    this.maxHp = 100;
    this.hp = this.maxHp;

    // ✅ escudo (não cumulativo)
    this.shieldMax = 30;
    this.shieldHp = 0; // 0 = sem escudo

    // economia / arma
    this.coins = 0;
    this.ammo = 10;
    this.bulletDamage = 1;

    // armadura
    this.armorLevel = 0;
    this.armorPerLevel = 0.10;
    this.armorMax = 0.60;

    // ✅ consumíveis no inventário
    this.spikes = 0; // espinhos (cumulativo)
    this.bombs = 0;  // bombas (cumulativo)

    // --- DASH ---
this.dashUnlocked = false;      // compra na loja (armadura)
this.dashUntil = 0;             // enquanto > now, está dashando
this.dashInvulnUntil = 0;       // invulnerável durante dash
this.dashCooldownMs = 1400;     // ajuste
this.lastDash = -1e9;

this.dashSpeed = 12;            // impulso (ajuste)
this.dashDurationMs = 140;      // duração do impulso
this.dashVx = 0;
this.dashVy = 0;

  }

  get damageReduction() {
    return clamp(this.armorLevel * this.armorPerLevel, 0, this.armorMax);
  }

  getCurrentSpeed() {
    const now = performance.now();
    if (now < this.slowUntil) return this.baseSpeed * this.slowFactor;
    this.slowFactor = 1;
    return this.baseSpeed;
  }

  applySlow(factor = 0.6, ms = 1000) {
    const now = performance.now();
    this.slowFactor = clamp(Math.min(this.slowFactor, factor), 0.6, 1);
    this.slowUntil = Math.max(this.slowUntil, now + ms);
  }

  // ✅ dano agora consome escudo primeiro
takeDamage(amount) {
  // ✅ invulnerável no dash OU poder de imunidade
  const now = performance.now();
  if (now < this.dashInvulnUntil) return;
  if (isImmune()) return;

  const raw = Number(amount);
  const dmg0 = Number.isFinite(raw) ? raw : 0;
  const dmg = dmg0 * (1 - this.damageReduction);

  if (this.shieldHp > 0) {
    const used = Math.min(this.shieldHp, dmg);
    this.shieldHp -= used;
    const left = dmg - used;
    if (left > 0) this.hp -= left;
  } else {
    this.hp -= dmg;
  }
}

canDash() {
  const now = performance.now();
  return this.dashUnlocked && (now >= this.lastDash + this.dashCooldownMs) && (now >= this.dashUntil);
}

startDash(mousePos) {
  if (!this.canDash()) return false;

  const now = performance.now();

  // direção por WASD
  let dx = 0, dy = 0;
  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;

  // se não tiver direção, dasha pro mouse
  if (dx === 0 && dy === 0 && mousePos) {
    const c = this.center();
    dx = mousePos.x - c.x;
    dy = mousePos.y - c.y;
  }

  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;

  this.dashVx = dx * this.dashSpeed;
  this.dashVy = dy * this.dashSpeed;

  this.lastDash = now;
  this.dashUntil = now + this.dashDurationMs;
  this.dashInvulnUntil = this.dashUntil; // ✅ invulnerável durante o dash

  return true;
}


update() {
  const now = performance.now();

  // ✅ durante dash: ignora movimento normal e só aplica impulso
  if (now < this.dashUntil) {
    this.x += this.dashVx;
    this.y += this.dashVy;

    this.x = clamp(this.x, 0, canvas.width - this.size);
    this.y = clamp(this.y, 0, canvas.height - this.size);
    return;
  }

  // ... resto do seu update normal (com slow etc)
  const spd = this.getCurrentSpeed();

  if (keys["w"] || keys["arrowup"]) this.y -= spd;
  if (keys["s"] || keys["arrowdown"]) this.y += spd;
  if (keys["a"] || keys["arrowleft"]) this.x -= spd;
  if (keys["d"] || keys["arrowright"]) this.x += spd;

  this.x = clamp(this.x, 0, canvas.width - this.size);
  this.y = clamp(this.y, 0, canvas.height - this.size);
}


  draw() {
    super.draw();
    drawHpBar(this, "rgba(80,255,120,0.9)");
  }

  center() {
    return { x: this.x + this.size / 2, y: this.y + this.size / 2 };
  }
}


class Bullet extends Entity {
  // owner: "player" | "enemy"
  constructor(
    x, y, dx, dy,
    damage,
    color = "yellow",
    speed = 6,
    size = 5,
    effect = null,
    owner = "player"
  ) {
    super(x, y, color, size);

    this.dx = dx;
    this.dy = dy;
    this.speed = speed;

    const d = Number(damage);
    this.damage = Number.isFinite(d) ? d : 0;

    this.effect = effect;
    this.owner = owner;
  }

  update() {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
  }

  isOut() {
    return (
      this.x < -40 ||
      this.y < -40 ||
      this.x > canvas.width + 40 ||
      this.y > canvas.height + 40
    );
  }
}

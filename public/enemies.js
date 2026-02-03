// enemies.js
class Enemy extends Entity {
  constructor(x, y, color, size = 20) {
    super(x, y, color, size);

    this.speed = 1;

    this.maxHp = 1;
    this.hp = this.maxHp;

    this.contactDamage = 1;
    this.hpBarColor = "yellow";
    this.showHp = true;
  }

  finalizeSpeed() {
    this.speed = Number.isFinite(Number(this.speed)) ? Number(this.speed) : 1;
    this.speed *= ENEMY_SPEED_MULT;
  }

  update(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const len = Math.hypot(dx, dy) || 1;

    this.x += (dx / len) * this.speed;
    this.y += (dy / len) * this.speed;
  }

  takeHit(dmg) {
    const hit = Number(dmg);
    this.hp -= (Number.isFinite(hit) ? hit : 0);
    return this.hp <= 0;
  }

  draw() {
    super.draw();
    if (this.showHp && this.maxHp > 1) drawHpBar(this, this.hpBarColor);
  }
}

class RedEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, "red", 20);
    this.speed = 1.1;
    this.maxHp = 1;
    this.hp = this.maxHp;
    this.contactDamage = 1;
    this.showHp = false;
    this.finalizeSpeed();
  }
}

class OrangeFast extends Enemy {
  constructor(x, y) {
    super(x, y, "orange", 20);
    this.speed = 2.4;
    this.maxHp = 2;
    this.hp = this.maxHp;
    this.hpBarColor = "orange";
    this.finalizeSpeed();
  }
}

class PinkSplitter extends Enemy {
  constructor(x, y) {
    super(x, y, "hotpink", 20);
    this.speed = 1.1;
    this.maxHp = 2;
    this.hp = this.maxHp;
    this.splitCount = 2;
    this.hpBarColor = "hotpink";
    this.finalizeSpeed();
  }
}

class PinkMini extends Enemy {
  constructor(x, y) {
    super(x, y, "pink", 12);
    this.speed = 2.6;
    this.maxHp = 1;
    this.hp = this.maxHp;
    this.hpBarColor = "pink";
    this.finalizeSpeed();
  }

  draw() {
    super.draw();
    drawHpBar(this, this.hpBarColor);
  }
}

class YellowShooter extends Enemy {
  constructor(x, y) {
    super(x, y, "gold", 20);
    this.speed = 0.85;

    this.maxHp = 3;
    this.hp = this.maxHp;

    this.shootCooldownMs = 900;
    this.lastShot = performance.now() + Math.random() * 400;
    this.hpBarColor = "yellow";

    this.finalizeSpeed();
  }

  tryShoot(player) {
    const now = performance.now();
    if (now - this.lastShot < this.shootCooldownMs) return;
    this.lastShot = now;

    const ex = this.x + this.size / 2;
    const ey = this.y + this.size / 2;
    const { x: px, y: py } = player.center();

    const dx = px - ex;
    const dy = py - ey;
    const len = Math.hypot(dx, dy) || 1;

    // ✅ owner = "enemy" no final (effect = null)
    enemyBullets.push(new Bullet(ex, ey, dx / len, dy / len, 6, "orange", 6, 5, null, "enemy"));
  }
}

class GreenMissiler extends Enemy {
  constructor(x, y) {
    super(x, y, "lime", 22);
    this.speed = 0.75;

    this.maxHp = 6;
    this.hp = this.maxHp;

    this.contactDamage = 2;
    this.hpBarColor = "lime";

    this.missileCooldownMs = 5200;
    this.lastMissile = performance.now() + Math.random() * 1200;

    this.aiming = false;
    this.aimStart = 0;
    this.aimDelay = 1000;

    this.aimFrom = null;
    this.aimTo = null;
    this.missileFired = false;

    this.finalizeSpeed();
  }

  startAim(player) {
    const now = performance.now();
    this.aiming = true;
    this.missileFired = false;
    this.aimStart = now;

    this.aimFrom = { x: this.x + this.size / 2, y: this.y + this.size / 2 };
    const p = player.center();
    this.aimTo = { x: p.x, y: p.y };
  }

  update(player) {
    const now = performance.now();

    if (!this.aiming) super.update(player);

    if (!this.aiming && now - this.lastMissile >= this.missileCooldownMs) {
      this.lastMissile = now;
      this.startAim(player);
    }

    if (this.aiming && !this.missileFired) {
      if (now - this.aimStart >= this.aimDelay) {
        this.missileFired = true;
        this.aiming = false;

        const pc = player.center();

        const dLine = pointToSegmentDistance(
          pc.x, pc.y,
          this.aimFrom.x, this.aimFrom.y,
          this.aimTo.x, this.aimTo.y
        );

        if (dLine <= 10) {
          player.takeDamage(12);
          showMessage("Míssil te acertou!", { color: "#ff5555", duration: 1200 });
          if (player.hp <= 0) triggerGameOver();
        }

        explosions.push({ x: this.aimTo.x, y: this.aimTo.y, r: 58, created: now, ttl: 450 });

        const dExp = dist(pc.x, pc.y, this.aimTo.x, this.aimTo.y);
        if (dExp <= 58) {
          player.takeDamage(18);
          showMessage("Explosão do míssil!", { color: "#ff4444", duration: 1200 });
          if (player.hp <= 0) triggerGameOver();
        }
      }
    }
  }

  draw() {
    super.draw();

    if (this.aiming && this.aimFrom && this.aimTo) {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "rgba(120,255,120,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.aimFrom.x, this.aimFrom.y);
      ctx.lineTo(this.aimTo.x, this.aimTo.y);
      ctx.stroke();
      ctx.restore();

      const now = performance.now();
      const left = clamp(1 - (now - this.aimStart) / this.aimDelay, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(this.x - 2, this.y - 22, this.size + 4, 8);
      ctx.fillStyle = "rgba(120,255,120,0.9)";
      ctx.fillRect(this.x - 2, this.y - 22, (this.size + 4) * left, 8);
    }
  }
}

class WhiteSlower extends Enemy {
  constructor(x, y) {
    super(x, y, "white", 20);
    this.speed = 0.85;

    this.maxHp = 4;
    this.hp = this.maxHp;

    this.contactDamage = 1;

    this.shootCooldownMs = 950;
    this.lastShot = performance.now() + Math.random() * 400;

    this.hpBarColor = "white";

    this.finalizeSpeed();
  }

  tryShoot(player) {
    const now = performance.now();
    if (now - this.lastShot < this.shootCooldownMs) return;
    this.lastShot = now;

    const ex = this.x + this.size / 2;
    const ey = this.y + this.size / 2;
    const { x: px, y: py } = player.center();

    const dx = px - ex;
    const dy = py - ey;
    const len = Math.hypot(dx, dy) || 1;

    const effect = { type: "slow", factor: 0.6, ms: 1000 };
    enemyBullets.push(new Bullet(ex, ey, dx / len, dy / len, 0, "rgba(240,240,240,0.95)", 6, 5, effect, "enemy"));
  }
}



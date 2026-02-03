// game.js
let player;
let bullets;
let enemies;
let enemyBullets;

let lastShot = 0;
let fireRateMs = 160;
let fireRateLevel = 0;

const explosions = [];

function bombExplosion(x, y) {
  const now = performance.now();
  const radius = 80;                  // ajuste se quiser
  const dmg = player.bulletDamage * 5; // parecido com o poder (mas 1 alvo/área)

  explosions.push({ x, y, r: radius, created: now, ttl: 520 });

  let killed = 0;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    const cx = en.x + en.size / 2;
    const cy = en.y + en.size / 2;

    if (dist(cx, cy, x, y) <= radius) {
      const died = en.takeHit(dmg);

      if (died) {
        // split rosa
        if (en instanceof PinkSplitter) {
          for (let k = 0; k < en.splitCount; k++) {
            enemies.push(new PinkMini(en.x + Math.random() * 12 - 6, en.y + Math.random() * 12 - 6));
          }
        }

        enemies.splice(i, 1);
        killed++;

        // coins (mantive simples)
        player.coins +=
          (en instanceof GreenMissiler) ? 18 :
          (en instanceof YellowShooter) ? 10 :
          (en instanceof WhiteSlower)   ? 9  :
          (en instanceof OrangeFast)    ? 7  :
          (en instanceof PinkSplitter || en instanceof PinkMini) ? 7 :
          5;
      }
    }
  }

  showMessage(`BOMBA! (${dmg} dmg)`, { color: "rgba(80,220,255,0.95)", duration: 1200 });
  updateShop();
}

function drawExplosions() {
  const now = performance.now();
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    const t = (now - ex.created) / ex.ttl;
    if (t >= 1) { explosions.splice(i, 1); continue; }

    ctx.globalAlpha = 0.35 * (1 - t);
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.r * (0.85 + t * 0.25), 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ✅ owner vai no ÚLTIMO argumento. effect = null aqui.
function firePlayerBullet(noAmmoCost = false, speed = 6, color = "yellow") {
  const { x: px, y: py } = player.center();
  const dx = mousePos.x - px;
  const dy = mousePos.y - py;
  const len = Math.hypot(dx, dy) || 1;

  bullets.push(new Bullet(px, py, dx / len, dy / len, player.bulletDamage, color, speed, 5, null, "player"));

  if (!noAmmoCost) {
    player.ammo -= 1;
    if (player.ammo < 0) player.ammo = 0;
  }
}

canvas.addEventListener("mousedown", (e) => {
  if (isGameOver) return;
  if (isMinigun()) return;
  if (e.button !== 0) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // ✅ BOMBA selecionada: explode no clique e NÃO atira bala
  if (window.selectedInventoryItem === "bomb") {
    if (player.bombs <= 0) {
      window.selectedInventoryItem = null;
      showMessage("Sem bombas!", { color: "#ffcc55" });
      updateShop();
      return;
    }

    player.bombs -= 1;
    bombExplosion(clickX, clickY);

    if (player.bombs <= 0) window.selectedInventoryItem = null;
    updateShop();
    return;
  }

  // ---- tiro normal ----
  const now = performance.now();
  if (now - lastShot < fireRateMs) return;
  lastShot = now;

  if (player.ammo <= 0) {
    showMessage("Sem munição!", { color: "#ffcc55" });
    return;
  }

  firePlayerBullet(false, 6, "yellow");
});

document.addEventListener("keydown", (e) => {
  if (isGameOver) return;
  if (e.repeat) return;

  if (e.key === "Shift") {
    const ok = player.startDash(mousePos);
    if (ok) {
      showMessage("DASH!", { color: "rgba(80,220,255,0.95)", duration: 500 });
      updateShop();
    }
  }
});


function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawExplosions();

  if (isGameOver) {
    player.draw();
    enemies.forEach(e => e.draw());
    bullets.forEach(b => b.draw());
    enemyBullets.forEach(b => b.draw());
    drawMessages();
    renderStatusBars();
    updatePowersUI();
    requestAnimationFrame(loop);
    return;
  }

  // minigun
  if (isMinigun() && mouseDown) {
    const now = performance.now();
    if (now - minigunLastShot >= MINIGUN_RATE) {
      minigunLastShot = now;
      firePlayerBullet(true, 7.5, "rgba(120,220,255,0.95)");
    }
  }

  player.update();
  player.draw();

  // --- bullets do player ---
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.update();
    b.draw();
    if (b.isOut()) bullets.splice(i, 1);
  }

  // --- inimigos ---
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    en.update(player);
    en.draw();

    if (en instanceof YellowShooter) en.tryShoot(player);
    if (en instanceof WhiteSlower) en.tryShoot(player);

    // ✅ bala do PLAYER x INIMIGO
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.owner !== "player") continue;

      if (rectsOverlap(b, en)) {
        const died = en.takeHit(b.damage);
        bullets.splice(j, 1);

        if (died) {
          // split rosa
          if (en instanceof PinkSplitter) {
            for (let k = 0; k < en.splitCount; k++) {
              enemies.push(new PinkMini(en.x + Math.random() * 12 - 6, en.y + Math.random() * 12 - 6));
            }
          }



          enemies.splice(i, 1);

          // recompensa (ajuste se quiser)
          player.coins +=
            (en instanceof GreenMissiler) ? 18 :
            (en instanceof YellowShooter) ? 10 :
            (en instanceof WhiteSlower)  ? 9  :
            (en instanceof OrangeFast)   ? 7  :
            (en instanceof PinkSplitter || en instanceof PinkMini) ? 7 :
            5;

          updateShop();
        }

        break; // uma bala só acerta uma vez
      }
    }

// ✅ espinhos: só quando ENCOSTA
if (player.spikes > 0 && rectsOverlap(player, en)) {
  player.spikes -= 1;

  const died = en.takeHit(1);
  showMessage("Espinho!", { color: "#ffffff", duration: 600 });

  if (died) {
    // split rosa
    if (en instanceof PinkSplitter) {
      for (let k = 0; k < en.splitCount; k++) {
        enemies.push(new PinkMini(en.x + Math.random() * 12 - 6, en.y + Math.random() * 12 - 6));
      }
    }

    enemies.splice(i, 1);
    player.coins += 5;
    updateShop();
    continue; // morreu, não toma dano de contato
  }
}


    // contato inimigo
    if (rectsOverlap(player, en)) {
      player.takeDamage(en.contactDamage);
      if (player.hp <= 0) {
        showMessage("Você morreu!", { color: "#ff4444", duration: 1200 });
        triggerGameOver();
        break;
      }
    }
  }

  // --- balas dos inimigos ---
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.update();
    b.draw();

    if (b.isOut()) {
      enemyBullets.splice(i, 1);
      continue;
    }

    if (b.owner !== "enemy") continue;

    if (rectsOverlap(b, player)) {
      enemyBullets.splice(i, 1);

      // slow do branco
      if (b.effect && b.effect.type === "slow") {
        player.applySlow(b.effect.factor, b.effect.ms);
        showMessage("Lentidão!", { color: "#ffffff", duration: 900 });
      } else {
        player.takeDamage(b.damage);
      }

      if (player.hp <= 0) {
        showMessage("Você morreu!", { color: "#ff4444", duration: 1200 });
        triggerGameOver();
        break;
      }
    }
  }

  const remainingToSpawn = Object.values(toSpawn).reduce((a, b) => a + b, 0);
  if (waveActive && enemies.length === 0 && remainingToSpawn === 0) waveCleared();

  drawMessages();
  renderStatusBars();
  updatePowersUI();
  requestAnimationFrame(loop);
}

function initGame() {
  isGameOver = false;
  $gameover.classList.add("hidden");
  $barFill.style.width = "0%";

  stopSpawning();

  player = new Player(300, 200);
  bullets = [];
  enemies = [];
  enemyBullets = [];

  lastShot = 0;
  fireRateMs = 160;
  fireRateLevel = 0;

  minigunActiveUntil = 0;
  minigunLastShot = 0;
  immuneUntil = 0;

  power.minigun.last = -1e9;
  power.bomb.last = -1e9;
  power.immune.last = -1e9;
  power.minigun.unlocked = false;
  power.bomb.unlocked = false;
  power.immune.unlocked = false;

  wave = 1;
  waveActive = false;
  toSpawn = { red: 0, white: 0, yellow: 0, orange: 0, pink: 0, green: 0 };

  messages.length = 0;
  explosions.length = 0;

  resetWaveCountdown();
  if (typeof startRoundChoices === "function") startRoundChoices();
  updateShop();
  startWave(1);
}

function resetGame() {
  initGame();
}

$btnRetry.addEventListener("click", resetGame);

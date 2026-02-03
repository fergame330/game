// powers.js
let minigunActiveUntil = 0;
let minigunLastShot = 0;
const MINIGUN_DURATION = 3000;
const MINIGUN_RATE = 60;

let immuneUntil = 0;
const IMMUNE_DURATION = 6000;

const POWER_CD = 45000;
const power = {
  minigun: { cd: POWER_CD, last: -1e9 },
  bomb:    { cd: POWER_CD, last: -1e9 },
  immune:  { cd: POWER_CD, last: -1e9 },
};

function isImmune() { return performance.now() < immuneUntil; }
function isMinigun() { return performance.now() < minigunActiveUntil; }
function canUse(p) { return performance.now() >= p.last + p.cd; }

function updatePowersUI() {
  const now = performance.now();
  const cd1 = document.getElementById("cd-1");
  const cd2 = document.getElementById("cd-2");
  const cd3 = document.getElementById("cd-3");

  const b1 = document.getElementById("btn-power-1");
  const b2 = document.getElementById("btn-power-2");
  const b3 = document.getElementById("btn-power-3");

  function setCD(fillEl, btnEl, p) {
    const left = (p.last + p.cd) - now;
    const ready = left <= 0;
    const prog = ready ? 0 : clamp(left / p.cd, 0, 1);
    fillEl.style.width = `${prog * 100}%`;
    btnEl.textContent = ready ? "Ativar" : `Carregando... (${Math.ceil(left / 1000)}s)`;
    btnEl.disabled = !ready;
    btnEl.style.opacity = btnEl.disabled ? 0.7 : 1;
  }

  setCD(cd1, b1, power.minigun);
  setCD(cd2, b2, power.bomb);
  setCD(cd3, b3, power.immune);
}

function activateMinigun() {
  const now = performance.now();
  if (!canUse(power.minigun)) return;
  power.minigun.last = now;
  minigunActiveUntil = now + MINIGUN_DURATION;
  showMessage("METRALHADORA ATIVA! (3s)", { color: "#55ccff", duration: 1400 });
  updatePowersUI();
}

function activateBomb() {
  const now = performance.now();
  if (!canUse(power.bomb)) return;
  power.bomb.last = now;

  const sorted = [...enemies].sort((a, b) => (b.hp - a.hp) || (b.maxHp - a.maxHp));
  const targets = sorted.slice(0, 3);
  if (targets.length === 0) {
    showMessage("Sem alvos!", { color: "#ffcc55" });
    return;
  }

  const dmg = player.bulletDamage * 5;
  const splashR = 70;

  for (const t of targets) {
    explosions.push({ x: t.x + t.size / 2, y: t.y + t.size / 2, r: splashR, created: now, ttl: 520 });

    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      const cx = en.x + en.size / 2;
      const cy = en.y + en.size / 2;
      const tx = t.x + t.size / 2;
      const ty = t.y + t.size / 2;

      if (dist(cx, cy, tx, ty) <= splashR) {
        const died = en.takeHit(dmg);
        if (died) {
          // split do rosa também aqui
          if (en instanceof PinkSplitter) {
            for (let k = 0; k < en.splitCount; k++) {
              enemies.push(new PinkMini(en.x + Math.random() * 12 - 6, en.y + Math.random() * 12 - 6));
            }
          }

          enemies.splice(i, 1);
          player.coins += (en instanceof GreenMissiler) ? 18 :
               (en instanceof YellowShooter) ? 10 :
               (en instanceof OrangeFast) ? 7 :
               (en instanceof WhiteSlower) ? 9 :
               (en instanceof PinkSplitter || en instanceof PinkMini) ? 7 : 5;
        }
      }
    }
  }

  showMessage(`Explosão Tripla! (${dmg} dmg)`, { color: "#ffd700", duration: 1500 });
  updateShop();
  updatePowersUI();
}

function activateImmune() {
  const now = performance.now();
  if (!canUse(power.immune)) return;
  power.immune.last = now;
  immuneUntil = now + IMMUNE_DURATION;
  showMessage("IMUNIDADE!", { color: "#aaffff", duration: 1400 });
  updatePowersUI();
}

document.getElementById("btn-power-1").addEventListener("click", () => activateMinigun());
document.getElementById("btn-power-2").addEventListener("click", () => activateBomb());
document.getElementById("btn-power-3").addEventListener("click", () => activateImmune());

document.addEventListener("keydown", (e) => {
  if (e.key === "1") activateMinigun();
  if (e.key === "2") activateBomb();
  if (e.key === "3") activateImmune();
});

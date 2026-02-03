// shop.js
const ROUND_CHOICES_COUNT = 3;
const roundChoiceState = {
  options: [],
  picked: false,
};

function pickAndRemove(list) {
  if (!list.length) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list.splice(idx, 1)[0];
}

function powersOnCooldown() {
  return !canUse(power.minigun) || !canUse(power.bomb) || !canUse(power.immune);
}

function refreshPowers() {
  power.minigun.last = -1e9;
  power.bomb.last = -1e9;
  power.immune.last = -1e9;
  showMessage("Poderes recarregados!", { color: "#a8d9ff" });
  updatePowersUI();
}

function buildRoundChoicePool() {
  const upgrades = [];
  const consumables = [];
  const functions = [];

  if (player.damageReduction < player.armorMax - 0.001) {
    upgrades.push({
      id: "armor",
      type: "Melhoria",
      title: "Armadura +1",
      desc: `Redução atual: ${Math.round(player.damageReduction * 100)}%`,
      apply: () => {
        player.armorLevel += 1;
        showMessage("Armadura +1!", { color: "#55ccff" });
      },
    });
  }

  upgrades.push({
    id: "damage",
    type: "Melhoria",
    title: "Dano +1",
    desc: `Dano atual: ${player.bulletDamage}`,
    apply: () => {
      player.bulletDamage += 1;
      showMessage("Dano +1!", { color: "#ffd700" });
    },
  });

  if (fireRateMs > 60) {
    upgrades.push({
      id: "firerate",
      type: "Melhoria",
      title: "Cadência +1",
      desc: `Delay atual: ${fireRateMs}ms`,
      apply: () => {
        fireRateLevel += 1;
        fireRateMs = Math.max(60, fireRateMs - 15);
        showMessage("Cadência melhorada!", { color: "#ffd700" });
      },
    });
  }

  if (player.shieldHp <= 0) {
    consumables.push({
      id: "shield",
      type: "Consumível",
      title: "Escudo +30",
      desc: "HP extra não cumulativo.",
      apply: () => {
        player.shieldHp = player.shieldMax;
        showMessage("Escudo +30!", { color: "rgba(80,220,255,0.95)" });
      },
    });
  }

  consumables.push({
    id: "spikes",
    type: "Consumível",
    title: "Espinhos +1",
    desc: "Encostar consome e causa dano.",
    apply: () => {
      player.spikes += 1;
      showMessage("Espinho +1!", { color: "#ffffff" });
    },
  });

  consumables.push({
    id: "bomb",
    type: "Consumível",
    title: "Bomba +1",
    desc: "Explode no clique.",
    apply: () => {
      player.bombs += 1;
      showMessage("Bomba +1!", { color: "rgba(80,220,255,0.95)" });
    },
  });

  if (!player.dashUnlocked) {
    functions.push({
      id: "dash",
      type: "Função",
      title: "Desbloquear Dash",
      desc: "Libera o dash com Shift.",
      apply: () => {
        player.dashUnlocked = true;
        showMessage("DASH DESBLOQUEADO!", { color: "rgba(80,220,255,0.95)" });
      },
    });
  }

  if (powersOnCooldown()) {
    functions.push({
      id: "power-reset",
      type: "Função",
      title: "Recarga dos Poderes",
      desc: "Zera o cooldown das habilidades.",
      apply: () => refreshPowers(),
    });
  }

  return { upgrades, consumables, functions };
}

function generateRoundChoices() {
  const { upgrades, consumables, functions } = buildRoundChoicePool();
  const choices = [];

  const firstPicks = [
    pickAndRemove(upgrades),
    pickAndRemove(consumables),
    pickAndRemove(functions),
  ].filter(Boolean);

  choices.push(...firstPicks);

  const remaining = [...upgrades, ...consumables, ...functions];
  while (choices.length < ROUND_CHOICES_COUNT && remaining.length) {
    const choice = pickAndRemove(remaining);
    if (choice) choices.push(choice);
  }

  roundChoiceState.options = choices;
  roundChoiceState.picked = false;
}

function renderRoundChoices() {
  const container = document.getElementById("round-choices");
  if (!container) return;

  if (roundChoiceState.picked) {
    container.innerHTML = `<div class="choice-empty">Bônus escolhido! Aguarde a próxima rodada.</div>`;
    return;
  }

  if (!roundChoiceState.options.length) {
    container.innerHTML = `<div class="choice-empty">Sem bônus disponíveis agora.</div>`;
    return;
  }

  container.innerHTML = roundChoiceState.options.map((opt) => `
    <button class="choice-button" data-choice="${opt.id}">
      <div class="choice-title">
        <span>${opt.title}</span>
        <span class="choice-type">${opt.type}</span>
      </div>
      <div class="choice-desc">${opt.desc}</div>
    </button>
  `).join("");
}

function startRoundChoices() {
  generateRoundChoices();
  renderRoundChoices();
}

function renderStatusBars() {
// ✅ vida + escudo (ciano no FIM)
const hp = clamp(player.hp, 0, player.maxHp);
const sh = clamp(player.shieldHp || 0, 0, player.shieldMax || 0);

// total “visível” só soma o escudo máximo quando ele existe (escudo não cumulativo)
const effectiveMax = player.maxHp + (sh > 0 ? player.shieldMax : 0);
const effectiveCur = hp + sh;

// texto
document.getElementById("stat-hp-text").textContent =
  `${Math.floor(hp)}${sh > 0 ? ` +${Math.floor(sh)}` : ""}/${effectiveMax}`;

// tamanho total da barra preenchida
const hpFill = document.getElementById("bar-hp");
hpFill.style.width = pct01(effectiveCur / effectiveMax);

// ✅ verde primeiro, ciano no fim
if (sh > 0 && effectiveCur > 0) {
  const greenPct = Math.round((hp / effectiveCur) * 100);
  hpFill.style.background =
    `linear-gradient(to right,
      rgba(80,255,120,0.85) 0%,
      rgba(80,255,120,0.85) ${greenPct}%,
      rgba(80,220,255,0.95) ${greenPct}%,
      rgba(80,220,255,0.95) 100%)`;
} else {
  hpFill.style.background = "rgba(80,255,120,0.85)";
}

  // ---- resto igual ao seu ----
  const ammoRatio = player.ammo / 50;
  document.getElementById("stat-ammo-text").textContent = String(player.ammo);
  const ammoFill = document.getElementById("bar-ammo");
  ammoFill.style.width = pct01(ammoRatio);
  ammoFill.style.background = "rgba(255,220,80,0.9)";

  document.getElementById("stat-armor-text").textContent =
    `${Math.round(player.damageReduction * 100)}% (Nv ${player.armorLevel})`;
  
  document.getElementById("stat-wave-text").textContent = String(wave);
  const remaining = Object.values(toSpawn).reduce((a, b) => a + b, 0) + enemies.length;
  document.getElementById("stat-remaining-text").textContent = String(remaining);

  document.getElementById("stat-immune-text").textContent = isImmune() ? "SIM" : "não";
  document.getElementById("stat-minigun-text").textContent = isMinigun() ? "ON" : "off";
}


// shop.js
window.selectedInventoryItem = null; // "bomb" | null

function renderInventory() {
  const grid = document.getElementById("inventory-grid");

  const cards = [
    { key: "armor",  name: "Armadura", lvl: player.armorLevel, desc: `Redução: ${Math.round(player.damageReduction * 100)}%`, selectable: false },
    { key: "dmg",    name: "Dano",     lvl: player.bulletDamage, desc: `Dano por tiro: ${player.bulletDamage}`, selectable: false },
    { key: "rate",   name: "Cadência", lvl: fireRateLevel, desc: `Delay: ${fireRateMs}ms`, selectable: false },

    // ✅ consumíveis
    { key: "shield", name: "Escudo",   lvl: player.shieldHp > 0 ? `${player.shieldHp}/${player.shieldMax}` : "0", desc: "HP extra (não cumulativo)", selectable: false },
    { key: "spikes", name: "Espinhos", lvl: player.spikes, desc: "Ao encostar: inimigo toma 1 e consome 1", selectable: false },

    { key: "bomb",   name: "Bombas",   lvl: player.bombs,  desc: "Clique pra selecionar e atire pra explodir", selectable: true },
  ];

  grid.innerHTML = cards.map(c => {
    const selected = c.key === "bomb" && window.selectedInventoryItem === "bomb";
    const border = selected ? "2px solid rgba(80,220,255,0.95)" : "1px solid #111";
    const cursor = c.selectable ? "pointer" : "default";

    return `
      <div class="card" data-item="${c.key}" style="border:${border}; cursor:${cursor};">
        <div class="title">
          <span class="name">${c.name}</span>
          <span class="lvl">Nv ${c.lvl}</span>
        </div>
        <div class="desc">${c.desc}</div>
      </div>
    `;
  }).join("");

  // clique para selecionar bomba
  grid.querySelectorAll(".card").forEach(el => {
    if (el.dataset.item !== "bomb") return;

    el.addEventListener("click", () => {
      if (player.bombs <= 0) {
        showMessage("Você não tem bombas!", { color: "#ffcc55" });
        window.selectedInventoryItem = null;
      } else {
        window.selectedInventoryItem = (window.selectedInventoryItem === "bomb") ? null : "bomb";
      }
      renderInventory();
    });
  });
}


function updateShop() {
  document.getElementById("coins").textContent = String(player.coins);
  document.getElementById("wave").textContent = String(wave);

  renderRoundChoices();
  renderStatusBars();
  renderInventory();
  updatePowersUI();
}

document.getElementById("round-choices").addEventListener("click", (e) => {
  if (roundChoiceState.picked || isGameOver) return;
  const button = e.target.closest(".choice-button");
  if (!button) return;

  const choiceId = button.dataset.choice;
  const choice = roundChoiceState.options.find((opt) => opt.id === choiceId);
  if (!choice) return;

  choice.apply();
  roundChoiceState.picked = true;
  updateShop();
});

// compras
function buyAmmo() {
  if (player.coins >= 10) {
    player.ammo += 10;
    player.coins -= 10;
    showMessage("+10 balas!", { color: "#55ff55" });
    updateShop();
  } else showMessage("Moedas insuficientes!", { color: "#ff5555" });
}
function buyMedkit() {
  if (player.coins >= 15) {
    player.hp = Math.min(player.maxHp, player.hp + 30);
    player.coins -= 15;
    showMessage("+30 HP!", { color: "#55ff55" });
    updateShop();
  } else showMessage("Moedas insuficientes!", { color: "#ff5555" });
}
// botões
document.getElementById("buy-ammo").addEventListener("click", () => { if (!isGameOver) buyAmmo(); });
document.getElementById("buy-medkit").addEventListener("click", () => { if (!isGameOver) buyMedkit(); });



canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

canvas.addEventListener("mousedown", (e) => {
  if (isGameOver) return;

  // BOTÃO DIREITO → recarregar
if (e.button === 2) {
  buyAmmo();
  showMessage("Recarregado!", { color: "#aaffaa", duration: 600 });
  return;
}

});


// atalhos
document.addEventListener("keydown", (e) => {
  if (isGameOver) return;
  if (e.repeat) return;

  const k = e.key.toLowerCase();

  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  if (tag === "input" || tag === "textarea") return;

  if (k === "q") buyAmmo();
  if (k === "e") buyMedkit();
});

window.startRoundChoices = startRoundChoices;

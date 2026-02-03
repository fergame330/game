// waves.js
let wave = 1;
let waveActive = false;
let toSpawn = { red: 0, white: 0, yellow: 0, orange: 0, pink: 0, green: 0 };
let spawnTimer = null;
let spawnTickMs = 360;

function stopSpawning() {
  if (spawnTimer) clearInterval(spawnTimer);
  spawnTimer = null;
}

function waveCounts(w) {
  const total = 5 + w * 2;

  const white  = w >= 3  ? Math.max(1, Math.floor(total * 0.18)) : 0;
  const yellow = w >= 5  ? Math.max(1, Math.floor(total * 0.22)) : 0;
  const orange = w >= 7  ? Math.max(1, Math.floor(total * 0.18)) : 0;
  const pink   = w >= 10 ? Math.max(1, Math.floor(total * 0.14)) : 0;
  const green  = w >= 15 ? Math.max(1, Math.floor(total * 0.10)) : 0;

  const used = white + yellow + orange + pink + green;
  const red = Math.max(0, total - used);

  return { red, white, yellow, orange, pink, green };
}

function spawnOneEnemy() {
  const size = 20;
  const pos = randSpawnOutside(size);

  if (toSpawn.green > 0)  { enemies.push(new GreenMissiler(pos.x, pos.y)); toSpawn.green--; return; }
  if (toSpawn.pink > 0)   { enemies.push(new PinkSplitter(pos.x, pos.y));  toSpawn.pink--; return; }
  if (toSpawn.orange > 0) { enemies.push(new OrangeFast(pos.x, pos.y));    toSpawn.orange--; return; }
  if (toSpawn.yellow > 0) { enemies.push(new YellowShooter(pos.x, pos.y)); toSpawn.yellow--; return; }
  if (toSpawn.white > 0)  { enemies.push(new WhiteSlower(pos.x, pos.y));   toSpawn.white--; return; }
  if (toSpawn.red > 0)    { enemies.push(new RedEnemy(pos.x, pos.y));      toSpawn.red--; return; }

  stopSpawning();
}


function startWave(w) {
  console.log("Wave:", w, "toSpawn:", toSpawn);
  wave = w;
  waveActive = true;
  toSpawn = waveCounts(w);

  stopSpawning();
  spawnTimer = setInterval(() => {
    if (isGameOver) return;
    const remainingToSpawn = Object.values(toSpawn).reduce((a, b) => a + b, 0);
    if (remainingToSpawn <= 0) { stopSpawning(); return; }
    spawnOneEnemy();
  }, spawnTickMs);

  showMessage(`Horda ${wave} iniciada!`, { color: "#55ccff", duration: 1400 });
  updateShop();
}

function waveCleared() {
  player.coins += 10 + wave * 2;
  waveActive = false;
  stopSpawning();
  showMessage(`Horda ${wave} limpa! +${10 + wave * 2} coins`, { color: "#55ff55", duration: 1500 });
  updateShop();

  setTimeout(() => {
    if (!isGameOver) startWave(wave + 1);
  }, 1200);
}

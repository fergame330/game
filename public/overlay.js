// overlay.js
let isGameOver = false;

const $gameover = document.getElementById("gameover");
const $barFill = document.getElementById("go-bar-fill");
const $btnRetry = document.getElementById("btn-retry");

function triggerGameOver() {
  if (isGameOver) return;
  isGameOver = true;

  stopSpawning();

  $gameover.classList.remove("hidden");
  $barFill.style.width = "0%";

  const duration = 2500;
  const start = performance.now();

  function anim() {
    if (!isGameOver) return;
    const t = (performance.now() - start) / duration;
    const pct = clamp(t, 0, 1);
    $barFill.style.width = `${pct * 100}%`;
    if (pct < 1) requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);
}

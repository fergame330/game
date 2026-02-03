const { app, BrowserWindow, Menu, screen } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  // Defina o tamanho base que representa a proporção que você quer manter.
  // Ex.: 1280x720 = 16:9
  const BASE_W = 1280;
  const BASE_H = 720;
  const ASPECT = BASE_W / BASE_H;

  mainWindow = new BrowserWindow({
    width: BASE_W,
    height: BASE_H,
    show: false, // mostra só depois de configurar
    autoHideMenuBar: true, // esconde menu (e não volta com Alt)
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // se não tiver, pode remover essa linha
      contextIsolation: true,
    },
  });

  // Remove o menu de vez (tira "File Edit View Window Help")
  Menu.setApplicationMenu(null);

  // Carrega seu app (HTML local)
  mainWindow.loadFile(path.join(__dirname, "public", "index.html"));

  // Força a janela a manter a proporção (mesma “proporção de resolução”)
  mainWindow.setAspectRatio(ASPECT);

  // (Opcional) define um mínimo pra não ficar minúsculo
  const MIN_W = 960;
  const MIN_H = Math.round(MIN_W / ASPECT);
  mainWindow.setMinimumSize(MIN_W, MIN_H);

  // Garante que ao redimensionar, ela não estoura a tela (mantendo proporção)
  mainWindow.on("resize", () => {
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const wa = display.workArea; // área útil (sem barra de tarefas)

    let [w, h] = mainWindow.getContentSize();

    // clamp por largura/altura máximas dentro da área útil
    const maxW = wa.width;
    const maxH = wa.height;

    // mantém proporção e limita
    if (w / h > ASPECT) {
      // largo demais -> ajusta largura
      w = Math.min(w, maxW);
      h = Math.round(w / ASPECT);
    } else {
      // alto demais -> ajusta altura
      h = Math.min(h, maxH);
      w = Math.round(h * ASPECT);
    }

    // Evita loop infinito: só seta se mudou
    const [cw, ch] = mainWindow.getContentSize();
    if (cw !== w || ch !== h) {
      mainWindow.setContentSize(w, h);
    }
  });

  // Abre no modo de janela maximizada
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize(); // janela maximizada (não fullscreen)
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

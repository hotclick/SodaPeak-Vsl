/* =========================================
   CONFIGURAÇÃO DO PITCH
   ========================================= */
const CONFIG = {
  segundosPitch: window.PITCH_SEGUNDOS || 3406, // definido no index.html, junto do player
  videoId: "6ac509fbfc46ffd44ae63229",  // ID do vídeo no VTurb
  seletor: ".esconder",                 // elementos que ficam ocultos até o pitch
  rolarPara: "#potes",                  // para onde rolar quando aparecer (null = não rola)
  chaveStorage: "pitchExibidoSodaPeak", // lembra que o visitante já viu o pitch
};

/* =========================================
   MOSTRAR OFERTAS
   ========================================= */
let exibido = false;

function mostrarOfertas(rolar = true) {
  if (exibido) return;
  exibido = true;

  document.querySelectorAll(CONFIG.seletor).forEach((el) => el.classList.remove("esconder"));

  try { localStorage.setItem(CONFIG.chaveStorage, "true"); } catch (e) {}

  if (rolar && CONFIG.rolarPara) {
    document.querySelector(CONFIG.rolarPara)?.scrollIntoView({ behavior: "smooth" });
  }
}

function verificarTempo(tempo, smartAutoPlay) {
  if (exibido || smartAutoPlay) return; // ignora o autoplay mudo
  const pitch = window.PITCH_SEGUNDOS || CONFIG.segundosPitch; // atualizado pelo VTurb no index.html
  if (typeof tempo === "number" && tempo >= pitch) mostrarOfertas();
}

/* =========================================
   VTURB
   ========================================= */
function pegarPlayer() {
  return (
    document.querySelector(`vturb-smartplayer#vid-${CONFIG.videoId}`) ||
    document.querySelector("vturb-smartplayer")
  );
}

// Player novo (<vturb-smartplayer>)
// O gatilho principal (displayHiddenElements, do VTurb) fica no index.html, antes do
// script do player. Este listener de tempo do vídeo é só uma reserva.
function ouvirPlayerNovo(player) {
  const onTime = (e) => {
    const d = e?.detail || {};
    const tempo = typeof d.time === "number" ? d.time : d.currentTime;
    verificarTempo(tempo, d.smartAutoPlay?.active ?? d.smartAutoPlay);
  };

  player.addEventListener("video:timeupdate", onTime);
  player.addEventListener("player:ready", (e) => {
    e?.detail?.player?.addEventListener("video:timeupdate", onTime);
  });
}

// Player antigo (window.smartplayer)
function ouvirPlayerAntigo(instancia) {
  instancia.on("timeupdate", () => {
    verificarTempo(instancia.video?.currentTime, instancia.smartAutoPlay);
  });
}

function iniciar(tentativa = 0) {
  const instancias = window.smartplayer?.instances || [];
  const instancia =
    instancias.find((i) => (i?.options?.id || i?.analytics?.player?.options?.id) === CONFIG.videoId) ||
    instancias[0];

  if (instancia && typeof instancia.on === "function") return ouvirPlayerAntigo(instancia);

  const player = pegarPlayer();
  if (player) return ouvirPlayerNovo(player);

  // Player ainda não carregou: tenta de novo por até 10s
  if (tentativa < 10) setTimeout(() => iniciar(tentativa + 1), 1000);
}

/* =========================================
   QUANDO O VTURB ABRIR AS OFERTAS
   ========================================= */
// O VTurb mostra a seção pelo style inline. Aqui a gente percebe isso e completa:
// tira a classe, salva que o visitante já viu e rola até as ofertas.
const secaoOfertas = document.querySelector(CONFIG.rolarPara);
if (secaoOfertas) {
  const vigia = new MutationObserver(() => {
    if (secaoOfertas.style.display && secaoOfertas.style.display !== "none") {
      vigia.disconnect();
      mostrarOfertas();
    }
  });
  vigia.observe(secaoOfertas, { attributes: true, attributeFilter: ["style"] });
}

/* =========================================
   CARD INTEIRO CLICÁVEL
   ========================================= */
// Clicar em qualquer parte do card aciona o botão "Buy now" dele.
// Usa o próprio link do botão, então mantém as UTMs que a UTMify adiciona.
document.querySelectorAll(".card").forEach((card) => {
  const botao = card.querySelector(".btn");
  if (!botao) return;

  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return; // clique no próprio botão já funciona sozinho
    botao.click();
  });
});

/* =========================================
   DATA DE HOJE NO AVISO
   ========================================= */
const dataHoje = document.getElementById("data-hoje");
if (dataHoje) {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  dataHoje.textContent = `${mes}/${dia}/${hoje.getFullYear()}`;
}

/* =========================================
   TÍTULO DA ABA PISCANDO
   ========================================= */
// Emoji codificado para evitar bloqueios
const titulosAba = ["📩 (1) Unread Message", "(1) Unread Message"];
let indiceAba = 0;

function trocarTituloAba() {
  document.title = titulosAba[indiceAba];
  indiceAba = (indiceAba + 1) % titulosAba.length;
}

trocarTituloAba();
setInterval(trocarTituloAba, 1000);

/* =========================================
   TOQUE EM QUALQUER LUGAR PARA INICIAR O VÍDEO
   ========================================= */
// No primeiro toque/clique da página, clica no elemento do meio da tela (o vídeo).
let tocou = false;

function tocarVideo() {
  if (tocou) return;
  tocou = true;

  const meio = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  if (meio && !meio.closest("a, .card")) meio.click();
}

document.addEventListener("touchstart", tocarVideo, { once: true });
document.addEventListener("click", tocarVideo, { once: true });

/* =========================================
   START
   ========================================= */
let jaViu = false;
try { jaViu = localStorage.getItem(CONFIG.chaveStorage) === "true"; } catch (e) {}

if (jaViu) {
  mostrarOfertas(false);
} else {
  iniciar();
}

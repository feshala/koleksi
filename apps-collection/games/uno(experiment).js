// games/uno.js
// --- Uno Classic Script ---
// --- Global: window.Uno ---
// --- Call: Uno.init(container, options) ---
// --- Options: onReady, onExit, onWin, onLose, onState ---
// --- Return: { pause, resume, exit, destroy } ---

(function () {
'use strict';

// --- CSS ---
const CSS = `
/* ============================================================
   0. THEME TOKENS + :HOST BASE
   --- Fix Bug A: custom properties must be declared on :host,
       not :root, because this stylesheet lives inside a Shadow Root.
       :root would match the document root (outside the shadow tree)
       and therefore never apply.
   --- Fix Bug B: removed dead 'html, body' selectors — they don't
       exist inside the shadow tree. Their styling is fully absorbed
       by :host below.
   ============================================================ */
:host {
  display: block;
  width: 100%;
  height: 100%;
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: radial-gradient(ellipse at 50% 0%, #3a3a3a 0%, #1c1c1c 72%);
  color: #fff;
  overflow-x: hidden;
  -webkit-tap-highlight-color: transparent;

  /* --- Theme tokens (Fix Bug A) --- */
  --bg-top:      #3a3a3a;
  --bg-bottom:   #1c1c1c;
  --panel-bg:    rgba(0,0,0,.55);
  --accent:      #fdd835;

  /* --- Fluid card sizing: shrinks on small viewports, caps at desktop.
         All inner card elements derive their font sizes from --card-h. --- */
  --card-w-base: clamp(44px, 8vw, 84px);
  --card-h-base: clamp(64px, 11.5vw, 122px);
}

/* ============================================================
   1. BASE
   ============================================================ */
*{box-sizing:border-box;}

/* --- Fix Bug C: #app needs every ancestor in the height chain to
       have an explicit height. #uno-root is the wrapper element
       directly inside :host, so give it 100%/100% too. --- */
#uno-root {
  width: 100%;
  height: 100%;
}

#app {
  /* --- Fix Bug C: :host already provides a definite height,
         so 100% is correct here (instead of 100vh / 100dvh). --- */
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ============================================================
   2. SCREENS
   ============================================================ */
.screen{position:absolute;inset:0;display:none;overflow-y:auto;}
.screen.active{display:flex;align-items:center;justify-content:center;}

#screen-game.active{
  display:grid;
  grid-template-rows:auto auto 1fr auto;
  overflow:hidden;   /* game screen should never scroll */
}

.panel{
  background:var(--panel-bg);
  border:1px solid rgba(255,255,255,.16);
  border-radius:20px;
  padding:32px 42px;
  text-align:center;
  max-width:620px;
  width:calc(100% - 32px);
  box-shadow:0 20px 60px rgba(0,0,0,.6);
  animation:panelIn .3s ease-out;
  margin:20px auto;
}
@keyframes panelIn{from{transform:scale(.94);opacity:0;}to{transform:none;opacity:1;}}

.logo{
  font-size:clamp(48px, 10vw, 76px);margin:0 0 6px;font-weight:900;letter-spacing:4px;
  color:var(--accent);text-shadow:4px 4px 0 #c62828, 8px 8px 0 rgba(0,0,0,.45);
  font-style:italic;
}
.sub{margin:0 0 20px;opacity:.75;font-size:14px;}

/* Compact rules list */
.rules{
  text-align:left;
  font-size:12.5px;
  line-height:1.55;
  opacity:.8;
  margin:0 0 20px;
  padding-left:18px;
}
.rules li{margin:2px 0;}
.rules b{color:var(--accent);}

/* ============================================================
   3. BUTTONS
   ============================================================ */
.btn{
  font-family:inherit;font-size:15px;font-weight:700;
  padding:12px 26px;border-radius:26px;border:none;cursor:pointer;
  background:var(--accent);color:#3e2723;
  transition:transform .12s, filter .12s, opacity .12s;
  letter-spacing:.03em;
  min-height:44px;         /* touch target */
  min-width:44px;
}
.btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.08);}
.btn:active:not(:disabled){transform:translateY(0);}
.btn:disabled{opacity:.35;cursor:not-allowed;}
.btn.secondary{background:rgba(255,255,255,.16);color:#fff;}
.btn.uno{background:#e53935;color:#fff;animation:pulseUno .9s infinite;}
@keyframes pulseUno{0%,100%{transform:scale(1);}50%{transform:scale(1.09);}}
.hidden{display:none !important;}

/* ============================================================
   4. CONFIG SCREEN (segmented controls + toggle)
   ============================================================ */
.config-block{margin:0 0 18px;text-align:left;}
.config-label{
  font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
  opacity:.7;margin-bottom:8px;display:block;
}
.segmented{
  display:inline-flex;
  background:rgba(255,255,255,.08);
  border-radius:12px;
  padding:4px;
  gap:4px;
  width:100%;
}
.segmented button{
  flex:1 1 0;
  background:transparent;
  border:none;
  color:#fff;
  padding:8px 10px;
  min-height:44px;
  border-radius:9px;
  cursor:pointer;
  font:inherit;
  font-weight:700;
  font-size:14px;
  transition:background .15s, color .15s;
  touch-action: manipulation;
}
.segmented button:hover{background:rgba(255,255,255,.08);}
.segmented button.active{
  background:var(--accent);
  color:#222;
}
/* --- Fitur 3: segmented grid untuk 6 pilihan bot --- */
.segmented.segmented-multi {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
}
.segmented-multi button {
  padding: 8px 4px;
  font-size: 13px;
}
.config-hint{
  font-size:11.5px;
  opacity:.55;
  margin:6px 0 0;
  line-height:1.4;
}

/* --- Fitur 2: Toggle row (Playable Highlight) --- */
.toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
}
.toggle-row span { font-size: 13px; opacity: .85; }
.toggle-switch {
  position: relative;
  width: 48px; height: 28px;
  background: rgba(255,255,255,.16);
  border: none; border-radius: 999px;
  cursor: pointer; padding: 0;
  transition: background .2s;
  flex: 0 0 auto;
}
.toggle-switch.on { background: var(--accent); }
.toggle-knob {
  position: absolute;
  top: 3px; left: 3px;
  width: 22px; height: 22px;
  background: #fff;
  border-radius: 50%;
  transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
.toggle-switch.on .toggle-knob { transform: translateX(20px); }

/* ============================================================
   5. TOP BAR
   ============================================================ */
#topbar{
  display:flex;align-items:center;gap:12px;
  padding:8px 16px;
  background:rgba(0,0,0,.45);
  border-bottom:1px solid rgba(255,255,255,.1);
  font-size:13px;
  flex-wrap:nowrap;
}
.tb-item{display:flex;align-items:center;gap:6px;}
.tb-item .label{opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em;}
#score-list{display:flex;gap:12px;flex-wrap:wrap;}
.score-item{display:flex;gap:4px;font-size:12px;}
.score-item .nm{opacity:.6;}
.score-item .pt{font-weight:800;color:var(--accent);}

/* --- Fitur 1: Menu button (topbar kiri) --- */
.menu-btn {
  width: 38px; height: 38px; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border: none; border-radius: 50%;
  background: rgba(253,216,53,.2);
  color: var(--accent);
  cursor: pointer;
  transition: background .15s, transform .1s;
  flex: 0 0 auto;
}
.menu-btn:active { background: rgba(253,216,53,.45); transform: scale(.92); }
.menu-btn svg { width: 20px; height: 20px; display: block; }

/* --- Fitur 1: Scores item mendorong exit-btn ke kanan --- */
.scores-item { flex: 1 1 auto; min-width: 0; }
.exit-btn { margin-left: 8px; }

/* ============================================================
   EXIT BUTTON (topbar)
   ============================================================ */
.exit-btn {
  width: 38px; height: 38px; padding: 0;
  display: none; align-items: center; justify-content: center;
  border: none; border-radius: 50%;
  background: rgba(229,57,53,.25); color: #ffb8b8;
  cursor: pointer; transition: background .15s, transform .1s;
  margin-left: 8px;
}
.exit-btn.show { display: inline-flex; }
.exit-btn:active { background: rgba(229,57,53,.5); transform: scale(.92); }
.exit-btn svg { width: 20px; height: 20px; display: block; }

/* ============================================================
   6. OPPONENTS
   ============================================================ */
#opponents{display:flex;gap:12px;padding:10px 16px 4px;justify-content:center;}
.opponent{
  flex:1 1 0;max-width:320px;
  background:rgba(255,255,255,.06);
  border:2px solid transparent;
  border-radius:14px;
  padding:8px 12px 6px;
  transition:border-color .25s, background .25s, box-shadow .25s;
}
.opponent.active{
  border-color:#ffd54f;
  background:rgba(255,213,79,.12);
  box-shadow:0 0 22px rgba(255,213,79,.35);
}
.opponent .head{display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:6px;}
.opponent .name{font-weight:700;}
.opponent .count{opacity:.6;font-size:12px;}
.mini-hand{display:flex;padding-right:22px;min-height:50px;}
.mini-hand .card{margin-right:-20px;}
.uno-badge{
  display:inline-block;background:#e53935;color:#fff;font-size:10px;font-weight:800;
  padding:1px 6px;border-radius:9px;margin-left:6px;letter-spacing:.06em;
  animation:pulseUno 1s infinite;
}

/* ============================================================
   7. TABLE (piles)
   ============================================================ */
#table{display:flex;align-items:center;justify-content:center;gap:70px;position:relative;padding:6px 0;}
.pile{display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;}
.pile-label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;opacity:.5;}
#draw-pile{cursor:pointer;transition:transform .15s;touch-action:manipulation;}
#draw-pile:hover{transform:translateY(-4px) scale(1.03);}
#draw-pile:active{transform:translateY(-2px) scale(1.02);}
#draw-pile::after{
  content:'';position:absolute;inset:0;border-radius:10px;
  box-shadow:4px 4px 0 rgba(0,0,0,.4), 8px 8px 0 rgba(0,0,0,.22);
  z-index:-1;
}
#discard-pile-wrap::before{
  content:'';position:absolute;top:-9px;left:-9px;right:-9px;bottom:22px;
  border-radius:20px;
  border:3px solid var(--glow,transparent);
  box-shadow:0 0 26px var(--glow,transparent);
  transition:border-color .3s, box-shadow .3s;
  pointer-events:none;
}

/* --- Fitur 3: discard pile dengan efek tumpukan 3 kartu --- */
#discard-pile{
  min-width:var(--card-w-base);
  min-height:var(--card-h-base);
  position:relative;
}
#discard-pile .card {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}
#discard-pile .card.stack-2 {
  transform: translate(-50%, -50%) translate(-5px, 3px) rotate(-5deg);
  opacity: .6;
  filter: brightness(.75);
  z-index: 1;
}
#discard-pile .card.stack-1 {
  transform: translate(-50%, -50%) translate(4px, 2px) rotate(3deg);
  opacity: .85;
  filter: brightness(.9);
  z-index: 2;
}
#discard-pile .card.stack-0 {
  z-index: 3;
}

/* ============================================================
   8. HUMAN AREA
   ============================================================ */
#human-area{
  display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:0 12px 10px;
  background:linear-gradient(to top, rgba(0,0,0,.5), transparent);
}
/* --- Fitur 4: turn timer absolute positioned --- */
#human-area { position: relative; }
.turn-timer {
  position: absolute;
  top: 4px;
  right: 16px;
  background: rgba(253,216,53,.95);
  color: #222;
  padding: 4px 12px;
  border-radius: 999px;
  /* --- Bug 5: font-size & uppercase untuk readability --- */
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .5px;
  text-transform: uppercase;
  /* --- Bug 3: z-index di atas .card.selected (yang punya 9999 !important) --- */
  z-index: 99999 !important;
  box-shadow: 0 3px 10px rgba(0,0,0,.4);
  transition: background .25s, color .25s;
  pointer-events: none;
}
.turn-timer.warning {
  background: #e53935;
  color: #fff;
  animation: pulseUno .8s infinite;
}

/* --- Fix Bug D: replaced the margin-auto :first-child / :last-child
       trick with justify-content:center on the container.
       The old trick combined with overflow-x:auto caused unstable
       gaps when the hand didn't fill the full width. --- */
/* --- Fix 1: padding-top diperbesar untuk menampung kartu terangkat
       (-90%) dan align-items flex-end agar kartu tetap di dasar. --- */
/* --- Bug 2: pakai flex-start + auto-margin spacer (::before/::after)
       agar kartu yang overflow ke kiri tetap bisa di-scroll. --- */
/* --- Bug 4: padding-top dikurangi jadi 0.55; padding ekstra hanya
       saat ada kartu terpilih (class .has-selection di-set oleh JS). --- */
#hand{
  display:flex;
  gap:8px;
  width:100%;
  padding: calc(var(--card-h-base) * 0.55 + 12px) 8px 10px;
  overflow-x:auto;
  overflow-y:hidden;
  scrollbar-width:thin;
  -webkit-overflow-scrolling:touch;
  justify-content: flex-start;
  align-items: flex-end;
  min-height: calc(var(--card-h-base) * 0.55 + var(--card-h-base) + 22px);
}
/* --- Bug 2: spacer agar konten terpusat saat tidak overflow,
       tapi tetap scrollable dari paling kiri saat overflow --- */
#hand::before,
#hand::after {
  content: '';
  flex: 0 0 0;
  margin: auto;
}
/* --- Bug 2: jaga kartu tetap di atas spacer --- */
#hand > .card { z-index: 1; }
/* --- Bug 4: padding lebih besar hanya saat ada kartu terpilih --- */
#hand.has-selection {
  padding-top: calc(var(--card-h-base) * 0.95 + 12px);
}
#hand::-webkit-scrollbar{height:6px;}
#hand::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:3px;}

/* --- Auto-overlap saat kartu > 6 ---
   Kartu saling menindih 50% (menutupi separuh kartu sebelumnya).
   Z-index di-set via inline style oleh JS dengan pola simetris:
   tepi = rendah, tengah = tinggi. --- */
#hand.hand-overlap {
  gap: 0;
}
#hand.hand-overlap .card + .card {
  margin-left: calc(var(--card-w-base) * -0.5);
}
/* Kartu yang sedang di-hover / playable muncul di atas semua
   supaya efek raise (translateY) tidak tertutup kartu lain. */
#hand .card:hover,
#hand .card.playable:hover {
  z-index: 9999 !important;
}

#hand .card.playable{
  cursor:pointer;
  box-shadow:0 0 0 3px rgba(255,255,255,.9), 0 0 18px 5px rgba(255,235,120,.75);
}
#hand .card.playable:hover{transform:translateY(-16px);}
#hand .card.playable:active{transform:translateY(-10px);}
#hand .card.dim{filter:brightness(.45) saturate(.45);}
#hand .card.drawn{box-shadow:0 0 0 3px #4fc3f7, 0 0 18px 5px rgba(79,195,247,.75);}

/* --- Fitur 2: mode tanpa hint — semua kartu tampil sama --- */
#hand .card.clickable { cursor: pointer; }
#hand .card.clickable:hover { transform: translateY(-8px); }

/* --- Fix 3: Transition halus untuk kartu di hand --- */
#hand .card {
  transition: transform .32s cubic-bezier(.25,.8,.25,1),
              box-shadow .3s ease,
              filter .3s ease;
}

/* --- Fitur 4: kartu terpilih (fase 1 sebelum play) --- */
#hand .card.selected {
  transform: translateY(-90%) !important;
  z-index: 9999 !important;
  box-shadow:
    0 0 0 3px var(--accent),
    0 0 22px 6px rgba(253,216,53,.65) !important;
  filter: none !important;
  cursor: pointer;
}

#controls{display:flex;gap:10px;align-items:center;min-height:44px;}

/* ============================================================
   9. CARDS (pure CSS)
   --- Fix Bug E: --card-w-base and --card-h-base now resolve from
       :host (see Fix Bug A above), so card sizing is consistent
       across hand, discard pile, mini-hand, etc.
   ============================================================ */
.card{
  --card-w: var(--card-w-base);
  --card-h: var(--card-h-base);
  --c:#888;
  width:var(--card-w);
  height:var(--card-h);
  border-radius:10px;
  position:relative;
  flex:0 0 auto;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 3px 9px rgba(0,0,0,.5);
  overflow:hidden;
  transition:transform .16s ease, box-shadow .16s ease, filter .16s ease;
  user-select:none;-webkit-user-select:none;
  background:var(--c);
}
.card.mini{
  --card-w: calc(var(--card-w-base) * 0.42);
  --card-h: calc(var(--card-h-base) * 0.42);
  border-radius:5px;
  box-shadow:0 1px 3px rgba(0,0,0,.55);
}

.card.red   {--c:#d32f2f;}
.card.green {--c:#2e7d32;}
.card.blue  {--c:#1565c0;}
.card.yellow{--c:#f9a825;}

.card .oval{
  position:absolute;
  width:84%;height:62%;
  background:#fff;
  border-radius:50%;
  transform:rotate(-22deg);
  display:flex;align-items:center;justify-content:center;
}
.card .oval span{
  display:block;
  transform:rotate(22deg);
  font-weight:900;
  font-style:italic;
  line-height:1;
}
.card .val{
  position:relative;z-index:2;
  font-size:calc(var(--card-h) * .36);
  font-weight:900;
  color:var(--c);
  line-height:1;
  transform:rotate(-8deg);
}
.card .corner{
  position:absolute;z-index:3;
  font-size:calc(var(--card-h) * .15);
  font-weight:800;
  color:#fff;
  line-height:1;
}
.card .corner.tl{top:6%;left:7%;}
.card .corner.br{bottom:6%;right:7%;}
.card.yellow .corner{color:rgba(0,0,0,.62);}
.card.mini .corner,.card.mini .val{display:none;}

/* Wild cards: four-colour quadrant background */
.card.wild{
  background:conic-gradient(from 45deg,#d32f2f 0 25%,#2e7d32 0 50%,#1565c0 0 75%,#f9a825 0 100%);
}
.card.wild .oval span{color:#212121;font-size:calc(var(--card-h) * .26);}

/* Card backs */
.card.back{background:#141414;border:2px solid #333;}
.card.back .oval{background:var(--accent);}
.card.back .oval span{color:#c62828;font-size:calc(var(--card-h) * .17);letter-spacing:-.5px;}

/* Play animation */
@keyframes playIn{
  from{transform:scale(1.55) rotate(-28deg);opacity:0;}
  to{transform:scale(1) rotate(0deg);opacity:1;}
}
.card.just-played{animation:playIn .35s ease-out;}

/* ============================================================
   10. TOASTS
   ============================================================ */
#toasts{
  position:fixed;top:60px;left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;gap:6px;align-items:center;
  z-index:900;pointer-events:none;
  max-width:92vw;
}
.toast{
  background:rgba(0,0,0,.88);
  border:1px solid rgba(255,255,255,.16);
  color:#fff;padding:7px 16px;border-radius:20px;font-size:13px;
  animation:toastIn .22s ease-out;
  box-shadow:0 4px 16px rgba(0,0,0,.5);
  text-align:center;
  max-width:92vw;
}
@keyframes toastIn{from{transform:translateY(-12px);opacity:0;}to{transform:none;opacity:1;}}
.toast.fade{opacity:0;transition:opacity .35s;}

/* ============================================================
   11. COLOUR MODAL
   ============================================================ */
#modal-overlay{
  position:fixed;inset:0;z-index:1000;
  background:rgba(0,0,0,.72);
  display:flex;align-items:center;justify-content:center;
  opacity:0;pointer-events:none;transition:opacity .2s ease;
  padding:16px;
}
#modal-overlay.show{opacity:1;pointer-events:auto;}
#color-modal{
  background:#1c1c1c;border:1px solid rgba(255,255,255,.16);
  border-radius:18px;padding:24px 30px;text-align:center;
  transform:scale(.88);transition:transform .2s ease;
  box-shadow:0 20px 60px rgba(0,0,0,.7);
  max-width:100%;
}
#modal-overlay.show #color-modal{transform:scale(1);}
#color-modal h2{margin:0 0 16px;font-size:17px;font-weight:700;}
.color-buttons{display:flex;gap:14px;justify-content:center;}
.color-buttons button{
  width:64px;height:64px;border-radius:14px;cursor:pointer;
  border:3px solid rgba(255,255,255,.55);
  transition:transform .12s, box-shadow .12s;
  min-width:56px;min-height:56px;
}
.color-buttons button:hover{transform:translateY(-4px) scale(1.05);box-shadow:0 8px 22px rgba(0,0,0,.6);}
.color-buttons button:active{transform:scale(.96);}
.color-buttons button[data-color="red"]{background:#d32f2f;}
.color-buttons button[data-color="green"]{background:#2e7d32;}
.color-buttons button[data-color="blue"]{background:#1565c0;}
.color-buttons button[data-color="yellow"]{background:#f9a825;}

/* ============================================================
   EXIT CONFIRM MODAL
   ============================================================ */
#exit-confirm-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(0,0,0,.72);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .2s ease;
  padding: 16px;
}
#exit-confirm-overlay.show { opacity: 1; pointer-events: auto; }
#exit-confirm-modal {
  background: #1c1c1c;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 18px;
  padding: 24px 28px;
  text-align: center;
  max-width: 320px;
  width: 100%;
  transform: scale(.9);
  transition: transform .2s ease;
  box-shadow: 0 20px 60px rgba(0,0,0,.7);
}
#exit-confirm-overlay.show #exit-confirm-modal { transform: scale(1); }
#exit-confirm-modal h2 { margin: 0 0 10px; font-size: 17px; font-weight: 800; }
#exit-confirm-modal p { margin: 0 0 20px; font-size: 13px; opacity: .7; line-height: 1.5; }
#exit-confirm-modal .row { display: flex; gap: 10px; }
#exit-confirm-modal button {
  flex: 1; padding: 12px; border: none; border-radius: 12px;
  font: inherit; font-weight: 800; font-size: 14px;
  letter-spacing: .3px; cursor: pointer;
  transition: transform .1s, filter .15s;
}
#exit-confirm-modal .btn-cancel {
  background: rgba(255,255,255,.16); color: #fff;
}
#exit-confirm-modal .btn-yes {
  background: #e53935; color: #fff;
}
#exit-confirm-modal button:active { transform: scale(.96); }

/* ============================================================
   HOME CONFIRM MODAL (kembali ke menu)
   ============================================================ */
#home-confirm-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(0,0,0,.72);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .2s ease;
  padding: 16px;
}
#home-confirm-overlay.show { opacity: 1; pointer-events: auto; }
#home-confirm-modal {
  background: #1c1c1c;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 18px;
  padding: 24px 28px;
  text-align: center;
  max-width: 320px;
  width: 100%;
  transform: scale(.9);
  transition: transform .2s ease;
  box-shadow: 0 20px 60px rgba(0,0,0,.7);
}
#home-confirm-overlay.show #home-confirm-modal { transform: scale(1); }
#home-confirm-modal h2 { margin: 0 0 10px; font-size: 17px; font-weight: 800; }
#home-confirm-modal p { margin: 0 0 20px; font-size: 13px; opacity: .7; line-height: 1.5; }
#home-confirm-modal .row { display: flex; gap: 10px; }
#home-confirm-modal button {
  flex: 1; padding: 12px; border: none; border-radius: 12px;
  font: inherit; font-weight: 800; font-size: 14px;
  letter-spacing: .3px; cursor: pointer;
  transition: transform .1s, filter .15s;
}
#home-confirm-modal .btn-cancel {
  background: rgba(255,255,255,.16); color: #fff;
}
#home-confirm-modal .btn-yes {
  background: var(--accent); color: #222;
}
#home-confirm-modal button:active { transform: scale(.96); }

/* ============================================================
   12. SCORE TABLES (round end / game over)
   ============================================================ */
.score-table{margin:18px 0 22px;display:flex;flex-direction:column;gap:6px;min-width:240px;}
.score-table .row{
  display:flex;justify-content:space-between;
  padding:8px 16px;border-radius:10px;
  background:rgba(255,255,255,.07);font-size:14px;
}
.score-table .row.win{background:rgba(253,216,53,.2);border:1px solid rgba(253,216,53,.55);font-weight:800;}
.big{font-size:32px;font-weight:900;color:var(--accent);margin:6px 0;}
h2{margin:0;font-size:20px;}
.button-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}

/* ============================================================
   13. RESPONSIVE — PHONE (< 640px)
   ============================================================ */
@media (max-width: 640px) {
  /* Compact panel padding */
  .panel { padding:22px 18px; border-radius:16px; }
  .logo { letter-spacing:2px; text-shadow:3px 3px 0 #c62828, 6px 6px 0 rgba(0,0,0,.45); }
  .sub { font-size:12.5px; margin-bottom:14px; }
  .rules { font-size:12px; line-height:1.5; margin-bottom:16px; }

  /* Topbar shrinks */
  #topbar { padding:6px 10px; gap:8px; font-size:11.5px; }
  .tb-item .label { font-size:9px; }
  .score-label { display:none; }              /* hide the "Scores" text label */
  #score-list { gap:8px; }
  .score-item { font-size:10.5px; }
  .menu-btn { width:34px; height:34px; }
  .menu-btn svg { width:18px; height:18px; }
  .exit-btn { width:34px; height:34px; }
  .exit-btn svg { width:18px; height:18px; }

  /* Opponents become a compact vertical list */
  #opponents {
    flex-direction:column;
    gap:4px;
    padding:6px 8px 2px;
  }
  .opponent {
    max-width:none;
    flex:none;
    width:100%;
    padding:4px 10px;
    font-size:12px;
    border-radius:10px;
    display:flex;
    align-items:center;
    justify-content:space-between;
  }
  .opponent .head { margin-bottom:0; flex:1 1 auto; }
  .opponent .mini-hand { display:none; }       /* no mini hand on phones */

  /* Table: tighter gap */
  #table { gap:28px; padding:4px 0; }
  .pile-label { font-size:9px; letter-spacing:.08em; }

  /* Human area: less padding to keep vertical space */
  #human-area { padding:0 6px 8px; }
  /* --- Bug 2: flex-start agar bisa scroll dari kiri ---
     --- Bug 4: padding dasar dikurangi, extra padding via .has-selection --- */
  #hand {
    padding: calc(var(--card-h-base) * 0.55 + 8px) 6px 8px;
    gap:6px;
    min-height: calc(var(--card-h-base) * 0.55 + var(--card-h-base) + 16px);
    justify-content: flex-start;
  }
  #hand.has-selection {
    padding-top: calc(var(--card-h-base) * 0.95 + 8px);
  }

  /* Toasts near bottom (above hand area) */
  #toasts {
    top:auto;
    bottom:150px;
  }
  .toast { font-size:12px; padding:6px 13px; }

  /* Colour modal: smaller buttons + padding */
  #color-modal { padding:18px 20px; border-radius:14px; }
  #color-modal h2 { font-size:15px; margin-bottom:12px; }
  .color-buttons { gap:10px; }
  .color-buttons button { width:58px; height:58px; border-radius:12px; }

  /* Buttons stay usable but compact */
  .btn { font-size:14px; padding:10px 20px; }
  #controls .btn { font-size:13px; padding:9px 16px; }

  .big { font-size:26px; }
  h2 { font-size:18px; }
}

/* ============================================================
   14. RESPONSIVE — TABLET (641px – 900px)
   ============================================================ */
@media (min-width: 641px) and (max-width: 900px) {
  #table { gap:50px; }
  #opponents { gap:10px; padding:8px 12px 2px; }
  .mini-hand { min-height:40px; }
}

/* Small landscape phones: shrink hand padding even further */
@media (max-height: 560px) and (max-width: 900px) {
  /* --- Bug 2: flex-start agar bisa scroll dari kiri ---
     --- Bug 4: padding dasar dikurangi, extra padding via .has-selection --- */
  #hand {
    padding: calc(var(--card-h-base) * 0.55 + 6px) 6px 6px;
    min-height: calc(var(--card-h-base) * 0.55 + var(--card-h-base) + 12px);
    justify-content: flex-start;
  }
  #hand.has-selection {
    padding-top: calc(var(--card-h-base) * 0.95 + 6px);
  }
  #opponents { padding:4px 8px 2px; }
  .opponent { padding:3px 8px; }
}

/* ============================================================
   15. LANDSCAPE MODE — rotate UI saat portrait di mobile
   --- Bug 1: expand override untuk membatalkan aturan mobile
       yang tidak cocok setelah rotasi (opponents row, topbar,
       hand padding, panel, dll). ---
   ============================================================ */
@media (orientation: portrait) and (max-width: 900px) {
  /* --- Force landscape layout: rotate app 90deg --- */
  #app {
    width: 100vh;
    height: 100vw;
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    transform: rotate(90deg) translate(0, -100%);
  }

  /* --- Batalkan aturan mobile yang tidak cocok untuk landscape --- */

  /* Opponents tetap horizontal karena ada ruang lebar */
  #opponents {
    flex-direction: row;
    gap: 8px;
    padding: 6px 12px 2px;
    flex-wrap: nowrap;
  }
  .opponent {
    max-width: none;
    flex: 1 1 0;
    width: auto;
    padding: 6px 10px;
    font-size: 12px;
    border-radius: 10px;
    display: block;
  }
  .opponent .head { margin-bottom: 4px; }
  .opponent .mini-hand { display: flex; min-height: 34px; }

  /* Topbar lebih nyaman di landscape */
  #topbar {
    padding: 6px 20px;
    font-size: 12.5px;
    gap: 12px;
    /* --- Safe area untuk notch di sisi kiri/kanan setelah rotasi --- */
    padding-left: calc(20px + env(safe-area-inset-top, 0px));
    padding-right: calc(20px + env(safe-area-inset-bottom, 0px));
  }

  /* Hand area: padding lebih kecil karena layar vertikal lebih pendek
     --- Bug 4: padding dasar 0.55, extra padding via .has-selection --- */
  #hand {
    padding: calc(var(--card-h-base) * 0.55 + 6px) 16px 8px;
    gap: 8px;
    min-height: calc(var(--card-h-base) * 0.55 + var(--card-h-base) + 16px);
  }
  #hand.has-selection {
    padding-top: calc(var(--card-h-base) * 0.95 + 6px);
  }

  /* Panel config sedikit lebih kompak */
  .panel {
    padding: 20px 28px;
    max-width: 640px;
  }
  .logo { font-size: clamp(40px, 7vw, 60px); letter-spacing: 3px; }
  .sub { margin-bottom: 12px; }

  /* Card base size sedikit lebih besar karena layar "lebar" */
  :host {
    --card-w-base: clamp(52px, 9vh, 88px);
    --card-h-base: clamp(76px, 13vh, 128px);
  }

  /* Toasts di landscape: atas, bukan bawah */
  #toasts {
    top: 60px;
    bottom: auto;
  }

  /* Turn timer di landscape: pindah ke kiri karena safe area kanan bisa notch */
  .turn-timer {
    top: 4px;
    right: auto;
    left: 16px;
  }
}
`;

// --- HTML ---
const HTML = `
<div id="uno-root">

  <div id="app">

    <!-- ============================ CONFIG / START SCREEN ============================ -->
    <div class="screen active" id="screen-start">
      <div class="panel">
        <h1 class="logo">UNO</h1>
        <p class="sub">Classic shedding card game — You vs AI opponents</p>

        <!-- A. Number of AI opponents (maks 6) -->
        <div class="config-block">
          <label class="config-label">AI Opponents</label>
          <div class="segmented segmented-multi" id="seg-bots" role="group" aria-label="AI opponents">
            <button type="button" data-value="1">1</button>
            <button type="button" data-value="2">2</button>
            <button type="button" data-value="3" class="active">3</button>
            <button type="button" data-value="4">4</button>
            <button type="button" data-value="5">5</button>
            <button type="button" data-value="6">6</button>
          </div>
          <p class="config-hint">Default: 3 bots (maks 6). Fewer bots = faster rounds.</p>
        </div>

        <!-- B. Starting cards per player -->
        <div class="config-block">
          <label class="config-label">Starting Cards</label>
          <div class="segmented" id="seg-cards" role="group" aria-label="Starting cards">
            <button type="button" data-value="5">5</button>
            <button type="button" data-value="7" class="active">7</button>
            <button type="button" data-value="10">10</button>
          </div>
          <p class="config-hint">Default: 7 cards (official UNO rule). Fewer cards = shorter rounds.</p>
        </div>

        <!-- C. Fitur 2: Playable Highlight toggle -->
        <div class="config-block">
          <label class="config-label">Playable Highlight</label>
          <div class="toggle-row">
            <span>Dim kartu yang tidak bisa dimainkan</span>
            <button class="toggle-switch on" id="toggle-highlight" role="switch" aria-checked="true">
              <span class="toggle-knob"></span>
            </button>
          </div>
          <p class="config-hint">Jika dimatikan, semua kartu tampil sama — tanpa hint visual.</p>
        </div>

        <ul class="rules">
          <li>Match the top card by <b>colour</b>, <b>number</b> or <b>symbol</b>.</li>
          <li>Play a <b>Wild</b> / <b>Wild +4</b> to choose the next colour.</li>
          <li>Down to one card? Hit the <b>UNO!</b> button within 3 seconds.</li>
          <li>First player to reach <b>500 points</b> wins the game.</li>
        </ul>

        <button class="btn" id="btn-start">Start Game</button>
      </div>
    </div>

    <!-- ============================ GAME SCREEN ============================ -->
    <div class="screen" id="screen-game">

      <header id="topbar">
        <button class="menu-btn" id="btn-menu" aria-label="Kembali ke menu" title="Kembali ke menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12l9-9 9 9"/>
            <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>
          </svg>
        </button>
        <div class="tb-item scores-item">
          <div id="score-list"></div>
        </div>
        <button class="exit-btn" id="exit-btn" aria-label="Keluar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="M16 17l5-5-5-5"/>
            <path d="M21 12H9"/>
          </svg>
        </button>
      </header>

      <section id="opponents"></section>

      <section id="table">
        <div class="pile" id="draw-pile-wrap">
          <div class="card back" id="draw-pile"><div class="oval"><span>UNO</span></div></div>
          <div class="pile-label">Draw · <span id="deck-count">0</span></div>
        </div>
        <div class="pile" id="discard-pile-wrap">
          <div id="discard-pile"></div>
          <div class="pile-label">Discard</div>
        </div>
      </section>

      <section id="human-area">
        <div id="turn-timer" class="turn-timer hidden">10s</div>
        <div id="hand"></div>
        <div id="controls">
          <button class="btn" id="btn-draw">Draw Card</button>
          <button class="btn secondary hidden" id="btn-pass">Pass</button>
          <button class="btn uno hidden" id="btn-uno">UNO!</button>
        </div>
      </section>

    </div>

    <!-- ============================ ROUND END SCREEN ============================ -->
    <div class="screen" id="screen-round-end">
      <div class="panel">
        <div id="round-end-body"></div>
        <div class="button-row">
          <button class="btn" id="btn-next-round">Next Round</button>
          <button class="btn secondary" id="btn-back-menu-1">Back to Menu</button>
        </div>
      </div>
    </div>

    <!-- ============================ GAME OVER SCREEN ============================ -->
    <div class="screen" id="screen-game-over">
      <div class="panel">
        <div id="game-over-body"></div>
        <div class="button-row">
          <button class="btn" id="btn-play-again">Play Again</button>
          <button class="btn secondary" id="btn-back-menu-2">Back to Menu</button>
        </div>
      </div>
    </div>

  </div>

  <!-- Toasts -->
  <div id="toasts"></div>

  <!-- Colour chooser modal -->
  <div id="modal-overlay">
    <div id="color-modal">
      <h2>Choose the next colour</h2>
      <div class="color-buttons">
        <button data-color="red"    aria-label="Red"></button>
        <button data-color="green"  aria-label="Green"></button>
        <button data-color="blue"   aria-label="Blue"></button>
        <button data-color="yellow" aria-label="Yellow"></button>
      </div>
    </div>
  </div>

  <!-- Exit confirm modal -->
  <div id="exit-confirm-overlay">
    <div id="exit-confirm-modal">
      <h2>Keluar dari game?</h2>
      <p>Progress permainan saat ini akan hilang. Yakin ingin keluar?</p>
      <div class="row">
        <button class="btn-cancel" id="exit-confirm-cancel">Tidak</button>
        <button class="btn-yes" id="exit-confirm-yes">Ya, Keluar</button>
      </div>
    </div>
  </div>

  <!-- Home / back-to-menu confirm modal -->
  <div id="home-confirm-overlay">
    <div id="home-confirm-modal">
      <h2>Kembali ke menu?</h2>
      <p>Permainan saat ini akan berakhir. Yakin ingin kembali ke menu?</p>
      <div class="row">
        <button class="btn-cancel" id="home-confirm-cancel">Tidak</button>
        <button class="btn-yes" id="home-confirm-yes">Ya, Kembali</button>
      </div>
    </div>
  </div>

</div>
`;

/* ============================================================
   TOP-LEVEL CONSTANTS (shared across init() calls)
   ============================================================ */
const COLORS       = ["red", "green", "blue", "yellow"];
const COLOR_HEX    = { red: "#d32f2f", green: "#2e7d32", blue: "#1565c0", yellow: "#f9a825" };
const TARGET_SCORE = 500;      // points needed to win the whole game
const UNO_WINDOW   = 3000;     // ms the human has to shout UNO

// --- Fitur 6: pool nama untuk bot, di-acak tiap game ---
const BOT_NAME_POOL = [
  "Ana", "Ben", "Cleo", "Dodi", "Eka", "Fani",
  "Gilang", "Hana", "Ivan", "Joko", "Kirana", "Luna",
  "Maya", "Nanda", "Oscar", "Putri"
];

/* Human-readable label drawn on a card */
const VALUE_LABEL = {
  skip: "⊘", reverse: "⇄", draw2: "+2", wild: "W", wild4: "+4"
};
/* Long names used in toasts */
const VALUE_NAME = {
  skip: "Skip", reverse: "Reverse", draw2: "Draw Two",
  wild: "Wild", wild4: "Wild Draw Four"
};

/* ============================================================
   MAIN FUNCTION
   ============================================================ */
function init(container, options = {}) {
  const {
    onReady = null,
    onExit = null,
    onWin = null,
    onLose = null,
    onState = null,
  } = options;

  // --- Shadow host setup (container remains reusable) ---
  const shadowHost = document.createElement('div');
  shadowHost.style.cssText = 'width:100%; height:100%; display:block; position:relative;';
  container.appendChild(shadowHost);

  const shadow = shadowHost.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  shadow.appendChild(styleEl);

  const host = document.createElement('div');
  host.innerHTML = HTML.trim();
  const appEl = host.firstElementChild;
  shadow.appendChild(appEl);

  // --- Element helpers (scoped to shadow) ---
  const $  = (sel) => appEl.querySelector(sel);
  const $$ = (sel) => appEl.querySelectorAll(sel);

  // --- Cleanup registry ---
  const cleanups = [];
  const trackedTimeouts  = new Set();
  const trackedIntervals = new Set();
  const addCleanup = (fn) => cleanups.push(fn);
  const addGlobal = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  };
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(() => { trackedTimeouts.delete(id); try { fn(); } catch (e) { console.warn('[Uno] timeout error:', e); } }, ms);
    trackedTimeouts.add(id);
    return id;
  };
  const safeInterval = (fn, ms) => {
    const id = setInterval(fn, ms);
    trackedIntervals.add(id);
    return id;
  };

  // --- Bridge callback helper ---
  const emit = (name, fn, payload) => {
    if (typeof fn === 'function') {
      try { fn(payload); } catch (e) { console.warn('[Uno] callback error:', e); }
    }
  };

  // --- Storage namespace ---
  const store = (window.AppStorage) ? window.AppStorage.namespace('uno') : null;

  // --- Runtime user configuration ---
  // --- Fitur 2: tambah showHighlight ---
  const config = { botCount: 3, startCards: 7, showHighlight: true };

  // --- Pause flag (simple) ---
  let paused = false;

  // --- Fitur 4: turn timer state ---
  let turnTimerId = null;
  let turnDeadline = 0;
  let turnTimeLeftAtPause = 0;

  // --- Save / Load settings ---
  function loadPersisted() {
    if (!store) return;
    const saved = store.get('settings', null);
    if (saved && typeof saved === 'object') {
      if (typeof saved.botCount === 'number')   config.botCount   = saved.botCount;
      if (typeof saved.startCards === 'number') config.startCards = saved.startCards;
      // --- Fitur 2: load showHighlight ---
      if (typeof saved.showHighlight === 'boolean') config.showHighlight = saved.showHighlight;
    }
  }
  function saveSettings() {
    if (!store) return;
    // --- Fitur 2: persist showHighlight juga ---
    store.set('settings', {
      botCount: config.botCount,
      startCards: config.startCards,
      showHighlight: config.showHighlight
    });
  }

  // --- Load persisted settings PALING AWAL ---
  loadPersisted();

  /* ============================================================
     DOM SHORTCUTS
     ============================================================ */
  const el = {
    screens:        $$(".screen"),
    startBtn:       $("#btn-start"),
    segBots:        $("#seg-bots"),
    segCards:       $("#seg-cards"),
    scoreList:      $("#score-list"),
    opponents:      $("#opponents"),
    drawPile:       $("#draw-pile"),
    drawPileWrap:   $("#draw-pile-wrap"),
    deckCount:      $("#deck-count"),
    discardPile:    $("#discard-pile"),
    discardWrap:    $("#discard-pile-wrap"),
    hand:           $("#hand"),
    btnDraw:        $("#btn-draw"),
    btnPass:        $("#btn-pass"),
    btnUno:         $("#btn-uno"),
    toasts:         $("#toasts"),
    modalOverlay:   $("#modal-overlay"),
    colorModal:     $("#color-modal"),
    roundEndBody:   $("#round-end-body"),
    btnNextRound:   $("#btn-next-round"),
    gameOverBody:   $("#game-over-body"),
    btnPlayAgain:   $("#btn-play-again"),
    btnBackMenu1:   $("#btn-back-menu-1"),
    btnBackMenu2:   $("#btn-back-menu-2"),
    exitBtn:        $("#exit-btn"),
    exitOverlay:    $("#exit-confirm-overlay"),
    exitCancel:     $("#exit-confirm-cancel"),
    exitYes:        $("#exit-confirm-yes"),
    // --- Fitur 5: modal home confirm ---
    homeOverlay:    $("#home-confirm-overlay"),
    homeCancel:     $("#home-confirm-cancel"),
    homeYes:        $("#home-confirm-yes"),
    // --- Fitur 1: tombol menu (topbar kiri) ---
    menuBtn:        $("#btn-menu"),
    // --- Fitur 2: toggle playable highlight ---
    toggleHighlight:$("#toggle-highlight"),
    // --- Fitur 4: turn timer ---
    turnTimer:      $("#turn-timer")
  };

  /* ============================================================
     SOUND (Web Audio API — no external files)
     ============================================================ */
  let audioCtx = null;
  function beep(freq, dur, type = "sine", vol = 0.05) {
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) { /* audio is optional */ }
  }
  function playSound(kind) {
    switch (kind) {
      case "play":  beep(520, 0.08, "triangle", 0.05); break;
      case "draw":  beep(260, 0.10, "sine", 0.05);     break;
      case "error": beep(140, 0.20, "sawtooth", 0.05); break;
      case "uno":
        beep(880, 0.12, "square", 0.04);
        safeTimeout(() => beep(1180, 0.14, "square", 0.04), 110);
        break;
      case "win":
        [523, 659, 784, 1046].forEach((f, i) =>
          safeTimeout(() => beep(f, 0.16, "triangle", 0.05), i * 120));
        break;
    }
  }

  /* ============================================================
     TURN TIMER (Fitur 4)
     ============================================================ */
  const TURN_TIMEOUT_MS = 10000;

  function startTurnTimer() {
    clearTurnTimer();
    turnDeadline = Date.now() + TURN_TIMEOUT_MS;
    el.turnTimer.classList.remove('hidden');
    updateTurnTimerDisplay();
    turnTimerId = safeInterval(tickTurnTimer, 100);
  }

  function tickTurnTimer() {
    const left = turnDeadline - Date.now();
    if (left <= 0) {
      clearTurnTimer();
      onTurnTimeout();
    } else {
      updateTurnTimerDisplay();
    }
  }

  // --- Bug 5: hapus emoji ⏱, pakai teks polos ---
  function updateTurnTimerDisplay() {
    const left = Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
    el.turnTimer.textContent = left + 's';
    el.turnTimer.classList.toggle('warning', left <= 3);
  }

  function pauseTurnTimer() {
    if (turnTimerId) {
      clearInterval(turnTimerId);
      turnTimerId = null;
      turnTimeLeftAtPause = Math.max(0, turnDeadline - Date.now());
    }
  }

  function resumeTurnTimer() {
    if (!turnTimerId && turnTimeLeftAtPause > 0 && state && state.awaitingHuman && state.phase === 'playing') {
      turnDeadline = Date.now() + turnTimeLeftAtPause;
      turnTimeLeftAtPause = 0;
      el.turnTimer.classList.remove('hidden');
      updateTurnTimerDisplay();
      turnTimerId = safeInterval(tickTurnTimer, 100);
    }
  }

  function clearTurnTimer() {
    if (turnTimerId) { clearInterval(turnTimerId); turnTimerId = null; }
    turnTimeLeftAtPause = 0;
    if (el.turnTimer) el.turnTimer.classList.add('hidden');
  }

  function onTurnTimeout() {
    if (!state || !state.awaitingHuman || state.phase !== 'playing') return;
    toast("Waktu habis! Kamu otomatis pass.");
    // --- Auto pass: kalau belum draw, draw dulu, lalu pass ---
    if (state.drawnCardId === null) {
      humanDraw();
      safeTimeout(() => {
        if (state && state.awaitingHuman && state.drawnCardId !== null && state.phase === 'playing') {
          humanPass();
        }
      }, 950);
    } else {
      humanPass();
    }
  }

  /* ============================================================
     DECK MANAGEMENT
     ============================================================ */
  let nextCardId = 0;

  /** Build a full 108-card UNO deck (always 108, regardless of player count). */
  function buildDeck() {
    const deck = [];
    for (const color of COLORS) {
      deck.push({ id: nextCardId++, color, value: 0 });         // one 0
      for (let n = 1; n <= 9; n++) {                            // two each 1-9
        deck.push({ id: nextCardId++, color, value: n });
        deck.push({ id: nextCardId++, color, value: n });
      }
      for (const v of ["skip", "reverse", "draw2"]) {           // two each action
        deck.push({ id: nextCardId++, color, value: v });
        deck.push({ id: nextCardId++, color, value: v });
      }
    }
    for (let i = 0; i < 4; i++) {                               // 4 Wild + 4 Wild+4
      deck.push({ id: nextCardId++, color: "wild", value: "wild" });
      deck.push({ id: nextCardId++, color: "wild", value: "wild4" });
    }
    return deck; // 25*4 + 8 = 108
  }

  /** Fisher–Yates shuffle (in place). */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Points a card is worth at the end of a round. */
  function cardPoints(card) {
    if (card.color === "wild") return 50;
    if (typeof card.value === "number") return card.value;
    return 20; // Skip / Reverse / Draw Two
  }

  /* ============================================================
     GAME STATE
     ============================================================ */
  let state = null;

  /**
   * Build a fresh game state for `botCount` AI opponents.
   * Player 0 is always the human; bots get names from BOT_NAME_POOL.
   */
  function newGameState(botCount) {
    const players = [{ name: "You", isHuman: true, hand: [], saidUno: false }];
    // --- Fitur 6: pilih nama bot secara random dari pool ---
    const shuffled = BOT_NAME_POOL.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < botCount; i++) {
      players.push({ name: shuffled[i] || ("Bot " + (i+1)), isHuman: false, hand: [], saidUno: false });
    }
    return {
      players,
      deck: [],
      discard: [],
      currentColor: "red",
      topValue: null,
      currentPlayer: 0,
      direction: 1,              // 1 = clockwise, -1 = counter-clockwise
      scores: new Array(players.length).fill(0),
      phase: "start",            // start | playing | roundEnd | gameOver
      awaitingHuman: false,
      drawnCardId: null,         // when the human just drew a playable card
      animCardId: null,          // card id that should play the "just played" animation
      unoPending: false,
      unoDeadline: 0,
      unoTimer: null,
      pendingPlay: null,         // { playerIdx, card } waiting on the UNO window
      roundWinner: 0,
      roundPoints: 0,
      // --- Fitur 4: kartu yang sedang dipilih (fase 1 tap) ---
      selectedCardId: null,
      // --- Fitur 4 (anti-spam draw): flag transient ---
      isDrawing: false
    };
  }

  /* ---- small helpers ---------------------------------------- */

  /** Index of the player `steps` seats away in the current direction. */
  function getNext(from, steps = 1) {
    const n = state.players.length;
    return ((from + state.direction * steps) % n + n) % n;
  }

  /** Draw one card, reshuffling the discard pile if the deck runs dry. */
  function drawOne() {
    if (state.deck.length === 0) {
      if (state.discard.length <= 1) return null;   // nothing left anywhere
      const top = state.discard.pop();
      state.deck = shuffle(state.discard.slice());
      state.discard = [top];
      toast("Draw pile exhausted — discard pile reshuffled!");
    }
    return state.deck.pop();
  }

  /** Can `card` be legally played given the current colour / top value? */
  function isPlayable(card, hand) {
    if (card.value === "wild") return true;
    if (card.value === "wild4") {
      // Wild Draw Four only when the hand holds no card of the current colour
      return !hand.some(c => c.id !== card.id && c.color === state.currentColor);
    }
    if (card.color === state.currentColor) return true;
    if (card.value === state.topValue) return true;
    return false;
  }

  /** Readable card description, e.g. "Red 7" or "Wild Draw Four". */
  function cardName(card) {
    const prefix = card.color === "wild"
      ? ""
      : card.color.charAt(0).toUpperCase() + card.color.slice(1) + " ";
    const v = typeof card.value === "number" ? card.value : VALUE_NAME[card.value];
    return prefix + v;
  }

  /** AI turn delay: snappier on phones. */
  function aiDelay() {
    // --- Fitur 5: delay random 900-2000ms ---
    return 900 + Math.floor(Math.random() * 1100);
  }

  /* ============================================================
     UI HELPERS (toasts, screens, colour modal)
     ============================================================ */
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    el.toasts.appendChild(t);
    safeTimeout(() => t.classList.add("fade"), 1900);
    safeTimeout(() => t.remove(), 2350);
    while (el.toasts.children.length > 5) el.toasts.firstChild.remove();
  }

  function showScreen(id) {
    el.screens.forEach(s => s.classList.toggle("active", s.id === id));
  }

  let colorModalCallback = null;
  function showColorModal(cb) {
    colorModalCallback = cb;
    el.modalOverlay.classList.add("show");
  }

  el.colorModal.addEventListener("click", e => {
    const btn = e.target.closest("button[data-color]");
    if (!btn) return;
    closeColorModal(btn.dataset.color);
  });

  function closeColorModal(color) {
    el.modalOverlay.classList.remove("show");
    const cb = colorModalCallback;
    colorModalCallback = null;
    if (cb && color) cb(color);
  }

  /* ============================================================
     RENDERING
     ============================================================ */

  /** Build a DOM node for a card. */
  function createCardEl(card, mini = false) {
    const div = document.createElement("div");
    div.className = "card " + (card.color === "wild" ? "wild" : card.color) + (mini ? " mini" : "");
    const label = typeof card.value === "number" ? String(card.value) : VALUE_LABEL[card.value];

    if (card.color === "wild") {
      div.innerHTML =
        `<span class="corner tl">${label}</span>` +
        `<span class="corner br">${label}</span>` +
        `<div class="oval"><span>${label}</span></div>`;
    } else {
      div.innerHTML =
        `<div class="oval"></div>` +
        `<span class="corner tl">${label}</span>` +
        `<span class="corner br">${label}</span>` +
        `<span class="val">${label}</span>`;
    }
    return div;
  }

  /** Card-back node (used for AI hands). */
  function createBackEl(mini = true) {
    const div = document.createElement("div");
    div.className = "card back" + (mini ? " mini" : "");
    div.innerHTML = `<div class="oval"><span>UNO</span></div>`;
    return div;
  }

  /* ---- individual render sections ---------------------------- */

  // --- Fitur 1: renderTopbar disederhanakan, hanya update score-list ---
  function renderTopbar() {
    el.scoreList.innerHTML = state.players
      .map((p, i) => `<div class="score-item"><span class="nm">${p.name}</span><span class="pt">${state.scores[i]}</span></div>`)
      .join("");
  }

  function renderOpponents() {
    el.opponents.innerHTML = "";
    // Loop over every non-human player (dynamic player count).
    for (let i = 1; i < state.players.length; i++) {
      const p = state.players[i];
      const panel = document.createElement("div");
      panel.className = "opponent" +
        (state.currentPlayer === i && state.phase === "playing" ? " active" : "");

      const head = document.createElement("div");
      head.className = "head";
      head.innerHTML =
        `<span class="name">${p.name}${p.hand.length === 1 ? '<span class="uno-badge">UNO!</span>' : ""}</span>` +
        `<span class="count">${p.hand.length} card${p.hand.length === 1 ? "" : "s"}</span>`;

      const miniHand = document.createElement("div");
      miniHand.className = "mini-hand";
      const shown = Math.min(p.hand.length, 10);
      for (let k = 0; k < shown; k++) miniHand.appendChild(createBackEl(true));

      panel.appendChild(head);
      panel.appendChild(miniHand);
      el.opponents.appendChild(panel);
    }
  }

  function renderTable() {
    el.deckCount.textContent = state.deck.length;

    // --- Fitur 3: discard pile dengan efek tumpukan 3 kartu ---
    el.discardPile.innerHTML = "";
    const total = state.discard.length;
    const showCount = Math.min(3, total);
    // Iterasi dari kartu paling bawah di antara yang ditampilkan,
    // supaya z-index natural (DOM order) sesuai stack
    for (let i = 0; i < showCount; i++) {
      const card = state.discard[total - showCount + i];
      const node = createCardEl(card);
      const depth = showCount - 1 - i;   // 2=deepest, 0=top
      node.classList.add("stack-" + depth);
      if (depth === 0 && state.animCardId === card.id) {
        node.classList.add("just-played");
      }
      el.discardPile.appendChild(node);
    }

    // Coloured glow around the discard pile showing the active colour
    el.discardWrap.style.setProperty("--glow", COLOR_HEX[state.currentColor] || "transparent");
  }

  // --- Bug 4: tambah class 'has-selection' untuk padding dinamis ---
  function renderHand() {
    const human = state.players[0];
    const myTurn = state.awaitingHuman && state.phase === "playing";
    el.hand.innerHTML = "";

    const n = human.hand.length;

    // --- Auto-overlap threshold: aktif kalau lebih dari 6 kartu ---
    if (n > 6) {
      el.hand.classList.add("hand-overlap");
    } else {
      el.hand.classList.remove("hand-overlap");
    }

    // --- Fitur padding dinamis: extra padding saat ada kartu terpilih ---
    if (state.selectedCardId !== null) {
      el.hand.classList.add("has-selection");
    } else {
      el.hand.classList.remove("has-selection");
    }

    human.hand.forEach((card, i) => {
      const node = createCardEl(card);
      node.dataset.id = card.id;

      // --- Z-index simetris: tepi rendah, tengah tinggi ---
      // --- Rumus: min(i, n-1-i) + 1 → pola [1,2,3,...,3,2,1] ---
      if (n > 6) {
        const z = Math.min(i, n - 1 - i) + 1;
        node.style.zIndex = z;
        // --- Kartu pertama tidak diberi margin-left negatif ---
        // --- (margin-left di-handle oleh CSS via .card + .card) ---
      }

      if (myTurn) {
        let playable;
        if (state.drawnCardId !== null) {
          // After drawing, only the drawn card may be played
          playable = card.id === state.drawnCardId && isPlayable(card, human.hand);
        } else {
          playable = isPlayable(card, human.hand);
        }
        // --- Fitur 2: highlight toggle ---
        if (config.showHighlight) {
          node.classList.add(playable ? "playable" : "dim");
        } else {
          // --- Tanpa hint visual: semua kartu tampil sama ---
          node.classList.add("clickable");
        }
      }
      if (state.drawnCardId === card.id) node.classList.add("drawn");

      // --- Fitur 4: tandai kartu terpilih ---
      if (state.selectedCardId === card.id) {
        node.classList.add("selected");
      }

      el.hand.appendChild(node);
    });
  }

  function renderControls() {
    const myTurn = state.awaitingHuman && state.phase === "playing";
    const justDrew = state.drawnCardId !== null;

    el.btnDraw.disabled = !myTurn || justDrew;
    el.btnPass.classList.toggle("hidden", !(myTurn && justDrew));

    if (state.unoPending) {
      el.btnUno.classList.remove("hidden");
      updateUnoButton();
    } else {
      el.btnUno.classList.add("hidden");
      el.btnUno.textContent = "UNO!";
    }
  }

  function updateUnoButton() {
    if (!state.unoPending) return;
    const left = Math.max(0, (state.unoDeadline - Date.now()) / 1000);
    el.btnUno.textContent = "UNO! (" + left.toFixed(1) + "s)";
  }

  /** Master render — redraws every dynamic part of the UI. */
  function render() {
    if (!state || state.phase === "start") return;
    renderTopbar();
    renderOpponents();
    renderTable();
    renderHand();
    renderControls();
  }

  /* ============================================================
     GAME LOGIC
     ============================================================ */

  /** Deal a fresh round using config.botCount and config.startCards. */
  function startRound() {
    clearTurnTimer();
    state.deck = shuffle(buildDeck());
    state.discard = [];
    state.players.forEach(p => { p.hand = []; p.saidUno = false; });

    // Deal the configured number of cards to every player
    for (let r = 0; r < config.startCards; r++) {
      for (const p of state.players) p.hand.push(state.deck.pop());
    }

    // Flip the starting card (never a Wild — reshuffle and flip again)
    let top, guard = 0;
    do {
      top = state.deck.pop();
      if (top.color === "wild") { state.deck.push(top); shuffle(state.deck); }
      guard++;
    } while (top.color === "wild" && guard < 300);

    state.discard.push(top);
    state.currentColor = top.color;
    state.topValue = top.value;
    state.direction = 1;
    state.currentPlayer = 0;
    state.phase = "playing";
    state.animCardId = null;
    state.drawnCardId = null;
    state.awaitingHuman = false;
    state.unoPending = false;
    state.pendingPlay = null;
    state.selectedCardId = null;
    state.isDrawing = false;
    if (state.unoTimer) { clearTimeout(state.unoTimer); state.unoTimer = null; }

    showScreen("screen-game");
    render();

    // --- Apply the starting card's effect to the starting player (You) ---
    let startMsg = "";
    const playerCount = state.players.length;

    if (top.value === "skip") {
      state.currentPlayer = 1;
      startMsg = "Starting card is Skip — you lose your first turn!";
    } else if (top.value === "reverse") {
      if (playerCount === 2) {
        // With two players, Reverse behaves like Skip
        state.currentPlayer = 1;
        startMsg = "Starting card is Reverse — acts as Skip (2 players)!";
      } else {
        state.direction = -1;
        state.currentPlayer = playerCount - 1;   // last seat acts "first" CCW
        startMsg = "Starting card is Reverse — direction reversed!";
      }
    } else if (top.value === "draw2") {
      for (let k = 0; k < 2; k++) { const c = drawOne(); if (c) state.players[0].hand.push(c); }
      state.currentPlayer = 1;
      startMsg = "Starting card is Draw Two — you draw 2 and lose your turn!";
    }
    if (startMsg) toast(startMsg);
    render();

    safeTimeout(beginTurn, 900);
  }

  /** Begin the turn of whoever is `state.currentPlayer`. */
  function beginTurn() {
    if (state.phase !== "playing") return;
    // --- Fix 1 pause: kalau paused, reschedule agar lanjut saat unpause ---
    if (paused) {
      safeTimeout(beginTurn, 250);
      return;
    }
    const idx = state.currentPlayer;
    const p = state.players[idx];

    state.awaitingHuman = false;
    state.drawnCardId = null;
    // --- Fitur 4: reset selection saat turn baru ---
    state.selectedCardId = null;
    // --- Fitur 4 (anti-spam draw): reset flag ---
    state.isDrawing = false;

    if (p.isHuman) {
      state.awaitingHuman = true;
      render();
      // --- Fitur 4: start turn timer untuk human ---
      startTurnTimer();
    } else {
      render();
      safeTimeout(() => aiTurn(idx), aiDelay());
    }
  }

  /**
   * Play a card. Handles removal, colour setting, UNO checks, effects
   * and passing the turn along.
   */
  function doPlay(playerIdx, card, chosenColor) {
    clearTurnTimer();
    const p = state.players[playerIdx];
    const i = p.hand.findIndex(c => c.id === card.id);
    if (i < 0) return;

    p.hand.splice(i, 1);
    state.discard.push(card);
    state.currentColor = card.color === "wild" ? chosenColor : card.color;
    state.topValue = card.value;
    state.animCardId = card.id;
    state.awaitingHuman = false;
    state.drawnCardId = null;
    state.selectedCardId = null;

    playSound("play");
    const who = p.isHuman ? "You" : p.name;
    toast(`${who} played ${cardName(card)}` +
          (card.color === "wild" ? ` → ${state.currentColor.toUpperCase()}` : ""));
    render();

    /* ---- Round over: this player has no cards left ---- */
    if (p.hand.length === 0) {
      resolveEffects(playerIdx, card);   // the final card's effect still applies
      render();
      safeTimeout(() => endRound(playerIdx), 900);
      return;
    }

    /* ---- UNO declaration ---- */
    if (p.hand.length === 1) {
      if (p.isHuman) {
        openUnoWindow(playerIdx, card);  // pause the game and let the human click
        return;
      }
      p.saidUno = true;
      toast(`${p.name}: UNO!`);
    }

    safeTimeout(() => continueTurn(playerIdx, card), 400);
  }

  /**
   * Apply Skip / Reverse / Draw Two / Wild Draw Four effects.
   * Returns true if the next player must be skipped.
   */
  function resolveEffects(playerIdx, card) {
    let skipNext = false;
    const nextIdx = getNext(playerIdx, 1);
    const playerCount = state.players.length;

    if (card.value === "skip") {
      skipNext = true;
      toast(`${state.players[nextIdx].name} is skipped!`);
    } else if (card.value === "reverse") {
      if (playerCount === 2) {
        // With two players, Reverse acts as Skip
        skipNext = true;
        toast("Reverse acts as Skip (2 players)!");
      } else {
        state.direction *= -1;
        toast("Direction reversed! " + (state.direction === 1 ? "↻" : "↺"));
      }
    } else if (card.value === "draw2" || card.value === "wild4") {
      const n = card.value === "draw2" ? 2 : 4;
      for (let k = 0; k < n; k++) {
        const c = drawOne();
        if (c) state.players[nextIdx].hand.push(c);
      }
      toast(`${state.players[nextIdx].name} draws ${n} cards`);
      skipNext = true;
    }
    return skipNext;
  }

  /** Move the turn pointer past the current player and start the next turn. */
  function continueTurn(playerIdx, card) {
    if (state.phase !== "playing") return;
    const skipNext = resolveEffects(playerIdx, card);
    state.currentPlayer = getNext(playerIdx, skipNext ? 2 : 1);
    state.animCardId = null;
    render();
    safeTimeout(beginTurn, 450);
  }

  /* ---- Human UNO window -------------------------------------- */

  function openUnoWindow(playerIdx, card) {
    state.unoPending = true;
    state.pendingPlay = { playerIdx, card };
    state.unoDeadline = Date.now() + UNO_WINDOW;
    render();

    const tick = safeInterval(() => {
      if (!state.unoPending) { clearInterval(tick); return; }
      updateUnoButton();
    }, 100);

    state.unoTimer = safeTimeout(() => {
      clearInterval(tick);
      if (!state.unoPending) return;
      state.unoPending = false;
      // Penalty: forgot to shout UNO
      for (let k = 0; k < 2; k++) { const c = drawOne(); if (c) state.players[0].hand.push(c); }
      toast("You forgot to say UNO! Draw 2 penalty cards.");
      playSound("error");
      render();
      finishPendingPlay();
    }, UNO_WINDOW);
  }

  function sayUno() {
    if (!state.unoPending) return;
    state.unoPending = false;
    if (state.unoTimer) { clearTimeout(state.unoTimer); state.unoTimer = null; }
    state.players[0].saidUno = true;
    toast("You shout: UNO!");
    playSound("uno");
    render();
    finishPendingPlay();
  }

  function finishPendingPlay() {
    const pp = state.pendingPlay;
    state.pendingPlay = null;
    state.unoPending = false;
    if (!pp) return;
    safeTimeout(() => continueTurn(pp.playerIdx, pp.card), 350);
  }

  /* ---- Human actions ----------------------------------------- */

  // --- Fitur 4: two-phase tap ---
  function humanPlayCard(cardId) {
    clearTurnTimer();
    if (state.phase !== "playing" || !state.awaitingHuman) return;
    const p = state.players[0];
    const card = p.hand.find(c => c.id === cardId);
    if (!card) return;

    // If the human just drew, only that card may be played
    if (state.drawnCardId !== null && card.id !== state.drawnCardId) return;

    if (!isPlayable(card, p.hand)) {
      toast("You can't play that card.");
      playSound("error");
      state.selectedCardId = null;
      renderHand();
      return;
    }

    // --- Dua fase tap ---
    if (state.selectedCardId === cardId) {
      // --- Fase 2: play ---
      state.selectedCardId = null;
      state.awaitingHuman = false;
      render();

      if (card.color === "wild") {
        showColorModal(color => doPlay(0, card, color));
      } else {
        doPlay(0, card, null);
      }
    } else {
      // --- Fase 1: select (atau pindah selection) ---
      state.selectedCardId = cardId;
      playSound("play");   // feedback halus
      renderHand();
    }
  }

  // --- Fitur 4 (anti-spam draw): guard isDrawing ---
  function humanDraw() {
    clearTurnTimer();
    if (state.phase !== "playing" || !state.awaitingHuman) return;
    if (state.drawnCardId !== null) return;  // already drew this turn
    // --- Guard anti-spam: kalau sedang proses draw, abaikan ---
    if (state.isDrawing) return;

    // --- Set flag & reset selection ---
    state.isDrawing = true;
    state.selectedCardId = null;

    const card = drawOne();
    if (!card) {
      toast("No cards left to draw — passing.");
      state.isDrawing = false;
      endHumanTurn();
      return;
    }

    state.players[0].hand.push(card);
    playSound("draw");
    render();

    if (isPlayable(card, state.players[0].hand)) {
      state.drawnCardId = card.id;
      toast("You drew a playable card — play it or pass.");
      render();
      // --- Flag dilepas setelah render selesai ---
      state.isDrawing = false;
    } else {
      toast("You drew a card. No play possible.");
      // --- Tetap lock sampai endHumanTurn selesai ---
      safeTimeout(() => {
        state.isDrawing = false;
        endHumanTurn();
      }, 750);
    }
  }

  function humanPass() {
    clearTurnTimer();
    if (!state.awaitingHuman || state.drawnCardId === null) return;
    toast("You pass.");
    endHumanTurn();
  }

  function endHumanTurn() {
    clearTurnTimer();
    if (state.phase !== "playing") return;
    state.awaitingHuman = false;
    state.drawnCardId = null;
    // --- Fitur 4: reset selection saat turn berakhir ---
    state.selectedCardId = null;
    state.isDrawing = false;
    state.currentPlayer = getNext(0, 1);
    render();
    safeTimeout(beginTurn, 400);
  }

  /* ============================================================
     AI LOGIC
     ============================================================ */

  /** Pick the colour the AI holds most of. */
  function aiChooseColor(p) {
    const counts = { red: 0, green: 0, blue: 0, yellow: 0 };
    p.hand.forEach(c => { if (c.color !== "wild") counts[c.color]++; });
    let best = COLORS[0], bestN = -1;
    for (const col of COLORS) {
      if (counts[col] > bestN) { bestN = counts[col]; best = col; }
    }
    return best;
  }

  /** Choose a card to play, or null if the AI must draw. */
  function aiChooseCard(idx) {
    const p = state.players[idx];
    const playable = p.hand.filter(c => isPlayable(c, p.hand));
    if (playable.length === 0) return null;

    const nextP   = state.players[getNext(idx, 1)];
    const nextFew = nextP.hand.length <= 2;

    const nums      = playable.filter(c => typeof c.value === "number");
    const colorNums = nums.filter(c => c.color === state.currentColor);
    const draw2s    = playable.filter(c => c.value === "draw2");
    const skips     = playable.filter(c => c.value === "skip");
    const revs      = playable.filter(c => c.value === "reverse");
    const wilds     = playable.filter(c => c.value === "wild");
    const wild4s    = playable.filter(c => c.value === "wild4");

    const highest = arr => arr.reduce((a, b) => (b.value > a.value ? b : a));

    // Aggressive play: hinder an opponent about to go out
    if (nextFew) {
      if (draw2s.length) return draw2s[0];
      if (wild4s.length) return wild4s[0];
      if (skips.length)  return skips[0];
    }

    // 1. Number card matching the current colour
    if (colorNums.length) return highest(colorNums);

    // 2. Useful action card
    if (skips.length)  return skips[0];
    if (draw2s.length) return draw2s[0];
    if (revs.length)   return revs[0];

    // 3. Number card that matches by number (different colour)
    if (nums.length) return highest(nums);

    // 4. Wild (always playable)
    if (wilds.length) return wilds[0];

    // 5. Wild Draw Four
    if (wild4s.length) return wild4s[0];

    return playable[0];
  }

  /** Perform one AI turn. */
  function aiTurn(idx) {
    // --- Fix 1 pause: kalau paused, reschedule agar lanjut saat unpause ---
    if (paused) {
      safeTimeout(() => aiTurn(idx), 250);
      return;
    }
    if (state.phase !== "playing" || state.currentPlayer !== idx) return;
    const p = state.players[idx];

    const card = aiChooseCard(idx);
    if (card) {
      const color = card.color === "wild" ? aiChooseColor(p) : null;
      doPlay(idx, card, color);
      return;
    }

    /* --- No playable card: draw one --- */
    const drawn = drawOne();
    if (!drawn) {
      toast(`${p.name} cannot draw — pile empty.`);
      state.currentPlayer = getNext(idx, 1);
      render();
      safeTimeout(beginTurn, 400);
      return;
    }

    p.hand.push(drawn);
    playSound("draw");
    render();

    if (isPlayable(drawn, p.hand)) {
      // Rule: may play the drawn card immediately
      safeTimeout(() => {
        if (state.phase !== "playing" || state.currentPlayer !== idx) return;
        const color = drawn.color === "wild" ? aiChooseColor(p) : null;
        doPlay(idx, drawn, color);
      }, 700);
    } else {
      toast(`${p.name} draws a card.`);
      safeTimeout(() => {
        if (state.phase !== "playing" || state.currentPlayer !== idx) return;
        state.currentPlayer = getNext(idx, 1);
        render();
        safeTimeout(beginTurn, 350);
      }, 650);
    }
  }

  /* ============================================================
     ROUND / GAME END
     ============================================================ */

  function endRound(winnerIdx) {
    if (state.phase !== "playing") return;
    state.phase = "roundEnd";

    // Winner scores the total of everyone else's remaining cards
    let points = 0;
    state.players.forEach((p, i) => {
      if (i !== winnerIdx) points += p.hand.reduce((sum, c) => sum + cardPoints(c), 0);
    });
    state.scores[winnerIdx] += points;
    state.roundWinner = winnerIdx;
    state.roundPoints = points;

    playSound("win");
    showRoundEnd();

    // --- Bridge: onState after a round ---
    emit('onState', onState, {
      game: 'uno',
      scores: state.scores.slice(),
      roundWinner: winnerIdx
    });
  }

  function showRoundEnd() {
    const w = state.players[state.roundWinner];
    const title = state.roundWinner === 0 ? "You win the round!" : `${w.name} wins the round!`;

    el.roundEndBody.innerHTML =
      `<h2>${title}</h2>` +
      `<div class="big">+${state.roundPoints} pts</div>` +
      `<div class="score-table">` +
        state.players.map((p, i) =>
          `<div class="row ${i === state.roundWinner ? "win" : ""}">
             <span>${p.name}${p.isHuman ? " (you)" : ""}</span>
             <span>${state.scores[i]}</span>
           </div>`).join("") +
      `</div>`;

    const someoneWon = Math.max(...state.scores) >= TARGET_SCORE;
    el.btnNextRound.textContent = someoneWon ? "Final Results" : "Next Round";
    showScreen("screen-round-end");
  }

  function showGameOver() {
    state.phase = "gameOver";
    const max = Math.max(...state.scores);
    const winners = state.players.filter((p, i) => state.scores[i] === max);
    const youWon = winners.some(p => p.isHuman);

    el.gameOverBody.innerHTML =
      `<h1 class="logo" style="font-size:clamp(40px,8vw,56px);">UNO</h1>` +
      `<h2>${youWon ? "🏆 You win the game!" : `🏆 ${winners.map(w => w.name).join(" & ")} win the game!`}</h2>` +
      `<div class="score-table" style="margin-top:20px;">` +
        state.players.map((p, i) =>
          `<div class="row ${state.scores[i] === max ? "win" : ""}">
             <span>${p.name}${p.isHuman ? " (you)" : ""}</span>
             <span>${state.scores[i]}</span>
           </div>`).join("") +
      `</div>`;

    playSound("win");
    showScreen("screen-game-over");

    // --- Bridge: onWin / onLose + AppStorage.recordPlay ---
    const payload = { game: 'uno', scores: state.scores.slice() };
    if (youWon) {
      emit('onWin', onWin, payload);
      if (window.AppStorage) {
        window.AppStorage.recordPlay('uno', { won: true, score: state.scores[0] });
      }
    } else {
      emit('onLose', onLose, payload);
      if (window.AppStorage) {
        window.AppStorage.recordPlay('uno', { won: false, score: state.scores[0] });
      }
    }
  }

  /* ============================================================
     CONFIG SCREEN
     ============================================================ */

  /** Sync segmented-control highlight with current config values. */
  function syncConfigUI() {
    const botsBtns  = el.segBots.querySelectorAll('button[data-value]');
    const cardsBtns = el.segCards.querySelectorAll('button[data-value]');
    botsBtns.forEach(b  => b.classList.toggle('active', Number(b.dataset.value) === config.botCount));
    cardsBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.value) === config.startCards));
    // --- Fitur 2: sinkronkan toggle highlight ---
    if (el.toggleHighlight) {
      el.toggleHighlight.classList.toggle('on', config.showHighlight);
      el.toggleHighlight.setAttribute('aria-checked', config.showHighlight ? 'true' : 'false');
    }
  }

  /** Wire a segmented control: clicks toggle the active button + update `config`. */
  function wireSegmented(rootEl, key, parse = Number) {
    rootEl.addEventListener("click", e => {
      const btn = e.target.closest("button[data-value]");
      if (!btn) return;
      [...rootEl.children].forEach(b => b.classList.toggle("active", b === btn));
      config[key] = parse(btn.dataset.value);
      saveSettings();
    });
  }
  wireSegmented(el.segBots,  "botCount");
  wireSegmented(el.segCards, "startCards");

  // --- Initial UI sync with loaded config ---
  syncConfigUI();

  /* ============================================================
     EVENT HANDLERS
     ============================================================ */

  /* Card clicks in the human hand — event delegation */
  el.hand.addEventListener("click", e => {
    const cardEl = e.target.closest(".card");
    if (!cardEl) return;
    humanPlayCard(Number(cardEl.dataset.id));
  });

  /* Draw pile click */
  el.drawPileWrap.addEventListener("click", humanDraw);

  /* Control buttons */
  el.btnDraw.addEventListener("click", humanDraw);
  el.btnPass.addEventListener("click", humanPass);
  el.btnUno.addEventListener("click", sayUno);

  /* Start / round / game buttons */
  el.startBtn.addEventListener("click", () => {
    newGame(config.botCount);
    startRound();
  });

  el.btnNextRound.addEventListener("click", () => {
    if (Math.max(...state.scores) >= TARGET_SCORE) {
      showGameOver();
    } else {
      startRound();
    }
  });

  el.btnPlayAgain.addEventListener("click", () => {
    newGame(config.botCount);
    startRound();
  });

  /* Back-to-menu handlers: safely unwind the current game, return to config */
  function backToMenu() {
    clearTurnTimer();
    if (state) {
      if (state.unoTimer) { clearTimeout(state.unoTimer); state.unoTimer = null; }
      state.unoPending = false;
      state.pendingPlay = null;
      state.selectedCardId = null;
      state.isDrawing = false;
      state.phase = "start";
    }
    el.modalOverlay.classList.remove("show");
    el.homeOverlay.classList.remove("show");
    el.exitOverlay.classList.remove("show");
    colorModalCallback = null;
    paused = false;
    // Rebuild a fresh state so the config screen has valid data
    newGame(config.botCount);
    showScreen("screen-start");
  }
  el.btnBackMenu1.addEventListener("click", backToMenu);
  el.btnBackMenu2.addEventListener("click", backToMenu);

  // --- Fitur 1 + 5: tombol menu di topbar kiri — sekarang konfirmasi ---
  el.menuBtn.addEventListener('click', () => {
    el.homeOverlay.classList.add('show');
    paused = true;
    pauseTurnTimer();
  });

  // --- Fitur 2: toggle playable highlight ---
  el.toggleHighlight.addEventListener('click', () => {
    config.showHighlight = !config.showHighlight;
    el.toggleHighlight.classList.toggle('on', config.showHighlight);
    el.toggleHighlight.setAttribute('aria-checked', config.showHighlight ? 'true' : 'false');
    saveSettings();
  });

  /* ============================================================
     EXIT BUTTON + EXIT CONFIRM MODAL
     ============================================================ */
  if (typeof onExit === 'function') {
    el.exitBtn.classList.add('show');
    el.exitBtn.addEventListener('click', () => {
      el.exitOverlay.classList.add('show');
      paused = true;
      pauseTurnTimer();
    });
  }

  el.exitCancel.addEventListener('click', () => {
    el.exitOverlay.classList.remove('show');
    paused = false;
    resumeTurnTimer();
  });

  el.exitYes.addEventListener('click', () => {
    el.exitOverlay.classList.remove('show');
    paused = false;
    saveSettings();
    emit('onExit', onExit, { game: 'uno', scores: state ? state.scores.slice() : [] });
  });

  el.exitOverlay.addEventListener('click', (e) => {
    if (e.target === el.exitOverlay) {
      el.exitOverlay.classList.remove('show');
      paused = false;
      resumeTurnTimer();
    }
  });

  /* ============================================================
     HOME CONFIRM MODAL (Fitur 5)
     ============================================================ */
  el.homeCancel.addEventListener('click', () => {
    el.homeOverlay.classList.remove('show');
    paused = false;
    resumeTurnTimer();
  });

  el.homeYes.addEventListener('click', () => {
    el.homeOverlay.classList.remove('show');
    paused = false;
    backToMenu();
  });

  el.homeOverlay.addEventListener('click', (e) => {
    if (e.target === el.homeOverlay) {
      el.homeOverlay.classList.remove('show');
      paused = false;
      resumeTurnTimer();
    }
  });

  /* ============================================================
     KEYBOARD SHORTCUTS
     - Space  = draw
     - U      = shout UNO
     - 1..4   = pick colour while modal open (red/green/blue/yellow)
     ============================================================ */
  addGlobal(document, 'keydown', e => {
    // Colour-modal shortcuts take priority
    if (el.modalOverlay.classList.contains("show")) {
      const map = { "1": "red", "2": "green", "3": "blue", "4": "yellow" };
      if (map[e.key]) {
        e.preventDefault();
        closeColorModal(map[e.key]);
      }
      return;
    }

    if (state && state.phase === "playing") {
      if (e.code === "Space" && state.awaitingHuman && state.drawnCardId === null) {
        e.preventDefault();
        humanDraw();
      } else if (e.key === "u" || e.key === "U") {
        sayUno();
      }
    }
  });

  /* ============================================================
     INITIALISATION
     ============================================================ */
  function newGame(botCount) {
    state = newGameState(botCount);
  }

  // Build an initial state so the start screen has something to look at.
  newGame(config.botCount);

  // --- Ready signal ---
  emit('onReady', onReady, { game: 'uno' });

  /* ============================================================
     RETURN CONTROL API
     ============================================================ */
  return {
    pause()  { paused = true; pauseTurnTimer(); },
    resume() { paused = false; resumeTurnTimer(); },
    exit() {
      saveSettings();
      emit('onExit', onExit, { game: 'uno' });
    },
    destroy() {
      clearTurnTimer();
      // Clear tracked timeouts / intervals
      trackedTimeouts.forEach(id => { try { clearTimeout(id); } catch (e) {} });
      trackedIntervals.forEach(id => { try { clearInterval(id); } catch (e) {} });
      trackedTimeouts.clear();
      trackedIntervals.clear();
      // Run cleanups (event listeners)
      cleanups.forEach(fn => { try { fn(); } catch (e) {} });
      // Remove shadow host
      try { shadowHost.remove(); } catch (e) {}
    }
  };
}

// --- Expose to global scope ---
window.Uno = { init };

})();
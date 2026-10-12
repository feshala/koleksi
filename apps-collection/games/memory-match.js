// games/memory-match.js
// --- Memory Match Script (flip & pair card game) ---
// --- Global: window.MemoryMatch ---
// --- Call: MemoryMatch.init(container, options) ---
// --- Options: onReady, onExit, onWin, onLose, onState ---
// --- Return: { pause, resume, exit, destroy } ---

(function () {
'use strict';

// --- CSS ---
const CSS = `
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
:host { display: flex; justify-content: center; width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #12263a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }

/* --- App Shell --- */
.app { position: relative; width: 100%; max-width: 540px; height: 100%; display: flex; flex-direction: column; background: #16324f; overflow: hidden; }

/* --- Header --- */
.topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; padding: 10px 14px; padding-top: calc(10px + env(safe-area-inset-top)); background: #0d2438; box-shadow: 0 3px 10px rgba(0,0,0,.35); z-index: 15; flex: 0 0 auto; }
.dropdown { justify-self: start; display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border: none; border-radius: 999px; background: rgba(255,255,255,.12); color: #dff1ff; font-size: 15px; font-weight: 700; letter-spacing: .2px; cursor: pointer; transition: background .15s; flex: 0 0 auto; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dropdown:active { background: rgba(255,255,255,.22); }
.dropdown .chev { transition: transform .2s; }
.dropdown.open .chev { transform: rotate(180deg); }
.stats { justify-self: center; display: flex; align-items: center; justify-content: center; gap: 14px; min-width: 0; flex-wrap: nowrap; }
.stat { display: inline-flex; align-items: center; gap: 5px; color: #fff; font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: .3px; white-space: nowrap; }
.stat .ico { width: 18px; height: 18px; display: block; flex: 0 0 auto; }
.sound { justify-self: end; display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; padding: 0; border: none; border-radius: 50%; background: rgba(255,255,255,.10); cursor: pointer; transition: background .15s; flex: 0 0 auto; }
.sound:active { background: rgba(255,255,255,.22); }
.sound svg { width: 21px; height: 21px; display: block; }
.sound .slash { display: none; }
.sound.muted .waves { display: none; }
.sound.muted .slash { display: block; }

/* --- Topbar Actions & Exit Button --- */
.topbar-actions { justify-self: end; display: flex; align-items: center; gap: 8px; }
.exit-btn { display: none; width: 38px; height: 38px; padding: 0; align-items: center; justify-content: center; border: none; border-radius: 50%; background: rgba(255,90,90,.18); color: #ffb8b8; cursor: pointer; transition: background .15s, transform .1s; flex: 0 0 auto; }
.exit-btn.show { display: inline-flex; }
.exit-btn:active { background: rgba(255,90,90,.38); transform: scale(.92); }
.exit-btn svg { width: 20px; height: 20px; display: block; }
.disabled { pointer-events: none; opacity: 0.4; }

/* --- Dropdown Menu --- */
.menu { position: absolute; top: calc(58px + env(safe-area-inset-top)); left: 14px; z-index: 50; min-width: 190px; padding: 6px; border-radius: 14px; background: #0a1c2c; box-shadow: 0 14px 30px rgba(0,0,0,.5); opacity: 0; visibility: hidden; transform: translateY(-8px); transition: opacity .18s, transform .18s, visibility .18s; }
.menu.show { opacity: 1; visibility: visible; transform: translateY(0); }
.menu button { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 11px 14px; border: none; border-radius: 9px; background: none; color: #dff1ff; font-size: 14px; font-weight: 700; text-align: left; cursor: pointer; }
.menu button small { font-weight: 600; font-size: 11px; opacity: .6; }
.menu button:active { background: rgba(255,255,255,.1); }
.menu button.active { background: rgba(74,144,226,.22); color: #7fc0ff; }

/* --- Board --- */
.board-wrap { flex: 1 1 auto; min-height: 0; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px; }
.board { display: grid; gap: var(--gap, 10px); grid-template-columns: repeat(var(--cols, 4), var(--cell, 72px)); grid-auto-rows: var(--cell, 72px); }

/* --- Card --- */
.card { position: relative; perspective: 700px; border: none; padding: 0; background: none; cursor: pointer; outline: none; }
.card-inner { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform .4s cubic-bezier(.3,1.3,.5,1); }
.card.flipped .card-inner, .card.matched .card-inner { transform: rotateY(180deg); }
.face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 14px; backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; }
.back { background: linear-gradient(150deg, #2e6fb0 0%, #1c4a7c 100%); box-shadow: inset 0 0 0 2px rgba(255,255,255,.14), 0 4px 10px rgba(0,0,0,.35); }
.back::after { content: ''; width: 46%; height: 46%; border-radius: 50%; border: 3px dashed rgba(255,255,255,.35); }
.front { background: #eef6ff; transform: rotateY(180deg); box-shadow: inset 0 0 0 2px rgba(255,255,255,.6), 0 4px 10px rgba(0,0,0,.25); font-size: calc(var(--cell, 72px) * .52); line-height: 1; }
.card.matched .front { background: #d9f4df; box-shadow: inset 0 0 0 3px #35b46a, 0 4px 10px rgba(0,0,0,.2); animation: matchPop .45s ease; }
@keyframes matchPop { 0%{transform:rotateY(180deg) scale(1)} 45%{transform:rotateY(180deg) scale(1.12)} 100%{transform:rotateY(180deg) scale(1)} }
.card.wrong .front { background: #ffe0e0; box-shadow: inset 0 0 0 3px #e05252, 0 4px 10px rgba(0,0,0,.2); }
.card.shake .card-inner { animation: shakeCard .4s ease; }
@keyframes shakeCard { 0%,100%{transform:rotateY(180deg) translateX(0)} 25%{transform:rotateY(180deg) translateX(-5px)} 50%{transform:rotateY(180deg) translateX(5px)} 75%{transform:rotateY(180deg) translateX(-3px)} }
.card:not(.flipped):not(.matched):active .card-inner { transform: scale(.94); }

/* --- Side Buttons --- */
.side-buttons { position: absolute; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 30; display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none; }
.side-buttons > * { pointer-events: auto; }
.fab { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; padding: 0; border: none; border-radius: 50%; background: #4a90e2; color: #fff; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.45), inset 0 -3px 0 rgba(0,0,0,.18); transition: transform .12s, background .15s, opacity .15s; }
.fab:active { transform: scale(.9); background: #5ea0f0; }
.fab svg { width: 24px; height: 24px; }

/* --- Dashboard --- */
.dashboard { position: absolute; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; padding: 20px 16px; background: rgba(4,12,20,.68); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; }
.dashboard.show { opacity: 1; visibility: visible; }
.dash-card { width: 100%; max-width: 380px; max-height: calc(100vh - 40px); max-height: calc(100dvh - 40px); display: flex; flex-direction: column; padding: 18px; border-radius: 22px; background: #f2f8ff; box-shadow: 0 22px 50px rgba(0,0,0,.55); transform: scale(.9); transition: transform .28s cubic-bezier(.2,1.4,.5,1); overflow: hidden; }
.dashboard.show .dash-card { transform: scale(1); }
.dash-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 12px; background: #dcebf9; margin-bottom: 14px; flex: 0 0 auto; }
.dash-tab { padding: 9px 6px; border: none; border-radius: 9px; background: none; color: #4a6b8a; font-size: 12px; font-weight: 800; letter-spacing: .3px; cursor: pointer; transition: background .15s, color .15s; }
.dash-tab.active { background: #fff; color: #14344f; box-shadow: 0 2px 6px rgba(0,0,0,.08); }
.dash-tab:active { transform: scale(.97); }
.dash-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 2px; }
.dash-pane { display: none; }
.dash-pane.active { display: block; animation: fadeIn .2s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.stat-box { padding: 12px 10px; border-radius: 12px; background: #fff; border: 1px solid #cfe3f5; text-align: center; }
.stat-val { font-size: 22px; font-weight: 800; color: #14344f; font-variant-numeric: tabular-nums; line-height: 1.1; }
.stat-lbl { margin-top: 3px; font-size: 10px; font-weight: 700; color: #5f83a3; letter-spacing: .6px; text-transform: uppercase; }
.best-title { font-size: 11px; font-weight: 800; color: #5f83a3; letter-spacing: .8px; text-transform: uppercase; margin: 4px 0 8px; text-align: center; }
.best-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.best-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid #cfe3f5; font-size: 13px; font-weight: 700; color: #2c4d6e; }
.best-row span:last-child { color: #14344f; font-variant-numeric: tabular-nums; }

.opt-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 12px; background: #fff; border: 1px solid #cfe3f5; margin-bottom: 10px; font-size: 13px; font-weight: 700; color: #2c4d6e; }
.opt-diff { flex-direction: column; align-items: stretch; gap: 10px; }
.opt-diff > span:first-child { text-align: center; display: block; }
.diff-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.diff-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 12px 8px; border: 1.5px solid #cfe3f5; border-radius: 10px; background: #f4faff; color: #4a6b8a; cursor: pointer; transition: all .15s; font-family: inherit; }
.diff-btn .diff-name { font-size: 14px; font-weight: 800; letter-spacing: .3px; }
.diff-btn .diff-desc { font-size: 10px; font-weight: 700; opacity: 0.7; }
.diff-btn.active { background: #2f7fd1; color: #fff; border-color: #2f7fd1; box-shadow: 0 3px 0 #1f5b98; }
.diff-btn.active .diff-desc { opacity: 0.95; }
.diff-btn:active { transform: scale(.96); }

.history-list { display: flex; flex-direction: column; gap: 6px; max-height: 60vh; overflow-y: auto; padding: 2px; }
.hist-item { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid #cfe3f5; font-size: 12px; font-weight: 700; }
.hist-diff { color: #2c4d6e; }
.hist-res { padding: 3px 8px; border-radius: 999px; font-size: 10px; letter-spacing: .4px; text-transform: uppercase; }
.hist-res.win { background: #cdeed6; color: #1f6b3a; }
.hist-time { color: #14344f; font-variant-numeric: tabular-nums; min-width: 44px; text-align: right; }
.hist-empty { padding: 30px 12px; text-align: center; color: #8aa7bf; font-size: 12px; font-weight: 700; }
.dash-actions { flex: 0 0 auto; margin-top: 14px; padding-top: 14px; border-top: 1px solid #cfe3f5; display: flex; gap: 10px; }
.dash-actions .play-btn, .dash-actions .resume-btn { flex: 1 1 0; min-width: 0; }
.dash-actions .resume-btn { display: none; }
.dash-actions.has-resume .resume-btn { display: flex; }
.play-btn, .resume-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; border: none; border-radius: 14px; font-size: 15px; font-weight: 800; letter-spacing: .5px; cursor: pointer; transition: transform .1s, box-shadow .1s, background .15s; white-space: nowrap; }
.play-btn { background: #2f7fd1; color: #fff; box-shadow: 0 4px 0 #1f5b98; }
.play-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #1f5b98; }
.resume-btn { background: #fff; color: #2c4d6e; box-shadow: 0 4px 0 #cfe3f5; border: 1.5px solid #cfe3f5; }
.resume-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #cfe3f5; }
.opt-warning { display: flex; gap: 6px; align-items: flex-start; font-size: 11px; font-weight: 700; color: #b8721e; padding: 0 6px 12px; line-height: 1.4; }
.opt-warning::before { content: '\u26A0'; font-size: 12px; flex: 0 0 auto; }

/* --- Result / Confirm overlays --- */
.result-overlay { position: absolute; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(4,12,20,.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; visibility: hidden; transition: opacity .3s, visibility .3s; }
.result-overlay.show { opacity: 1; visibility: visible; }
.result-card { width: 100%; max-width: 300px; padding: 28px 24px 22px; border-radius: 24px; text-align: center; transform: scale(.85); transition: transform .35s cubic-bezier(.2,1.4,.5,1); box-shadow: 0 24px 60px rgba(0,0,0,.55); background: linear-gradient(160deg, #f2f8ff 0%, #d6eafc 100%); border: 2px solid #4a90e2; }
.result-overlay.show .result-card { transform: scale(1); }
.result-icon { font-size: 60px; line-height: 1; margin-bottom: 10px; display: block; animation: popIcon .5s cubic-bezier(.2,1.4,.5,1); }
@keyframes popIcon { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2);opacity:1} 100%{transform:scale(1)} }
.result-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; letter-spacing: -.3px; color: #14344f; }
.result-sub { font-size: 14px; font-weight: 600; margin: 0 0 6px; color: #2c4d6e; }
.result-stars { font-size: 30px; letter-spacing: 4px; margin: 0 0 18px; display: block; }
.result-btn { width: 100%; padding: 14px; border: none; border-radius: 14px; font-size: 15px; font-weight: 800; letter-spacing: .5px; cursor: pointer; transition: transform .1s, box-shadow .1s; font-family: inherit; background: #2f7fd1; color: #fff; box-shadow: 0 4px 0 #1f5b98; }
.result-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #1f5b98; }
.result-btn-secondary { width: 100%; padding: 11px; margin-top: 8px; border: none; border-radius: 12px; background: transparent; font-size: 13px; font-weight: 800; letter-spacing: .3px; cursor: pointer; transition: background .15s; font-family: inherit; color: #2c4d6e; }
.result-btn-secondary:active { background: rgba(47,127,209,.12); }

.confirm-overlay { position: absolute; inset: 0; z-index: 95; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(4,12,20,.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; }
.confirm-overlay.show { opacity: 1; visibility: visible; }
.confirm-card { width: 100%; max-width: 320px; padding: 24px 22px 18px; border-radius: 20px; background: #f2f8ff; box-shadow: 0 22px 50px rgba(0,0,0,.55); transform: scale(.9); transition: transform .28s cubic-bezier(.2,1.4,.5,1); }
.confirm-overlay.show .confirm-card { transform: scale(1); }
.confirm-title { margin: 0 0 8px; font-size: 17px; font-weight: 800; color: #14344f; letter-spacing: -.2px; }
.confirm-sub { margin: 0 0 20px; font-size: 13px; font-weight: 600; color: #2c4d6e; line-height: 1.5; }
.confirm-actions { display: flex; gap: 10px; }
.confirm-btn { flex: 1; padding: 12px; border: none; border-radius: 12px; font-size: 14px; font-weight: 800; letter-spacing: .3px; cursor: pointer; font-family: inherit; transition: transform .1s, box-shadow .1s, background .15s; }
.confirm-cancel { background: #dcebf9; color: #2c4d6e; }
.confirm-cancel:active { background: #c8def2; }
.confirm-yes { background: #2f7fd1; color: #fff; box-shadow: 0 3px 0 #1f5b98; }
.confirm-yes:active { transform: translateY(2px); box-shadow: 0 1px 0 #1f5b98; }
`;

// --- HTML ---
const HTML = `
<div class="app">
  <header class="topbar">
    <button class="dropdown" id="ddBtn">
      <span id="ddLabel">Medium</span>
      <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="stats">
      <div class="stat">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="#7fc0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/></svg>
        <span id="pairsCount">0 / 8</span>
      </div>
      <div class="stat">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="#ffd23f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h6l2-3h6v3h2v13H4z" opacity=".9"/><path d="M4 11h16"/></svg>
        <span id="movesCount">0</span>
      </div>
      <div class="stat">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="#ffd23f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.6" r="7.4"/><path d="M12 9.6v4.2l2.8 1.9"/><path d="M9.6 2.6h4.8"/><path d="M12 2.6v3.4"/></svg>
        <span id="timer">000</span>
      </div>
    </div>
    <div class="topbar-actions">
      <button class="sound" id="soundBtn" aria-label="Toggle sound">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 9.4v5.2h3.4L12 18.4V5.6L7.4 9.4H4z" fill="#fff"/><g class="waves"><path d="M15 9.2a4 4 0 010 5.6" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><path d="M17.7 6.7a7.6 7.6 0 010 10.6" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/></g><g class="slash"><path d="M15.5 9.5l5.5 5.5M21 9.5l-5.5 5.5" stroke="#ff6b6b" stroke-width="2.1" stroke-linecap="round"/></g></svg>
      </button>
      <button class="exit-btn" id="exitBtn" aria-label="Exit to hub" title="Keluar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
      </button>
    </div>
  </header>

  <div class="menu" id="menu">
    <button data-key="easy">Easy <small>4 × 3 · 6</small></button>
    <button data-key="medium" class="active">Medium <small>4 × 4 · 8</small></button>
    <button data-key="hard">Hard <small>6 × 4 · 12</small></button>
    <button data-key="expert">Expert <small>6 × 6 · 18</small></button>
    <button data-key="random">Random <small>Surprise!</small></button>
  </div>

  <main class="board-wrap" id="boardWrap">
    <div class="board" id="board"></div>
  </main>

  <div class="side-buttons">
    <button class="fab" id="fabBtn" aria-label="Open menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  </div>

  <div class="dashboard" id="dashboard">
    <div class="dash-card">
      <div class="dash-tabs">
        <button class="dash-tab active" data-tab="stats">Stats</button>
        <button class="dash-tab" data-tab="options">Options</button>
        <button class="dash-tab" data-tab="history">History</button>
      </div>
      <div class="dash-body">
        <div class="dash-pane active" data-pane="stats">
          <div class="stat-grid">
            <div class="stat-box"><div class="stat-val" id="statPlayed">0</div><div class="stat-lbl">Played</div></div>
            <div class="stat-box"><div class="stat-val" id="statWins">0</div><div class="stat-lbl">Cleared</div></div>
            <div class="stat-box"><div class="stat-val" id="statMoves">0</div><div class="stat-lbl">Total Moves</div></div>
            <div class="stat-box"><div class="stat-val" id="statPerfect">0</div><div class="stat-lbl">Perfect</div></div>
          </div>
          <div class="best-title">Best Time Per Difficulty</div>
          <div class="best-list">
            <div class="best-row"><span>Easy</span><span id="bestEasy">—</span></div>
            <div class="best-row"><span>Medium</span><span id="bestMedium">—</span></div>
            <div class="best-row"><span>Hard</span><span id="bestHard">—</span></div>
            <div class="best-row"><span>Expert</span><span id="bestExpert">—</span></div>
          </div>
          <div class="best-title">Fewest Moves Per Difficulty</div>
          <div class="best-list">
            <div class="best-row"><span>Easy</span><span id="fewEasy">—</span></div>
            <div class="best-row"><span>Medium</span><span id="fewMedium">—</span></div>
            <div class="best-row"><span>Hard</span><span id="fewHard">—</span></div>
            <div class="best-row"><span>Expert</span><span id="fewExpert">—</span></div>
          </div>
        </div>
        <div class="dash-pane" data-pane="options">
          <div class="opt-row opt-diff">
            <span>Difficulty</span>
            <div class="diff-group">
              <button class="diff-btn" data-diff="easy"><span class="diff-name">Easy</span><span class="diff-desc">4 × 3 · 6 pairs</span></button>
              <button class="diff-btn active" data-diff="medium"><span class="diff-name">Medium</span><span class="diff-desc">4 × 4 · 8 pairs</span></button>
              <button class="diff-btn" data-diff="hard"><span class="diff-name">Hard</span><span class="diff-desc">6 × 4 · 12 pairs</span></button>
              <button class="diff-btn" data-diff="expert"><span class="diff-name">Expert</span><span class="diff-desc">6 × 6 · 18 pairs</span></button>
            </div>
          </div>
          <div class="opt-row opt-diff">
            <span>Card Theme</span>
            <div class="diff-group">
              <button class="diff-btn active" data-theme="animals"><span class="diff-name">Animals</span><span class="diff-desc">🐶 🐱 🦊</span></button>
              <button class="diff-btn" data-theme="fruits"><span class="diff-name">Fruits</span><span class="diff-desc">🍎 🍌 🍇</span></button>
              <button class="diff-btn" data-theme="space"><span class="diff-name">Space</span><span class="diff-desc">🚀 🪐 ⭐</span></button>
              <button class="diff-btn" data-theme="mixed"><span class="diff-name">Mixed</span><span class="diff-desc">All of them</span></button>
            </div>
          </div>
          <div class="opt-warning">Changing difficulty or theme starts a brand new board.</div>
        </div>
        <div class="dash-pane" data-pane="history">
          <div class="history-list" id="historyList"></div>
        </div>
      </div>
      <div class="dash-actions" id="dashActions">
        <button class="resume-btn" id="resumeBtn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Resume</span></button>
        <button class="play-btn" id="playBtn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span id="playBtnLabel">Play</span></button>
      </div>
    </div>
  </div>

  <div class="result-overlay" id="resultOverlay">
    <div class="result-card">
      <span class="result-icon" id="resultIcon">🏆</span>
      <h2 class="result-title" id="resultTitle">Board Cleared!</h2>
      <p class="result-sub" id="resultSub">Time: 000 · Moves: 0</p>
      <span class="result-stars" id="resultStars">★★★</span>
      <button class="result-btn" id="resultBtn">Play Again</button>
      <button class="result-btn-secondary" id="resultSecondary">View Stats</button>
    </div>
  </div>

  <div class="confirm-overlay" id="exitConfirmOverlay">
    <div class="confirm-card">
      <h3 class="confirm-title">Leave the game?</h3>
      <p class="confirm-sub">Your current progress will be lost. Best times and stats are already saved.</p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-cancel" id="exitConfirmCancel">Stay</button>
        <button class="confirm-btn confirm-yes" id="exitConfirmYes">Leave</button>
      </div>
    </div>
  </div>

  <div class="confirm-overlay" id="resetConfirmOverlay">
    <div class="confirm-card">
      <h3 class="confirm-title">Reset all stats?</h3>
      <p class="confirm-sub">Best times, move records, and history for Memory Match will be permanently erased.</p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-cancel" id="resetConfirmCancel">Cancel</button>
        <button class="confirm-btn confirm-yes" id="resetConfirmYes">Reset</button>
      </div>
    </div>
  </div>
</div>
`;

// --- Config ---
const CONFIG = {
  easy:   { cols: 4, rows: 3, label: 'Easy' },
  medium: { cols: 4, rows: 4, label: 'Medium' },
  hard:   { cols: 6, rows: 4, label: 'Hard' },
  expert: { cols: 6, rows: 6, label: 'Expert' }
};

const THEMES = {
  animals: ['🐶','🐱','🦊','🐻','🐼','🐨','🦁','🐮','🐷','🐸','🐵','🐔','🦉','🐰','🐴','🐙','🦄','🐝'],
  fruits:  ['🍎','🍌','🍇','🍓','🍑','🍍','🥝','🍉','🍒','🥕','🌽','🍠','🥥','🍋','🫐','🍊','🥦','🍅'],
  space:   ['🚀','🪐','⭐','🌙','☄️','🛸','🌍','🌟','👽','🔭','🌞','💫','🌑','🌠','🛰️','🌕','🌗','✨']
};

// --- Main factory ---
function init(container, options) {
  options = options || {};
  const {
    onReady = null,
    onExit = null,
    onWin = null,
    onLose = null,
    onState = null,
  } = options;

  // --- Buat child element sebagai shadow host ---
  const shadowHost = document.createElement('div');
  shadowHost.style.cssText = 'width:100%; height:100%; display:block; position:relative;';
  container.appendChild(shadowHost);

  // --- Shadow Root Setup ---
  const shadow = shadowHost.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  shadow.appendChild(styleEl);

  const host = document.createElement('div');
  host.innerHTML = HTML.trim();
  const appEl = host.firstElementChild;
  shadow.appendChild(appEl);

  const $ = (id) => appEl.querySelector('#' + id);

  // --- Storage Namespace ---
  const store = (window.AppStorage) ? window.AppStorage.namespace('memory-match') : null;

  // --- Elements ---
  const ddBtn = $('ddBtn'), ddLabel = $('ddLabel'), menuEl = $('menu');
  const pairsEl = $('pairsCount'), movesEl = $('movesCount'), timerEl = $('timer');
  const soundBtn = $('soundBtn'), exitBtn = $('exitBtn');
  const boardWrap = $('boardWrap'), boardEl = $('board');
  const fabBtn = $('fabBtn');
  const dashboard = $('dashboard'), dashActions = $('dashActions');
  const playBtn = $('playBtn'), playBtnLabel = $('playBtnLabel'), resumeBtn = $('resumeBtn');
  const historyListEl = $('historyList');
  const statPlayedEl = $('statPlayed'), statWinsEl = $('statWins'), statMovesEl = $('statMoves'), statPerfectEl = $('statPerfect');
  const bestEls = { easy: $('bestEasy'), medium: $('bestMedium'), hard: $('bestHard'), expert: $('bestExpert') };
  const fewEls  = { easy: $('fewEasy'),  medium: $('fewMedium'),  hard: $('fewHard'),  expert: $('fewExpert') };
  const resultOverlay = $('resultOverlay'), resultIcon = $('resultIcon'), resultTitle = $('resultTitle');
  const resultSub = $('resultSub'), resultStars = $('resultStars'), resultBtn = $('resultBtn'), resultSecondary = $('resultSecondary');
  const exitConfirmOverlay = $('exitConfirmOverlay'), exitConfirmCancel = $('exitConfirmCancel'), exitConfirmYes = $('exitConfirmYes');
  const resetConfirmOverlay = $('resetConfirmOverlay'), resetConfirmCancel = $('resetConfirmCancel'), resetConfirmYes = $('resetConfirmYes');

  // --- State ---
  let currentKey = 'medium';
  let activeMode = 'medium';
  let theme = 'animals';
  let cards = [];              // --- [{icon, state:'hidden'|'flipped'|'matched', el}] ---
  let firstIdx = -1, secondIdx = -1, lockBoard = false;
  let moves = 0, matchedPairs = 0, totalPairs = 8, perfect = true;
  let started = false, finished = false;
  let timer = 0, timerHandle = null;
  let muted = false;
  let revealTimeout = null;
  let peekUntil = 0;

  // --- Stats & History ---
  function defaultStats() {
    const s = {};
    for (const k in CONFIG) s[k] = { played: 0, wins: 0, bestTime: null, fewestMoves: null };
    return s;
  }
  let stats = defaultStats();
  let totals = { moves: 0, perfect: 0 };
  let history = [];

  function saveStats() {
    if (!store) return;
    store.set('stats', stats);
    store.set('totals', totals);
    store.set('history', history);
  }
  function saveSettings() {
    if (!store) return;
    store.set('settings', { theme: theme, muted: muted, difficulty: currentKey });
  }
  function loadPersisted() {
    if (!store) return;
    const s = store.get('stats', null);
    if (s && typeof s === 'object') {
      const def = defaultStats();
      for (const k in def) if (s[k]) Object.assign(def[k], s[k]);
      stats = def;
    }
    totals = store.get('totals', totals);
    history = store.get('history', []);
    const settings = store.get('settings', null);
    if (settings) {
      if (THEMES[settings.theme]) theme = settings.theme;
      muted = !!settings.muted;
      if (CONFIG[settings.difficulty] || settings.difficulty === 'random') currentKey = settings.difficulty;
    }
  }

  // --- Audio ---
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
    return audioCtx;
  }
  function beep(freq, dur, type, vol) {
    if (muted) return;
    try {
      const ac = ensureAudio();
      if (!ac) return;
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(Math.min(0.2, (vol || 0.05)), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(t); osc.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function playMatchSound() { beep(660, 0.08, 'sine', 0.06); setTimeout(() => beep(880, 0.1, 'sine', 0.06), 80); }
  function playMissSound() { beep(220, 0.12, 'triangle', 0.05); }
  function playWinSound() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'sine', 0.06), i * 110)); }

  // --- Cleanup registry & safe listeners ---
  const cleanups = [];
  function addGlobal(el, ev, fn, opts) { el.addEventListener(ev, fn, opts); cleanups.push(() => el.removeEventListener(ev, fn, opts)); }
  function emit(name, fn, payload) { if (typeof fn === 'function') { try { fn(payload); } catch (e) { console.warn('[MemoryMatch] ' + name + ' error:', e); } } }

  // --- Timer ---
  function formatTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? String(m) + ':' + (s < 10 ? '0' + s : s) : String(s);
  }
  function startTimerIfNeeded() {
    if (started || finished) return;
    started = true;
    emit('onState', onState, { game: 'memory-match', state: 'playing' });
  }
  function resumeTimer() {
    stopTimerTick();
    if (finished) return;
    timerHandle = setInterval(() => { timer++; timerEl.textContent = formatTime(timer); }, 1000);
  }
  function stopTimerTick() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }
  function pauseTimer() { stopTimerTick(); }
  function stopTimer() { stopTimerTick(); }

  // --- Deck building ---
  function pickIcons(count) {
    let pool;
    if (theme === 'mixed') pool = THEMES.animals.concat(THEMES.fruits, THEMES.space);
    else pool = THEMES[theme];
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
    }
    return shuffled.slice(0, count);
  }

  function buildDeck() {
    const cc = CONFIG[activeMode];
    totalPairs = (cc.cols * cc.rows) / 2;
    const icons = pickIcons(totalPairs);
    cards = [];
    for (let i = 0; i < totalPairs; i++) { cards.push(icons[i]); cards.push(icons[i]); }
    // --- Fisher-Yates shuffle ---
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp;
    }
    cards = cards.map((icon) => ({ icon: icon, state: 'hidden', el: null }));
  }

  // --- Layout sizing ---
  function setupLayout() {
    const cc = CONFIG[activeMode];
    const rect = boardWrap.getBoundingClientRect();
    const availW = Math.max(120, rect.width - 28);
    const availH = Math.max(120, rect.height - 28);
    const gap = cc.cols >= 6 ? 7 : 10;
    let cell = Math.floor(Math.min((availW - gap * (cc.cols - 1)) / cc.cols, (availH - gap * (cc.rows - 1)) / cc.rows));
    cell = Math.max(38, Math.min(96, cell));
    boardEl.style.setProperty('--cols', cc.cols);
    boardEl.style.setProperty('--cell', cell + 'px');
    boardEl.style.setProperty('--gap', gap + 'px');
  }

  // --- Render board ---
  function renderBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.dataset.index = String(i);
      btn.setAttribute('aria-label', 'Card ' + (i + 1));
      btn.innerHTML = '<span class="card-inner"><span class="face back"></span><span class="face front">' + c.icon + '</span></span>';
      boardEl.appendChild(btn);
      c.el = btn;
    }
    setupLayout();
  }

  function updateHud() {
    pairsEl.textContent = matchedPairs + ' / ' + totalPairs;
    movesEl.textContent = String(moves);
    timerEl.textContent = formatTime(timer);
  }

  // --- Flip logic ---
  function flipCard(idx) {
    const c = cards[idx];
    if (!c || c.state !== 'hidden' || lockBoard || finished) return;
    clearPeek(); // --- klik saat preview sedang berjalan: hentikan preview, langsung main ---
    startTimerIfNeeded();
    c.state = 'flipped';
    c.el.classList.add('flipped');
    beep(520, 0.05, 'sine', 0.04);

    if (firstIdx === -1) { firstIdx = idx; return; }
    secondIdx = idx;
    moves++;
    updateHud();
    lockBoard = true;

    const a = cards[firstIdx], b = cards[secondIdx];
    if (a.icon === b.icon) {
      // --- Match ---
      a.state = 'matched'; b.state = 'matched';
      const fa = firstIdx, fb = secondIdx;
      revealTimeout = setTimeout(() => {
        a.el.classList.remove('flipped'); a.el.classList.add('matched');
        b.el.classList.remove('flipped'); b.el.classList.add('matched');
        matchedPairs++;
        playMatchSound();
        firstIdx = -1; secondIdx = -1; lockBoard = false;
        updateHud();
        if (matchedPairs === totalPairs) winGame();
      }, 300);
    } else {
      // --- Miss ---
      perfect = false;
      const fi = firstIdx, si = secondIdx;
      revealTimeout = setTimeout(() => {
        a.el.classList.add('wrong', 'shake');
        b.el.classList.add('wrong', 'shake');
        playMissSound();
      }, 480);
      revealTimeout = setTimeout(() => {
        a.el.classList.remove('flipped', 'wrong', 'shake'); a.state = 'hidden';
        b.el.classList.remove('flipped', 'wrong', 'shake'); b.state = 'hidden';
        firstIdx = -1; secondIdx = -1; lockBoard = false;
      }, 1050);
    }
  }

  boardEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.card');
    if (!btn) return;
    flipCard(parseInt(btn.dataset.index, 10));
  });

  // --- Win ---
  function starsFor() {
    const par = totalPairs * 2;
    if (moves <= par) return 3;
    if (moves <= Math.ceil(par * 1.5)) return 2;
    return 1;
  }
  function showResultOverlay() {
    const stars = starsFor();
    resultIcon.textContent = stars === 3 ? '🌟' : '🏆';
    resultTitle.textContent = 'Board Cleared!';
    resultSub.textContent = 'Time: ' + formatTime(timer) + ' · Moves: ' + moves;
    resultStars.textContent = '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars);
    resultOverlay.classList.add('show');
  }
  function hideResultOverlay() { resultOverlay.classList.remove('show'); }

  function recordResult(won) {
    const s = stats[activeMode];
    s.played++;
    if (won) {
      s.wins++;
      if (s.bestTime === null || timer < s.bestTime) s.bestTime = timer;
      if (s.fewestMoves === null || moves < s.fewestMoves) s.fewestMoves = moves;
      totals.moves += moves;
      if (perfect) totals.perfect++;
    } else {
      totals.moves += moves;
    }
    history.unshift({ diff: CONFIG[activeMode].label + ' · ' + theme, result: won ? 'Won' : 'Lost', time: timer });
    if (history.length > 30) history.length = 30;
    saveStats();
    if (window.AppStorage) {
      window.AppStorage.recordPlay('memory-match', {
        won: won,
        time: timer,
        moves: moves,
        perfect: perfect,
        stars: starsFor(),
        difficulty: activeMode,
        difficultyLabel: CONFIG[activeMode].label,
        theme: theme
      });
    }
    const payload = { game: 'memory-match', difficulty: activeMode, difficultyLabel: CONFIG[activeMode].label, time: timer, timeFormatted: formatTime(timer), moves: moves, perfect: perfect, stars: starsFor(), theme: theme };
    if (won) emit('onWin', onWin, payload);
    else emit('onLose', onLose, payload);
  }

  function winGame() {
    finished = true;
    stopTimer();
    clearPendingReveal();
    recordResult(true);
    playWinSound();
    showResultOverlay();
    syncDashboardActions();
    emit('onState', onState, { game: 'memory-match', state: 'won' });
  }

  // --- New Game ---
  function newGame(key) {
    if (key && (CONFIG[key] || key === 'random')) currentKey = key;
    activeMode = (currentKey === 'random')
      ? Object.keys(CONFIG)[Math.floor(Math.random() * Object.keys(CONFIG).length)]
      : currentKey;
    ddLabel.textContent = (currentKey === 'random') ? 'Random: ' + CONFIG[activeMode].label : CONFIG[activeMode].label;
    Array.prototype.forEach.call(menuEl.querySelectorAll('button'), (b) => b.classList.toggle('active', b.dataset.key === currentKey));
    syncDiffButtons();

    clearPendingReveal();
    hideResultOverlay(); closeDashboard(); hideConfirmModal(resetConfirmOverlay);
    exitConfirmOverlay.classList.remove('show');

    stopTimer();
    timer = 0; moves = 0; matchedPairs = 0; perfect = true;
    started = false; finished = false;
    firstIdx = -1; secondIdx = -1; lockBoard = false;

    buildDeck();
    renderBoard();
    updateHud();
    emit('onState', onState, { game: 'memory-match', state: 'ready' });
  }

  function clearPendingReveal() {
    if (revealTimeout) { clearTimeout(revealTimeout); revealTimeout = null; }
  }

  // --- Peek: preview all cards for 1.2s at game start ---
  let peekTimers = [];
  function clearPeek() {
    peekTimers.forEach(t => clearTimeout(t));
    peekTimers = [];
    lockBoard = false;
  }
  function doPeek() {
    if (peekUntil > Date.now()) return; // --- sudah peek di sesi ini ---
    peekUntil = Date.now() + 8000; // --- anti spam ---
    clearPendingReveal();
    firstIdx = -1; secondIdx = -1; lockBoard = true;
    cards.forEach((c, i) => { if (c.state === 'hidden') peekTimers.push(setTimeout(() => c.el.classList.add('flipped'), i * 30)); });
    const delay = 1200 + cards.length * 30;
    peekTimers.push(setTimeout(() => {
      cards.forEach((c) => { if (c.state === 'hidden') c.el.classList.remove('flipped'); });
      peekTimers = [];
      lockBoard = false;
    }, delay));
  }

  // --- Stats & History UI ---
  function updateStatsUI() {
    let totalPlayed = 0, totalWins = 0;
    for (const k in stats) { totalPlayed += stats[k].played; totalWins += stats[k].wins; }
    statPlayedEl.textContent = totalPlayed;
    statWinsEl.textContent = totalWins;
    statMovesEl.textContent = totals.moves;
    statPerfectEl.textContent = totals.perfect;
    for (const k in bestEls) bestEls[k].textContent = stats[k].bestTime !== null ? formatTime(stats[k].bestTime) : '—';
    for (const k in fewEls) fewEls[k].textContent = stats[k].fewestMoves !== null ? String(stats[k].fewestMoves) : '—';
  }

  function updateHistoryUI() {
    if (!history.length) { historyListEl.innerHTML = '<div class="hist-empty">No games played yet.</div>'; return; }
    let html = '';
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      html += '<div class="hist-item"><span class="hist-diff">' + h.diff + '</span><span class="hist-res ' + (h.result === 'Won' ? 'win' : '') + '">' + h.result + '</span><span class="hist-time">' + formatTime(h.time) + '</span></div>';
    }
    historyListEl.innerHTML = html;
  }

  // --- Dashboard ---
  function syncDiffButtons() {
    const btns = dashboard.querySelectorAll('.diff-btn[data-diff]');
    for (let i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.diff === currentKey);
    const tbtns = dashboard.querySelectorAll('.diff-btn[data-theme]');
    for (let i = 0; i < tbtns.length; i++) tbtns[i].classList.toggle('active', tbtns[i].dataset.theme === theme);
  }
  function syncDashboardActions() {
    const inProgress = started && !finished;
    if (inProgress) { playBtnLabel.textContent = 'Restart'; dashActions.classList.add('has-resume'); }
    else { playBtnLabel.textContent = 'Play'; dashActions.classList.remove('has-resume'); }
  }
  function openDashboard() {
    if (started && !finished) pauseTimer();
    updateStatsUI(); updateHistoryUI(); syncDiffButtons(); syncDashboardActions();
    dashboard.classList.add('show');
  }
  function closeDashboard() {
    dashboard.classList.remove('show');
    if (started && !finished) resumeTimer();
  }
  function switchDashboardTab(name) {
    dashboard.querySelectorAll('.dash-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    dashboard.querySelectorAll('.dash-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
  }
  function hideConfirmModal(el) { el.classList.remove('show'); }

  // --- Exit Button ---
  if (typeof onExit === 'function') {
    exitBtn.classList.add('show');
    exitBtn.addEventListener('click', () => {
      exitConfirmOverlay.classList.add('show');
      if (started && !finished) pauseTimer();
    });
  }
  exitConfirmCancel.addEventListener('click', () => {
    exitConfirmOverlay.classList.remove('show');
    if (started && !finished) resumeTimer();
    beep(600, 0.04, 'sine', 0.03);
  });
  exitConfirmYes.addEventListener('click', () => {
    exitConfirmOverlay.classList.remove('show');
    beep(700, 0.05, 'sine', 0.04);
    emit('onExit', onExit, { game: 'memory-match', time: timer, difficulty: activeMode, moves: moves });
  });
  exitConfirmOverlay.addEventListener('click', (e) => {
    if (e.target === exitConfirmOverlay) {
      exitConfirmOverlay.classList.remove('show');
      if (started && !finished) resumeTimer();
    }
  });

  // --- Reset stats confirm ---
  resetConfirmCancel.addEventListener('click', () => hideConfirmModal(resetConfirmOverlay));
  resetConfirmYes.addEventListener('click', () => {
    stats = defaultStats(); totals = { moves: 0, perfect: 0 }; history = [];
    saveStats();
    hideConfirmModal(resetConfirmOverlay);
    updateStatsUI(); updateHistoryUI();
    beep(500, 0.08, 'sine', 0.05);
  });
  resetConfirmOverlay.addEventListener('click', (e) => { if (e.target === resetConfirmOverlay) hideConfirmModal(resetConfirmOverlay); });

  // --- Global Events ---
  ddBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menuEl.classList.toggle('show');
    ddBtn.classList.toggle('open', open);
  });
  menuEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-key]');
    if (!btn) return;
    menuEl.classList.remove('show'); ddBtn.classList.remove('open');
    newGame(btn.dataset.key);
    saveSettings();
    doPeek();
  });
  addGlobal(document, 'click', () => { menuEl.classList.remove('show'); ddBtn.classList.remove('open'); });

  fabBtn.addEventListener('click', () => openDashboard());
  dashboard.addEventListener('click', (e) => { if (e.target === dashboard) closeDashboard(); });
  dashboard.addEventListener('click', (e) => { const tab = e.target.closest('.dash-tab'); if (tab) switchDashboardTab(tab.dataset.tab); });
  dashboard.addEventListener('click', (e) => {
    const dbtn = e.target.closest('.diff-btn[data-diff]');
    if (!dbtn) return;
    const key = dbtn.dataset.diff;
    if (!CONFIG[key]) return;
    if (key === currentKey) return;
    currentKey = key;
    syncDiffButtons(); beep(700, 0.05, 'sine', 0.04);
    saveSettings();
  });
  dashboard.addEventListener('click', (e) => {
    const tbtn = e.target.closest('.diff-btn[data-theme]');
    if (!tbtn) return;
    const t = tbtn.dataset.theme;
    if (!THEMES[t] && t !== 'mixed') return;
    if (t === theme) return;
    theme = t;
    syncDiffButtons(); beep(760, 0.05, 'sine', 0.04);
    saveSettings();
    newGame(currentKey);
    doPeek();
  });

  playBtn.addEventListener('click', () => { newGame(currentKey); doPeek(); });
  resumeBtn.addEventListener('click', () => closeDashboard());

  resultBtn.addEventListener('click', () => { hideResultOverlay(); newGame(currentKey); doPeek(); });
  resultSecondary.addEventListener('click', () => { hideResultOverlay(); openDashboard(); switchDashboardTab('stats'); });

  soundBtn.addEventListener('click', () => {
    muted = !muted;
    soundBtn.classList.toggle('muted', muted);
    if (!muted) beep(700, 0.06, 'sine', 0.05);
    saveSettings();
  });

  addGlobal(window, 'resize', () => setupLayout());
  addGlobal(window, 'orientationchange', () => setTimeout(setupLayout, 220));

  addGlobal(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      if (exitConfirmOverlay.classList.contains('show')) { exitConfirmOverlay.classList.remove('show'); if (started && !finished) resumeTimer(); }
      else if (resetConfirmOverlay.classList.contains('show')) hideConfirmModal(resetConfirmOverlay);
      else if (resultOverlay.classList.contains('show')) hideResultOverlay();
      else if (dashboard.classList.contains('show')) closeDashboard();
    }
  });

  addGlobal(document, 'gesturestart', (e) => e.preventDefault());

  // --- Init ---
  loadPersisted();
  soundBtn.classList.toggle('muted', muted);
  newGame(currentKey);
  doPeek();

  // --- Ready Signal ---
  if (typeof onReady === 'function') emit('onReady', onReady, { game: 'memory-match' });

  // --- Return Control API ---
  return {
    pause() { if (started && !finished) pauseTimer(); },
    resume() { if (started && !finished) resumeTimer(); },
    exit() {
      saveStats();
      saveSettings();
      if (typeof onExit === 'function') emit('onExit', onExit, { game: 'memory-match', time: timer, difficulty: activeMode });
    },
    destroy() {
      saveStats();
      saveSettings();
      clearPendingReveal();
      try { stopTimer(); } catch (e) {}
      cleanups.forEach(fn => { try { fn(); } catch (e) {} });
      try { shadowHost.remove(); } catch (e) {}
    }
  };
}

// --- Expose ke global scope ---
window.MemoryMatch = { init };

})();

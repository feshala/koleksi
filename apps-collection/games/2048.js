// games/2048.js
// --- 2048 Slide Puzzle Script ---
// --- Global: window.Game2048 ---
// --- Call: Game2048.init(container, options) ---
// --- Options: onReady, onExit, onWin, onLose, onState ---
// --- Return: { pause, resume, exit, destroy } ---

(function () {
'use strict';

// --- CSS ---
const CSS = `
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
:host { display: flex; justify-content: center; width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #4a3b2c; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }

/* --- App Shell --- */
.app { position: relative; width: 100%; max-width: 540px; height: 100%; display: flex; flex-direction: column; background: #5b4a37; overflow: hidden; }

/* --- Header --- */
.topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; padding: 10px 14px; padding-top: calc(10px + env(safe-area-inset-top)); background: #46382a; box-shadow: 0 3px 10px rgba(0,0,0,.35); z-index: 15; flex: 0 0 auto; }
.brand { justify-self: start; display: inline-flex; align-items: baseline; gap: 8px; padding: 7px 13px; border: none; border-radius: 999px; background: rgba(255,255,255,.12); color: #f7efe4; font-size: 15px; font-weight: 800; letter-spacing: .2px; flex: 0 0 auto; }
.brand small { font-size: 11px; font-weight: 700; opacity: .65; }
.stats { justify-self: center; display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; }
.scorebox { display: flex; flex-direction: column; align-items: center; min-width: 64px; padding: 5px 10px; border-radius: 10px; background: rgba(255,255,255,.12); }
.scorebox .lbl { font-size: 9px; font-weight: 800; letter-spacing: .8px; text-transform: uppercase; color: #e8d9c4; }
.scorebox .val { font-size: 16px; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; line-height: 1.15; }
.score-pop { animation: scorePop .3s ease; }
@keyframes scorePop { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1)} }
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

/* --- Board --- */
.board-wrap { flex: 1 1 auto; min-height: 0; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px; }
.board-frame { position: relative; width: var(--frame, 320px); height: var(--frame, 320px); padding: var(--pad, 10px); border-radius: 16px; background: #6c5a45; box-shadow: inset 0 2px 8px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.35); touch-action: none; }
.grid-bg { position: absolute; inset: var(--pad, 10px); display: grid; gap: var(--gap, 10px); grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); }
.cell-bg { border-radius: 10px; background: rgba(0,0,0,.14); }
.tiles-layer { position: absolute; inset: 0; pointer-events: none; }
.tile { position: absolute; width: var(--tile, 70px); height: var(--tile, 70px); will-change: transform; transition: transform .12s ease-out; display: flex; align-items: center; justify-content: center; }
.tile-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-weight: 800; font-variant-numeric: tabular-nums; box-shadow: 0 3px 0 rgba(0,0,0,.18); transition: background .1s; }
.tile.spawn .tile-inner { animation: tileSpawn .18s ease-out; }
@keyframes tileSpawn { 0%{transform:scale(0)} 70%{transform:scale(1.08)} 100%{transform:scale(1)} }
.tile.merge .tile-inner { animation: tileMerge .2s ease-out; }
@keyframes tileMerge { 0%{transform:scale(1)} 50%{transform:scale(1.22)} 100%{transform:scale(1)} }
.t2  { background:#eee4da; color:#776e65; font-size: calc(var(--tile,70px)*.42); }
.t4  { background:#ede0c8; color:#776e65; font-size: calc(var(--tile,70px)*.42); }
.t8  { background:#f2b179; color:#f9f6f2; font-size: calc(var(--tile,70px)*.42); }
.t16 { background:#f59563; color:#f9f6f2; font-size: calc(var(--tile,70px)*.36); }
.t32 { background:#f67c5f; color:#f9f6f2; font-size: calc(var(--tile,70px)*.36); }
.t64 { background:#f65e3b; color:#f9f6f2; font-size: calc(var(--tile,70px)*.36); }
.t128 { background:#edcf72; color:#f9f6f2; font-size: calc(var(--tile,70px)*.30); }
.t256 { background:#edcc61; color:#f9f6f2; font-size: calc(var(--tile,70px)*.30); }
.t512 { background:#edc850; color:#f9f6f2; font-size: calc(var(--tile,70px)*.30); }
.t1024 { background:#edc53f; color:#f9f6f2; font-size: calc(var(--tile,70px)*.24); }
.t2048 { background:#edc22e; color:#f9f6f2; font-size: calc(var(--tile,70px)*.24); box-shadow: 0 0 18px rgba(237,194,46,.7); }
.super { background:#3c3a32; color:#f9f6f2; font-size: calc(var(--tile,70px)*.22); }

/* --- Hint bar --- */
.hint { flex: 0 0 auto; text-align: center; font-size: 11px; font-weight: 700; color: rgba(247,239,228,.65); letter-spacing: .4px; padding: 2px 12px 10px; }

/* --- Side Buttons --- */
.side-buttons { position: absolute; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 30; display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none; }
.side-buttons > * { pointer-events: auto; }
.fab { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; padding: 0; border: none; border-radius: 50%; background: #f2b179; color: #5b4a37; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.45), inset 0 -3px 0 rgba(0,0,0,.18); transition: transform .12s, background .15s; }
.fab:active { transform: scale(.9); background: #f7c396; }
.fab svg { width: 24px; height: 24px; }

/* --- Dashboard --- */
.dashboard { position: absolute; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; padding: 20px 16px; background: rgba(24,16,8,.68); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; }
.dashboard.show { opacity: 1; visibility: visible; }
.dash-card { width: 100%; max-width: 380px; max-height: calc(100vh - 40px); max-height: calc(100dvh - 40px); display: flex; flex-direction: column; padding: 18px; border-radius: 22px; background: #f7efe4; box-shadow: 0 22px 50px rgba(0,0,0,.55); transform: scale(.9); transition: transform .28s cubic-bezier(.2,1.4,.5,1); overflow: hidden; }
.dashboard.show .dash-card { transform: scale(1); }
.dash-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 12px; background: #e6d9c6; margin-bottom: 14px; flex: 0 0 auto; }
.dash-tab { padding: 9px 6px; border: none; border-radius: 9px; background: none; color: #7c6a52; font-size: 12px; font-weight: 800; letter-spacing: .3px; cursor: pointer; transition: background .15s, color .15s; }
.dash-tab.active { background: #fff; color: #4a3b2c; box-shadow: 0 2px 6px rgba(0,0,0,.08); }
.dash-tab:active { transform: scale(.97); }
.dash-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 2px; }
.dash-pane { display: none; }
.dash-pane.active { display: block; animation: fadeIn .2s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.stat-box { padding: 12px 10px; border-radius: 12px; background: #fff; border: 1px solid #e0d2bc; text-align: center; }
.stat-val { font-size: 22px; font-weight: 800; color: #4a3b2c; font-variant-numeric: tabular-nums; line-height: 1.1; }
.stat-lbl { margin-top: 3px; font-size: 10px; font-weight: 700; color: #93805f; letter-spacing: .6px; text-transform: uppercase; }
.best-title { font-size: 11px; font-weight: 800; color: #93805f; letter-spacing: .8px; text-transform: uppercase; margin: 4px 0 8px; text-align: center; }
.best-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.best-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid #e0d2bc; font-size: 13px; font-weight: 700; color: #6a563d; }
.best-row span:last-child { color: #4a3b2c; font-variant-numeric: tabular-nums; }

.history-list { display: flex; flex-direction: column; gap: 6px; max-height: 60vh; overflow-y: auto; padding: 2px; }
.hist-item { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid #e0d2bc; font-size: 12px; font-weight: 700; }
.hist-diff { color: #6a563d; }
.hist-res { padding: 3px 8px; border-radius: 999px; font-size: 10px; letter-spacing: .4px; text-transform: uppercase; }
.hist-res.win { background: #ddefc4; color: #456b1d; }
.hist-res.lose { background: #f5c9c9; color: #8c2020; }
.hist-score { color: #4a3b2c; font-variant-numeric: tabular-nums; min-width: 44px; text-align: right; }
.hist-empty { padding: 30px 12px; text-align: center; color: #b3a288; font-size: 12px; font-weight: 700; }

.opt-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 12px; background: #fff; border: 1px solid #e0d2bc; margin-bottom: 10px; font-size: 13px; font-weight: 700; color: #6a563d; }
.opt-diff { flex-direction: column; align-items: stretch; gap: 10px; }
.opt-diff > span:first-child { text-align: center; display: block; }
.diff-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.diff-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 12px 8px; border: 1.5px solid #e0d2bc; border-radius: 10px; background: #fbf6ee; color: #7c6a52; cursor: pointer; transition: all .15s; font-family: inherit; }
.diff-btn .diff-name { font-size: 14px; font-weight: 800; letter-spacing: .3px; }
.diff-btn .diff-desc { font-size: 10px; font-weight: 700; opacity: 0.7; }
.diff-btn.active { background: #f2b179; color: #fff; border-color: #f2b179; box-shadow: 0 3px 0 #d18f52; }
.diff-btn.active .diff-desc { opacity: 0.95; }
.diff-btn:active { transform: scale(.96); }
.opt-warning { display: flex; gap: 6px; align-items: flex-start; font-size: 11px; font-weight: 700; color: #b8721e; padding: 0 6px 12px; line-height: 1.4; }
.opt-warning::before { content: '\u26A0'; font-size: 12px; flex: 0 0 auto; }

.switch { position: relative; width: 46px; height: 26px; border: none; border-radius: 999px; background: #d5c5aa; cursor: pointer; padding: 0; transition: background .2s; flex: 0 0 auto; }
.switch-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s; }
.switch.on { background: #f2b179; }
.switch.on .switch-knob { transform: translateX(20px); }

.dash-actions { flex: 0 0 auto; margin-top: 14px; padding-top: 14px; border-top: 1px solid #e0d2bc; display: flex; gap: 10px; }
.dash-actions .play-btn, .dash-actions .resume-btn { flex: 1 1 0; min-width: 0; }
.play-btn, .resume-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; border: none; border-radius: 14px; font-size: 15px; font-weight: 800; letter-spacing: .5px; cursor: pointer; transition: transform .1s, box-shadow .1s, background .15s; white-space: nowrap; }
.play-btn { background: #f2b179; color: #fff; box-shadow: 0 4px 0 #d18f52; }
.play-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #d18f52; }
.resume-btn { background: #fff; color: #6a563d; box-shadow: 0 4px 0 #e0d2bc; border: 1.5px solid #e0d2bc; }
.resume-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #e0d2bc; }
.play-btn svg, .resume-btn svg { width: 16px; height: 16px; flex: 0 0 auto; }

/* --- Result / Confirm overlays --- */
.result-overlay { position: absolute; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(24,16,8,.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; visibility: hidden; transition: opacity .3s, visibility .3s; }
.result-overlay.show { opacity: 1; visibility: visible; }
.result-card { width: 100%; max-width: 300px; padding: 28px 24px 22px; border-radius: 24px; text-align: center; transform: scale(.85); transition: transform .35s cubic-bezier(.2,1.4,.5,1); box-shadow: 0 24px 60px rgba(0,0,0,.55); background: linear-gradient(160deg, #f9f3e9 0%, #ecdcc4 100%); border: 2px solid #f2b179; }
.result-overlay.show .result-card { transform: scale(1); }
.result-icon { font-size: 60px; line-height: 1; margin-bottom: 10px; display: block; animation: popIcon .5s cubic-bezier(.2,1.4,.5,1); }
@keyframes popIcon { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2);opacity:1} 100%{transform:scale(1)} }
.result-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; letter-spacing: -.3px; color: #4a3b2c; }
.result-sub { font-size: 14px; font-weight: 600; margin: 0 0 22px; color: #7c6a52; }
.result-btn { width: 100%; padding: 14px; border: none; border-radius: 14px; font-size: 15px; font-weight: 800; letter-spacing: .5px; cursor: pointer; transition: transform .1s, box-shadow .1s; font-family: inherit; background: #f2b179; color: #fff; box-shadow: 0 4px 0 #d18f52; }
.result-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #d18f52; }
.result-btn-secondary { width: 100%; padding: 11px; margin-top: 8px; border: none; border-radius: 12px; background: transparent; font-size: 13px; font-weight: 800; letter-spacing: .3px; cursor: pointer; transition: background .15s; font-family: inherit; color: #7c6a52; }
.result-btn-secondary:active { background: rgba(242,177,121,.15); }

.confirm-overlay { position: absolute; inset: 0; z-index: 95; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(24,16,8,.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; }
.confirm-overlay.show { opacity: 1; visibility: visible; }
.confirm-card { width: 100%; max-width: 320px; padding: 24px 22px 18px; border-radius: 20px; background: #f7efe4; box-shadow: 0 22px 50px rgba(0,0,0,.55); transform: scale(.9); transition: transform .28s cubic-bezier(.2,1.4,.5,1); }
.confirm-overlay.show .confirm-card { transform: scale(1); }
.confirm-title { margin: 0 0 8px; font-size: 17px; font-weight: 800; color: #4a3b2c; letter-spacing: -.2px; }
.confirm-sub { margin: 0 0 20px; font-size: 13px; font-weight: 600; color: #7c6a52; line-height: 1.5; }
.confirm-actions { display: flex; gap: 10px; }
.confirm-btn { flex: 1; padding: 12px; border: none; border-radius: 12px; font-size: 14px; font-weight: 800; letter-spacing: .3px; cursor: pointer; font-family: inherit; transition: transform .1s, box-shadow .1s, background .15s; }
.confirm-cancel { background: #e6d9c6; color: #6a563d; }
.confirm-cancel:active { background: #dbcbb2; }
.confirm-yes { background: #f2b179; color: #fff; box-shadow: 0 3px 0 #d18f52; }
.confirm-yes:active { transform: translateY(2px); box-shadow: 0 1px 0 #d18f52; }
`;

// --- HTML ---
const HTML = `
<div class="app">
  <header class="topbar">
    <div class="brand">2048<small id="sizeLabel">4×4</small></div>
    <div class="stats">
      <div class="scorebox"><span class="lbl">Score</span><span class="val" id="scoreVal">0</span></div>
      <div class="scorebox"><span class="lbl">Best</span><span class="val" id="bestVal">0</span></div>
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

  <main class="board-wrap" id="boardWrap">
    <div class="board-frame" id="boardFrame">
      <div class="grid-bg" id="gridBg"></div>
      <div class="tiles-layer" id="tilesLayer"></div>
    </div>
  </main>
  <div class="hint">Swipe or use arrow keys · Double a tile to reach 2048!</div>

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
            <div class="stat-box"><div class="stat-val" id="statWins">0</div><div class="stat-lbl">2048 Reached</div></div>
            <div class="stat-box"><div class="stat-val" id="statBestScore">0</div><div class="stat-lbl">Best Score</div></div>
            <div class="stat-box"><div class="stat-val" id="statBestTile">0</div><div class="stat-lbl">Best Tile</div></div>
          </div>
          <div class="best-title">Recent Games</div>
          <div class="best-list" id="statsMiniList"></div>
        </div>
        <div class="dash-pane" data-pane="options">
          <div class="opt-row opt-diff">
            <span>Board Size</span>
            <div class="diff-group">
              <button class="diff-btn" data-size="3"><span class="diff-name">Tiny</span><span class="diff-desc">3 × 3</span></button>
              <button class="diff-btn active" data-size="4"><span class="diff-name">Classic</span><span class="diff-desc">4 × 4</span></button>
              <button class="diff-btn" data-size="5"><span class="diff-name">Big</span><span class="diff-desc">5 × 5</span></button>
              <button class="diff-btn" data-size="6"><span class="diff-name">Huge</span><span class="diff-desc">6 × 6</span></button>
            </div>
          </div>
          <div class="opt-row">
            <span>Undo (up to 5)</span>
            <button class="switch on" id="undoSwitch" aria-label="Toggle undo"><span class="switch-knob"></span></button>
          </div>
          <div class="opt-warning">Changing board size starts a brand new game.</div>
        </div>
        <div class="dash-pane" data-pane="history">
          <div class="history-list" id="historyList"></div>
        </div>
      </div>
      <div class="dash-actions">
        <button class="resume-btn" id="resumeBtn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Resume</span></button>
        <button class="play-btn" id="playBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg><span id="playBtnLabel">New Game</span></button>
      </div>
    </div>
  </div>

  <div class="result-overlay" id="resultOverlay">
    <div class="result-card">
      <span class="result-icon" id="resultIcon">🏆</span>
      <h2 class="result-title" id="resultTitle">You Win!</h2>
      <p class="result-sub" id="resultSub">Score: 0</p>
      <button class="result-btn" id="resultBtn">New Game</button>
      <button class="result-btn-secondary" id="resultSecondary">Keep Playing</button>
    </div>
  </div>

  <div class="confirm-overlay" id="exitConfirmOverlay">
    <div class="confirm-card">
      <h3 class="confirm-title">Leave the game?</h3>
      <p class="confirm-sub">Your current board is saved automatically, so you can continue where you left off.</p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-cancel" id="exitConfirmCancel">Stay</button>
        <button class="confirm-btn confirm-yes" id="exitConfirmYes">Leave</button>
      </div>
    </div>
  </div>
</div>
`;

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

  // --- Shadow host setup ---
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

  const $ = (id) => appEl.querySelector('#' + id);

  // --- Storage namespace ---
  const store = (window.AppStorage) ? window.AppStorage.namespace('2048') : null;

  // --- Elements ---
  const scoreValEl = $('scoreVal'), bestValEl = $('bestVal'), sizeLabelEl = $('sizeLabel');
  const soundBtn = $('soundBtn'), exitBtn = $('exitBtn');
  const boardWrap = $('boardWrap'), frameEl = $('boardFrame'), gridBgEl = $('gridBg'), tilesLayer = $('tilesLayer');
  const fabBtn = $('fabBtn');
  const dashboard = $('dashboard');
  const playBtn = $('playBtn'), playBtnLabel = $('playBtnLabel'), resumeBtn = $('resumeBtn');
  const historyListEl = $('historyList'), statsMiniListEl = $('statsMiniList');
  const statPlayedEl = $('statPlayed'), statWinsEl = $('statWins'), statBestScoreEl = $('statBestScore'), statBestTileEl = $('statBestTile');
  const undoSwitch = $('undoSwitch');
  const resultOverlay = $('resultOverlay'), resultIcon = $('resultIcon'), resultTitle = $('resultTitle');
  const resultSub = $('resultSub'), resultBtn = $('resultBtn'), resultSecondary = $('resultSecondary');
  const exitConfirmOverlay = $('exitConfirmOverlay'), exitConfirmCancel = $('exitConfirmCancel'), exitConfirmYes = $('exitConfirmYes');

  // --- State ---
  let size = 4;
  let grid = [];               // --- 2D array of tile values (0 = empty) ---
  let tileSeq = 0;             // --- unique ids for DOM tile tracking ---
  let tileEls = {};            // --- id -> DOM element ---
  let positions = {};          // --- id -> {r,c} for animation bookkeeping ---
  let score = 0, best = 0, bestEver = 0, bestTile = 0;
  let won2048 = false, keepPlaying = false, over = false;
  let history = [];
  let statsTotals = { played: 0, wins: 0 };
  let undoStack = [];
  let undoEnabled = true;
  let muted = false;
  let moveCount = 0;

  // --- Persistence ---
  function saveAll() {
    if (!store) return;
    store.set('board', { size: size, grid: grid, score: score, won2048: won2048, keepPlaying: keepPlaying, over: over, bestTile: bestTile, moveCount: moveCount });
    store.set('meta', { best: bestEver, history: history, totals: statsTotals, settings: { size: size, undoEnabled: undoEnabled, muted: muted } });
  }
  function loadPersisted() {
    if (!store) return;
    const meta = store.get('meta', null);
    if (meta) {
      bestEver = meta.best || 0;
      history = Array.isArray(meta.history) ? meta.history : [];
      if (meta.totals) statsTotals = meta.totals;
      if (meta.settings) {
        if ([3,4,5,6].indexOf(meta.settings.size) !== -1) size = meta.settings.size;
        undoEnabled = meta.settings.undoEnabled !== false;
        muted = !!meta.settings.muted;
      }
    }
    const b = store.get('board', null);
    if (b && b.size === size && Array.isArray(b.grid) && b.grid.length === size * size) {
      grid = [];
      for (let r = 0; r < size; r++) grid.push(b.grid.slice(r * size, (r + 1) * size));
      score = b.score || 0; won2048 = !!b.won2048; keepPlaying = !!b.keepPlaying; over = !!b.over;
      bestTile = b.bestTile || 0; moveCount = b.moveCount || 0;
    } else {
      grid = null; // --- invalid/incompatible save, start fresh ---
    }
  }

  // --- Audio ---
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; } }
    if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
    return audioCtx;
  }
  function beep(freq, dur, type, vol) {
    if (muted) return;
    try {
      const ac = ensureAudio();
      if (!ac) return;
      const t = ac.currentTime;
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(Math.min(0.2, vol || 0.05), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(t); osc.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function playMoveSound() { beep(340, 0.04, 'sine', 0.03); }
  function playMergeSound(val) { const f = Math.min(1200, 420 + Math.log2(val) * 90); beep(f, 0.07, 'triangle', 0.05); }
  function playWinSound() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'sine', 0.06), i * 110)); }
  function playLoseSound() { [330, 262, 196].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'sawtooth', 0.04), i * 140)); }

  // --- Cleanup registry ---
  const cleanups = [];
  function addGlobal(el, ev, fn, opts) { el.addEventListener(ev, fn, opts); cleanups.push(() => el.removeEventListener(ev, fn, opts)); }
  function emit(name, fn, payload) { if (typeof fn === 'function') { try { fn(payload); } catch (e) { console.warn('[Game2048] ' + name + ' error:', e); } } }

  // --- Grid helpers ---
  function emptyGrid() { const g = []; for (let r = 0; r < size; r++) g.push(new Array(size).fill(0)); return g; }
  function cloneGrid(g) { return g.map(row => row.slice()); }
  function randomEmptyCell(g) {
    const cells = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (g[r][c] === 0) cells.push({ r, c });
    if (!cells.length) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  }
  function spawnTile(g) {
    const spot = randomEmptyCell(g);
    if (!spot) return null;
    g[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
    return { r: spot.r, c: spot.c, val: g[spot.r][spot.c], id: ++tileSeq, fresh: true };
  }

  // --- Move engine: returns { moved, merges:[{r,c,val}], grid } ---
  function slide(g, dir) {
    // --- dir: 0=up 1=right 2=down 3=left ---
    const ng = cloneGrid(g);
    const lines = [];
    for (let i = 0; i < size; i++) {
      const line = [];
      for (let j = 0; j < size; j++) {
        let r, c;
        if (dir === 0) { r = j; c = i; }
        else if (dir === 2) { r = size - 1 - j; c = i; }
        else if (dir === 3) { r = i; c = j; }
        else { r = i; c = size - 1 - j; }
        line.push({ r, c });
      }
      lines.push(line);
    }
    let moved = false;
    const merges = [];
    for (let i = 0; i < size; i++) {
      const coords = lines[i];
      const vals = coords.map(p => ng[p.r][p.c]).filter(v => v !== 0);
      const out = [];
      let mergedHere = 0;
      for (let k = 0; k < vals.length; k++) {
        if (k + 1 < vals.length && vals[k] === vals[k + 1]) {
          const nv = vals[k] * 2;
          out.push(nv);
          mergedHere++;
          k++;
        } else out.push(vals[k]);
      }
      while (out.length < size) out.push(0);
      for (let j = 0; j < size; j++) {
        const p = coords[j];
        if (ng[p.r][p.c] !== out[j]) moved = true;
        ng[p.r][p.c] = out[j];
      }
      if (mergedHere) {
        // --- record merge target cells for this line ---
        for (let j = 0; j < size; j++) {
          const p = coords[j];
          if (out[j] >= 4) merges.push({ r: p.r, c: p.c, val: out[j] });
        }
      }
    }
    return { moved, merges, grid: ng };
  }

  function movesAvailable(g) {
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (g[r][c] === 0) return true;
      if (c + 1 < size && g[r][c + 1] === g[r][c]) return true;
      if (r + 1 < size && g[r + 1][c] === g[r][c]) return true;
    }
    return false;
  }

  // --- Layout sizing ---
  let padPx = 10, gapPx = 10, tilePx = 70, framePx = 320;
  function setupLayout() {
    const rect = boardWrap.getBoundingClientRect();
    const avail = Math.max(160, Math.min(rect.width, rect.height) - 28);
    framePx = Math.min(avail, 460);
    padPx = Math.max(6, Math.round(framePx * 0.03));
    gapPx = Math.max(5, Math.round(framePx * 0.028));
    tilePx = Math.floor((framePx - padPx * 2 - gapPx * (size - 1)) / size);
    frameEl.style.setProperty('--frame', framePx + 'px');
    frameEl.style.setProperty('--pad', padPx + 'px');
    frameEl.style.setProperty('--gap', gapPx + 'px');
    frameEl.style.setProperty('--tile', tilePx + 'px');
    gridBgEl.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
    gridBgEl.style.gridTemplateRows = 'repeat(' + size + ', 1fr)';
  }
  function cellXY(r, c) {
    return { x: padPx + c * (tilePx + gapPx), y: padPx + r * (tilePx + gapPx) };
  }

  // --- Tile DOM rendering ---
  function buildBackdrop() {
    gridBgEl.innerHTML = '';
    for (let i = 0; i < size * size; i++) {
      const d = document.createElement('div');
      d.className = 'cell-bg';
      gridBgEl.appendChild(d);
    }
  }
  function tileClassFor(v) { return v <= 2048 ? 't' + v : 'super'; }
  function renderTile(id, r, c, val, animClass) {
    const pos = cellXY(r, c);
    let el = tileEls[id];
    if (!el) {
      el = document.createElement('div');
      el.className = 'tile';
      el.innerHTML = '<div class="tile-inner"></div>';
      tilesLayer.appendChild(el);
      tileEls[id] = el;
    }
    el.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
    const inner = el.firstElementChild;
    inner.textContent = String(val);
    inner.className = 'tile-inner ' + tileClassFor(val);
    el.classList.remove('spawn', 'merge');
    if (animClass) { void el.offsetWidth; el.classList.add(animClass); }
    positions[id] = { r, c };
  }
  function clearTiles() { tilesLayer.innerHTML = ''; tileEls = {}; positions = {}; }

  // --- Full re-render from grid state (used on load/new game) ---
  function rebuildTileMap() {
    clearTiles();
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const id = ++tileSeq;
      renderTile(id, r, c, v, null);
    }
  }

  // --- HUD ---
  function updateHud(popScore) {
    scoreValEl.textContent = String(score);
    bestValEl.textContent = String(best);
    sizeLabelEl.textContent = size + '×' + size;
    if (popScore) {
      scoreValEl.parentElement.classList.remove('score-pop');
      void scoreValEl.offsetWidth;
      scoreValEl.parentElement.classList.add('score-pop');
    }
  }

  // --- Undo ---
  function pushUndo() {
    if (!undoEnabled) return;
    undoStack.push({ grid: cloneGrid(grid), score: score, bestTile: bestTile, moveCount: moveCount });
    if (undoStack.length > 5) undoStack.shift();
  }
  function doUndo() {
    if (!undoStack.length || over) return false;
    const snap = undoStack.pop();
    grid = snap.grid; score = snap.score; bestTile = snap.bestTile; moveCount = snap.moveCount;
    won2048 = bestTile >= 2048 && !keepPlaying ? won2048 : won2048;
    rebuildTileMap();
    updateHud(false);
    hideResultOverlay();
    beep(500, 0.05, 'sine', 0.04);
    return true;
  }

  // --- Game flow ---
  function showResult(win) {
    resultIcon.textContent = win ? '🎉' : '💥';
    resultTitle.textContent = win ? '2048 Reached!' : 'Game Over';
    resultSub.textContent = 'Score: ' + score + ' · Best tile: ' + bestTile;
    resultSecondary.style.display = win ? '' : 'none';
    resultOverlay.classList.add('show');
  }
  function hideResultOverlay() { resultOverlay.classList.remove('show'); }

  function finishGame(won) {
    over = !won;
    if (won) { won2048 = true; }
    if (score > bestEver) bestEver = score;
    best = bestEver;
    statsTotals.played++;
    if (won) statsTotals.wins++;
    history.unshift({ res: won ? 'win' : 'lose', score: score, tile: bestTile, moves: moveCount });
    if (history.length > 30) history.length = 30;
    saveAll();
    if (window.AppStorage) {
      window.AppStorage.recordPlay('2048', { won: won, score: score, bestTile: bestTile, moves: moveCount, size: size });
    }
    const payload = { game: '2048', won: won, score: score, bestTile: bestTile, moves: moveCount, size: size };
    if (won) emit('onWin', onWin, payload); else emit('onLose', onLose, payload);
    emit('onState', onState, { game: '2048', state: won ? 'won' : 'lost' });
    showResult(won);
    if (won) playWinSound(); else playLoseSound();
  }

  function applyMove(dir) {
    if (over) return;
    if (resultOverlay.classList.contains('show') && won2048 && keepPlaying) hideResultOverlay();
    const res = slide(grid, dir);
    if (!res.moved) { beep(180, 0.06, 'square', 0.025); return; }
    pushUndo();
    grid = res.grid;
    moveCount++;

    // --- Score from merges ---
    let gained = 0;
    const mergedVals = {};
    res.merges.forEach(m => { if (!mergedVals[m.r + ':' + m.c]) { mergedVals[m.r + ':' + m.c] = true; gained += m.val; } });
    score += gained;
    if (gained > 0) playMergeSound(gained); else playMoveSound();

    // --- Rebuild visuals simply (re-render all tiles with animations) ---
    rebuildTileMap();
    const spot = spawnTile(grid);
    if (spot) renderTile(spot.id, spot.r, spot.c, spot.val, 'spawn');

    // --- Track best tile ---
    let maxT = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r][c] > maxT) maxT = grid[r][c];
    bestTile = Math.max(bestTile, maxT);
    if (score > best) { best = score; }

    updateHud(gained > 0);

    // --- Win check ---
    if (maxT >= 2048 && !won2048 && !keepPlaying) { finishGame(true); return; }
    // --- Lose check ---
    if (!movesAvailable(grid)) finishGame(false);
  }

  function newGame() {
    clearTiles();
    grid = emptyGrid();
    score = 0; over = false; won2048 = false; keepPlaying = false; moveCount = 0; bestTile = 0;
    undoStack = [];
    hideResultOverlay();
    const a = spawnTile(grid); const b = spawnTile(grid);
    if (a) renderTile(a.id, a.r, a.c, a.val, 'spawn');
    if (b) renderTile(b.id, b.r, b.c, b.val, 'spawn');
    best = bestEver;
    updateHud(false);
    saveAll();
    emit('onState', onState, { game: '2048', state: 'ready' });
  }

  // --- Input: keyboard ---
  const KEY_DIRS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3 };
  addGlobal(document, 'keydown', (e) => {
    if (dashboard.classList.contains('show')) {
      if (e.key === 'Escape') closeDashboard();
      return;
    }
    if (e.key === 'Escape') {
      if (exitConfirmOverlay.classList.contains('show')) { exitConfirmOverlay.classList.remove('show'); }
      else if (resultOverlay.classList.contains('show')) hideResultOverlay();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); return; }
    const dir = KEY_DIRS[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    applyMove(dir);
  });

  // --- Input: swipe ---
  let touchStart = null;
  frameEl.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  frameEl.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    touchStart = null;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (Math.max(adx, ady) < 24) return;
    if (adx > ady) applyMove(dx > 0 ? 1 : 3);
    else applyMove(dy > 0 ? 2 : 0);
  }, { passive: true });
  // --- Mouse drag fallback for desktop testing ---
  let mouseStart = null;
  frameEl.addEventListener('mousedown', (e) => { mouseStart = { x: e.clientX, y: e.clientY }; });
  frameEl.addEventListener('mouseup', (e) => {
    if (!mouseStart) return;
    const dx = e.clientX - mouseStart.x, dy = e.clientY - mouseStart.y;
    mouseStart = null;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (Math.max(adx, ady) < 24) return;
    if (adx > ady) applyMove(dx > 0 ? 1 : 3);
    else applyMove(dy > 0 ? 2 : 0);
  });

  // --- Stats & History UI ---
  function updateStatsUI() {
    statPlayedEl.textContent = statsTotals.played;
    statWinsEl.textContent = statsTotals.wins;
    statBestScoreEl.textContent = bestEver;
    statBestTileEl.textContent = bestTile > 0 ? bestTile : (history.length ? history[0].tile : 0);
    if (!history.length) {
      statsMiniListEl.innerHTML = '<div class="hist-empty" style="padding:12px">No games yet.</div>';
      historyListEl.innerHTML = '<div class="hist-empty">No games played yet.</div>';
      return;
    }
    let mini = '', full = '';
    for (let i = 0; i < Math.min(5, history.length); i++) {
      const h = history[i];
      mini += '<div class="best-row"><span>' + (h.res === 'win' ? '🏆' : '💥') + ' ' + h.moves + ' moves</span><span>' + h.score + '</span></div>';
    }
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      full += '<div class="hist-item"><span class="hist-diff">' + size + '×' + size + ' · tile ' + h.tile + '</span><span class="hist-res ' + h.res + '">' + (h.res === 'win' ? 'Won' : 'Lost') + '</span><span class="hist-score">' + h.score + '</span></div>';
    }
    statsMiniListEl.innerHTML = mini;
    historyListEl.innerHTML = full;
  }

  // --- Dashboard ---
  function syncSizeButtons() {
    const btns = dashboard.querySelectorAll('.diff-btn[data-size]');
    for (let i = 0; i < btns.length; i++) btns[i].classList.toggle('active', parseInt(btns[i].dataset.size, 10) === size);
    undoSwitch.classList.toggle('on', undoEnabled);
    playBtnLabel.textContent = (score > 0 && !over) ? 'Restart' : 'New Game';
  }
  function openDashboard() { updateStatsUI(); syncSizeButtons(); dashboard.classList.add('show'); }
  function closeDashboard() { dashboard.classList.remove('show'); }
  function switchDashboardTab(name) {
    dashboard.querySelectorAll('.dash-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    dashboard.querySelectorAll('.dash-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
  }

  fabBtn.addEventListener('click', () => openDashboard());
  dashboard.addEventListener('click', (e) => { if (e.target === dashboard) closeDashboard(); });
  dashboard.addEventListener('click', (e) => { const tab = e.target.closest('.dash-tab'); if (tab) switchDashboardTab(tab.dataset.tab); });
  dashboard.addEventListener('click', (e) => {
    const btn = e.target.closest('.diff-btn[data-size]');
    if (!btn) return;
    const ns = parseInt(btn.dataset.size, 10);
    if (![3,4,5,6].includes(ns) || ns === size) return;
    size = ns;
    buildBackdrop(); setupLayout();
    newGame();
    syncSizeButtons();
    beep(700, 0.05, 'sine', 0.04);
  });
  undoSwitch.addEventListener('click', () => {
    undoEnabled = !undoEnabled;
    if (!undoEnabled) undoStack = [];
    undoSwitch.classList.toggle('on', undoEnabled);
    saveAll();
    beep(650, 0.04, 'sine', 0.03);
  });
  playBtn.addEventListener('click', () => { closeDashboard(); newGame(); });
  resumeBtn.addEventListener('click', () => closeDashboard());

  resultBtn.addEventListener('click', () => { hideResultOverlay(); newGame(); });
  resultSecondary.addEventListener('click', () => { keepPlaying = true; hideResultOverlay(); over = false; saveAll(); });

  // --- Exit button ---
  if (typeof onExit === 'function') {
    exitBtn.classList.add('show');
    exitBtn.addEventListener('click', () => { saveAll(); exitConfirmOverlay.classList.add('show'); });
  }
  exitConfirmCancel.addEventListener('click', () => exitConfirmOverlay.classList.remove('show'));
  exitConfirmYes.addEventListener('click', () => {
    exitConfirmOverlay.classList.remove('show');
    saveAll();
    emit('onExit', onExit, { game: '2048', score: score, bestTile: bestTile });
  });
  exitConfirmOverlay.addEventListener('click', (e) => { if (e.target === exitConfirmOverlay) exitConfirmOverlay.classList.remove('show'); });

  soundBtn.addEventListener('click', () => {
    muted = !muted;
    soundBtn.classList.toggle('muted', muted);
    if (!muted) beep(700, 0.06, 'sine', 0.05);
    saveAll();
  });

  addGlobal(window, 'resize', () => { setupLayout(); rebuildTileMap(); });
  addGlobal(window, 'orientationchange', () => setTimeout(() => { setupLayout(); rebuildTileMap(); }, 220));
  addGlobal(document, 'gesturestart', (e) => e.preventDefault());

  // --- Init ---
  loadPersisted();
  soundBtn.classList.toggle('muted', muted);
  best = bestEver;
  buildBackdrop();
  setupLayout();
  if (grid) {
    // --- Resume saved board ---
    won2048 = bestTile >= 2048;
    rebuildTileMap();
    if (over) showResult(false);
  } else {
    newGame();
  }
  updateHud(false);

  emit('onReady', onReady, { game: '2048' });

  // --- Control API ---
  return {
    pause() { /* turn-based, nothing ticking */ },
    resume() { /* turn-based, nothing ticking */ },
    exit() {
      saveAll();
      if (typeof onExit === 'function') emit('onExit', onExit, { game: '2048', score: score, bestTile: bestTile });
    },
    destroy() {
      saveAll();
      cleanups.forEach(fn => { try { fn(); } catch (e) {} });
      try { shadowHost.remove(); } catch (e) {}
    }
  };
}

// --- Expose ke global scope ---
window.Game2048 = { init };

})();

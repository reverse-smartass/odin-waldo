import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:3001/api"; // ← change to your backend URL

async function fetchPresets() {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error("Failed to fetch presets");
  return res.json(); // [{ id, photoUrl, nbRows, nbCols }]
}

async function fetchPreset(id) {
  const res = await fetch(`${API_BASE}/presets/${id}`);
  if (!res.ok) throw new Error("Failed to fetch preset");
  return res.json(); // { id, photoUrl, nbRows, nbCols, Solutions: [{id, row, col, photoUrl}] }
}

async function submitRecord({ presetId, username, time }) {
  const res = await fetch(`${API_BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presetId, username, time }),
  });
  if (!res.ok) throw new Error("Failed to submit record");
  return res.json();
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const DEFAULT_COLS = 8;
const DEFAULT_ROWS = 5;
const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80";

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function ImageGridOverlay() {
  // Grid / image state
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [colsInput, setColsInput] = useState(String(DEFAULT_COLS));
  const [rowsInput, setRowsInput] = useState(String(DEFAULT_ROWS));
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGE);
  const [imageInputVal, setImageInputVal] = useState("");

  // Click log / timer
  const [clickLog, setClickLog] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showLog, setShowLog] = useState(true);
  const [elapsed, setElapsed] = useState(null);
  const lastClickTime = useRef(null);
  const firstClickTime = useRef(null);
  const tickRef = useRef(null);
  const fileInputRef = useRef(null);

  // Presets
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetLoading, setPresetLoading] = useState(false);

  // Solutions
  const [solutions, setSolutions] = useState([]); // [{ id, row, col, photoUrl }]
  const [foundIds, setFoundIds] = useState(new Set());
  const [activePresetId, setActivePresetId] = useState(null);

  // Win modal
  const [showWinModal, setShowWinModal] = useState(false);
  const [winTime, setWinTime] = useState(null);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // ── Fetch presets list on mount ──
  useEffect(() => {
    setPresetsLoading(true);
    fetchPresets()
      .then((data) => { setPresets(data); setPresetsError(null); })
      .catch((e) => setPresetsError(e.message))
      .finally(() => setPresetsLoading(false));
  }, []);

  // ── Load a preset ──
  const loadPreset = async (id) => {
    if (!id) return;
    setPresetLoading(true);
    try {
      const data = await fetchPreset(id);
      setImageUrl(data.photoUrl);
      setCols(data.nbCols);
      setRows(data.nbRows);
      setColsInput(String(data.nbCols));
      setRowsInput(String(data.nbRows));
      setSolutions(data.Solutions || []);
      setFoundIds(new Set());
      setActivePresetId(data.id);
      handleClear();
    } catch (e) {
      console.error(e);
    } finally {
      setPresetLoading(false);
    }
  };

  // ── Timer helpers ──
  const stopTick = () => { if (tickRef.current) clearInterval(tickRef.current); };

  const startTick = () => {
    stopTick();
    tickRef.current = setInterval(() => {
      if (firstClickTime.current) setElapsed(Date.now() - firstClickTime.current);
    }, 50);
  };

  // ── Grid dims ──
  const applyDims = () => {
    const c = clamp(parseInt(colsInput) || 1, 1, 50);
    const r = clamp(parseInt(rowsInput) || 1, 1, 50);
    setCols(c); setRows(r);
    setColsInput(String(c)); setRowsInput(String(r));
  };

  // ── Cell click ──
  const handleCellClick = useCallback((row, col) => {
    const now = Date.now();
    const gap = lastClickTime.current ? now - lastClickTime.current : null;
    if (lastClickTime.current === null) firstClickTime.current = now;
    lastClickTime.current = now;
    startTick();

    const entry = {
      id: now, row, col,
      cell: `R${row}:C${col}`, gap,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setClickLog((prev) => [entry, ...prev].slice(0, 50));

    // Check against solutions
    setSolutions((sols) => {
      const matched = sols.find((s) => s.row === row && s.col === col);
      if (matched) {
        setFoundIds((prev) => {
          const next = new Set(prev);
          next.add(matched.id);
          // Check win condition after state update
          if (next.size === sols.length && sols.length > 0) {
            const finalTime = Date.now() - firstClickTime.current;
            stopTick();
            setElapsed(finalTime);
            setWinTime(finalTime);
            setShowWinModal(true);
          }
          return next;
        });
      }
      return sols;
    });
  }, []);

  // ── Image URL / file ──
  const handleImageUrl = () => {
    if (imageInputVal.trim()) { setImageUrl(imageInputVal.trim()); setImageInputVal(""); }
  };
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
  };

  // ── Clear ──
  const handleClear = () => {
    setClickLog([]);
    lastClickTime.current = null;
    firstClickTime.current = null;
    setElapsed(null);
    stopTick();
    setFoundIds(new Set());
    setShowWinModal(false);
    setWinTime(null);
    setUsername("");
    setSubmitted(false);
    setSubmitError(null);
  };

  // ── Submit record ──
  const handleSubmit = async () => {
    if (!username.trim() || !activePresetId || winTime === null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitRecord({ presetId: activePresetId, username: username.trim(), time: winTime });
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Formatters ──
  const formatMs = (ms) => {
    if (ms === null) return "—";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimer = (ms) => {
    if (ms === null) return "00:00.000";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  };

  const gapColor = (ms) => {
    if (ms === null) return "rgba(255,255,255,0.25)";
    if (ms < 800) return "#4ade80";
    if (ms < 2000) return "#fbbf24";
    return "#f87171";
  };

  const avgGap = (() => {
    const gaps = clickLog.map((e) => e.gap).filter((g) => g !== null);
    if (!gaps.length) return null;
    return gaps.reduce((a, b) => a + b, 0) / gaps.length;
  })();

  const fastestGap = (() => {
    const gaps = clickLog.map((e) => e.gap).filter((g) => g !== null);
    return gaps.length ? Math.min(...gaps) : null;
  })();

  // ── Cells ──
  const cells = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const key = `${r}-${c}`;
      const isHovered = hoveredCell === key;
      const isSolution = solutions.some((s) => s.row === r && s.col === c);
      const isFound = solutions.some((s) => s.row === r && s.col === c && foundIds.has(s.id));
      cells.push(
        <div
          key={key}
          className="grid-cell"
          onClick={() => handleCellClick(r, c)}
          onMouseEnter={() => setHoveredCell(key)}
          onMouseLeave={() => setHoveredCell(null)}
          style={isFound ? { background: "rgba(74,222,128,0.25)", border: "1.5px solid #4ade80" } : undefined}
        >
          {isHovered && <span className="cell-tooltip">R{r}:C{c}</span>}
        </div>
      );
    }
  }

  return (
    <div className="grid-container">
      <ControlsBar
        cols={cols} rows={rows} colsInput={colsInput} rowsInput={rowsInput}
        setColsInput={setColsInput} setRowsInput={setRowsInput} applyDims={applyDims}
        imageInputVal={imageInputVal} setImageInputVal={setImageInputVal}
        handleImageUrl={handleImageUrl} fileInputRef={fileInputRef} handleFile={handleFile}
        clickLog={clickLog} showLog={showLog} setShowLog={setShowLog} handleClear={handleClear}
        presets={presets} presetsLoading={presetsLoading} presetsError={presetsError}
        selectedPresetId={selectedPresetId} setSelectedPresetId={setSelectedPresetId}
        loadPreset={loadPreset} presetLoading={presetLoading}
      />

      {solutions.length > 0 && (
        <SolutionsStrip solutions={solutions} foundIds={foundIds} />
      )}

      <ImageGrid cols={cols} rows={rows} imageUrl={imageUrl} cells={cells} />

      <LogPanel
        clickLog={clickLog} elapsed={elapsed} avgGap={avgGap} fastestGap={fastestGap}
        showLog={showLog} formatMs={formatMs} gapColor={gapColor} formatTimer={formatTimer}
      />

      {showWinModal && (
        <WinModal
          winTime={winTime} formatTimer={formatTimer}
          username={username} setUsername={setUsername}
          onSubmit={handleSubmit} submitting={submitting}
          submitError={submitError} submitted={submitted}
          onClose={() => setShowWinModal(false)}
        />
      )}
    </div>
  );
}

// ─── CONTROLS BAR ──────────────────────────────────────────────────────────────
function ControlsBar({
  cols, rows, colsInput, rowsInput, setColsInput, setRowsInput, applyDims,
  imageInputVal, setImageInputVal, handleImageUrl, fileInputRef, handleFile,
  clickLog, showLog, setShowLog, handleClear,
  presets, presetsLoading, presetsError, selectedPresetId, setSelectedPresetId,
  loadPreset, presetLoading,
}) {
  return (
    <div className="controls-bar">
      {/* Preset selector */}
      <div className="label-group">
        <span className="control-label">preset</span>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              setSelectedPresetId(e.target.value);
              loadPreset(e.target.value);
            }}
            disabled={presetsLoading || presetLoading}
            style={{
              padding: "4px 28px 4px 8px", fontSize: 12,
              background: "rgba(255,255,255,0.07)",
              border: "0.5px solid rgba(255,255,255,0.2)",
              borderRadius: 6, color: presetsLoading ? "rgba(255,255,255,0.3)" : "#fff",
              cursor: "pointer", appearance: "none", minWidth: 140,
            }}
          >
            <option value="" style={{ background: "#111" }}>
              {presetsLoading ? "Loading…" : presetsError ? "Error loading" : "— select preset —"}
            </option>
            {presets.map((p) => (
              <option key={p.id} value={p.id} style={{ background: "#111" }}>
                {p.presetName.slice(0, 8)}… ({p.nbCols}×{p.nbRows})
              </option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 8, pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>▾</span>
        </div>
        {presetLoading && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>loading…</span>}
        {presetsError && <span style={{ fontSize: 11, color: "#f87171" }}>{presetsError}</span>}
      </div>

      <div className="divider" />

      {/* Grid dims */}
      <span className="stat-label" style={{ marginRight: 4 }}>Grid</span>
      <div className="label-group">
        <label className="control-label">cols</label>
        <input type="number" className="input-num" value={colsInput}
          onChange={(e) => setColsInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyDims()} />
        <label className="control-label">rows</label>
        <input type="number" className="input-num" value={rowsInput}
          onChange={(e) => setRowsInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyDims()} />
        <button onClick={applyDims} className="btn-primary">Apply</button>
      </div>

      <div className="divider" />

      {/* Image */}
      <div className="label-group">
        <span className="control-label">image url</span>
        <input type="text" className="input-text" placeholder="https://…"
          value={imageInputVal} onChange={(e) => setImageInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleImageUrl()} />
        <button onClick={handleImageUrl} className="btn-primary">Load</button>
        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" disabled>
          Upload
        </button>
        <button  className="btn-primary" >
          <a href="./leaderboard">View Leaderboard</a>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
          {cols} × {rows} = {cols * rows} cells
        </span>
        <button onClick={() => setShowLog((v) => !v)} className="btn-secondary" style={{ padding: "3px 10px" }}>
          {showLog ? "hide log" : "show log"}
        </button>
        {clickLog.length > 0 && (
          <button onClick={handleClear} style={{ padding: "3px 8px", fontSize: 11, background: "transparent", border: "0.5px solid rgba(255,80,80,0.3)", borderRadius: 6, color: "rgba(255,100,100,0.7)", cursor: "pointer" }}>
            clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SOLUTIONS STRIP ───────────────────────────────────────────────────────────
function SolutionsStrip({ solutions, foundIds }) {
  const found = foundIds.size;
  const total = solutions.length;
  const isAllFound = found === total;
  const progressPercent = total > 0 ? (found / total) * 100 : 0;

  return (
    <div className="solutions-strip">
      <div className="strip-header">
        <span className="strip-label">solutions</span>
        <span className={`strip-count ${isAllFound ? 'is-complete' : 'is-pending'}`}>
          {found} / {total}
        </span>
        
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${progressPercent}%`,
              background: isAllFound ? "#4ade80" : "#fbbf24" 
            }} 
          />
        </div>
      </div>

      <div className="thumbnails-list">
        {solutions.map((sol) => {
          const isFound = foundIds.has(sol.id);
          
          return (
            <div 
              key={sol.id} 
              className="solution-thumb"
              style={{
                border: `2px solid ${isFound ? "#4ade80" : "#f87171"}`,
                boxShadow: `0 0 8px ${isFound ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.3)"}`
              }}
            >
              <img 
                src={sol.photoUrl} 
                alt={`solution R${sol.row}:C${sol.col}`}
                className="thumb-img"
                style={{ filter: isFound ? "none" : "grayscale(60%) brightness(0.7)" }}
              />
              
              <div 
                className="thumb-overlay"
                style={{ background: isFound ? "rgba(74,222,128,0.7)" : "rgba(248,113,113,0.6)" }}
              />

              {isFound && <div className="check-mark">✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── IMAGE GRID ────────────────────────────────────────────────────────────────
function ImageGrid({ cols, rows, imageUrl, cells }) {
  return (
    <div className="viewport-wrapper">
      <img src={imageUrl} alt="backdrop" className="backdrop-img" draggable={false} />
      <div className="overlay-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {cells}
      </div>
    </div>
  );
}

// ─── LOG PANEL ─────────────────────────────────────────────────────────────────
function LogPanel({ clickLog, elapsed, avgGap, fastestGap, showLog, formatMs, gapColor, formatTimer }) {
  if (!showLog) return null;
  return (
    <div className="log-panel">
      <LogTimerStats elapsed={elapsed} avgGap={avgGap} fastestGap={fastestGap} formatMs={formatMs} gapColor={gapColor} clickLog={clickLog} formatTimer={formatTimer} />
      <LogLegend />
      <LogEntries clickLog={clickLog} formatMs={formatMs} gapColor={gapColor} />
    </div>
  );
}

function LogTimerStats({ elapsed, avgGap, fastestGap, formatMs, gapColor, clickLog, formatTimer }) {
  return (
    <div className="stats-row">
      {[
        { label: "total time", value: formatTimer(elapsed), color: "rgba(255,255,255,0.9)", mono: true },
        { label: "last gap", value: clickLog[0]?.gap != null ? formatMs(clickLog[0].gap) : "—", color: clickLog[0]?.gap != null ? gapColor(clickLog[0].gap) : "rgba(255,255,255,0.2)" },
        { label: "avg gap", value: avgGap != null ? formatMs(avgGap) : "—", color: avgGap != null ? gapColor(avgGap) : "rgba(255,255,255,0.2)" },
        { label: "fastest", value: fastestGap != null ? formatMs(fastestGap) : "—", color: fastestGap != null ? "#4ade80" : "rgba(255,255,255,0.2)" },
        { label: "total clicks", value: String(clickLog.length), color: "rgba(255,255,255,0.7)" },
      ].map(({ label, value, color, mono }, i, arr) => (
        <div key={label} className="stat-item">
          <div className="stat-content">
            <span className="stat-label">{label}</span>
            <span className="stat-value" style={{ color, fontFamily: mono ? "monospace" : undefined, fontSize: mono ? 18 : undefined }}>{value}</span>
          </div>
          {i < arr.length - 1 && <div style={{ width: "0.5px", height: 32, background: "rgba(255,255,255,0.1)" }} />}
        </div>
      ))}
    </div>
  );
}

function LogLegend() {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
      {[["#4ade80", "< 800ms"], ["#fbbf24", "< 2s"], ["#f87171", "≥ 2s"]].map(([color, label]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function LogEntries({ clickLog, formatMs, gapColor }) {
  return (
    <>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>click log</div>
      {clickLog.length === 0 ? (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Click any cell to start timing.</div>
      ) : (
        <div className="log-entries">
          {clickLog.map((entry, i) => (
            <div className={i === 0 ? "log-bubble latest" : "log-bubble"} key={entry.id}>
              <span style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: i === 0 ? 500 : 400 }}>{entry.cell}</span>
              {entry.gap !== null && <span style={{ color: gapColor(entry.gap), fontSize: 11 }}>+{formatMs(entry.gap)}</span>}
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{entry.time}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── WIN MODAL ─────────────────────────────────────────────────────────────────
function WinModal({ winTime, formatTimer, username, setUsername, onSubmit, submitting, submitError, submitted, onClose }) {
  const canSubmit = username.trim() && !submitting;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        <div className="modal-header">
          <div className="modal-emoji">🎉</div>
          <div className="modal-title">All solutions found!</div>
          <div className="modal-subtitle">Your time</div>
          <div className="modal-timer">{formatTimer(winTime)}</div>
        </div>

        {submitted ? (
          <div className="success-view">
            <div className="success-msg">Record saved!</div>
            <div className="success-sub">Good game, {username}.</div>
            <button onClick={onClose} className="btn-base btn-skip" style={{ marginTop: 16, padding: "8px 24px" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="input-group">
              <label className="input-label">Enter your username</label>
              <input
                type="text"
                placeholder="your name…"
                className="modal-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                autoFocus
              />
            </div>

            {submitError && <div className="error-message">{submitError}</div>}

            <div className="button-row">
              <button onClick={onClose} className="btn-base btn-skip">
                Skip
              </button>
              <button 
                onClick={onSubmit} 
                disabled={!canSubmit}
                className="btn-base btn-submit"
              >
                {submitting ? "Saving…" : "Submit record"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
import { useState, useRef, useCallback } from "react";
import "./App.css";
const DEFAULT_COLS = 8;
const DEFAULT_ROWS = 5;
const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80";

export default function ImageGridOverlay() {
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [colsInput, setColsInput] = useState(String(DEFAULT_COLS));
  const [rowsInput, setRowsInput] = useState(String(DEFAULT_ROWS));
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGE);
  const [imageInputVal, setImageInputVal] = useState("");
  const [clickLog, setClickLog] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showLog, setShowLog] = useState(true);
  const [elapsed, setElapsed] = useState(null);
  const fileInputRef = useRef(null);
  const lastClickTime = useRef(null);
  const firstClickTime = useRef(null);
  const tickRef = useRef(null);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const applyDims = () => {
    const c = clamp(parseInt(colsInput) || 1, 1, 50);
    const r = clamp(parseInt(rowsInput) || 1, 1, 50);
    setCols(c);
    setRows(r);
    setColsInput(String(c));
    setRowsInput(String(r));
  };

  const startTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (lastClickTime.current)
        setElapsed(Date.now() - firstClickTime.current);
    }, 50);
  };

  const handleCellClick = useCallback((row, col) => {
    const now = Date.now();
    const gap = lastClickTime.current ? now - lastClickTime.current : null;
    if (lastClickTime.current === null) firstClickTime.current = now;
    lastClickTime.current = now;
    //setElapsed(0);
    startTick();
    const entry = {
      id: now,
      row,
      col,
      cell: `R${row}:C${col}`,
      gap,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    setClickLog((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const handleImageUrl = () => {
    if (imageInputVal.trim()) {
      setImageUrl(imageInputVal.trim());
      setImageInputVal("");
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setClickLog([]);
    lastClickTime.current = null;
    setElapsed(null);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  const formatMs = (ms) => {
    if (ms === null) return "—";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
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

  const cells = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const key = `${r}-${c}`;
      const isHovered = hoveredCell === key;
      cells.push(
        <div
          key={key}
          className="grid-cell"
          onClick={() => handleCellClick(r, c)}
          onMouseEnter={() => setHoveredCell(key)}
          onMouseLeave={() => setHoveredCell(null)}
        >
          {isHovered && (
            <span className="cell-tooltip">
              R{r}:C{c}
            </span>
          )}
        </div>,
      );
    }
  }

  return (
    <div className="grid-container">
      {/* Controls bar */}
      <ControlsBar
        cols={cols}
        rows={rows}
        colsInput={colsInput}
        rowsInput={rowsInput}
        setColsInput={setColsInput}
        setRowsInput={setRowsInput}
        applyDims={applyDims}
        imageInputVal={imageInputVal}
        setImageInputVal={setImageInputVal}
        handleImageUrl={handleImageUrl}
        fileInputRef={fileInputRef}
        handleFile={handleFile}
        clickLog={clickLog}
        showLog={showLog}
        setShowLog={setShowLog}
        handleClear={handleClear}
      />

      {/* Image + Grid */}
      <ImageGrid cols={cols} rows={rows} imageUrl={imageUrl} cells={cells} />

      {/* Log panel */}
      <LogPanel
        clickLog={clickLog}
        elapsed={elapsed}
        avgGap={avgGap}
        fastestGap={fastestGap}
        showLog={showLog}
        formatMs={formatMs}
        gapColor={gapColor}
      />
    </div>
  );
}

function ControlsBar({
  cols,
  rows,
  colsInput,
  rowsInput,
  setColsInput,
  setRowsInput,
  applyDims,
  imageInputVal,
  setImageInputVal,
  handleImageUrl,
  fileInputRef,
  handleFile,
  clickLog,
  showLog,
  setShowLog,
  handleClear,
}) {
  return (
    <>
      <div className="controls-bar">
        <span className="stat-label" style={{ marginRight: 4 }}>
          Grid
        </span>
        <div className="label-group">
          <label className="control-label">cols</label>
          <input
            type="number"
            className="input-num"
            value={colsInput}
            onChange={(e) => setColsInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyDims()}
          />
          <label className="control-label">rows</label>
          <input
            type="number"
            className="input-num"
            value={rowsInput}
            onChange={(e) => setRowsInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyDims()}
          />
          <button onClick={applyDims} className="btn-primary">
            Apply
          </button>
        </div>

        <div className="divider" />
        <div className="label-group">
          <span className="control-label">image url</span>
          <input
            type="text"
            className="input-text"
            placeholder="https://..."
            value={imageInputVal}
            onChange={(e) => setImageInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImageUrl()}
          />
          <button onClick={handleImageUrl} className="btn-primary">
            Load
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
          >
            Upload
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {cols} × {rows} = {cols * rows} cells
          </span>
          <button
            onClick={() => setShowLog((v) => !v)}
            className="btn-secondary"
            style={{ padding: "3px 10px" }}
          >
            {showLog ? "hide log" : "show log"}
          </button>
          {clickLog.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                padding: "3px 8px",
                fontSize: 11,
                background: "transparent",
                border: "0.5px solid rgba(255,80,80,0.3)",
                borderRadius: 6,
                color: "rgba(255,100,100,0.7)",
                cursor: "pointer",
              }}
            >
              clear
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function ImageGrid({ cols, rows, imageUrl, cells }) {
  return (
    <div className="viewport-wrapper">
      <img
        src={imageUrl}
        alt="backdrop"
        className="backdrop-img"
        draggable={false}
      />
      <div
        className="overlay-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}

function LogPanel({
  clickLog,
  elapsed,
  avgGap,
  fastestGap,
  showLog,
  formatMs,
  gapColor,
}) {
  if (!showLog) return null;
  return (
    <div className="log-panel">
      {/* Timer stats */}
      <LogTimerStats
        elapsed={elapsed}
        avgGap={avgGap}
        fastestGap={fastestGap}
        formatMs={formatMs}
        gapColor={gapColor}
        clickLog={clickLog}
      />

      {/* Legend */}
      <LogLegend />

      {/* Entries */}
      <LogEntries clickLog={clickLog} formatMs={formatMs} gapColor={gapColor} />
    </div>
  );
}

function LogTimerStats({
  elapsed,
  avgGap,
  fastestGap,
  formatMs,
  gapColor,
  clickLog,
}) {
  return (
    <div className="stats-row">
      {[
        {
          label: "since last click",
          value: elapsed !== null ? formatMs(elapsed) : "—",
          color: elapsed !== null ? gapColor(elapsed) : "rgba(255,255,255,0.2)",
        },
        {
          label: "last gap",
          value: clickLog[0]?.gap != null ? formatMs(clickLog[0].gap) : "—",
          color:
            clickLog[0]?.gap != null
              ? gapColor(clickLog[0].gap)
              : "rgba(255,255,255,0.2)",
        },
        {
          label: "avg gap",
          value: avgGap != null ? formatMs(avgGap) : "—",
          color: avgGap != null ? gapColor(avgGap) : "rgba(255,255,255,0.2)",
        },
        {
          label: "fastest",
          value: fastestGap != null ? formatMs(fastestGap) : "—",
          color: fastestGap != null ? "#4ade80" : "rgba(255,255,255,0.2)",
        },
        {
          label: "total clicks",
          value: String(clickLog.length),
          color: "rgba(255,255,255,0.7)",
        },
      ].map(({ label, value, color }, i, arr) => (
        <div key={label} className="stat-item">
          <div className="stat-content">
            <span className="stat-label">{label}</span>
            <span className="stat-value" style={{ color }}>
              {value}
            </span>
          </div>
          {i < arr.length - 1 && (
            <div
              style={{
                width: "0.5px",
                height: 32,
                background: "rgba(255,255,255,0.1)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function LogLegend() {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
      {[
        ["#4ade80", "< 800ms"],
        ["#fbbf24", "< 2s"],
        ["#f87171", "≥ 2s"],
      ].map(([color, label]) => (
        <div
          key={label}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: color,
            }}
          />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LogEntries({ clickLog, formatMs, gapColor }) {
  return (
    <>
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        click log
      </div>
      {clickLog.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.2)",
            fontStyle: "italic",
          }}
        >
          Click any cell to start timing.
        </div>
      ) : (
        <div className="log-entries">
          {clickLog.map((entry, i) => (
            <div
              className={i === 0 ? "log-bubble latest" : "log-bubble"}
              key={entry.id}
            >
              <span
                style={{
                  color: i === 0 ? "#fff" : "rgba(255,255,255,0.6)",
                  fontWeight: i === 0 ? 500 : 400,
                }}
              >
                {entry.cell}
              </span>
              {entry.gap !== null && (
                <span style={{ color: gapColor(entry.gap), fontSize: 11 }}>
                  +{formatMs(entry.gap)}
                </span>
              )}
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

import { useState, useRef, useCallback } from "react";

const DEFAULT_COLS = 8;
const DEFAULT_ROWS = 5;

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80";

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
  const fileInputRef = useRef(null);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const applyDims = () => {
    const c = clamp(parseInt(colsInput) || 1, 1, 50);
    const r = clamp(parseInt(rowsInput) || 1, 1, 50);
    setCols(c);
    setRows(r);
    setColsInput(String(c));
    setRowsInput(String(r));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") applyDims();
  };

  const handleCellClick = useCallback((row, col) => {
    const entry = {
      id: Date.now(),
      row,
      col,
      cell: `R${row}:C${col}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
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
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const cells = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const key = `${r}-${c}`;
      const isHovered = hoveredCell === key;
      cells.push(
        <div
          key={key}
          onClick={() => handleCellClick(r, c)}
          onMouseEnter={() => setHoveredCell(key)}
          onMouseLeave={() => setHoveredCell(null)}
          style={{
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.35)",
            cursor: "crosshair",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isHovered ? "rgba(255,255,255,0.18)" : "transparent",
            transition: "background 0.1s",
            position: "relative",
          }}
        >
          {isHovered && (
            <span style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#fff",
              background: "rgba(0,0,0,0.55)",
              padding: "2px 6px",
              borderRadius: 4,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              letterSpacing: "0.03em",
            }}>
              R{r}:C{c}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div style={{ fontFamily: "var(--font-sans, 'Courier New', monospace)", minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>

      {/* Controls bar */}
      <div style={{
        position: "relative",
        zIndex: 10,
        background: "rgba(10,10,10,0.92)",
        borderBottom: "0.5px solid rgba(255,255,255,0.12)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 4 }}>Grid</span>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>cols</label>
          <input
            type="number" min={1} max={50}
            value={colsInput}
            onChange={e => setColsInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ width: 52, padding: "4px 6px", fontSize: 13, background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff", textAlign: "center" }}
          />
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>rows</label>
          <input
            type="number" min={1} max={50}
            value={rowsInput}
            onChange={e => setRowsInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ width: 52, padding: "4px 6px", fontSize: 13, background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff", textAlign: "center" }}
          />
          <button onClick={applyDims} style={{ padding: "4px 12px", fontSize: 12, fontWeight: 500, background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "#fff", cursor: "pointer", letterSpacing: "0.04em" }}>
            Apply
          </button>
        </div>

        <div style={{ width: "0.5px", height: 24, background: "rgba(255,255,255,0.15)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>image url</span>
          <input
            type="text"
            placeholder="https://..."
            value={imageInputVal}
            onChange={e => setImageInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleImageUrl()}
            style={{ width: 200, padding: "4px 8px", fontSize: 12, background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 6, color: "#fff" }}
          />
          <button onClick={handleImageUrl} style={{ padding: "4px 10px", fontSize: 12, background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "#fff", cursor: "pointer" }}>Load</button>
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: "4px 10px", fontSize: 12, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.18)", borderRadius: 6, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            Upload
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
            {cols} × {rows} = {cols * rows} cells
          </span>
          <button onClick={() => setShowLog(v => !v)} style={{ padding: "3px 10px", fontSize: 11, background: "transparent", border: "0.5px solid rgba(255,255,255,0.18)", borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            {showLog ? "hide log" : "show log"}
          </button>
          {clickLog.length > 0 && (
            <button onClick={() => setClickLog([])} style={{ padding: "3px 8px", fontSize: 11, background: "transparent", border: "0.5px solid rgba(255,80,80,0.3)", borderRadius: 6, color: "rgba(255,100,100,0.7)", cursor: "pointer" }}>
              clear
            </button>
          )}
        </div>
      </div>

      {/* Image + Grid */}
      <div style={{ position: "relative", width: "100%", flex: 1 }}>
        <img
          src={imageUrl}
          alt="backdrop"
          style={{ display: "block", width: "100%", height: "auto", minHeight: 300, objectFit: "cover", userSelect: "none" }}
          draggable={false}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {cells}
        </div>
      </div>

      {/* Click log */}
      {showLog && (
        <div style={{
          background: "rgba(10,10,10,0.95)",
          borderTop: "0.5px solid rgba(255,255,255,0.1)",
          padding: "10px 16px",
          maxHeight: 180,
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            click log {clickLog.length > 0 && `— ${clickLog.length} event${clickLog.length !== 1 ? "s" : ""}`}
          </div>
          {clickLog.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Click any cell to record it here.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px" }}>
              {clickLog.map((entry, i) => (
                <div key={entry.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: i === 0 ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)",
                  border: i === 0 ? "0.5px solid rgba(255,255,255,0.2)" : "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  <span style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: i === 0 ? 500 : 400 }}>{entry.cell}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{entry.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
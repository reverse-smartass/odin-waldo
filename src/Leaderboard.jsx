import "./Leaderboard.css";
import { useState, useEffect, useCallback } from "react";

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:3001/api"; // ← same as your main app

async function fetchRecords() {
  const res = await fetch(`${API_BASE}/records`);
  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json();
  // expected: [{ id, username, time, presetId, createdAt }]
  // sorted by time asc on the server ideally, but we sort client-side too
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

const MEDALS = {
  1: { label: "GOLD", color: "#FFD700", dim: "#7a6200" },
  2: { label: "SILVER", color: "#C0C0C0", dim: "#5a5a5a" },
  3: { label: "BRONZE", color: "#CD7F32", dim: "#5e3b17" },
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [highlightId, setHighlightId] = useState(null); // animate new record in

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchRecords()
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.time - b.time);
        setRecords(sorted);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Filtered list — rank is always position in time-sorted list
  const filtered = records.filter((r) =>
    r.username?.toLowerCase().includes(search.toLowerCase()),
  );

  const top3 = records.slice(0, 3);

  return (
    <div className="leaderboard-root">
      <div className="scanlines" />

      <div className="leaderboard-container">
        <div className="header-section">
          <button className="btn-primary">
            <a href="./">Back to Game</a>
          </button>
          <p className="section-label">global rankings</p>
          <h1 className="leaderboard-title">LEADERBOARD</h1>
          <div className="title-separator" />
        </div>

        {!loading && top3.length > 0 && (
          <div className="podium-wrapper">
            {[top3[1], top3[0], top3[2]].map((rec, podiumIdx) => {
              const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const medal = MEDALS[rank];
              const barHeights = [80, 108, 60];
              if (!rec) return <div key={podiumIdx} style={{ flex: 1 }} />;

              return (
                <div
                  key={rec.id}
                  className="podium-col"
                  style={{
                    "--medal-color": medal.color,
                    "--medal-dim": medal.dim,
                    "--border-color": `${medal.dim}44`,
                  }}
                >
                  <span className="podium-medal-label">{medal.label}</span>
                  <span className="podium-name">{rec.username}</span>
                  <span className="podium-time">{formatTime(rec.time)}</span>
                  <div
                    className="podium-bar"
                    style={{ height: barHeights[podiumIdx] }}
                  >
                    {rank}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="controls-row">
          <div className="search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="search player…"
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={refresh} className="refresh-btn">
            ↺
          </button>
        </div>

        <div className="list-header">
          {["#", "player", "time"].map((h, i) => (
            <span
              key={i}
              className={`header-cell ${i === 2 ? "align-right" : ""}`}
            >
              {h}
            </span>
          ))}
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div
              className="status-box"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              LOADING…
            </div>
          ) : error ? (
            <div className="status-box" style={{ color: "#f87171" }}>
              {error}
            </div>
          ) : (
            filtered.map((rec) => {
              const rank = records.findIndex((r) => r.id === rec.id) + 1;
              return (
                <Row
                  key={rec.id}
                  rec={rec}
                  rank={rank}
                  medal={MEDALS[rank]}
                  isTop={rank <= 3}
                />
              );
            })
          )}
        </div>

        {!loading && !error && (
          <p className="footer-count">
            {filtered.length} of {records.length} record
            {records.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ rec, rank, medal, isTop }) {
  const [hovered, setHovered] = useState(false);

  // We keep the dynamic background logic here since it relies on React state (hovered)
  const rowStyle = {
    background: hovered
      ? "rgba(255,255,255,0.04)"
      : isTop
        ? "rgba(255,255,255,0.012)"
        : "transparent",
  };

  return (
    <div
      className="row-container"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={rowStyle}
    >
      <div className="row-rank">
        {medal && (
          <span className="rank-symbol" style={{ color: medal.color }}>
            ◆
          </span>
        )}
        <span
          className="rank-num"
          style={{
            fontSize: isTop ? 15 : 13,
            fontWeight: isTop ? 700 : 400,
            color: medal ? medal.color : "rgba(255,255,255,0.25)",
          }}
        >
          {rank}
        </span>
      </div>

      <span
        className="row-user"
        style={{
          fontWeight: isTop ? 600 : 400,
          color: isTop ? "#fff" : "rgba(255,255,255,0.7)",
        }}
      >
        {rec.username}
      </span>

      <span
        className="row-time"
        style={{
          color: medal ? medal.color : "rgba(255,255,255,0.45)",
          fontWeight: isTop ? 600 : 400,
        }}
      >
        {formatTime(rec.time)}
      </span>
    </div>
  );
}

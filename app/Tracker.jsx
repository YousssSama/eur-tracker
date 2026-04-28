"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  CURRENCIES,
  PERIODS,
  formatDate,
  formatAxisDate,
  formatRate,
  formatEur,
  fetchHistory,
  fetchLatest,
} from "./utils";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────
// Custom tooltip for the chart
// ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: 8,
        padding: "10px 16px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 4 }}>
        {formatDate(label)}
      </div>
      <div style={{ color: "#f0c040", fontSize: 16, fontWeight: 700 }}>
        {formatRate(payload[0].value, currency)}{" "}
        <span style={{ fontSize: 11, color: "#8b949e" }}>{currency}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Currency selector (top tabs)
// ─────────────────────────────────────────────────────────────
function CurrencySelector({ currency, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 4,
        gap: 4,
      }}
    >
      {Object.values(CURRENCIES).map((c) => {
        const active = currency === c.code;
        return (
          <button
            key={c.code}
            onClick={() => onChange(c.code)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: active ? "#f0c040" : "transparent",
              color: active ? "#0d1117" : "#8b949e",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: "all 0.15s",
              letterSpacing: 0.5,
            }}
          >
            {c.code}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bidirectional converter
// ─────────────────────────────────────────────────────────────
function Converter({ rate, currency }) {
  const [eurAmount, setEurAmount] = useState("100");
  const [foreignAmount, setForeignAmount] = useState("");
  const [activeField, setActiveField] = useState("eur");

  // Recompute when rate, currency, or active value changes
  useEffect(() => {
    if (!rate) return;
    if (activeField === "eur") {
      const n = parseFloat(eurAmount.replace(",", "."));
      if (!isNaN(n)) {
        setForeignAmount(formatRate(n * rate, currency));
      } else {
        setForeignAmount("");
      }
    } else {
      const n = parseFloat(foreignAmount.replace(/\s/g, "").replace(",", "."));
      if (!isNaN(n)) {
        setEurAmount((n / rate).toFixed(2).replace(".", ","));
      } else {
        setEurAmount("");
      }
    }
  }, [rate, currency, eurAmount, foreignAmount, activeField]);

  const cfg = CURRENCIES[currency];

  const inputStyle = {
    width: "100%",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 8,
    padding: "12px 14px",
    color: "#f0f6fc",
    fontSize: 18,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  };

  const labelStyle = {
    fontSize: 11,
    color: "#8b949e",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#8b949e",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Convertisseur
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <div style={labelStyle}>EUR</div>
          <input
            type="text"
            inputMode="decimal"
            value={eurAmount}
            onFocus={() => setActiveField("eur")}
            onChange={(e) => {
              setActiveField("eur");
              setEurAmount(e.target.value);
            }}
            style={inputStyle}
            placeholder="0,00"
          />
        </div>

        <div
          style={{
            color: "#484f58",
            fontSize: 18,
            paddingBottom: 14,
            userSelect: "none",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          =
        </div>

        <div>
          <div style={labelStyle}>{currency}</div>
          <input
            type="text"
            inputMode="decimal"
            value={foreignAmount}
            onFocus={() => setActiveField("foreign")}
            onChange={(e) => {
              setActiveField("foreign");
              setForeignAmount(e.target.value);
            }}
            style={inputStyle}
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#484f58", marginTop: 12 }}>
        Taux appliqué : 1 EUR = {formatRate(rate, currency)} {currency}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main tracker
// ─────────────────────────────────────────────────────────────
export default function Tracker() {
  const [currency, setCurrency] = useState("IDR");
  const [period, setPeriod] = useState(PERIODS[1]);
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Loader: fetch both history and latest live rate
  const loadData = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      setError(null);
      try {
        const [history, latest] = await Promise.all([
          fetchHistory(currency, period.days),
          fetchLatest(currency),
        ]);
        setData(history);
        setCurrent(latest);
        setLastUpdate(new Date());
      } catch (e) {
        setError("Impossible de charger les données. Réessayez dans un instant.");
      } finally {
        setLoading(false);
      }
    },
    [currency, period]
  );

  // Initial load + reload on change of currency/period
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Auto-refresh every 5 minutes (silent)
  useEffect(() => {
    const id = setInterval(() => loadData(false), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [loadData]);

  // Refresh on tab focus (returning to the page)
  useEffect(() => {
    const onFocus = () => loadData(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  // Derived stats
  const stats = useMemo(() => {
    const rates = data.map((d) => d.rate);
    if (!rates.length) return null;
    const max = Math.max(...rates);
    const min = Math.min(...rates);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return {
      max,
      min,
      avg,
      maxDate: data.find((d) => d.rate === max)?.date,
      minDate: data.find((d) => d.rate === min)?.date,
    };
  }, [data]);

  const isGoodTime = current && stats && current > stats.avg * 1.002;
  const isBadTime = current && stats && current < stats.avg * 0.998;
  const pctVsAvg = current && stats ? ((current - stats.avg) / stats.avg) * 100 : null;

  // Thin out chart data for readability
  const displayData = useMemo(() => {
    if (data.length <= 60) return data;
    const step = Math.floor(data.length / 60);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [data]);

  const yDomain = useMemo(() => {
    if (!data.length) return ["auto", "auto"];
    const rates = data.map((d) => d.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    return [min * 0.998, max * 1.002];
  }, [data]);

  const cfg = CURRENCIES[currency];
  const lastUpdateText = lastUpdate
    ? lastUpdate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#e6edf3",
        fontFamily: "'IBM Plex Sans', sans-serif",
        padding: "32px 20px",
        maxWidth: 880,
        margin: "0 auto",
      }}
    >
      {/* ─── Header ─── */}
      <header
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #f0c040, #e07020)",
                borderRadius: 6,
                width: 10,
                height: 10,
              }}
            />
            <span
              style={{
                fontSize: 11,
                letterSpacing: 3,
                color: "#8b949e",
                textTransform: "uppercase",
              }}
            >
              Suivi de change · Live
            </span>
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 700,
              margin: 0,
              letterSpacing: -1,
              color: "#f0f6fc",
            }}
          >
            Euro → {cfg.name}
          </h1>
          <p style={{ color: "#8b949e", margin: "6px 0 0", fontSize: 13 }}>
            Données BCE via Frankfurter · auto-refresh toutes les 5 min
          </p>
        </div>

        <CurrencySelector currency={currency} onChange={setCurrency} />
      </header>

      {/* ─── Hero + Signal ─── */}
      <section
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 16,
          padding: "28px 32px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            style={{
              fontSize: 12,
              color: "#8b949e",
              marginBottom: 6,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Taux actuel · 1 EUR =
          </div>
          {loading && !current ? (
            <div
              style={{
                color: "#30363d",
                fontSize: 36,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Chargement…
            </div>
          ) : error && !current ? (
            <div style={{ color: "#f85149", fontSize: 15 }}>{error}</div>
          ) : (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#f0c040",
                  fontFamily: "'IBM Plex Mono', monospace",
                  lineHeight: 1,
                }}
              >
                {formatRate(current, currency)}
              </span>
              <span
                style={{ fontSize: 20, color: "#8b949e", fontWeight: 300 }}
              >
                {currency}
              </span>
            </div>
          )}

          {pctVsAvg !== null && !loading && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color:
                  pctVsAvg > 0.2
                    ? "#3fb950"
                    : pctVsAvg < -0.2
                    ? "#f85149"
                    : "#8b949e",
              }}
            >
              {pctVsAvg > 0 ? "▲" : "▼"} {Math.abs(pctVsAvg).toFixed(2)}% vs
              moyenne {period.label}
            </div>
          )}

          {lastUpdateText && (
            <div style={{ fontSize: 11, color: "#484f58", marginTop: 6 }}>
              Mis à jour à {lastUpdateText}
            </div>
          )}
        </div>

        {!loading && !error && current && stats && (
          <div
            style={{
              background: isGoodTime
                ? "#0f3320"
                : isBadTime
                ? "#3d0f0f"
                : "#1c2128",
              border: `1px solid ${
                isGoodTime ? "#3fb950" : isBadTime ? "#f85149" : "#30363d"
              }`,
              borderRadius: 12,
              padding: "18px 24px",
              minWidth: 220,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: isGoodTime
                  ? "#3fb950"
                  : isBadTime
                  ? "#f85149"
                  : "#8b949e",
                marginBottom: 6,
              }}
            >
              Signal
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isGoodTime
                  ? "#3fb950"
                  : isBadTime
                  ? "#f85149"
                  : "#8b949e",
              }}
            >
              {isGoodTime
                ? "Bon moment pour échanger"
                : isBadTime
                ? "Moment défavorable"
                : "Pas de signal clair"}
            </div>
            <div style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>
              {isGoodTime
                ? "L'euro est fort en ce moment"
                : isBadTime
                ? "Attendez un rebond si possible"
                : "Pas de tendance marquée"}
            </div>
          </div>
        )}
      </section>

      {/* ─── Converter ─── */}
      {current && <Converter rate={current} currency={currency} />}

      {/* ─── Stats ─── */}
      {stats && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "Plus haut",
              value: formatRate(stats.max, currency),
              sub: stats.maxDate ? formatDate(stats.maxDate) : "",
              color: "#3fb950",
            },
            {
              label: "Plus bas",
              value: formatRate(stats.min, currency),
              sub: stats.minDate ? formatDate(stats.minDate) : "",
              color: "#f85149",
            },
            {
              label: "Moyenne",
              value: formatRate(stats.avg, currency),
              sub: `sur ${period.label}`,
              color: "#8b949e",
            },
            {
              label: "Variation",
              value: `${(((stats.max - stats.min) / stats.min) * 100).toFixed(
                1
              )}%`,
              sub: "max − min",
              color: "#f0c040",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#8b949e",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {s.value}
              </div>
              <div
                style={{ fontSize: 11, color: "#484f58", marginTop: 2 }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Period selector ─── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setPeriod(p)}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: `1px solid ${
                period.days === p.days ? "#f0c040" : "#30363d"
              }`,
              background:
                period.days === p.days ? "#f0c04015" : "transparent",
              color: period.days === p.days ? "#f0c040" : "#8b949e",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ─── Chart ─── */}
      <div
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 16,
          padding: "24px 16px 8px",
        }}
      >
        {loading && !data.length && (
          <div
            style={{
              textAlign: "center",
              color: "#8b949e",
              padding: 60,
              fontSize: 14,
            }}
          >
            Chargement des données…
          </div>
        )}
        {error && !data.length && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ color: "#f85149", fontSize: 14, marginBottom: 12 }}>
              {error}
            </div>
            <button
              onClick={() => loadData(true)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "1px solid #f85149",
                background: "transparent",
                color: "#f85149",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Réessayer
            </button>
          </div>
        )}
        {data.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={displayData}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatAxisDate(v, period.days)}
                tick={{
                  fill: "#8b949e",
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                axisLine={{ stroke: "#30363d" }}
                tickLine={false}
                minTickGap={48}
                tickMargin={8}
              />
              <YAxis
                domain={yDomain}
                tickFormatter={(v) =>
                  cfg.decimals > 0 ? v.toFixed(2) : (v / 1000).toFixed(1) + "k"
                }
                tick={{
                  fill: "#8b949e",
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              {stats?.avg && (
                <ReferenceLine
                  y={stats.avg}
                  stroke="#8b949e"
                  strokeDasharray="4 4"
                  label={{
                    value: "moy.",
                    fill: "#8b949e",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#f0c040"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#f0c040",
                  stroke: "#0d1117",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 20px",
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 12,
          fontSize: 13,
          color: "#8b949e",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#e6edf3" }}>Conseil —</strong> plus le taux
        est élevé, plus l'euro est fort face au {cfg.name.toLowerCase()} —
        c'est le moment d'échanger. Comparez le taux actuel au{" "}
        <em>plus haut</em> de la période pour évaluer le bon moment.
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 11,
          color: "#484f58",
        }}
      >
        Source : api.frankfurter.app (BCE) · Mis à jour chaque jour ouvré
      </div>
    </main>
  );
}

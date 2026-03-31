import { useState, useEffect, useRef, useCallback } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "⚡" },
  { id: "engines", label: "Any Engine", icon: "🔧" },
  { id: "learn", label: "How It Learns", icon: "🧠" },
  { id: "safety", label: "Safety", icon: "🔒" },
  { id: "pipeline", label: "The Process", icon: "⛓" },
  { id: "training", label: "Training", icon: "🎯" },
  { id: "savings", label: "ROI", icon: "💰" },
];

const ENGINE_PROFILES = [
  {
    id: "vtwin", name: "Harley V-Twin", tagline: "Where DynoAI was born",
    icon: "🏍️", color: "#ff3b4e",
    specs: "Air-cooled, 2-cylinder, 45° V-twin",
    challenges: "Heat soak shifts AFR between cylinders. Air-cooled motors change tune with ambient temp. Aftermarket cams and pipes create huge variation bike to bike.",
    benefit: "DynoAI models both cylinders independently and compensates for heat soak in real time. Handles the massive variety of cam/exhaust/intake combos without a canned map for each one.",
    examples: "96ci stock, 107ci big bore, 114ci/117ci M8, 124ci+ strokers, turbo builds",
    pulls: { trad: 25, ai: 6 }, time: { trad: "3–4 hrs", ai: "~45 min" },
  },
  {
    id: "diesel", name: "Turbo Diesel", tagline: "Big boost, big tables, big opportunity",
    icon: "🚛", color: "#00d4ff",
    specs: "Turbocharged compression-ignition, 4-8+ cylinders",
    challenges: "Massive fuel tables with hundreds of cells. Boost-dependent fueling adds a whole extra dimension. Injection timing, rail pressure, and boost targets all interact. EGT management is critical at high power.",
    benefit: "DynoAI maps the boost/RPM/load matrix simultaneously instead of one axis at a time. Catches dangerous EGT trends before they become problems. Handles huge table sizes that make hand-tuning an all-day job.",
    examples: "Duramax, Cummins, Power Stroke, compound turbo builds, sled pullers, drag trucks",
    pulls: { trad: 40, ai: 10 }, time: { trad: "6–10 hrs", ai: "~90 min" },
  },
  {
    id: "sport", name: "Sport / Moto", tagline: "High-RPM precision across the whole map",
    icon: "🏎️", color: "#b44dff",
    specs: "High-revving multi-cylinder, fuel-injected",
    challenges: "Wide RPM range means more cells. Quick-revving engines give less data per zone per pull. Factory ECUs are complex with multiple fuel and ignition maps by gear, throttle rate, and mode.",
    benefit: "DynoAI extracts more usable data from each pull and fills gaps with its prediction model. Handles multi-map ECUs and can optimize across different riding modes.",
    examples: "Inline-4 sportbikes, V4 superbikes, high-performance singles, supercharged builds",
    pulls: { trad: 20, ai: 5 }, time: { trad: "2–3 hrs", ai: "~35 min" },
  },
  {
    id: "automotive", name: "Cars & Trucks", tagline: "LS swaps to Hellcats to turbo 4-bangers",
    icon: "🏁", color: "#ffb020",
    specs: "Gasoline, forced induction or NA, standalone or factory ECU",
    challenges: "Huge variety of platforms. Standalone ECUs like Holley, FiTech, and MegaSquirt each have different table layouts. Forced induction adds boost-referenced fuel and timing tables.",
    benefit: "DynoAI adapts to whatever table structure the ECU uses. Learns the engine's response to boost, load, and RPM regardless of the platform. Same safety limits — can't write lean under boost.",
    examples: "LS/LT swaps, Coyotes, EcoBoost, turbo Hondas, standalone EFI conversions",
    pulls: { trad: 30, ai: 8 }, time: { trad: "4–6 hrs", ai: "~60 min" },
  },
  {
    id: "powersports", name: "UTV / Sled", tagline: "Side-by-sides, sleds, and everything with an ECU",
    icon: "🏔️", color: "#34d399",
    specs: "Various configs, often turbo or supercharged",
    challenges: "Altitude changes dramatically affect forced-induction. A sled tuned at sea level runs dangerously lean at 8,000 feet. UTVs see extreme load variation.",
    benefit: "DynoAI's altitude and temp compensation is built in from sensor data. Models the engine across the full load range. Catches part-throttle lean spots that cause detonation on trail.",
    examples: "Polaris RZR, Can-Am X3, turbo sleds, PWC, sport quads",
    pulls: { trad: 20, ai: 5 }, time: { trad: "2–3 hrs", ai: "~40 min" },
  },
];

/* ─── Fade-in wrapper ─── */
function FadeIn({ children, delay = 0 }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    }}>{children}</div>
  );
}

/* ─── Glow card ─── */
function GlowCard({ children, color = "#ff3b4e", style = {}, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
        borderRadius: 14,
        border: `1px solid ${hovered ? color + "50" : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered ? `0 0 30px ${color}15, inset 0 1px 0 rgba(255,255,255,0.05)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "all 0.4s ease",
        ...style,
      }}
    >{children}</div>
  );
}

/* ─── Styled range slider ─── */
function Slider({ value, onChange, min, max, step = 1, color = "#ff3b4e" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: "relative", padding: "8px 0" }}>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 3, transition: "width 0.1s" }} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
      <div style={{
        position: "absolute", top: 2, left: `calc(${pct}% - 9px)`,
        width: 18, height: 18, borderRadius: "50%",
        background: color, boxShadow: `0 0 12px ${color}60`,
        border: "2px solid rgba(255,255,255,0.2)",
        transition: "left 0.1s", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─── Stat pill ─── */
function StatPill({ value, label, sub, color }) {
  return (
    <GlowCard color={color} style={{ padding: "20px 14px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color, fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600, marginTop: 6, letterSpacing: 0.5 }}>{label}</div>
      {sub && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 3 }}>{sub}</div>}
    </GlowCard>
  );
}

/* ═══════════════════ LEARN CHART ═══════════════════ */
function LearnChart() {
  const [pulls, setPulls] = useState(3);
  const [showPred, setShowPred] = useState(false);
  const [engType, setEngType] = useState("vtwin");

  const curves = {
    vtwin: [
      {rpm:2000,tq:55},{rpm:2250,tq:62},{rpm:2500,tq:68},{rpm:2750,tq:76},{rpm:3000,tq:82},
      {rpm:3250,tq:87},{rpm:3500,tq:91},{rpm:3750,tq:94},{rpm:4000,tq:96},{rpm:4250,tq:98},
      {rpm:4500,tq:99},{rpm:4750,tq:97.5},{rpm:5000,tq:95},{rpm:5250,tq:91},{rpm:5500,tq:88},
      {rpm:5750,tq:82},{rpm:6000,tq:74},
    ],
    diesel: [
      {rpm:1200,tq:320},{rpm:1500,tq:480},{rpm:1800,tq:620},{rpm:2000,tq:720},{rpm:2200,tq:790},
      {rpm:2500,tq:830},{rpm:2800,tq:810},{rpm:3000,tq:760},{rpm:3200,tq:690},{rpm:3500,tq:580},
      {rpm:3800,tq:460},{rpm:4000,tq:380},
    ],
    sport: [
      {rpm:4000,tq:32},{rpm:5000,tq:41},{rpm:6000,tq:49},{rpm:7000,tq:56},{rpm:8000,tq:62},
      {rpm:9000,tq:67},{rpm:10000,tq:70},{rpm:11000,tq:71},{rpm:12000,tq:69},{rpm:13000,tq:64},{rpm:14000,tq:55},
    ],
  };
  const typeColors = { vtwin: "#ff3b4e", diesel: "#00d4ff", sport: "#b44dff" };
  const typeLabels = { vtwin: "V-Twin", diesel: "Turbo Diesel", sport: "Sport Bike" };

  const data = curves[engType] || curves.vtwin;
  const rng = [data[0].rpm, data[data.length-1].rpm];
  const tqMin = Math.floor(Math.min(...data.map(p=>p.tq))*0.7);
  const tqMax = Math.ceil(Math.max(...data.map(p=>p.tq))*1.1);

  const samples = [];
  const s = Math.max(1, Math.floor(data.length / (pulls + 2)));
  for (let i = 0; i < data.length && samples.length < pulls + 2; i += s) samples.push(data[i]);

  const band = (tqMax - tqMin) * (0.08 - pulls * 0.012);
  const upper = data.map(p => ({...p, tq: p.tq + band}));
  const lower = data.map(p => ({...p, tq: p.tq - band}));

  const toX = rpm => ((rpm - rng[0]) / (rng[1] - rng[0])) * 430 + 55;
  const toY = tq => 215 - ((tq - tqMin) / (tqMax - tqMin)) * 175;

  const smooth = pts => {
    if (pts.length < 3) return pts.map((p,i) => `${i===0?"M":"L"}${toX(p.rpm)},${toY(p.tq)}`).join(" ");
    let d = `M${toX(pts[0].rpm)},${toY(pts[0].tq)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const x0 = toX(pts[i-1].rpm), y0 = toY(pts[i-1].tq);
      const x1 = toX(pts[i].rpm), y1 = toY(pts[i].tq);
      const x2 = toX(pts[i+1].rpm), y2 = toY(pts[i+1].tq);
      const cp1x = x0 + (x1-x0)*0.5, cp2x = x1 - (x2-x0)*0.15;
      d += ` C${cp1x},${y0} ${cp2x},${y1} ${x1},${y1}`;
    }
    const last = pts[pts.length-1];
    const prev = pts[pts.length-2];
    d += ` C${toX(prev.rpm)+(toX(last.rpm)-toX(prev.rpm))*0.5},${toY(prev.tq)} ${toX(last.rpm)},${toY(last.tq)} ${toX(last.rpm)},${toY(last.tq)}`;
    return d;
  };

  const pathD = smooth(data);
  const areaD = smooth(upper) + " L" + [...lower].reverse().map(p => `${toX(p.rpm)},${toY(p.tq)}`).join(" L") + " Z";
  const col = typeColors[engType];

  const rpmTicks = Array.from({length:5}, (_,i) => Math.round(rng[0] + (rng[1]-rng[0])*(i/4)));
  const tqTicks = Array.from({length:5}, (_,i) => Math.round(tqMin + (tqMax-tqMin)*(i/4)));

  return (
    <GlowCard color={col} style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {Object.keys(curves).map(t => (
          <button key={t} onClick={() => { setEngType(t); setShowPred(false); }}
            style={{
              padding: "7px 16px", borderRadius: 20, border: "none",
              background: engType === t ? typeColors[t] : "rgba(255,255,255,0.06)",
              color: engType === t ? "#fff" : "rgba(255,255,255,0.4)",
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.3s", letterSpacing: 0.5,
              boxShadow: engType === t ? `0 0 16px ${typeColors[t]}40` : "none",
            }}>
            {typeLabels[t]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Dyno Pulls</span>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => { setPulls(n); setShowPred(false); }}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: pulls === n ? `2px solid ${col}` : "2px solid rgba(255,255,255,0.08)",
                  background: pulls === n ? `${col}20` : "rgba(255,255,255,0.03)",
                  color: pulls === n ? col : "rgba(255,255,255,0.3)",
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16,
                  cursor: "pointer", transition: "all 0.25s",
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowPred(!showPred)}
          style={{
            padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
            background: showPred ? col : `linear-gradient(135deg, ${col}, ${col}bb)`,
            color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14,
            letterSpacing: 0.5, transition: "all 0.3s",
            boxShadow: `0 4px 20px ${col}30`,
          }}>
          {showPred ? "HIDE" : "SHOW"} PREDICTION
        </button>
      </div>

      <svg viewBox="0 0 520 255" style={{ width: "100%", maxHeight: 300 }}>
        <defs>
          <linearGradient id={`grad-${engType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.15" />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        {rpmTicks.map(rpm => (
          <g key={rpm}>
            <line x1={toX(rpm)} y1={28} x2={toX(rpm)} y2={225} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={toX(rpm)} y={245} fill="rgba(255,255,255,0.25)" fontSize={10} textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif">{rpm.toLocaleString()}</text>
          </g>
        ))}
        {tqTicks.map(tq => (
          <g key={tq}>
            <line x1={45} y1={toY(tq)} x2={495} y2={toY(tq)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={40} y={toY(tq)+4} fill="rgba(255,255,255,0.25)" fontSize={10} textAnchor="end" fontFamily="'Barlow Condensed', sans-serif">{tq}</text>
          </g>
        ))}
        <text x={270} y={14} fill="rgba(255,255,255,0.3)" fontSize={11} textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight={600} letterSpacing={2}>
          TORQUE vs RPM — {typeLabels[engType].toUpperCase()}
        </text>

        {showPred && <path d={areaD} fill={col} opacity={0.06} />}
        {showPred && <path d={pathD} fill="none" stroke={col} strokeWidth={2.5} opacity={0.85} filter="url(#glow)" strokeLinecap="round" />}

        {samples.map((p, i) => (
          <g key={i}>
            <circle cx={toX(p.rpm)} cy={toY(p.tq)} r={7} fill="transparent" stroke="#00d4ff" strokeWidth={2} opacity={0.8} />
            <circle cx={toX(p.rpm)} cy={toY(p.tq)} r={3} fill="#00d4ff" />
            <circle cx={toX(p.rpm)} cy={toY(p.tq)} r={14} fill="#00d4ff" opacity={0.08}>
              <animate attributeName="r" from="7" to="20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.12" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>

      <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff60" }} />
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Your Data ({samples.length} pts)</span>
        </div>
        {showPred && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 18, height: 3, background: col, borderRadius: 2, boxShadow: `0 0 6px ${col}60` }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>DynoAI Prediction</span>
          </div>
        )}
      </div>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 12, lineHeight: 1.7 }}>
        {showPred
          ? `From ${samples.length} pulls, DynoAI predicts the full curve — including every spot between your measured points. The shaded band is the confidence zone. More pulls = tighter confidence. Switch engine types to see how the system adapts.`
          : "Pick an engine type and pull count, then hit SHOW PREDICTION to see how DynoAI fills in the complete picture from limited data."}
      </p>
    </GlowCard>
  );
}

/* ═══════════════════ SAFETY DEMO ═══════════════════ */
function SafetyDemo() {
  const [afr, setAfr] = useState(13.2);
  const [rpm, setRpm] = useState(3500);
  const target = 13.0;
  const error = afr - target;
  const correction = -(0.42*error + 0.15*error*0.5 + 0.08*Math.sign(error)*error*error);
  const correctedAfr = afr + correction;
  const veAdj = (correction / afr) * 100;

  const status = afr > 14.0 ? { label: "DANGER — TOO LEAN", color: "#ff3b4e", glow: "#ff3b4e40" }
    : afr > 13.5 ? { label: "RUNNING LEAN", color: "#ffb020", glow: "#ffb02040" }
    : afr < 12.0 ? { label: "DANGER — WAY TOO RICH", color: "#ff3b4e", glow: "#ff3b4e40" }
    : afr < 12.5 ? { label: "RUNNING RICH", color: "#ffb020", glow: "#ffb02040" }
    : { label: "ON TARGET ✓", color: "#34d399", glow: "#34d39940" };

  return (
    <GlowCard color={status.color} style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            Wideband AFR <span style={{ color: status.color, fontWeight: 800, fontSize: 18, marginLeft: 8 }}>{afr.toFixed(1)}</span>
          </div>
          <Slider value={afr} onChange={e => setAfr(parseFloat(e.target.value))} min={11.5} max={15.0} step={0.1} color={status.color} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
            <span>Rich 11.5</span><span>Target 13.0</span><span>Lean 15.0</span>
          </div>
        </div>
        <div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            RPM <span style={{ color: "#00d4ff", fontWeight: 800, fontSize: 18, marginLeft: 8 }}>{rpm.toLocaleString()}</span>
          </div>
          <Slider value={rpm} onChange={e => setRpm(parseInt(e.target.value))} min={2000} max={6000} step={250} color="#00d4ff" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
            <span>2,000</span><span>4,000</span><span>6,000</span>
          </div>
        </div>
      </div>

      <div style={{
        borderRadius: 10, padding: "10px 16px", marginBottom: 18,
        background: `${status.color}08`, border: `1px solid ${status.color}25`,
        display: "flex", alignItems: "center", gap: 10, transition: "all 0.3s",
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: status.color, boxShadow: `0 0 10px ${status.glow}` }} />
        <span style={{ color: status.color, fontSize: 13, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>{status.label}</span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {[
          { label: "Wideband says", val: `${afr.toFixed(1)} AFR`, color: error > 0.3 ? "#ff3b4e" : error < -0.3 ? "#00d4ff" : "#34d399" },
          { label: "Target", val: "13.0 AFR", color: "#00d4ff" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{r.label}</span>
            <span style={{ color: r.color, fontSize: 18, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif" }}>{r.val}</span>
          </div>
        ))}
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 14, padding: 2 }}>▼</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>DynoAI adjusts fuel table</span>
          <span style={{ color: "#b44dff", fontSize: 18, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif" }}>{veAdj >= 0 ? "+" : ""}{veAdj.toFixed(1)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#34d39908", borderRadius: 10, border: "1px solid #34d39920" }}>
          <span style={{ color: "#34d399", fontSize: 14, fontWeight: 700 }}>Corrected AFR</span>
          <span style={{ color: "#34d399", fontSize: 24, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>{correctedAfr.toFixed(1)}</span>
        </div>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 14, lineHeight: 1.7 }}>
        Push it lean, push it rich — watch DynoAI correct it every time. The correction is <strong style={{ color: "#ff3b4e" }}>hard-limited</strong> and cannot write a value outside safe operating range. Same logic applies to diesel rail pressure, boost targets, and EGT. The math adapts; the safety doesn't budge.
      </p>
    </GlowCard>
  );
}

/* ═══════════════════ PIPELINE ═══════════════════ */
function PipelineFlow() {
  const [step, setStep] = useState(0);
  const steps = [
    { name: "Strap It Down", detail: "Whatever the platform — bike, truck, UTV, car — it goes on the dyno. DynoAI reads all available sensor data in real time: RPM, throttle position, wideband AFR, boost pressure, intake air temp, engine temp, EGT, and timing. Every pull captures thousands of data points.", plain: "Same dyno session you'd normally run — the software just watches everything at once", color: "#00d4ff" },
    { name: "DynoAI Learns It", detail: "After a few pulls, DynoAI builds a complete model of that specific engine — not a canned map, a custom model for this exact combination of displacement, cams, boost, altitude, and temperature. On a diesel with hundreds of fuel table cells, this is where it really shines — it fills the entire map instead of making you pull for each zone.", plain: "It builds a 3D map of how this specific engine breathes and burns", color: "#b44dff" },
    { name: "Compute Correction", detail: "DynoAI identifies where fueling, timing, and boost targets are off, then calculates exact table corrections. On gas engines: VE tables and spark advance. On diesels: fuel maps, rail pressure, injection timing, boost duty cycle. Every correction has hard safety limits.", plain: "Does what a great tuner does — checks every cell, every axis, instantly", color: "#ff3b4e" },
    { name: "Flash", detail: "The optimized calibration gets written to the ECU. Before any flash, DynoAI saves a complete snapshot — one click to undo everything. Works with factory ECUs, standalones like Holley/MegaSquirt/MS3Pro, and diesel-specific platforms.", plain: "Full rollback safety net — you can always go back", color: "#34d399" },
    { name: "Verify", detail: "One more pull to confirm. DynoAI compares predicted vs. actual across every cell and gives a confidence score. On diesels, it checks EGT trends and boost stability too. If anything is off, it flags exactly where. Customer gets a printout.", plain: "Proof the tune is dialed — documented, not guesswork", color: "#ffb020" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{
              flex: "1 0 auto", minWidth: 70, padding: "12px 10px", borderRadius: 10,
              border: step === i ? `2px solid ${s.color}` : "2px solid rgba(255,255,255,0.06)",
              background: step === i ? `${s.color}10` : "rgba(255,255,255,0.02)",
              color: step === i ? s.color : "rgba(255,255,255,0.3)",
              cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all 0.3s", textAlign: "center",
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
            }}>
            <div style={{ fontSize: 20, marginBottom: 4, opacity: step === i ? 1 : 0.5 }}>{i + 1}</div>
            {s.name}
          </button>
        ))}
      </div>

      <GlowCard color={steps[step].color} style={{
        padding: 24, borderLeft: `3px solid ${steps[step].color}`, minHeight: 160,
      }}>
        <h4 style={{ color: steps[step].color, margin: "0 0 12px", fontSize: 20, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5 }}>
          Step {step + 1} — {steps[step].name}
        </h4>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.85, margin: "0 0 16px" }}>{steps[step].detail}</p>
        <div style={{
          borderRadius: 8, padding: "10px 14px",
          background: `${steps[step].color}08`, borderLeft: `2px solid ${steps[step].color}30`,
          fontSize: 12, color: steps[step].color, fontStyle: "italic",
        }}>💡 {steps[step].plain}</div>
      </GlowCard>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 18, gap: 3 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: i <= step ? s.color : "rgba(255,255,255,0.08)", transition: "all 0.3s",
              boxShadow: i <= step ? `0 0 8px ${s.color}40` : "none",
            }} />
            {i < steps.length - 1 && <div style={{ width: 30, height: 2, borderRadius: 1, background: i < step ? steps[i+1].color : "rgba(255,255,255,0.06)", transition: "all 0.3s" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ SAVINGS CALC ═══════════════════ */
function SavingsCalc() {
  const [units, setUnits] = useState(8);
  const [platform, setPlatform] = useState("vtwin");
  const profiles = {
    vtwin: { label: "V-Twin", tradH: 3.5, aiH: 0.75, tradC: 450, aiC: 175, tradP: 25, aiP: 6 },
    diesel: { label: "Turbo Diesel", tradH: 8, aiH: 1.5, tradC: 900, aiC: 300, tradP: 40, aiP: 10 },
    sport: { label: "Sport Bike", tradH: 2.5, aiH: 0.6, tradC: 350, aiC: 150, tradP: 20, aiP: 5 },
    auto: { label: "Car / Truck", tradH: 5, aiH: 1, tradC: 600, aiC: 225, tradP: 30, aiP: 8 },
    utv: { label: "UTV / Sled", tradH: 2.5, aiH: 0.65, tradC: 350, aiC: 150, tradP: 20, aiP: 5 },
  };
  const p = profiles[platform];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {Object.entries(profiles).map(([k, v]) => (
          <button key={k} onClick={() => setPlatform(k)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "none",
              background: platform === k ? "#ff3b4e" : "rgba(255,255,255,0.06)",
              color: platform === k ? "#fff" : "rgba(255,255,255,0.35)",
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.3s", letterSpacing: 0.5,
              boxShadow: platform === k ? "0 0 16px #ff3b4e30" : "none",
            }}>
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
          Units per week <span style={{ color: "#00d4ff", fontWeight: 900, fontSize: 24, marginLeft: 8 }}>{units}</span>
        </div>
        <Slider value={units} onChange={e => setUnits(parseInt(e.target.value))} min={1} max={30} color="#ff3b4e" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
          <span>Side gig</span><span>Steady shop</span><span>High volume</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <GlowCard color="#ff3b4e" hover={false} style={{ padding: 18 }}>
          <div style={{ color: "#ff3b4e", fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 14, fontFamily: "'Barlow Condensed', sans-serif" }}>THE OLD WAY</div>
          {[
            { v: `${(p.tradH * units).toFixed(0)}`, u: "hours on the dyno" },
            { v: `${p.tradP * units}`, u: "pulls burned" },
            { v: `$${(p.tradC * units).toLocaleString()}`, u: "in labor" },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 800, fontSize: 20, fontFamily: "'Barlow Condensed', sans-serif" }}>{r.v}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 6 }}>{r.u}</span>
            </div>
          ))}
        </GlowCard>
        <GlowCard color="#34d399" hover={false} style={{ padding: 18 }}>
          <div style={{ color: "#34d399", fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 14, fontFamily: "'Barlow Condensed', sans-serif" }}>WITH DYNOAI</div>
          {[
            { v: `${(p.aiH * units).toFixed(0)}`, u: "hours on the dyno" },
            { v: `${p.aiP * units}`, u: "pulls total" },
            { v: `$${(p.aiC * units).toLocaleString()}`, u: "in labor" },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 800, fontSize: 20, fontFamily: "'Barlow Condensed', sans-serif" }}>{r.v}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 6 }}>{r.u}</span>
            </div>
          ))}
        </GlowCard>
      </div>

      <div style={{
        background: "linear-gradient(135deg, rgba(180,77,255,0.06), rgba(0,212,255,0.04))",
        borderRadius: 14, padding: 28, textAlign: "center",
        border: "1px solid rgba(180,77,255,0.15)",
      }}>
        <div style={{ color: "#b44dff", fontSize: 12, fontWeight: 800, letterSpacing: 3, marginBottom: 18, fontFamily: "'Barlow Condensed', sans-serif" }}>WHAT YOU KEEP</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { v: `${((p.tradH - p.aiH) * units).toFixed(0)}h`, l: "Hours Back" },
            { v: `$${((p.tradC - p.aiC) * units).toLocaleString()}`, l: "Saved / Week" },
            { v: `${(p.tradP - p.aiP) * units}`, l: "Fewer Pulls" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ color: "#34d399", fontSize: 32, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>{s.v}</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 20 }}>
          Annual: <span style={{ color: "#34d399", fontWeight: 900, fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif" }}>${((p.tradC - p.aiC) * units * 50).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ ENGINE CARDS ═══════════════════ */
function EngineCards() {
  const [active, setActive] = useState("vtwin");
  const eng = ENGINE_PROFILES.find(e => e.id === active);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {ENGINE_PROFILES.map(e => (
          <button key={e.id} onClick={() => setActive(e.id)}
            style={{
              padding: "12px 14px", borderRadius: 10, minWidth: 75,
              border: active === e.id ? `2px solid ${e.color}` : "2px solid rgba(255,255,255,0.06)",
              background: active === e.id ? `${e.color}10` : "rgba(255,255,255,0.02)",
              color: active === e.id ? e.color : "rgba(255,255,255,0.3)",
              cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all 0.3s",
              textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
            }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{e.icon}</div>
            {e.name}
          </button>
        ))}
      </div>

      <GlowCard color={eng.color} style={{ padding: 24, borderLeft: `3px solid ${eng.color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <h3 style={{ color: eng.color, margin: "0 0 4px", fontSize: 22, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>{eng.icon} {eng.name}</h3>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>{eng.tagline}</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#ff3b4e", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>OLD WAY</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>{eng.pulls.trad} pulls</div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{eng.time.trad}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#34d399", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>DYNOAI</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>{eng.pulls.ai} pulls</div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{eng.time.ai}</div>
            </div>
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 14 }}>{eng.specs}</div>

        <div style={{ background: "rgba(255,176,32,0.04)", borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid rgba(255,176,32,0.1)" }}>
          <div style={{ color: "#ffb020", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif" }}>THE CHALLENGE</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>{eng.challenges}</div>
        </div>
        <div style={{ background: "rgba(52,211,153,0.04)", borderRadius: 10, padding: 14, border: "1px solid rgba(52,211,153,0.1)" }}>
          <div style={{ color: "#34d399", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif" }}>HOW DYNOAI HANDLES IT</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>{eng.benefit}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>PLATFORMS: </span>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{eng.examples}</span>
        </div>
      </GlowCard>
    </div>
  );
}

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function DynoAIExplainer() {
  const [section, setSection] = useState("overview");

  const content = {
    overview: (
      <div>
        <FadeIn>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", fontSize: 36, fontWeight: 900, margin: "0 0 8px", letterSpacing: -0.5, lineHeight: 1.1 }}>
              What If Your Dyno Was<br /><span style={{ color: "#ff3b4e" }}>Smarter Than You?</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "12px 0 0", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
              AI-Powered Calibration — Any Engine, Any Platform
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.9, margin: "0 0 18px" }}>
            You know the drill. Engine on the dyno. Pull, check the numbers, tweak cells, pull again. Repeat 20, 30, 40+ times.
            On a big diesel with hundreds of fuel table cells, that's an entire day on one truck.
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.9, margin: "0 0 30px" }}>
            <strong style={{ color: "#00d4ff" }}>DynoAI cuts that to a fraction of the pulls and a fraction of the time.</strong> It
            watches the engine, learns what it's doing, computes the correction, and writes it — with safety limits that <strong style={{ color: "#ff3b4e" }}>physically cannot</strong> write
            a dangerous value. Started on Harley V-twins. Works on anything with an ECU and a wideband.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14 }}>
            <StatPill value="75–85%" label="Fewer Pulls" sub="across all platforms" color="#ff3b4e" />
            <StatPill value="4–6×" label="Faster Per Job" sub="more vehicles per day" color="#00d4ff" />
            <StatPill value="±0.2" label="AFR Accuracy" sub="every cell in the map" color="#34d399" />
            <StatPill value="100%" label="Cells Checked" sub="not just the ones you saw" color="#b44dff" />
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <GlowCard color="#ff3b4e" style={{ padding: 24, marginTop: 28 }}>
            <h4 style={{ color: "#ff3b4e", margin: "0 0 16px", fontSize: 16, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
              WHAT THIS IS (AND ISN'T)
            </h4>
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { title: "No canned maps", desc: "Builds a custom model for every engine on your dyno. A compound-turbo Duramax gets a completely different model than a cammed LS3 or a 124ci stroker." },
                { title: "Not a black box", desc: "Every correction is visible with the data that drove it. Full audit trail — great for your reputation and liability protection." },
                { title: "Doesn't replace the tuner", desc: "You pick the targets and strategy. DynoAI handles the repetitive cell-by-cell math and catches what human eyes miss after three hours of staring at tables." },
                { title: "Platform agnostic", desc: "V-twins, inline-4s, V8s, turbo diesels, forced induction, NA — if it has sensors and a fuel table, DynoAI can learn it." },
              ].map(item => (
                <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ff3b4e", marginTop: 8, flexShrink: 0, boxShadow: "0 0 8px #ff3b4e50" }} />
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.7, marginTop: 3 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>
        </FadeIn>
      </div>
    ),

    engines: (
      <div>
        <FadeIn><h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 6px" }}>Built for <span style={{ color: "#00d4ff" }}>Any Engine</span></h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 8px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>V-Twins → Turbo Diesels → Sport Bikes → Cars → Powersports</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, margin: "0 0 24px" }}>
          Born on Harley V-twins — battle-tested across every platform. The core system doesn't care what engine it's looking at. A turbo diesel with 400+ fuel table cells? That's where DynoAI saves the <em>most</em> time.
        </p></FadeIn>
        <FadeIn delay={0.1}><EngineCards /></FadeIn>
        <FadeIn delay={0.2}>
          <GlowCard color="#ffb020" style={{ padding: 24, marginTop: 24, textAlign: "center" }}>
            <div style={{ color: "#ffb020", fontSize: 14, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2, marginBottom: 10 }}>THE BIGGER THE MAP, THE BIGGER THE WIN</div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
              A Harley VE table has ~100 cells. A turbo diesel fuel map can have 400+. Hand-tuning that is an 8-10 hour marathon.
              DynoAI fills the entire map from a handful of pulls — and checks every cell, not just the ones in your common zones.
            </p>
          </GlowCard>
        </FadeIn>
      </div>
    ),

    learn: (
      <div>
        <FadeIn><h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 6px" }}>How DynoAI <span style={{ color: "#b44dff" }}>Learns</span></h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, margin: "0 0 24px" }}>
          Hand-tuning: check data at specific points, tweak cells one at a time, guess between measured points. DynoAI takes your data and figures out what the engine does <strong style={{ color: "#00d4ff" }}>everywhere</strong> — including spots you haven't measured. Switch engine types below to see how the same principle adapts.
        </p></FadeIn>
        <FadeIn delay={0.1}><LearnChart /></FadeIn>
        <FadeIn delay={0.2}>
          <GlowCard color="#b44dff" style={{ padding: 24, marginTop: 20 }}>
            <h4 style={{ color: "#b44dff", margin: "0 0 12px", fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>WHY SO FAST?</h4>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              Built from scratch for engine calibration. Off-the-shelf software: 8+ seconds. Ours: <strong style={{ color: "#34d399" }}>under 150 milliseconds</strong>.
              Make a pull, model updates instantly. On a diesel with 400+ cells, a slow system means minutes of waiting. Ours keeps up in real time.
            </p>
          </GlowCard>
        </FadeIn>
        <FadeIn delay={0.3}>
          <GlowCard color="#00d4ff" style={{ padding: 24, marginTop: 14 }}>
            <h4 style={{ color: "#00d4ff", margin: "0 0 12px", fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>IN PRACTICE</h4>
            {["Models THIS engine on YOUR dyno — not a lookup table of 'similar builds'",
              "A stock Duramax tunes completely different from one with compounds — DynoAI sees that from the data",
              "Altitude, temperature, boost, backpressure — all factored in automatically from sensors",
              "Shows you when it has 'enough data' to be confident — no wasted pulls",
              "Two trucks with identical parts lists can still tune differently — DynoAI catches that",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ color: "#00d4ff", fontWeight: 900, fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.6 }}>{t}</div>
              </div>
            ))}
          </GlowCard>
        </FadeIn>
      </div>
    ),

    safety: (
      <div>
        <FadeIn><h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 6px" }}>Cannot Write a <span style={{ color: "#ff3b4e" }}>Bad Tune</span></h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, margin: "0 0 24px" }}>
          The correction math is <strong style={{ color: "#ff3b4e" }}>locked down</strong> with hard limits. Too lean? Clamped. Too much boost? Clamped. Dangerous EGT? Flagged and limited.
          No update, no setting, no operator error can override these limits. Drag the sliders to see it work.
        </p></FadeIn>
        <FadeIn delay={0.1}><SafetyDemo /></FadeIn>
        <FadeIn delay={0.2}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
            {[
              { name: "Writes Correction", desc: "Exact fuel table adjustment per cell. Every change logged with the sensor data that drove it.", color: "#ff3b4e", icon: "✍️" },
              { name: "One-Click Undo", desc: "Full snapshot before every flash. One click back to where you started. Any platform.", color: "#00d4ff", icon: "↩️" },
              { name: "Smart Cell Mapping", desc: "Maps your data to the right table cells — even on massive diesel maps with boost, RPM, and load axes.", color: "#b44dff", icon: "🗺️" },
              { name: "Hard Safety Limits", desc: "Every correction checked against max safe values for fueling, timing, boost, EGT, rail pressure. Cannot be bypassed.", color: "#ffb020", icon: "🛡️" },
            ].map(k => (
              <GlowCard key={k.name} color={k.color} style={{ padding: 16, borderLeft: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
                <div style={{ color: k.color, fontSize: 13, fontWeight: 800, marginBottom: 4, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5 }}>{k.name}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 1.6 }}>{k.desc}</div>
              </GlowCard>
            ))}
          </div>
        </FadeIn>
      </div>
    ),

    pipeline: (
      <div>
        <FadeIn><h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 6px" }}>A Tune, <span style={{ color: "#34d399" }}>Start to Finish</span></h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, margin: "0 0 24px" }}>
          Whether it's a Dyna on the rollers or a Duramax on a hub dyno, the workflow is the same. Every step is automated but you can inspect and override at any point.
        </p></FadeIn>
        <FadeIn delay={0.1}><PipelineFlow /></FadeIn>
      </div>
    ),

    training: (
      <div>
        <FadeIn><h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 6px" }}>Train New Guys <span style={{ color: "#ffb020" }}>Without Risk</span></h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, margin: "0 0 24px" }}>
          Teaching someone to tune on real customer vehicles is nerve-wracking and expensive. DynoAI's training mode runs full sessions on virtual engines — same software, same safety system, zero risk.
        </p></FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ display: "grid", gap: 14 }}>
            {[
              { title: "Same Software, Simulated Engine", desc: "Exact same system as a real tune — same screen, safety limits, workflow. Just virtual sensor data. Available for every platform.", icon: "🔄", color: "#00d4ff" },
              { title: "Break Things on Purpose", desc: "Simulate clogged injectors, failing sensors, boost leaks, stuck wastegates, EGT spikes. Learn on a fake engine, not a customer's $80K truck.", icon: "⚠️", color: "#ff3b4e" },
              { title: "Real-World Profiles", desc: "From bone-stock 96ci Harleys to compound-turbo Cummins sled pullers. Trainees see the variety they'll face in the real world.", icon: "🏍️", color: "#b44dff" },
              { title: "Scoring & Coaching", desc: "Compares the trainee's tune against optimal. Shows what they missed and what to do differently. Like a tuning mentor that never gets tired.", icon: "📊", color: "#34d399" },
            ].map(item => (
              <GlowCard key={item.title} color={item.color} style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontSize: 30, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ color: item.color, fontSize: 15, fontWeight: 800, marginBottom: 4, fontFamily: "'Barlow Condensed', sans-serif" }}>{item.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </GlowCard>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{
            background: "linear-gradient(135deg, rgba(255,176,32,0.06), rgba(0,0,0,0))",
            borderRadius: 14, padding: 28, marginTop: 24, border: "1px solid rgba(255,176,32,0.12)", textAlign: "center",
          }}>
            <div style={{ color: "#ffb020", fontSize: 14, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2, marginBottom: 14 }}>TRAINING MATH</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 420, margin: "0 auto" }}>
              <GlowCard color="#ff3b4e" hover={false} style={{ padding: 14 }}>
                <div style={{ color: "#ff3b4e", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>OLD WAY</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>Weeks of shadowing, real engine risk, expensive mistakes, and you're babysitting</div>
              </GlowCard>
              <GlowCard color="#34d399" hover={false} style={{ padding: 14 }}>
                <div style={{ color: "#34d399", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>DYNOAI</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.7 }}>50+ practice tunes/day, zero risk, zero fuel, zero dyno wear, you keep working</div>
              </GlowCard>
            </div>
          </div>
        </FadeIn>
      </div>
    ),

    savings: (
      <div>
        <FadeIn><h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 6px" }}>Your <span style={{ color: "#34d399" }}>Bottom Line</span></h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, margin: "0 0 24px" }}>
          Savings scale with complexity. A Harley goes from 3-4 hours to ~45 minutes. A turbo diesel? From an all-day job to 90 minutes. Pick your platform and volume.
        </p></FadeIn>
        <FadeIn delay={0.1}><SavingsCalc /></FadeIn>
        <FadeIn delay={0.2}>
          <GlowCard color="#ff3b4e" style={{ padding: 24, marginTop: 24 }}>
            <h4 style={{ color: "#ff3b4e", margin: "0 0 14px", fontSize: 16, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>BEYOND THE DOLLARS</h4>
            {[
              { text: "Every tune comes out consistent — the system doesn't have off days and checks every cell every time", icon: "🎯" },
              { text: "Full paper trail — if a customer comes back with a melted piston, you've got documented proof of what was written and why", icon: "📋" },
              { text: "Faster turnaround = more vehicles per day = your dyno is making money, not sitting idle", icon: "⚡" },
              { text: "Same quality at 5pm Friday as 9am Monday — the math doesn't get tired", icon: "🛡️" },
              { text: "New tuners productive in days, not months — across any platform DynoAI supports", icon: "👨‍🔧" },
              { text: "Customers get predicted vs. actual on paper — the kind of transparency that builds referrals", icon: "🤝" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6 }}>{item.text}</div>
              </div>
            ))}
          </GlowCard>
        </FadeIn>
      </div>
    ),
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080e",
      color: "#fff",
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* ─── HEADER ─── */}
      <div style={{
        padding: "36px 24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(255,59,78,0.04) 0%, transparent 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div style={{ maxWidth: 780, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #ff3b4e, #cc2233)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff",
              boxShadow: "0 0 30px rgba(255,59,78,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}>D</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
                DYNO<span style={{ color: "#ff3b4e" }}>AI</span>
              </h1>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 3, fontFamily: "'Barlow Condensed', sans-serif" }}>
                BY THUNDERHORSE TUNING
              </div>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: "14px 0 0", lineHeight: 1.5 }}>
            AI-powered calibration that learns, corrects, and protects — from V-twins to turbo diesels and everything in between.
          </p>
        </div>
      </div>

      {/* ─── NAV ─── */}
      <div style={{
        padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,8,14,0.95)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", gap: 2, overflowX: "auto", paddingBottom: 0 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{
                padding: "14px 16px", border: "none",
                borderBottom: section === s.id ? "2px solid #ff3b4e" : "2px solid transparent",
                background: "transparent",
                color: section === s.id ? "#fff" : "rgba(255,255,255,0.3)",
                cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                transition: "all 0.25s", fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: 1,
              }}>
              <span style={{ marginRight: 5, fontSize: 13 }}>{s.icon}</span>{s.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 24px 70px" }}>
        <div key={section}>{content[section]}</div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
          BUILT IN UTICA, NY BY THUNDERHORSE TUNING
        </div>
        <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 11, marginTop: 4 }}>Want a demo on your platform? Let's talk.</div>
      </div>
    </div>
  );
}

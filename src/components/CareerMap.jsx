import { useState, useEffect, useRef } from "react";

// ── Coordinate system ──────────────────────────────────
const VW = 900, VH = 440;
const PL = 106, PR = 56, PT = 44, PB = 52;
const UW = VW - PL - PR;   // usable width  = 738
const UH = VH - PT - PB;   // usable height = 344
const Y0 = 2005, Y1 = 2025;

const gx = (t) => PL + t * UW;
const gy = (y) => PT + ((y - Y0) / (Y1 - Y0)) * UH;

// ── Data ───────────────────────────────────────────────
const NODES = [
  { id: "nsit",    year: 2009, t: 0.10, period: "2005–09", role: "B.E., Engineering",               inst: "NSIT",                    loc: "Delhi, India",       type: "edu"      },
  { id: "iiser",   year: 2016, t: 0.20, period: "2011–16", role: "Ph.D., Physics",                  inst: "IISER Mohali",            loc: "Mohali, India",      type: "edu"      },
  { id: "olden",   year: 2018, t: 0.44, period: "2016–18", role: "Postdoctoral Researcher",          inst: "University of Oldenburg", loc: "Oldenburg, Germany", type: "research" },
  { id: "ncstate", year: 2022, t: 0.63, period: "2019–22", role: "Postdoctoral Researcher",          inst: "NC State · NAIL",         loc: "Raleigh, NC, USA",   type: "research" },
  { id: "jax",     year: 2025, t: 0.82, period: "2022–",   role: "Assoc. Computational Scientist",  inst: "The Jackson Laboratory",  loc: "Farmington, CT",     type: "current"  },
];

const BRANCHES = {
  iiser:   [ { lbl: "complex networks",      dx: 62,  dy: -28 }, { lbl: "nonlinear dynamics",   dx: -52, dy: 14  } ],
  olden:   [ { lbl: "phase synchronization", dx: -68, dy: -18 }, { lbl: "trait diversity",       dx: 58,  dy: 26  } ],
  ncstate: [ { lbl: "Hamiltonian ML",        dx: -58, dy: -22 }, { lbl: "neuronal diversity",    dx: 64,  dy: 12  } ],
  jax:     [ { lbl: "RNA velocity",          dx: -52, dy: -30 }, { lbl: "JABS · behavior",       dx: 56,  dy: 22  } ],
};

const TYPE_COL = { edu: "var(--accent-blue)", research: "var(--sage)", current: "var(--oxide)" };

// ── Catmull-Rom → cubic bezier path ───────────────────
function smoothPath(pts, tension = 0.28) {
  const d = [`M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1 = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension];
    const cp2 = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension];
    d.push(`C ${cp1[0].toFixed(1)},${cp1[1].toFixed(1)} ${cp2[0].toFixed(1)},${cp2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`);
  }
  return d.join(" ");
}

// ── Component ─────────────────────────────────────────
export default function CareerMap() {
  const [active, setActive]   = useState(null);
  const [visible, setVisible] = useState(false);
  const [pathLen, setPathLen] = useState(820);
  const [eggHover, setEggHover] = useState(false);
  const wrapRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.18 }
    );
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (visible && pathRef.current) {
      try { setPathLen(pathRef.current.getTotalLength()); } catch {}
    }
  }, [visible]);

  const pts   = NODES.map(n => [gx(n.t), gy(n.year)]);
  const pathD = smoothPath(pts);
  const yearTicks = [2005, 2010, 2015, 2020, 2025];
  const activeNode = NODES.find(n => n.id === active);

  return (
    <div ref={wrapRef} className="cmap-wrap">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="cmap-svg"
        aria-label="Career trajectory: theory to biology over time"
        role="img"
      >
        {/* ── Grid lines ── */}
        {yearTicks.map(y => (
          <line key={y}
            x1={PL} y1={gy(y)} x2={VW - PR} y2={gy(y)}
            className="cmap-grid"
            strokeDasharray={y % 10 === 0 ? undefined : "2 5"}
          />
        ))}

        {/* ── Year labels ── */}
        {yearTicks.map(y => (
          <text key={y} x={PL - 10} y={gy(y) + 4} textAnchor="end" className="cmap-year-lbl">
            {y}
          </text>
        ))}

        {/* ── Axis labels ── */}
        <text x={PL}      y={VH - 12} textAnchor="start" className="cmap-axis-lbl">← pure theory</text>
        <text x={VW - PR} y={VH - 12} textAnchor="end"   className="cmap-axis-lbl">computational biology →</text>

        {/* ── Research branches ── */}
        {NODES.flatMap(n =>
          (BRANCHES[n.id] ?? []).map((b, i) => {
            const nx = gx(n.t), ny = gy(n.year);
            return (
              <g key={`${n.id}-b${i}`}
                className={`cmap-branch${visible ? " cmap-branch-in" : ""}`}
                style={{ animationDelay: `${1.4 + i * 0.14}s` }}
              >
                <line x1={nx} y1={ny} x2={nx + b.dx} y2={ny + b.dy}
                  stroke={TYPE_COL[n.type]}
                  strokeWidth="1" strokeLinecap="round" strokeOpacity="0.32"
                />
                <text
                  x={nx + b.dx + (b.dx > 0 ? 6 : -6)}
                  y={ny + b.dy + 3}
                  textAnchor={b.dx > 0 ? "start" : "end"}
                  className="cmap-branch-lbl"
                  style={{ fill: TYPE_COL[n.type], fillOpacity: 0.55 }}
                >
                  {b.lbl}
                </text>
              </g>
            );
          })
        )}

        {/* ── Main trajectory ── */}
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          strokeDashoffset={visible ? 0 : pathLen}
          className="cmap-path"
        />

        {/* ── Nodes ── */}
        {NODES.map((n, i) => {
          const nx = gx(n.t), ny = gy(n.year);
          const isActive = active === n.id;
          const col = TYPE_COL[n.type];
          return (
            <g key={n.id}
              className={`cmap-node${visible ? " cmap-node-in" : ""}`}
              style={{ animationDelay: `${0.5 + i * 0.22}s`, cursor: "default" }}
              onMouseEnter={() => setActive(n.id)}
              onMouseLeave={() => setActive(null)}
            >
              {n.type === "current" && (
                <circle cx={nx} cy={ny} r="12"
                  fill={col} fillOpacity="0.08"
                  className="cmap-pulse"
                />
              )}
              <circle cx={nx} cy={ny}
                r={isActive ? 7.5 : n.type === "current" ? 6.5 : 5.5}
                className="cmap-node-circle"
                style={{
                  fill: col,
                  fillOpacity: isActive ? 1 : 0.9,
                  stroke: "var(--paper)",
                  strokeWidth: 1.8,
                  transition: "r 180ms ease",
                }}
              />
            </g>
          );
        })}

        {/* ── Easter egg ── */}
        <g className="cmap-egg"
          onMouseEnter={() => setEggHover(true)}
          onMouseLeave={() => setEggHover(false)}
        >
          {/* Nearly invisible pulse dot in top-right — requires deliberate discovery */}
          <circle cx={VW - PR + 28} cy={PT - 8} r="3"
            style={{ fill: "var(--oxide)", opacity: 0.06, cursor: "default" }}
            className="cmap-egg-dot"
          />
          <text x={VW - PR + 34} y={PT - 4}
            className="cmap-egg-rec"
            style={{ opacity: eggHover ? 1 : 0, transition: "opacity 300ms ease" }}
          >
            ● REC
          </text>
          <text x={VW - PR + 34} y={PT + 12}
            className="cmap-egg-credit"
            style={{ opacity: eggHover ? 0.7 : 0, transition: "opacity 300ms ease 80ms" }}
          >
            dir. A. Choudhary · runtime: ongoing ∞
          </text>
        </g>
      </svg>

      {/* ── HTML tooltip overlay ── */}
      {activeNode && (
        <div
          className="cmap-tooltip"
          style={{
            left:      `${(gx(activeNode.t) / VW) * 100}%`,
            top:       `${(gy(activeNode.year) / VH) * 100}%`,
            transform: `translate(${activeNode.t > 0.7 ? "calc(-100% - 14px)" : "16px"}, -50%)`,
          }}
        >
          <span className="cmap-tt-period">{activeNode.period}</span>
          <span className="cmap-tt-role">{activeNode.role}</span>
          <span className="cmap-tt-inst">{activeNode.inst}</span>
          <span className="cmap-tt-loc">{activeNode.loc}</span>
        </div>
      )}
    </div>
  );
}

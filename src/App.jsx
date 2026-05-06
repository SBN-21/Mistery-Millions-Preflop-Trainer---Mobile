import React, { useMemo, useState } from "react";

function AppButton({
  children,
  onClick,
  active = false,
  disabled = false,
  wide = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: active ? "2px solid #2563eb" : "1px solid #cbd5e1",
        background: active ? "#dbeafe" : "white",
        color: "#0f172a",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        width: wide ? "100%" : undefined,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: "white",
        color: "#0f172a",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 10px 25px rgba(0,0,0,.18)",
      }}
    >
      {children}
    </div>
  );
}

const scenarios = [
  {
    level: "Level 22 · Push/Fold",
    warning: "4 reshove stacks behind",
    position: "UTG+1",
    hand: "33",
    stack: "8BB",
    action: "Folded to you",
    options: ["JAM", "FOLD"],
    correct: "JAM",
    explanation:
      "At 8BB, all pocket pairs are profitable jams. Blind pressure is too severe to wait.",
  },
  {
    level: "Level 19 · Push/Fold",
    warning: "Late reg closed",
    position: "UTG+1",
    hand: "ATo",
    stack: "17BB",
    action: "UTG limps",
    options: ["JAM", "FOLD"],
    correct: "JAM",
    explanation:
      "Jam over limp. Dead money + fold equity + awkward stack depth for iso/fold.",
  },
  {
    level: "Level 12 · Critical",
    warning: "Aggressive players behind",
    position: "LJ",
    hand: "KK",
    stack: "17BB",
    action: "UTG opens 2.1x",
    options: ["3-BET JAM", "CALL", "FOLD"],
    correct: "3-BET JAM",
    explanation:
      "Premium at 17BB versus open = pure value jam.",
  },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);

  const s = useMemo(() => scenarios[index % scenarios.length], [index]);

  function nextHand() {
    setIndex((v) => v + 1);
    setSelected(null);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        padding: 18,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .container {
          max-width: 820px;
          margin: 0 auto;
        }

        .title {
          color: white;
          font-size: clamp(28px, 7vw, 48px);
          font-weight: 800;
          margin: 0 0 14px 0;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .sticky {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px;
          background: rgba(2,6,23,.95);
          border-top: 1px solid #334155;
        }

        .safe {
          height: 90px;
        }

        @media (max-width: 760px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }

          .actions {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="container">
        <h1 className="title">Mini Mystery Trainer</h1>

        <Card>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                background: "#e2e8f0",
                padding: "8px 12px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {s.level}
            </div>

            <div
              style={{
                background: "#fef3c7",
                padding: "8px 12px",
                borderRadius: 999,
                fontWeight: 700,
                color: "#92400e",
              }}
            >
              ⚠ {s.warning}
            </div>
          </div>

          <div className="grid">
            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ color: "#64748b", marginBottom: 6 }}>
                Position
              </div>
              <div style={{ fontSize: 42, fontWeight: 800 }}>
                {s.position}
              </div>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ color: "#64748b", marginBottom: 6 }}>
                Hand
              </div>
              <div style={{ fontSize: 42, fontWeight: 800 }}>
                {s.hand}
              </div>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ color: "#64748b", marginBottom: 6 }}>
                Stack
              </div>
              <div style={{ fontSize: 42, fontWeight: 800 }}>
                {s.stack}
              </div>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ color: "#64748b", marginBottom: 6 }}>
                Action before you
              </div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {s.action}
              </div>
            </div>
          </div>

          <div className="actions">
            {s.options.map((o) => (
              <AppButton
                key={o}
                onClick={() => setSelected(o)}
                disabled={!!selected}
                active={selected === o}
                wide
              >
                {o}
              </AppButton>
            ))}
          </div>

          {selected && (
            <div
              style={{
                marginTop: 18,
                borderRadius: 18,
                padding: 18,
                background:
                  selected === s.correct ? "#dcfce7" : "#fee2e2",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {selected === s.correct ? "Correct" : "Wrong"}
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Best action:</strong> {s.correct}
              </div>

              <div>{s.explanation}</div>
            </div>
          )}
        </Card>

        <div className="safe" />
      </div>

      {selected && (
        <div className="sticky">
          <AppButton onClick={nextHand} wide>
            Next Hand
          </AppButton>
        </div>
      )}
    </div>
  );
}

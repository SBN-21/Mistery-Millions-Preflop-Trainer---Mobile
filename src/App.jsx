import React, { useState } from "react";

/* ---------- SIMPLE UI ---------- */

function Button({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",
        margin: "5px",
        borderRadius: "8px",
        border: "none",
        background: "#2563eb",
        color: "white",
        cursor: "pointer",
        opacity: disabled ? 0.5 : 1,
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
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "20px",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- POKER ENGINE ---------- */

const hands = [
  "AK", "AQ", "AJ", "AT",
  "KQ", "KJ", "KT",
  "QJ", "QT",
  "JTs", "T9s", "98s",
  "77", "66", "55",
  "K9s", "Q9s"
];

const positions = ["UTG", "MP", "HJ", "CO", "BTN"];

function getScenario() {
  return {
    hand: hands[Math.floor(Math.random() * hands.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    bb: Math.floor(Math.random() * 20) + 5,
  };
}

function solve(s) {
  const { hand, position, bb } = s;

  // PUSH/FOLD ZONE
  if (bb <= 12) {
    if (position === "CO" || position === "BTN") {
      if (["K9s", "Q9s", "JTs", "T9s", "77", "66"].includes(hand)) {
        return "JAM";
      }
    }
    return "FOLD";
  }

  // 13–20BB
  if (bb <= 20) {
    if (["AK", "AQ"].includes(hand)) return "OPEN";
    if (["77", "66", "55", "KTs", "QTs", "JTs"].includes(hand)) return "JAM";
    return "FOLD";
  }

  // 20BB+
  return "OPEN";
}

/* ---------- APP ---------- */

export default function App() {
  const [scenario, setScenario] = useState(getScenario());
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState(null);

  const actions = ["OPEN", "JAM", "FOLD"];

  function next() {
    setScenario(getScenario());
    setSelected(null);
    setAnswer(null);
  }

  function choose(action) {
    setSelected(action);
    setAnswer(solve(scenario));
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>WSOP Trainer</h2>

      <Card>
        <p><strong>Position:</strong> {scenario.position}</p>
        <p><strong>Hand:</strong> {scenario.hand}</p>
        <p><strong>Stack:</strong> {scenario.bb}BB</p>
      </Card>

      <div style={{ marginTop: 20 }}>
        {actions.map((a) => (
          <Button key={a} onClick={() => choose(a)} disabled={selected}>
            {a}
          </Button>
        ))}
      </div>

      {answer && (
        <Card>
          <p>
            <strong>{selected === answer ? "Correct" : "Wrong"}</strong>
          </p>
          <p>Best action: {answer}</p>
        </Card>
      )}

      <div style={{ marginTop: 20 }}>
        <Button onClick={next}>Next Scenario</Button>
      </div>
    </div>
  );
}

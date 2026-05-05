import React, { useState } from "react";

const POSITIONS = ["UTG", "UTG+1", "LJ", "HJ", "CO", "BTN", "SB", "BB"];
const STACKS = [20, 25, 30, 40, 50, 75, 100];
const HANDS = ["AA","KK","QQ","JJ","TT","99","88","77","AKs","AQs","AJs","ATs","KQs","QJs","JTs","T9s","98s","87s","AKo","AQo","AJo","KQo"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateScenario() {
  const heroPos = rand(POSITIONS);
  const stack = rand(STACKS);
  const hand = rand(HANDS);
  const type = rand(["unopened","vs_open"]);

  let opener = null;
  let size = null;

  if (type === "vs_open") {
    opener = rand(POSITIONS.slice(0, POSITIONS.indexOf(heroPos)));
    size = rand([2.2, 2.5, 3, 4]);
  }

  return { heroPos, stack, hand, type, opener, size };
}

function getActions(type) {
  if (type === "unopened") return ["Fold","Open","Jam"];
  return ["Fold","Call","3Bet","Jam"];
}

function getAnswer(s) {
  if (["AA","KK","QQ","AKs","AKo"].includes(s.hand)) {
    return s.stack < 25 ? "Jam" : s.type === "unopened" ? "Open" : "3Bet";
  }
  if (["JJ","TT","AQs","AJs","KQs"].includes(s.hand)) {
    return s.type === "unopened" ? "Open" : "Call";
  }
  return "Fold";
}

export default function App() {
  const [scenario, setScenario] = useState(generateScenario());
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ hands:0, correct:0 });

  const actions = getActions(scenario.type);

  function handleAction(a) {
    if (selected) return;

    const correct = getAnswer(scenario);
    const isCorrect = a === correct;

    setSelected(a);
    setResult({ correct, isCorrect });

    setStats(prev => ({
      hands: prev.hands + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }));
  }

  function next() {
    setScenario(generateScenario());
    setSelected(null);
    setResult(null);
  }

  return (
    <div style={{padding:16, fontFamily:"Arial", maxWidth:420, margin:"0 auto"}}>
      
      {/* Stats */}
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}>
        <div>Hands: {stats.hands}</div>
        <div>Acc: {stats.hands ? Math.round(stats.correct/stats.hands*100) : 0}%</div>
      </div>

      {/* Scenario */}
      <div style={{background:"#f5f5f5", padding:16, borderRadius:12, marginBottom:16}}>
        <div style={{fontSize:32, fontWeight:"bold"}}>{scenario.hand}</div>
        <div>{scenario.heroPos} • {scenario.stack}bb</div>
        <div style={{marginTop:10}}>
          {scenario.type === "unopened"
            ? `Folds to you`
            : `${scenario.opener} opens ${scenario.size}bb`}
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
        {actions.map(a => (
          <button
            key={a}
            onClick={() => handleAction(a)}
            style={{
              height:60,
              fontSize:18,
              fontWeight:"bold",
              borderRadius:10,
              background:selected === a ? "#333" : "#ddd"
            }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div style={{marginTop:16}}>
          <div style={{fontWeight:"bold"}}>
            {result.isCorrect ? "✅ Correct" : "❌ Wrong"}
          </div>
          <div>Best: {result.correct}</div>

          <button
            onClick={next}
            style={{
              marginTop:12,
              width:"100%",
              height:60,
              fontSize:20,
              fontWeight:"bold"
            }}
          >
            Next Hand
          </button>
        </div>
      )}
    </div>
  );
}

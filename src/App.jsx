import React, { useMemo, useState } from "react";

const POSITIONS = ["UTG", "UTG+1", "LJ", "HJ", "CO", "BTN", "SB", "BB"];
const STACKS = [15, 20, 25, 30, 40, 50, 75, 100, 150, 200];

const HANDS = [
  "AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22",
  "AKs","AQs","AJs","ATs","A9s","A5s","A4s","KQs","KJs","KTs",
  "QJs","QTs","JTs","T9s","98s","87s","76s","65s","54s",
  "AKo","AQo","AJo","ATo","KQo","KJo","QJo"
];

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const idx = p => POSITIONS.indexOf(p);
const late = p => ["CO", "BTN", "SB"].includes(p);
const blind = p => ["SB", "BB"].includes(p);

function generateScenario(seen) {
  for (let i = 0; i < 500; i++) {
    const heroPos = rand(POSITIONS);
    const stack = rand(STACKS);
    const hand = rand(HANDS);
    const type = rand(["unopened", "vs_open", "vs_3bet"]);

    let opener = null;
    let openSize = null;
    let threeBettor = null;
    let threeBetSize = null;

    if (type === "vs_open" || type === "vs_3bet") {
      const possibleOpeners =
        heroPos === "BB"
          ? ["UTG", "UTG+1", "LJ", "HJ", "CO", "BTN", "SB"]
          : POSITIONS.filter(p => idx(p) < idx(heroPos));

      opener = rand(possibleOpeners.length ? possibleOpeners : ["UTG", "LJ", "HJ"]);
      openSize = rand([2.2, 2.5, 3, 4, 5]);
    }

    if (type === "vs_3bet") {
      const possible3Bettors = POSITIONS.filter(
        p => p !== heroPos && p !== opener && idx(p) > idx(opener)
      );
      threeBettor = rand(possible3Bettors.length ? possible3Bettors : ["CO", "BTN", "SB", "BB"]);
      threeBetSize = rand([8, 10, 12, 15, 18, 22]);
    }

    const key = `${heroPos}-${stack}-${hand}-${type}-${opener}-${openSize}-${threeBettor}-${threeBetSize}`;

    if (!seen.has(key)) {
      seen.add(key);
      return { heroPos, stack, hand, type, opener, openSize, threeBettor, threeBetSize, key };
    }
  }

  seen.clear();
  return generateScenario(seen);
}

function actions(type) {
  if (type === "unopened") return ["Fold", "Open", "Jam"];
  if (type === "vs_open") return ["Fold", "Call", "3Bet", "Jam"];
  return ["Fold", "Call", "4Bet", "Jam"];
}

const premiums = ["AA", "KK", "QQ", "AKs", "AKo"];
const strong = ["JJ", "TT", "99", "AQs", "AJs", "KQs", "AQo"];
const playable = ["ATs","A9s","A5s","A4s","KJs","KTs","QJs","QTs","JTs","T9s","98s","87s","76s","65s","54s"];
const pairs = ["88","77","66","55","44","33","22"];

function solve(s) {
  const h = s.hand;
  let best = "Fold";
  let category = "Discipline";
  let explanation = "This hand does not perform well enough from this position and stack depth. Folding protects your stack and avoids dominated spots.";

  if (s.type === "unopened") {
    if (premiums.includes(h)) {
      best = s.stack <= 18 ? "Jam" : "Open";
      category = "Value";
      explanation = s.stack <= 18
        ? "Premium hand with shallow stack. Jamming maximizes fold equity and avoids awkward postflop SPR."
        : "Clear value open. Build the pot with the top of your range.";
    } else if (strong.includes(h)) {
      best = s.stack <= 15 ? "Jam" : "Open";
      category = "Strong open";
      explanation = "Strong enough to open profitably. You want initiative and fold equity.";
    } else if (playable.includes(h) || pairs.includes(h)) {
      if (late(s.heroPos)) {
        best = s.stack <= 18 ? "Jam" : "Open";
        category = "Steal / playable";
        explanation = "Late position gives you enough fold equity and playability to enter the pot.";
      } else {
        best = "Fold";
        category = "Too loose early";
        explanation = "This hand class plays better late. From early/middle position it creates dominated and low-realization spots.";
      }
    } else if (["AJo", "ATo", "KQo"].includes(h)) {
      best = late(s.heroPos) ? "Open" : "Fold";
      category = "Position sensitive";
      explanation = late(s.heroPos)
        ? "Good enough to open late, especially with fold equity."
        : "Offsuit broadways get dominated too often from early position.";
    }
  }

  if (s.type === "vs_open") {
    const inPosition = idx(s.heroPos) > idx(s.opener) || s.heroPos === "BB";

    if (premiums.includes(h)) {
      best = s.stack <= 30 ? "Jam" : "3Bet";
      category = "Value 3bet";
      explanation = s.stack <= 30
        ? "At this stack depth, premium hands can profitably jam over opens."
        : "Premium hand wants value, isolation, and initiative.";
    } else if (strong.includes(h)) {
      if (s.stack <= 25) best = "Jam";
      else best = inPosition ? "Call" : "3Bet";
      category = "Continue";
      explanation = inPosition
        ? "Strong enough to continue. Calling keeps dominated hands in and realizes equity."
        : "Out of position, prefer 3betting or folding more often. Avoid passive dominated calls.";
    } else if (playable.includes(h) || pairs.includes(h)) {
      best = inPosition || blind(s.heroPos) ? "Call" : "Fold";
      category = "Realization";
      explanation = best === "Call"
        ? "Playable hand with sufficient price/position. Realize equity without over-bloating the pot."
        : "Not enough position or strength to continue profitably.";
    } else if (["AJo", "ATo", "KQo", "KJo", "QJo"].includes(h)) {
      best = late(s.heroPos) && inPosition ? "Call" : "Fold";
      category = "Domination risk";
      explanation = "Offsuit broadways can be traps versus opens, especially out of position.";
    }
  }

  if (s.type === "vs_3bet") {
    const big3bet = s.threeBetSize >= 15;

    if (["AA", "KK"].includes(h)) {
      best = s.stack <= 60 ? "Jam" : "4Bet";
      category = "Top range";
      explanation = "Top of range. Continue aggressively for value.";
    } else if (["QQ", "AKs", "AKo"].includes(h)) {
      best = s.stack <= 50 ? "Jam" : "4Bet";
      category = "Commit range";
      explanation = "Strong enough to apply maximum pressure and deny equity.";
    } else if (["JJ", "TT", "AQs", "KQs"].includes(h)) {
      best = big3bet || s.stack <= 30 ? "Fold" : "Call";
      category = "Close continue";
      explanation = best === "Call"
        ? "Strong enough to call versus reasonable sizing, especially with playability."
        : "Sizing and stack depth make this a poor realization spot.";
    } else {
      best = "Fold";
      category = "Avoid spew";
      explanation = "Versus 3bets, dominated hands and speculative hands lose value fast. Discipline matters here.";
    }
  }

  return { best, category, explanation };
}

function scenarioText(s) {
  if (s.type === "unopened") return `Folds to you in ${s.heroPos}.`;
  if (s.type === "vs_open") return `${s.opener} opens to ${s.openSize}bb. You are in ${s.heroPos}.`;
  return `${s.opener} opens ${s.openSize}bb, ${s.threeBettor} 3bets to ${s.threeBetSize}bb. You are in ${s.heroPos}.`;
}

export default function App() {
  const [seen] = useState(() => new Set());
  const [scenario, setScenario] = useState(() => generateScenario(new Set()));
  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    hands: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    leaks: {}
  });

  const result = selected ? solve(scenario) : null;
  const actionList = useMemo(() => actions(scenario.type), [scenario]);

  function choose(action) {
    if (selected) return;

    const answer = solve(scenario);
    const isCorrect = action === answer.best;

    setSelected(action);

    setStats(prev => {
      const leakName = isCorrect ? null : answer.category;
      const leaks = { ...prev.leaks };

      if (leakName) leaks[leakName] = (leaks[leakName] || 0) + 1;

      const streak = isCorrect ? prev.streak + 1 : 0;

      return {
        hands: prev.hands + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
        leaks
      };
    });
  }

  function next() {
    setScenario(generateScenario(seen));
    setSelected(null);
    setShowDetails(false);
  }

  function reset() {
    seen.clear();
    setScenario(generateScenario(seen));
    setSelected(null);
    setShowDetails(false);
    setStats({ hands: 0, correct: 0, streak: 0, bestStreak: 0, leaks: {} });
  }

  const accuracy = stats.hands ? Math.round((stats.correct / stats.hands) * 100) : 0;
  const topLeak = Object.entries(stats.leaks).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07111f",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: 14,
      maxWidth: 460,
      margin: "0 auto"
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
        <div>
          <div style={{fontSize:12, color:"#94a3b8", letterSpacing:1}}>MOBILE MODE</div>
          <div style={{fontSize:22, fontWeight:900}}>WSOP Preflop Trainer</div>
        </div>
        <button onClick={reset} style={smallBtn}>Reset</button>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12}}>
        <Stat label="Hands" value={stats.hands} />
        <Stat label="Acc" value={`${accuracy}%`} />
        <Stat label="Streak" value={stats.streak} />
        <Stat label="Best" value={stats.bestStreak} />
      </div>

      <div style={{
        background:"white",
        color:"#0f172a",
        borderRadius:24,
        padding:20,
        marginBottom:14,
        boxShadow:"0 12px 30px rgba(0,0,0,.25)"
      }}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:18}}>
          <div>
            <div style={{fontSize:12, color:"#64748b", fontWeight:700}}>HAND</div>
            <div style={{fontSize:54, fontWeight:900, lineHeight:1}}>{scenario.hand}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={pill}>{scenario.heroPos}</div>
            <div style={{fontWeight:800, marginTop:8}}>{scenario.stack}bb</div>
          </div>
        </div>

        <div style={{
          background:"#e2e8f0",
          padding:14,
          borderRadius:16,
          fontSize:18,
          fontWeight:800,
          lineHeight:1.25
        }}>
          {scenarioText(scenario)}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
        {actionList.map(a => (
          <button
            key={a}
            onClick={() => choose(a)}
            disabled={!!selected}
            style={{
              height:64,
              borderRadius:18,
              border:"none",
              fontSize:19,
              fontWeight:900,
              background:selected === a ? "#fbbf24" : "#e2e8f0",
              color:"#0f172a",
              opacity:selected && selected !== a ? .55 : 1
            }}
          >
            {a}
          </button>
        ))}
      </div>

      {selected && (
        <div style={{
          marginTop:14,
          background:"#111827",
          borderRadius:22,
          padding:16,
          border:"1px solid #334155"
        }}>
          <div style={{
            fontSize:18,
            fontWeight:900,
            color:selected === result.best ? "#22c55e" : "#ef4444",
            marginBottom:8
          }}>
            {selected === result.best ? "✅ Correct" : "❌ Miss"}
          </div>

          <div style={{fontSize:16, marginBottom:8}}>
            Your answer: <b>{selected}</b>
          </div>

          <div style={{fontSize:16, marginBottom:10}}>
            Best answer: <b>{result.best}</b>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              width:"100%",
              height:44,
              borderRadius:14,
              border:"none",
              background:"#334155",
              color:"white",
              fontWeight:800,
              marginBottom: showDetails ? 10 : 0
            }}
          >
            {showDetails ? "Hide Explanation" : "Show Explanation"}
          </button>

          {showDetails && (
            <div style={{color:"#cbd5e1", lineHeight:1.35}}>
              <div><b>Category:</b> {result.category}</div>
              <div style={{marginTop:6}}>{result.explanation}</div>
            </div>
          )}

          {topLeak && (
            <div style={{
              marginTop:12,
              background:"#1e293b",
              padding:12,
              borderRadius:14,
              fontSize:14,
              color:"#cbd5e1"
            }}>
              Biggest leak so far: <b>{topLeak[0]}</b> ({topLeak[1]} misses)
            </div>
          )}

          <button
            onClick={next}
            style={{
              marginTop:14,
              width:"100%",
              height:64,
              borderRadius:18,
              border:"none",
              fontSize:22,
              fontWeight:900,
              background:"#22c55e",
              color:"#052e16"
            }}
          >
            Next Hand
          </button>
        </div>
      )}

      <div style={{textAlign:"center", fontSize:12, color:"#64748b", marginTop:14}}>
        No exact repeat spots · mobile speed mode
      </div>
    </div>
  );
}

function Stat({label, value}) {
  return (
    <div style={{
      background:"#111827",
      border:"1px solid #334155",
      borderRadius:14,
      padding:9,
      textAlign:"center"
    }}>
      <div style={{fontSize:11, color:"#94a3b8"}}>{label}</div>
      <div style={{fontSize:18, fontWeight:900}}>{value}</div>
    </div>
  );
}

const pill = {
  display:"inline-block",
  background:"#0f172a",
  color:"white",
  padding:"7px 12px",
  borderRadius:999,
  fontWeight:900
};

const smallBtn = {
  background:"#1e293b",
  color:"white",
  border:"1px solid #475569",
  borderRadius:12,
  padding:"9px 12px",
  fontWeight:800
};

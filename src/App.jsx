import React, { useEffect, useState } from "react";

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Button({ children, onClick, disabled = false, className = "", variant = "default" }) {
  const base = "px-3 py-2 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "secondary"
      ? "bg-slate-200 text-slate-900 hover:bg-slate-300"
      : variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

function Badge({ children, className = "", variant = "default" }) {
  const styles = variant === "secondary" ? "bg-slate-200 text-slate-900" : "bg-blue-600 text-white";
  return <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold ${styles} ${className}`}>{children}</span>;
}

function Progress({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

const positions = ["UTG", "UTG+1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"];
const actions = ["OPEN", "JAM", "3-BET", "3-BET JAM", "CALL", "FOLD"];
const strategyModes = ["Live Exploit", "Balanced"];
const difficultyModes = ["Standard", "Tough Spots", "Leak Finder"];
const drillModes = ["Normal", "Speed"];
const rebuyModes = ["Rebuy Aware", "Ignore Rebuy"];
const tableTypes = ["Standard", "Soft/Passive", "Loose/Gambly", "Aggressive Regs", "Tight/Scared"];
const tournamentPhases = ["Auto", "Day 1 Rebuy", "Day 1 Post-Reg", "Day 2 Bounty"];

function autoTournamentPhase(level) {
  if (!level) return "Day 1 Rebuy";
  if (level.level <= 10) return "Day 1 Rebuy";
  return "Day 1 Post-Reg";
}
const postflopActions = ["C-BET", "CHECK", "JAM", "GIVE UP"];
const flopTextures = [
  { name: "A72 rainbow", type: "highDry", favors: "opener" },
  { name: "K83 rainbow", type: "highDry", favors: "opener" },
  { name: "Q64 rainbow", type: "highDry", favors: "opener" },
  { name: "J75 rainbow", type: "medium", favors: "neutral" },
  { name: "T86 two-tone", type: "connected", favors: "caller" },
  { name: "987 two-tone", type: "connected", favors: "caller" },
  { name: "765 rainbow", type: "lowConnected", favors: "caller" },
  { name: "KQ5 two-tone", type: "broadway", favors: "opener" },
  { name: "QJ4 rainbow", type: "broadway", favors: "opener" },
  { name: "332 rainbow", type: "pairedDry", favors: "opener" },
];
const userRebuyCutoffLevel = 7; // User preference: do not rebuy after Level 7.

const modeInfo = {
  "Live Exploit": "Day 1 WSOP field: steal more versus tight/passive players, respect tight big opens, punish limps, and avoid thin jams into loose callers.",
  Balanced: "Baseline tournament ranges with fewer live-field exploit assumptions.",
};

function rebuyInfo(level, rebuyMode = "Rebuy Aware") {
  if (rebuyMode !== "Rebuy Aware") return { active: false, userWillRebuy: false, label: "Rebuy ignored", adjustment: 0 };
  const active = level.level <= 10;
  const userWillRebuy = level.level <= userRebuyCutoffLevel;
  if (!active) return { active: false, userWillRebuy: false, label: "Registration closed", adjustment: -2 };
  if (userWillRebuy) return { active: true, userWillRebuy: true, label: "Rebuy active — you still allow rebuy", adjustment: 4 };
  return { active: true, userWillRebuy: false, label: "Rebuy active — you do NOT want to rebuy now", adjustment: 7 };
}

function rebuyWarningText(level, rebuyMode = "Rebuy Aware") {
  const info = rebuyInfo(level, rebuyMode);
  if (rebuyMode !== "Rebuy Aware") return null;
  if (level.level <= userRebuyCutoffLevel) return "Early rebuy period: field may gamble/call wider. You still allow yourself to rebuy at this level.";
  if (level.level <= 10) return "Late rebuy window: your plan is no rebuy after Level 7, and many players will also avoid rebuying short. Fold equity increases, especially versus passive/tight stacks.";
  return "Registration closed: field usually tightens, fold equity improves.";
}

const levels = [
  { level: 1, sb: 100, bb: 200, stage: "Early" },
  { level: 2, sb: 200, bb: 300, stage: "Early" },
  { level: 3, sb: 200, bb: 400, stage: "Early" },
  { level: 4, sb: 300, bb: 500, stage: "Early" },
  { level: 5, sb: 300, bb: 600, stage: "Early" },
  { level: 6, sb: 400, bb: 800, stage: "Early" },
  { level: 7, sb: 500, bb: 1000, stage: "Pressure" },
  { level: 8, sb: 600, bb: 1200, stage: "Pressure" },
  { level: 9, sb: 1000, bb: 1500, stage: "Pressure" },
  { level: 10, sb: 1000, bb: 2000, stage: "Pressure" },
  { level: 11, sb: 1000, bb: 2500, stage: "Critical" },
  { level: 12, sb: 1500, bb: 3000, stage: "Critical" },
  { level: 13, sb: 2000, bb: 4000, stage: "Critical" },
  { level: 14, sb: 3000, bb: 5000, stage: "Critical" },
  { level: 15, sb: 3000, bb: 6000, stage: "Push/Fold" },
  { level: 16, sb: 4000, bb: 8000, stage: "Push/Fold" },
  { level: 17, sb: 5000, bb: 10000, stage: "Push/Fold" },
  { level: 18, sb: 6000, bb: 12000, stage: "Push/Fold" },
  { level: 19, sb: 10000, bb: 15000, stage: "Push/Fold" },
  { level: 20, sb: 10000, bb: 20000, stage: "Push/Fold" },
  { level: 21, sb: 10000, bb: 25000, stage: "Push/Fold" },
  { level: 22, sb: 15000, bb: 30000, stage: "Push/Fold" },
];

const stageInfo = {
  Early: "Build stack phase",
  Pressure: "Steal + resteal phase",
  Critical: "Open/jam/3-bet jam zone",
  "Push/Fold": "Jam or fold only",
};

const stackLabels = ["Short", "Average", "Big"];
const playerTypes = ["tight", "loose", "passive", "aggressive", "unknown"];

const handBuckets = {
  premium: ["AA", "KK", "QQ", "JJ", "AKs", "AKo"],
  strong: ["TT", "99", "AQs", "AQo", "AJs", "KQs"],
  medium: ["88", "77", "66", "ATs", "AJo", "KJs", "QJs"],
  blocker: ["A5s", "A4s", "A3s", "A2s", "KTs", "A9o", "ATo"],
  speculative: ["55", "44", "33", "22", "JTs", "T9s", "98s", "87s"],
  weakSteal: ["A8o", "A7s", "K9s", "KTo", "QTs", "Q9s", "J9s", "T8s"],
  trash: ["K7o", "Q8o", "J7s", "T7s", "96s", "85s", "74s", "A2o"],
};

const allHands = Object.values(handBuckets).flat();
const toughHands = ["AJo", "ATo", "KTs", "K9s", "QJs", "QTs", "JTs", "T9s", "A5s", "A4s", "66", "55", "44", "33", "AQo", "AQs"];

function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick(arr, seed, fallback = null) {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const idx = Math.floor(rand(seed) * arr.length);
  return arr[idx] ?? fallback;
}

function bucketOf(hand) {
  const found = Object.entries(handBuckets).find(([, hands]) => hands.includes(hand));
  return found ? found[0] : "trash";
}

function isSuited(hand) {
  return typeof hand === "string" && hand.endsWith("s");
}

function isOffsuit(hand) {
  return typeof hand === "string" && hand.endsWith("o");
}

function handScore(hand) {
  const scores = { premium: 100, strong: 85, medium: 68, blocker: 55, speculative: 45, weakSteal: 36, trash: 15 };
  let base = scores[bucketOf(hand)] || 15;
  if (isSuited(hand)) base += 4;
  if (isOffsuit(hand)) base -= 2;
  return base;
}

function posRank(pos) {
  return positions.indexOf(pos);
}

function isLate(pos) {
  return ["CO", "BTN", "SB"].includes(pos);
}

function isEarly(pos) {
  return ["UTG", "UTG+1", "MP"].includes(pos);
}

function fmt(n) {
  return Number(n || 0).toLocaleString();
}

function MiniIcon({ label }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[11px] text-white">{label}</span>;
}

function stackBBFor(stage, label, seed) {
  if (stage === "Early") {
    if (label === "Short") return Math.round(22 + rand(seed) * 18);
    if (label === "Average") return Math.round(40 + rand(seed) * 35);
    return Math.round(75 + rand(seed) * 75);
  }
  if (stage === "Pressure") {
    if (label === "Short") return Math.round(12 + rand(seed) * 10);
    if (label === "Average") return Math.round(23 + rand(seed) * 17);
    return Math.round(41 + rand(seed) * 45);
  }
  if (stage === "Critical") {
    if (label === "Short") return Math.round(8 + rand(seed) * 8);
    if (label === "Average") return Math.round(17 + rand(seed) * 11);
    return Math.round(29 + rand(seed) * 35);
  }
  if (label === "Short") return Math.round(4 + rand(seed) * 7);
  if (label === "Average") return Math.round(12 + rand(seed) * 9);
  return Math.round(22 + rand(seed) * 28);
}

function stackClass(bb) {
  if (bb <= 12) return "Short";
  if (bb <= 30) return "Average";
  return "Big";
}

function makeTable(level, heroPos, seed) {
  const table = {};
  positions.forEach((pos, idx) => {
    const label = pick(stackLabels, seed + idx * 97, "Average");
    const bb = stackBBFor(level.stage, label, seed + idx * 101);
    table[pos] = { pos, label: stackClass(bb), bb, chips: bb * level.bb, type: pos === heroPos ? "hero" : pick(playerTypes, seed + idx * 103, "unknown") };
  });
  return table;
}

function playersBehind(heroPos) {
  const idx = posRank(heroPos);
  return idx < 0 ? [] : positions.slice(idx + 1);
}

function safePlayer(table, pos) {
  if (!table || !pos || !table[pos]) return null;
  return table[pos];
}

function openSizeFor(type, seed = 1) {
  const r = rand(seed);
  if (type === "loose") return r < 0.4 ? "3.0x" : "2.5x";
  if (type === "passive") return r < 0.25 ? "3.5x" : "2.0x";
  if (type === "aggressive") return r < 0.3 ? "2.7x" : "2.1x";
  return r < 0.15 ? "3.0x" : "2.1x";
}

function parseOpenSize(prior) {
  const match = String(prior || "").match(/opens to ([0-9.]+)x/);
  return match ? Number(match[1]) : 2.1;
}

function playerAdjustmentFacingOpen(type, mode) {
  if (mode !== "Live Exploit") return 0;
  if (type === "loose" || type === "aggressive") return -6;
  if (type === "tight") return 8;
  if (type === "passive") return 5;
  return 0;
}

function tableTypeAdjustment(tableType, spot = "open") {
  // Negative = widen / more aggressive. Positive = tighten.
  if (tableType === "Soft/Passive") {
    if (spot === "open") return -4;
    if (spot === "jam") return -4; // passive players overfold to jams
    if (spot === "callOff") return 4;
    return 0;
  }
  if (tableType === "Loose/Gambly") {
    if (spot === "jam") return 6; // less fold equity; tighten thin jams
    if (spot === "callOff") return 4;
    return 2;
  }
  if (tableType === "Aggressive Regs") {
    if (spot === "open") return 4; // open/fold less into reshove pressure
    if (spot === "jam") return -3; // deny reshoves by open-jamming more
    if (spot === "resteal") return -3;
    return 2;
  }
  if (tableType === "Tight/Scared") {
    if (spot === "open") return -6;
    if (spot === "jam") return -6;
    return 0;
  }
  return 0;
}

function phaseAdjustment(phase, spot = "open", heroCovers = false, levelNumber = 1) {
  if (phase === "Day 1 Rebuy") {
    const lateRebuy = levelNumber >= 8 && levelNumber <= 10;
    const earlyRebuy = levelNumber <= 7;

    if (earlyRebuy) {
      if (spot === "thinJam") return heroCovers ? 3 : 6; // early: more gambling/calling
      if (spot === "value") return -3; // value gets paid
      if (spot === "steal") return 1;
    }

    if (lateRebuy) {
      if (spot === "thinJam") return heroCovers ? -2 : -4; // late: field overfolds, rebuy unattractive
      if (spot === "value") return -1;
      if (spot === "steal") return -5;
    }
  }

  if (phase === "Day 1 Post-Reg") {
    if (spot === "thinJam") return -3;
    if (spot === "steal") return -3;
  }

  if (phase === "Day 2 Bounty") {
    if (spot === "callOff" && heroCovers) return -5;
    if (spot === "callOff" && !heroCovers) return 5;
    if (spot === "thinJam") return heroCovers ? -2 : 3;
  }

  return 0;
}

function actionConfidence(freqs, best) {
  const vals = Object.values(freqs).filter((v) => v > 0).sort((a, b) => b - a);
  if (!vals.length) return "High";
  if (vals[0] >= 80) return "High";
  if (vals[0] >= 60) return "Medium";
  return "Mixed";
}

function acceptableActions(freqs) {
  return Object.entries(freqs)
    .filter(([, pct]) => pct >= 25)
    .map(([action]) => action);
}

function scoreSelection(selected, best, freqs) {
  if (selected === best) return { label: "Best", credit: 1 };
  if (acceptableActions(freqs).includes(selected)) return { label: "Close / mixed", credit: 0.5 };
  return { label: "Wrong", credit: 0 };
}

function normalizeFrequencies(freqs) {
  const legalTotal = Object.values(freqs).reduce((a, b) => a + b, 0);
  if (!legalTotal) return freqs;
  const out = {};
  Object.entries(freqs).forEach(([k, v]) => {
    if (v > 0) out[k] = Math.max(0, Math.round((v / legalTotal) * 100));
  });
  return out;
}

function getActionFrequencies(s, best, mode = "Live Exploit", rebuyMode = "Rebuy Aware", tableType = "Standard", phase = "Day 1 Rebuy") {
  const legal = legalActionsForScenario(s);
  const bb = s.hero?.bb || 0;
  const p = s.heroPos;
  const hand = s.hand;
  const score = handScore(hand);
  const facingOpen = hasOpen(s.prior);
  const facingLimp = hasLimp(s.prior);
  const villain = s.villain;
  const villainPos = s.villainPos;
  const openTiny = parseOpenSize(s.prior) <= 2.0;
  const passiveVillain = villain?.type === "passive";
  const lateVillain = villainPos && ["CO", "BTN", "SB"].includes(villainPos);
  const heroInPosition = villainPos ? posRank(p) > posRank(villainPos) : false;
  const freqs = {};
  legal.forEach((a) => (freqs[a] = 0));

  freqs[best] = 100;

  // Phase-aware practical adjustment: post-reg fold equity increases; bounty phase creates more mixed call/jam spots.
  const heroCovers = villain ? bb > villain.bb : false;
  if (phase === "Day 2 Bounty" && facingOpen && heroCovers && legal.includes("CALL") && legal.includes("3-BET JAM") && score >= 55) {
    // Mystery bounty exploit: covering villain adds bounty equity, but don't torch chips with trash.
    const shortVillain = villain && villain.bb <= 20;
    freqs[best] = shortVillain ? 45 : 60;
    freqs["3-BET JAM"] = Math.max(freqs["3-BET JAM"] || 0, shortVillain ? 40 : 25);
    freqs.CALL = Math.max(freqs.CALL || 0, shortVillain ? 15 : 15);
    return normalizeFrequencies(freqs);
  }

  // Mixed spot overrides — useful for real poker study.
  if (facingOpen && bb >= 50 && heroInPosition && passiveVillain && openTiny && ["AQo", "AJs", "KQs", "KJs", "QJs", "JTs"].includes(hand)) {
    freqs.CALL = hand === "AQo" ? 70 : 80;
    freqs["3-BET"] = hand === "AQo" ? 30 : 20;
    return normalizeFrequencies(freqs);
  }

  if (facingOpen && p === "BB" && lateVillain && bb >= 60 && passiveVillain && openTiny && isSuited(hand) && score >= 80) {
    freqs.CALL = 70;
    freqs["3-BET"] = 30;
    return normalizeFrequencies(freqs);
  }

  if (!facingOpen && !facingLimp && bb >= 16 && bb <= 22 && isLate(p) && ["55", "66", "77", "88", "A5s", "A4s", "KTs", "K9s", "QTs", "JTs", "T9s", "98s", "87s"].includes(hand)) {
    freqs.JAM = tableType === "Tight/Scared" ? 80 : tableType === "Loose/Gambly" ? 55 : phase === "Day 1 Post-Reg" ? 78 : phase === "Day 2 Bounty" ? 72 : 70;
    freqs.OPEN = 100 - freqs.JAM;
    return normalizeFrequencies(freqs);
  }

  if (!facingOpen && !facingLimp && bb >= 18 && bb <= 24 && ["AKs", "AKo", "AQs", "AQo", "QQ", "KK", "AA"].includes(hand)) {
    freqs.OPEN = 80;
    freqs.JAM = 20;
    return normalizeFrequencies(freqs);
  }

  if (facingLimp && bb > 40 && isLate(p) && score >= 34) {
    freqs.OPEN = 90;
    if (legal.includes("CALL")) freqs.CALL = 10;
    return normalizeFrequencies(freqs);
  }

  return normalizeFrequencies(freqs);
}

function frequencySummary(freqs) {
  return Object.entries(freqs)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}%`)
    .join(" / ");
}

function chooseFlop(seed) {
  return pick(flopTextures, seed * 91 + 7, flopTextures[0]);
}

function solvePostflop(preflopScenario, flop, action) {
  const hand = preflopScenario.hand;
  const hasAceOrKing = hand.includes("A") || hand.includes("K");
  const isPremiumPair = ["AA", "KK", "QQ"].includes(hand);
  const shallow = getEffectiveBB(preflopScenario) <= 22;
  let best = "CHECK";
  let reason = "Default to pot control when equity realization is unclear.";

  if (flop.favors === "opener" && (hasAceOrKing || isPremiumPair)) {
    best = shallow && isPremiumPair ? "JAM" : "C-BET";
    reason = "You keep range advantage on this board. Small c-bet prints folds; premium made hands can commit shallow.";
  } else if (flop.type === "connected" || flop.type === "lowConnected") {
    best = "CHECK";
    reason = "This board hits the caller more. Avoid torching chips with automatic c-bets.";
  } else if (flop.type === "broadway" && hasAceOrKing) {
    best = "C-BET";
    reason = "Broadway/high-card texture favors the preflop aggressor and gives strong overcard/backdoor pressure.";
  } else if (flop.type === "pairedDry") {
    best = "C-BET";
    reason = "Paired dry boards are good small-c-bet boards because caller misses often.";
  }

  return {
    best,
    correct: action === best,
    reason,
  };
}

function buildReviewExport(history, leaks, attempted, correct, accuracy) {
  const lines = [];
  lines.push("WSOP Mini Mystery Preflop Trainer - Hand Review");
  lines.push(`Session: ${correct}/${attempted} correct (${accuracy}%)`);
  lines.push(`Leaks: missed jams ${leaks.missedJams}, over-folds ${leaks.overFolds}, passive calls ${leaks.passiveCalls}, over-aggressive punts ${leaks.overAggro}, other ${leaks.other}`);
  lines.push("");
  history.forEach((h, idx) => {
    lines.push(`#${idx + 1}: ${h.scenario.heroPos} ${h.scenario.hand} @ ${h.scenario.hero.bb}BB | Level ${h.scenario.level.level}`);
    lines.push(`Action: ${h.scenario.prior}`);
    lines.push(`Selected: ${h.selected} | Best: ${h.answer} | ${h.correct ? "Correct" : "Wrong"}`);
    lines.push(`Mistake: ${h.mistake}`);
    lines.push("---");
  });
  return lines.join("\n");
}

function hasOpen(prior) {
  return /opens/.test(String(prior || ""));
}

function hasLimp(prior) {
  return /limp/.test(String(prior || ""));
}

function legalActionsForScenario(scenario) {
  const facingOpen = hasOpen(scenario?.prior);
  const facingLimp = hasLimp(scenario?.prior);
  if (facingOpen) return ["3-BET", "3-BET JAM", "CALL", "FOLD"];
  if (facingLimp) return ["OPEN", "JAM", "CALL", "FOLD"];
  return ["OPEN", "JAM", "FOLD"];
}

function isoRaiseSize(limpCount) {
  return `${3 + limpCount}BB`;
}

function isoOpenThreshold(pos, bb, limpCount, mode) {
  const liveBonus = mode === "Live Exploit" ? Math.min(10, limpCount * 4) : Math.min(4, limpCount * 2);
  if (bb > 40) {
    if (pos === "BTN") return 30 - liveBonus;
    if (pos === "CO") return 34 - liveBonus;
    if (pos === "HJ" || pos === "LJ") return 45 - liveBonus;
    return 55 - liveBonus;
  }
  if (bb > 30) {
    if (pos === "BTN") return 34 - liveBonus;
    if (pos === "CO") return 38 - liveBonus;
    if (pos === "HJ" || pos === "LJ") return 48 - liveBonus;
    return 58 - liveBonus;
  }
  if (bb > 15) {
    if (pos === "BTN" || pos === "CO") return 42 - liveBonus;
    if (pos === "HJ" || pos === "LJ") return 52 - liveBonus;
    return 62 - liveBonus;
  }
  return 999;
}

function limpJamThreshold(pos, bb, limpCount, mode) {
  const liveBonus = mode === "Live Exploit" ? Math.min(10, limpCount * 4) : Math.min(4, limpCount * 2);
  if (bb <= 7) return (isEarly(pos) ? 36 : 28) - liveBonus;
  if (bb <= 12) return (isLate(pos) ? 36 : 45) - liveBonus;
  if (bb <= 15) return (isLate(pos) ? 42 : 50) - liveBonus;
  if (bb <= 25) return (isLate(pos) ? 58 : 68) - liveBonus;
  return 999;
}

function generateScenario(i, difficulty = "Standard") {
  const level = pick(levels, i * 11 + 3, levels[0]);
  const heroPos = pick(positions, i * 17 + 7, "MP");
  const handPool = difficulty === "Tough Spots" ? toughHands : allHands;
  const hand = pick(handPool, i * 19 + 9, "AJo");
  const table = makeTable(level, heroPos, i * 29 + 13);
  const hero = table[heroPos];
  const r = rand(i * 31 + 15);

  let prior = "Folded to you";
  let villainPos = null;
  let villain = null;
  let limpers = [];

  const limpChance = difficulty === "Tough Spots" ? 0.3 : 0.22;
  if (heroPos === "BB") {
    villainPos = pick(["CO", "BTN", "SB"], i * 37 + 17, "BTN");
    villain = safePlayer(table, villainPos);
    prior = villain ? `${villain.type} ${villainPos} (${villain.bb}BB) opens to ${openSizeFor(villain.type, i * 37 + 18)}` : "Folded to you in BB";
  } else if (heroPos === "SB") {
    if (r < 0.5) {
      const bbPlayer = safePlayer(table, "BB");
      prior = `Folded to you in SB; BB has ${bbPlayer ? bbPlayer.bb : "?"}BB and is ${bbPlayer ? bbPlayer.type : "unknown"}`;
    } else {
      villainPos = pick(["CO", "BTN"], i * 41 + 19, "BTN");
      villain = safePlayer(table, villainPos);
      prior = villain ? `${villain.type} ${villainPos} (${villain.bb}BB) opens to ${openSizeFor(villain.type, i * 41 + 20)}` : "Folded to you in SB";
    }
  } else if (r < limpChance) {
    const earlier = positions.slice(0, Math.max(0, posRank(heroPos)));
    limpers = earlier.slice(0, Math.min(difficulty === "Tough Spots" ? 3 : 2, earlier.length)).filter((_, idx) => rand(i * 53 + idx) > 0.35);
    prior = limpers.length > 0 ? `${limpers.join(" and ")} ${limpers.length > 1 ? "limp" : "limps"}; action on you` : "Folded to you";
  } else if (r < 0.62) {
    const behind = playersBehind(heroPos).map((p) => `${p} ${table[p].bb}BB`).join(", ");
    prior = behind ? `Folded to you; behind: ${behind}` : "Folded to you";
  } else {
    const earlier = positions.slice(0, Math.max(0, posRank(heroPos)));
    villainPos = pick(earlier, i * 43 + 21, null);
    villain = safePlayer(table, villainPos);
    if (villain) prior = `${villain.type} ${villainPos} (${villain.bb}BB) opens to ${openSizeFor(villain.type, i * 43 + 22)}`;
    else {
      const behind = playersBehind(heroPos).map((p) => `${p} ${table[p].bb}BB`).join(", ");
      prior = behind ? `Folded to you; behind: ${behind}` : "Folded to you";
    }
  }

  return { id: i, level, heroPos, hand, table, hero, prior, villain, villainPos, limpers };
}

function solve(s, mode = "Live Exploit", rebuyMode = "Rebuy Aware", tableType = "Standard", phase = "Day 1 Rebuy") {
  const bb = s.hero ? s.hero.bb : 0;
  const score = handScore(s.hand);
  const bucket = bucketOf(s.hand);
  const p = s.heroPos;
  const facingOpen = hasOpen(s.prior);
  const facingLimp = hasLimp(s.prior);
  const villain = s.villain;
  const villainPos = s.villainPos;
  const lateVillain = villainPos && ["CO", "BTN", "SB"].includes(villainPos);
  const looseVillain = villain && ["loose", "aggressive"].includes(villain.type);
  const passiveVillain = villain && villain.type === "passive";
  const coverVillain = villain ? bb > villain.bb : false;
  const coveredByVillain = villain ? bb < villain.bb : false;
  const behind = playersBehind(p).map((x) => s.table[x]).filter(Boolean);
  const shortBehind = behind.filter((x) => x.bb <= 15).length;
  const bigBehind = behind.filter((x) => x.bb >= Math.max(35, bb + 8)).length;
  const tightPassiveBehind = behind.filter((x) => ["tight", "passive"].includes(x.type)).length;
  const looseAggroBehind = behind.filter((x) => ["loose", "aggressive"].includes(x.type)).length;
  const openSize = parseOpenSize(s.prior);
  const openTooBig = openSize >= 3;
  const openTiny = openSize <= 2.0;
  const liveFacingAdj = playerAdjustmentFacingOpen(villain ? villain.type : null, mode);
  const rebuy = rebuyInfo(s.level, rebuyMode);
  const rebuyPenalty = mode === "Live Exploit" ? rebuy.adjustment : Math.ceil(rebuy.adjustment / 2);
  const openTableAdj = mode === "Live Exploit" ? tableTypeAdjustment(tableType, "open") : 0;
  const jamTableAdj = mode === "Live Exploit" ? tableTypeAdjustment(tableType, "jam") : 0;
  const restealTableAdj = mode === "Live Exploit" ? tableTypeAdjustment(tableType, "resteal") : 0;
  const heroCoversVillain = villain ? bb > villain.bb : false;
  const coverBehindCount = behind.filter((x) => bb > x.bb).length;
  const coveredByBehindCount = behind.filter((x) => bb < x.bb).length;
  const bountyCoverAdj = phase === "Day 2 Bounty" ? (coverBehindCount >= 2 ? -5 : coverBehindCount === 1 ? -3 : coveredByBehindCount >= 2 ? 4 : 0) : 0;
  const thinJamPhaseAdj = phaseAdjustment(phase, "thinJam", heroCoversVillain, s.level.level) + bountyCoverAdj;
  const valuePhaseAdj = phaseAdjustment(phase, "value", heroCoversVillain, s.level.level);

  if (!facingOpen && !facingLimp && bb <= 7) {
    const threshold = isEarly(p) ? 45 : p === "LJ" || p === "HJ" ? 36 : p === "CO" ? 28 : p === "BTN" ? 20 : 15;
    if (score >= threshold) return ["JAM", `Level ${s.level.level}, ${bb}BB: emergency stack. The BB ante makes the pot too valuable. From ${p}, ${s.hand} should jam.`];
    return ["FOLD", `Level ${s.level.level}, ${bb}BB: emergency stack, but ${s.hand} is still too weak from ${p}.`];
  }

  if (facingLimp) {
    const limpCount = s.limpers && s.limpers.length ? s.limpers.length : 1;
    const isoSize = isoRaiseSize(limpCount);
    const jamThreshold = limpJamThreshold(p, bb, limpCount, mode);
    const openThreshold = isoOpenThreshold(p, bb, limpCount, mode);
    if (bb <= 25 && score >= jamThreshold) return ["JAM", `At ${bb}BB over ${limpCount} limper(s), jam and punish dead money. Live Day 1 limpers overfold and call off poorly.`];
    if (bb <= 15) return ["FOLD", `At ${bb}BB over limpers, avoid passive calls. ${s.hand} is not strong enough to jam from ${p}.`];
    if (score >= openThreshold) return ["OPEN", `Iso-raise over ${limpCount} limper(s). Suggested size: about ${isoSize}. From ${p} at ${bb}BB, ${s.hand} is strong enough to isolate rather than overlimp.`];
    return ["FOLD", `Facing ${limpCount} limper(s), ${s.hand} is not strong enough to iso from ${p}. Do not overlimp weak hands in this fast structure.`];
  }

  if (!facingOpen && p === "SB") {
    const bbPlayer = s.table.BB;
    const bbType = bbPlayer ? bbPlayer.type : "unknown";
    const bbExploit = mode === "Live Exploit" && ["tight", "passive"].includes(bbType) ? -6 : mode === "Live Exploit" && ["loose", "aggressive"].includes(bbType) ? 4 : 0;
    if (bb <= 20) {
      if (score >= 28 + bbExploit) return ["JAM", `SB vs BB at ${bb}BB: jam wide. BB has ${bbPlayer ? bbPlayer.bb : "?"}BB and is ${bbType}; deny equity and use fold equity.`];
      return ["FOLD", `Too weak even for SB jam range at ${bb}BB.`];
    }
    if (score >= 25 + bbExploit) return ["OPEN", "Folded to SB. Open wide to 2.5x-3x, especially if BB is tight/passive. Tight/passive BBs overfold in live fields."];
    return ["FOLD", "Weak hand; okay to give up from SB despite only one player behind."];
  }

  if (facingOpen) {
    let adjustment = 0;
    if (coverVillain) adjustment -= 4;
    if (coveredByVillain) adjustment += 4;
    if (looseVillain) adjustment -= 5;
    adjustment += liveFacingAdj;
    adjustment += phaseAdjustment(phase, "callOff", heroCoversVillain, s.level.level);
    if (phase === "Day 2 Bounty" && heroCoversVillain && villain && villain.bb <= 20) adjustment -= 4;
    if (phase === "Day 2 Bounty" && coveredByVillain) adjustment += 4;
    if (openTooBig) adjustment += mode === "Live Exploit" && villain && villain.type === "loose" ? 2 : 8;
    if (openTiny && lateVillain) adjustment -= 3;

    if (bb <= 15) {
      const threshold = (lateVillain ? 50 : 78) + adjustment;
      if (score >= threshold) return ["3-BET JAM", `Facing ${villainPos}'s open at ${bb}BB: no flatting. ${coverVillain ? "You cover villain, so pressure improves." : coveredByVillain ? "Villain covers you, so stay tighter." : "Stacks are similar."}`];
      return ["FOLD", `Do not call at ${bb}BB. ${s.hand} is not strong enough to 3-bet jam versus ${villainPos}.`];
    }

    if (bb <= 30) {
      const shortLateOpen = lateVillain && villain && villain.bb <= 18;
      const shortLateValueJam = shortLateOpen && ["AJo", "AQo", "AQs", "AJs", "ATs", "KQs", "77", "88", "99", "TT", "JJ"].includes(s.hand);
      const primeResteal = lateVillain && (bucket === "blocker" || ["55", "66", "77", "88", "99", "ATo", "AJo", "AQo", "KQs", "KJs"].includes(s.hand) || score >= 68);
      if (shortLateValueJam) return ["3-BET JAM", `Versus a short ${villainPos} open (${villain.bb}BB), ${s.hand} is strong enough to jam for value/protection. Do not flat from ${p}.`];
      if (primeResteal && score >= 42 + adjustment + restealTableAdj) return ["3-BET JAM", `Prime resteal: ${bb}BB vs ${villainPos} open (${villain ? villain.bb : "?"}BB). Blockers/pairs/broadways perform well as jams.`];
      if (!lateVillain && score >= 85 + adjustment) return ["3-BET JAM", `Against earlier opens, keep 3-bet jams value-heavy. ${s.hand} qualifies.`];
      return ["FOLD", `Avoid flats at ${bb}BB. Not enough to 3-bet jam profitably versus ${villainPos}'s open.`];
    }

    if (bb <= 45) {
      if (score >= 85 + adjustment) return ["3-BET", "Normal value 3-bet. Size around 3x in position, 3.5x-4x out of position."];
      if (lateVillain && looseVillain && ["blocker", "strong"].includes(bucket)) return ["3-BET", `Good blocker/pressure 3-bet versus a ${villain ? villain.type : "loose"} ${villainPos} opener.`];
      if (p === "BB" && lateVillain && score >= 36 + adjustment) return ["CALL", "BB gets a price versus late opens. Defend playable hands when stacks are deep enough."];
      return ["FOLD", `Not strong enough to continue versus this open at ${bb}BB.`];
    }

    if (p === "BB" && lateVillain && passiveVillain && openTiny && isSuited(s.hand) && score >= 80 && bb >= 60) return ["CALL", "Deep BB versus passive late-position min-open: suited broadways like AQs realize equity well, keep dominated hands in, and can be mixed as calls."];

    // Deep live MTT flatting branch: not every strong hand must become a 3-bet.
    // In position versus a small passive open, AQo/AJs/KQs/QJs can realize equity well,
    // keep dominated hands in, and avoid isolating against only stronger continue ranges.
    const heroInPosition = posRank(p) > posRank(villainPos || "UTG");
    const squeezeRiskBehind = behind.filter((x) => ["loose", "aggressive"].includes(x.type) || x.bb <= 30).length;
    const deepIpFlatHands = ["AQo", "AJs", "KQs", "KJs", "QJs", "JTs"];
    if (
      heroInPosition &&
      bb >= 50 &&
      openTiny &&
      passiveVillain &&
      !isEarly(p) &&
      deepIpFlatHands.includes(s.hand) &&
      squeezeRiskBehind <= 2
    ) {
      return ["CALL", `Deep IP versus passive ${villainPos} min-open: ${s.hand} plays well as a flat. You keep dominated hands in and avoid turning it into a thin value 3-bet.`];
    }

    if (score >= 85 + adjustment) return ["3-BET", "Deep enough for a normal value 3-bet."];
    if (p === "BB" && lateVillain && score >= 30 + adjustment) return ["CALL", "BB defense is correct versus late opens when deep enough and priced in."];
    if (p === "SB") return ["FOLD", "SB should mostly 3-bet or fold. Avoid flatting out of position."];
    if (score >= 45 + adjustment && lateVillain) return ["CALL", "Playable versus a late open with position/price."];
    return ["FOLD", "Default fold versus open."];
  }

  if (bb <= 15) {
    let threshold = isEarly(p) ? 58 : p === "LJ" || p === "HJ" ? 46 : p === "CO" ? 34 : p === "BTN" ? 28 : 24;
    if (shortBehind >= 3) threshold += 2;

    // Push/fold correction: at 8-15BB, rebuy dynamics should not make us pass up
    // profitable late-position jams, especially when the players behind are passive/tight.
    const passiveBehind = behind.filter((x) => ["tight", "passive"].includes(x.type)).length;
    const aggroBehind = behind.filter((x) => ["loose", "aggressive"].includes(x.type)).length;
    const pushFoldRebuyPenalty = Math.max(0, Math.min(4, rebuyPenalty + thinJamPhaseAdj) - passiveBehind * 2 + aggroBehind * 2);

    if (score >= threshold + jamTableAdj + pushFoldRebuyPenalty) return ["JAM", `Level ${s.level.level}, ${bb}BB: push/fold. ${s.hand} clears the jam range from ${p}. ${rebuy.active ? "Rebuy is active, so expect some lighter calls, but passive/tight players behind still create fold equity." : "Registration is closed, so fold equity improves."}`];
    return ["FOLD", `Level ${s.level.level}, ${bb}BB: jam/fold only. ${s.hand} is below range from ${p}.`];
  }

  if (bb <= 25) {
    const openerPenalty = (shortBehind >= 2 ? 4 : 0) + (bigBehind >= 1 ? 4 : 0) + (mode === "Live Exploit" ? Math.max(0, looseAggroBehind - tightPassiveBehind) * 2 : 0) + rebuyPenalty + jamTableAdj + thinJamPhaseAdj;
    if (isLate(p) && ["blocker", "speculative", "weakSteal"].includes(bucket) && score >= 36 + openerPenalty) return ["JAM", `Late position at ${bb}BB: this hand plays well as an open-jam, especially with reshove stacks behind.`];
    const openThreshold = (isEarly(p) ? 68 : isLate(p) ? 42 : 52) + openerPenalty + openTableAdj;
    if (score >= openThreshold) return ["OPEN", `Open 2.0x. Strong enough to raise; not mandatory to open-jam from ${p}.`];
    return ["FOLD", `Fold. Not enough hand strength/fold equity from ${p} with these stacks behind.`];
  }

  if (bb <= 40) {
    const threshold = (isEarly(p) ? 68 : isLate(p) ? 36 : 50) + (mode === "Live Exploit" && isLate(p) ? -Math.min(6, tightPassiveBehind * 2) : 0) + openTableAdj;
    if (score >= threshold + Math.max(0, Math.floor(rebuyPenalty / 2))) return ["OPEN", `Open 2.0x-2.2x. You have ${bb}BB; pressure matters, but open-jamming this depth is usually unnecessary. ${rebuy.active ? "Rebuy dynamics can increase resistance." : "No more rebuys means more fold equity."}`];
    return ["FOLD", `Below opening range for ${p}.`];
  }

  const threshold = (isEarly(p) ? 68 : isLate(p) ? 30 : 45) + (mode === "Live Exploit" && isLate(p) ? -Math.min(8, tightPassiveBehind * 2) : 0) + openTableAdj;
  if (score >= threshold + Math.max(0, Math.floor(rebuyPenalty / 2))) return ["OPEN", "Open 2.2x. Early levels: build pots with playable hands. If table is loose/passive and hand is value-heavy, 2.5x is fine. Rebuy dynamics may make players stickier."];
  return ["FOLD", `Too loose for ${p} this deep. Preserve chips and attack better spots.`];
}

function mistakeLabel(selected, best, scenario) {
  if (selected === best) return "Good execution";
  const bb = scenario.hero ? scenario.hero.bb : 0;
  if (best === "JAM" && selected === "FOLD") return bb <= 7 ? "Critical missed emergency jam" : "Missed profitable shove";
  if (best === "FOLD" && (selected === "CALL" || selected === "OPEN")) return "Loose/passive chip leak";
  if (best === "3-BET JAM" && selected === "CALL") return "Flatting leak — missed fold equity";
  if (best === "FOLD" && selected && selected.includes("JAM")) return "Over-aggressive punt risk";
  if (best === "OPEN" && selected === "JAM") return "Unnecessary shove — preserves less edge";
  if (best === "CALL" && selected === "FOLD") return "Over-fold / missed defend";
  return "Low-EV deviation";
}

function leakKey(selected, best) {
  if (!selected || selected === best) return "correct";
  if ((best === "JAM" || best === "3-BET JAM") && selected === "FOLD") return "missedJams";
  if (best === "FOLD" && selected !== "FOLD") return "overAggro";
  if (best === "CALL" && selected === "FOLD") return "overFolds";
  if ((best === "3-BET" || best === "3-BET JAM") && selected === "CALL") return "passiveCalls";
  return "other";
}

function getEffectiveBB(s) {
  if (!s.villain) return s.hero.bb;
  return Math.min(s.hero.bb, s.villain.bb);
}

function getWarnings(s, rebuyMode = "Rebuy Aware") {
  const behind = playersBehind(s.heroPos).map((p) => s.table[p]).filter(Boolean);
  const shortBehind = behind.filter((x) => x.bb <= 15);
  const aggroBehind = behind.filter((x) => ["aggressive", "loose"].includes(x.type));
  const warnings = [];
  if (shortBehind.length >= 2) warnings.push(`${shortBehind.length} reshove stacks behind`);
  if (aggroBehind.length >= 2) warnings.push(`${aggroBehind.length} loose/aggressive players behind`);
  if (s.villain && s.villain.bb > s.hero.bb) warnings.push("villain covers you");
  if (hasLimp(s.prior)) warnings.push("dead money from limpers");
  const rebuyWarn = rebuyWarningText(s.level, rebuyMode);
  if (rebuyWarn) warnings.push(rebuyWarn);
  return warnings;
}

function getRangeView(s, answer) {
  const bb = s.hero.bb;
  if (hasLimp(s.prior)) {
    return {
      hero: bb <= 25 ? "Jam range over limps: 55+, A9o+, A5s+, KTs+, QJs, strong broadways" : "Iso range late/deep: pairs, suited aces, broadways, suited connectors, strong Kx/Qx on BTN/CO",
      villain: "Typical limp range: small pairs, weak Ax, suited kings, broadways, suited connectors, random traps rarely",
    };
  }
  if (hasOpen(s.prior)) {
    return {
      hero: answer.includes("JAM") ? "Resteal jam range: pairs, Axs blockers, ATo+, KQs/KJs depending opener" : "Continue range: value 3-bets, suited broadway calls in BB, folds vs tight/large early opens",
      villain: s.villainPos ? `${s.villainPos} open range: tighter early, much wider CO/BTN/SB; type=${s.villain?.type || "unknown"}` : "Opener range depends heavily on position and type",
    };
  }
  return {
    hero: bb <= 15 ? "Open-jam range: pairs, Ax, broadways, suited connectors wider late" : "Open range: tight early, wide CO/BTN/SB, avoid loose opens with reshove stacks behind",
    villain: "Players behind: defend tighter if tight/passive, reshove more if short/aggressive",
  };
}

function matrixStatusForHand(hand, scenario, answer) {
  const score = handScore(hand);
  const bb = scenario.hero.bb;
  const p = scenario.heroPos;
  const facingOpen = hasOpen(scenario.prior);
  const facingLimp = hasLimp(scenario.prior);

  if (hand === scenario.hand) return "hero";

  if (facingOpen) {
    if (answer === "FOLD") return score >= 85 ? "mix" : "fold";
    if (answer === "CALL") return isSuited(hand) && score >= 68 ? "play" : score >= 85 ? "mix" : "fold";
    if (answer === "3-BET" || answer === "3-BET JAM") return score >= 85 ? "play" : score >= 55 && isSuited(hand) ? "mix" : "fold";
  }

  if (facingLimp) {
    if (bb <= 25) return score >= 55 ? "play" : score >= 40 && isLate(p) ? "mix" : "fold";
    return score >= 45 || (isLate(p) && score >= 34) ? "play" : score >= 30 && isLate(p) ? "mix" : "fold";
  }

  if (bb <= 15) return score >= (isLate(p) ? 36 : 60) ? "play" : score >= 45 ? "mix" : "fold";
  if (bb <= 40) return score >= (isLate(p) ? 36 : isEarly(p) ? 68 : 50) ? "play" : score >= 45 ? "mix" : "fold";
  return score >= (isLate(p) ? 30 : isEarly(p) ? 68 : 45) ? "play" : score >= 40 ? "mix" : "fold";
}

function RangeMatrix({ scenario, answer }) {
  const rows = [
    ["AA", "AKs", "AQs", "AJs", "ATs", "A5s"],
    ["KK", "AKo", "AQo", "AJo", "ATo", "A4s"],
    ["QQ", "KQs", "KJs", "KTs", "K9s", "A3s"],
    ["JJ", "KQo", "QJs", "QTs", "Q9s", "A2s"],
    ["TT", "99", "88", "77", "66", "55"],
    ["44", "33", "22", "JTs", "T9s", "98s"],
  ];
  const colorFor = (status) => {
    if (status === "hero") return "bg-blue-600 text-white ring-2 ring-blue-300";
    if (status === "play") return "bg-green-700 text-white";
    if (status === "mix") return "bg-amber-500 text-slate-950";
    return "bg-red-900 text-white";
  };

  return (
    <div className="mt-4 bg-white/60 rounded-xl p-3 text-sm">
      <div className="font-bold mb-2">Range Matrix</div>
      <div className="grid grid-cols-6 gap-1">
        {rows.flat().map((hand) => {
          const status = matrixStatusForHand(hand, scenario, answer);
          return <div key={hand} className={`${colorFor(status)} text-center rounded-md py-1 text-xs font-semibold`}>{hand}</div>;
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 text-xs">
        <span className="px-2 py-1 rounded bg-green-700 text-white">Play</span>
        <span className="px-2 py-1 rounded bg-amber-500 text-slate-950">Mix / close</span>
        <span className="px-2 py-1 rounded bg-red-900 text-white">Fold</span>
        <span className="px-2 py-1 rounded bg-blue-600 text-white">Your hand</span>
      </div>
    </div>
  );
}

function getEVExplanation(s, answer) {
  const effective = getEffectiveBB(s);
  const warnings = getWarnings(s);
  const lines = [];
  if (answer.includes("JAM")) {
    lines.push("Fold equity is the main profit driver; you deny opponents the chance to realize equity.");
    lines.push(`Effective stack is about ${effective}BB, so all-in pressure matters more than postflop edge.`);
  } else if (answer === "OPEN") {
    lines.push("Opening/iso-raising keeps your range strong while risking less than a jam.");
    lines.push("You can still fold to heavy resistance when stack depth allows it.");
  } else if (answer === "3-BET") {
    lines.push("3-betting gets value from worse hands and denies equity while keeping worse continuing ranges in.");
    lines.push(`At ${effective}BB effective, a non-all-in 3-bet preserves postflop flexibility.`);
  } else if (answer === "CALL") {
    lines.push("Calling is selected because price/playability/equity realization are strong enough.");
    lines.push("Suited hands and BB defense spots realize equity better than offsuit dominated hands.");
  } else {
    lines.push("Folding avoids reverse-implied-odds and dominated-hand problems.");
    lines.push("This saves chips for better fold-equity spots in a fast Day 1 structure.");
  }
  if (warnings.length) lines.push(`Warning factors: ${warnings.join(", ")}.`);
  return lines;
}

function generateAnswer(question, scenario, correctAction, explanation, mode = "Live Exploit") {
  const q = question.toLowerCase();
  if ((q.includes("why not") || q.includes("instead")) && /limp/.test(String(scenario.prior || ""))) return `Because this is an iso-raise decision, not an overlimp decision. Correct action is ${correctAction}. ${explanation}`;
  if (q.includes("range")) {
    const rv = getRangeView(scenario, correctAction);
    return `Hero range: ${rv.hero}. Villain/player-pool range: ${rv.villain}.`;
  }
  if (q.includes("ev") || q.includes("equity")) return getEVExplanation(scenario, correctAction).join(" ");
  if (q.includes("why not") || q.includes("instead")) return `Because ${correctAction} fits the stack depth and position better here. ${explanation}`;
  if (q.includes("jam") || q.includes("shove")) return `At ${scenario.hero.bb}BB, jam value comes from fold equity plus realizing all your hand equity. ${explanation}`;
  if (q.includes("call")) return `Calling is usually avoided at ${scenario.hero.bb}BB unless you are BB getting a price or deep enough to realize equity. ${explanation}`;
  if (q.includes("size") || q.includes("sizing")) return "Default open sizing is 2.0x-2.2x. SB can use 2.5x-3x deeper. Non-all-in 3-bets are about 3x IP and 3.5x-4x OOP.";
  return `Key factors: position (${scenario.heroPos}), stack (${scenario.hero.bb}BB), prior action (${scenario.prior}), effective stack (${getEffectiveBB(scenario)}BB), and strategy mode (${mode}).`;
}

function makeTestScenario(overrides = {}) {
  const level = overrides.level || { level: 18, sb: 6000, bb: 12000, stage: "Push/Fold" };
  const heroPos = overrides.heroPos || "MP";
  const table = makeTable(level, heroPos, 999);
  if (overrides.heroBB) table[heroPos] = { ...table[heroPos], bb: overrides.heroBB, chips: overrides.heroBB * level.bb, label: stackClass(overrides.heroBB), type: "hero" };
  return { id: 10000, level, heroPos, hand: overrides.hand || "JTs", table, hero: table[heroPos], prior: overrides.prior || "Folded to you", villain: overrides.villain || null, villainPos: overrides.villainPos || null, limpers: overrides.limpers || [] };
}

function runSelfTests() {
  const results = [];
  const assert = (name, condition) => results.push({ name, passed: Boolean(condition) });
  assert("positions has 9 seats", positions.length === 9);
  assert("levels has 22 Day 1 levels", levels.length === 22 && levels[0].level === 1 && levels[21].level === 22);
  assert("allHands is populated", allHands.length > 20);
  assert("suited hands score higher than offsuit equivalent bucket", handScore("AQs") > handScore("AQo"));

  const generated = Array.from({ length: 1000 }, (_, idx) => generateScenario(idx + 1));
  assert("generates 1000 test scenarios", generated.length === 1000);
  assert("scenario IDs are unique in test batch", new Set(generated.map((s) => s.id)).size === 1000);
  assert("all scenarios have hero stack", generated.every((s) => s.hero && s.hero.bb > 0 && s.hero.chips > 0));
  assert("all scenarios have table positions", generated.every((s) => positions.every((p) => s.table[p])));
  assert("all stages represented", ["Early", "Pressure", "Critical", "Push/Fold"].every((stage) => generated.some((s) => s.level.stage === stage)));
  assert("all scenarios solve without throwing", generated.every((s) => actions.includes(solve(s)[0])));
  assert("all scenarios solve in Balanced mode", generated.every((s) => actions.includes(solve(s, "Balanced")[0])));
  assert("all solved actions are legal for scenario", generated.every((s) => legalActionsForScenario(s).includes(solve(s)[0])));

  const emergencyJTs = makeTestScenario({ heroPos: "MP", heroBB: 4, hand: "JTs", prior: "Folded to you" });
  assert("4BB MP JTs folded to hero is a jam", solve(emergencyJTs)[0] === "JAM");

  const sbJam = makeTestScenario({ heroPos: "SB", heroBB: 15, hand: "Q9s", prior: "Folded to you in SB; BB has 18BB and is tight" });
  assert("SB 15BB Q9s folded to hero is a jam", solve(sbJam)[0] === "JAM");

  const bbFacingOpen = makeTestScenario({ heroPos: "BB", heroBB: 25, hand: "A5s" });
  bbFacingOpen.villainPos = "BTN";
  bbFacingOpen.villain = { pos: "BTN", bb: 22, chips: 264000, type: "loose" };
  bbFacingOpen.prior = "loose BTN (22BB) opens to 2.5x";
  assert("BB 25BB A5s vs loose BTN open is 3-bet jam", solve(bbFacingOpen)[0] === "3-BET JAM");

  const limpPunish = makeTestScenario({ heroPos: "CO", heroBB: 12, hand: "AJs", prior: "UTG limps; action on you", limpers: ["UTG"] });
  assert("12BB AJs over limp is a jam", solve(limpPunish)[0] === "JAM");

  const utgNoVillain = makeTestScenario({ heroPos: "UTG", heroBB: 35, hand: "K7o", prior: "Folded to you" });
  assert("UTG folded-to no villain does not crash", actions.includes(solve(utgNoVillain)[0]));

  const oversizedTightOpen = makeTestScenario({ heroPos: "HJ", heroBB: 28, hand: "A5s" });
  oversizedTightOpen.villainPos = "UTG";
  oversizedTightOpen.villain = { pos: "UTG", bb: 40, chips: 480000, type: "tight" };
  oversizedTightOpen.prior = "tight UTG (40BB) opens to 3.5x";
  assert("Oversized tight early open is respected", solve(oversizedTightOpen, "Live Exploit")[0] === "FOLD");

  const btnK9sIso = makeTestScenario({ level: { level: 11, sb: 1000, bb: 2500, stage: "Critical" }, heroPos: "BTN", heroBB: 60, hand: "K9s", prior: "UTG and UTG+1 limp; action on you", limpers: ["UTG", "UTG+1"] });
  assert("BTN 60BB K9s over two limpers is an iso open", solve(btnK9sIso, "Live Exploit")[0] === "OPEN");

  const coT9sIso = makeTestScenario({ level: { level: 8, sb: 600, bb: 1200, stage: "Pressure" }, heroPos: "CO", heroBB: 45, hand: "T9s", prior: "UTG limps; action on you", limpers: ["UTG"] });
  assert("CO 45BB T9s over one limper is an iso open", solve(coT9sIso, "Live Exploit")[0] === "OPEN");

  const mpK9sNoIso = makeTestScenario({ level: { level: 8, sb: 600, bb: 1200, stage: "Pressure" }, heroPos: "MP", heroBB: 45, hand: "K9s", prior: "UTG limps; action on you", limpers: ["UTG"] });
  assert("MP 45BB K9s over UTG limp is not an automatic iso", solve(mpK9sNoIso, "Live Exploit")[0] === "FOLD");

  const deepBBAQs = makeTestScenario({ level: { level: 4, sb: 300, bb: 500, stage: "Early" }, heroPos: "BB", heroBB: 130, hand: "AQs", prior: "passive CO (60BB) opens to 2.0x" });
  deepBBAQs.villainPos = "CO";
  deepBBAQs.villain = { pos: "CO", bb: 60, chips: 30000, type: "passive" };
  assert("Deep BB AQs vs passive CO min-open can call", solve(deepBBAQs, "Live Exploit")[0] === "CALL");

  const deepBBAQo = makeTestScenario({ level: { level: 4, sb: 300, bb: 500, stage: "Early" }, heroPos: "BB", heroBB: 130, hand: "AQo", prior: "passive CO (60BB) opens to 2.0x" });
  deepBBAQo.villainPos = "CO";
  deepBBAQo.villain = { pos: "CO", bb: 60, chips: 30000, type: "passive" };
  assert("Deep BB AQo vs passive CO min-open leans 3-bet", solve(deepBBAQo, "Live Exploit")[0] === "3-BET");

  const deepHJAQoVsPassiveMP = makeTestScenario({
    level: { level: 5, sb: 300, bb: 600, stage: "Early" },
    heroPos: "HJ",
    heroBB: 69,
    hand: "AQo",
    prior: "passive MP (94BB) opens to 2.0x",
  });
  deepHJAQoVsPassiveMP.villainPos = "MP";
  deepHJAQoVsPassiveMP.villain = { pos: "MP", bb: 94, chips: 56400, type: "passive" };
  deepHJAQoVsPassiveMP.table.CO = { ...deepHJAQoVsPassiveMP.table.CO, bb: 27, chips: 16200, type: "tight" };
  deepHJAQoVsPassiveMP.table.BTN = { ...deepHJAQoVsPassiveMP.table.BTN, bb: 60, chips: 36000, type: "loose" };
  deepHJAQoVsPassiveMP.table.SB = { ...deepHJAQoVsPassiveMP.table.SB, bb: 58, chips: 34800, type: "unknown" };
  deepHJAQoVsPassiveMP.table.BB = { ...deepHJAQoVsPassiveMP.table.BB, bb: 142, chips: 85200, type: "unknown" };
  assert("Deep HJ AQo vs passive MP min-open can call", solve(deepHJAQoVsPassiveMP, "Live Exploit")[0] === "CALL");

  assert("EV explanation returns multiple lines", getEVExplanation(deepBBAQs, "CALL").length >= 2);
  assert("Range view returns hero and villain text", Boolean(getRangeView(deepBBAQs, "CALL").hero && getRangeView(deepBBAQs, "CALL").villain));

  const lateRebuyCOk9s = makeTestScenario({
    level: { level: 9, sb: 1000, bb: 1500, stage: "Pressure" },
    heroPos: "CO",
    heroBB: 12,
    hand: "K9s",
    prior: "Folded to you; behind: BTN 64BB, SB 19BB, BB 12BB",
  });
  lateRebuyCOk9s.table.BTN = { ...lateRebuyCOk9s.table.BTN, bb: 64, chips: 96000, type: "passive" };
  lateRebuyCOk9s.table.SB = { ...lateRebuyCOk9s.table.SB, bb: 19, chips: 28500, type: "passive" };
  lateRebuyCOk9s.table.BB = { ...lateRebuyCOk9s.table.BB, bb: 12, chips: 18000, type: "passive" };
  assert("Level 9 CO 12BB K9s into passive stacks is a jam", solve(lateRebuyCOk9s, "Live Exploit", "Rebuy Aware", "Soft/Passive", "Day 1 Rebuy")[0] === "JAM");

  assert("Late rebuy thin-jam adjustment is wider than early rebuy", phaseAdjustment("Day 1 Rebuy", "thinJam", false, 9) < phaseAdjustment("Day 1 Rebuy", "thinJam", false, 3));
  assert("Soft/passive table widens jams", tableTypeAdjustment("Soft/Passive", "jam") < 0);

  return results;
}

const selfTests = runSelfTests();

function randomSeed() {
  return Math.floor(Math.random() * 1000000000);
}

function generateRandomScenario(stageMode = "all", difficulty = "Standard") {
  let scenario = generateScenario(randomSeed(), difficulty);
  let guard = 0;
  while (stageMode !== "all" && scenario.level.stage !== stageMode && guard < 300) {
    scenario = generateScenario(randomSeed(), difficulty);
    guard += 1;
  }
  return scenario;
}

function StatBox({ label, value }) {
  return <div className="bg-slate-800 rounded-2xl p-3"><div className="text-slate-400">{label}</div><div className="text-xl font-bold">{value}</div></div>;
}

function InfoBox({ label, children, className = "" }) {
  return <div className={`bg-slate-100 rounded-2xl p-5 ${className}`}><div className="text-slate-500 text-sm">{label}</div>{children}</div>;
}

function summarizeLeaks(leaks) {
  const entries = [
    ["Missed jams", leaks.missedJams],
    ["Over-folds", leaks.overFolds],
    ["Passive calls", leaks.passiveCalls],
    ["Over-aggressive punts", leaks.overAggro],
    ["Other", leaks.other],
  ];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? `${top[0]} (${top[1]})` : "No leak detected yet";
}

function sessionRecommendation(leaks, attempted, accuracy) {
  if (attempted < 10) return "Play at least 10 hands for a useful report.";
  const top = summarizeLeaks(leaks);
  if (top.startsWith("Missed jams")) return "Study 7–20BB open-jam and 3-bet jam spots. You are leaving fold equity on the table.";
  if (top.startsWith("Over-folds")) return "Drill BB defense and suited-hand calls versus late-position opens.";
  if (top.startsWith("Passive calls")) return "Work on converting calls into 3-bet jams when stacks are 15–30BB.";
  if (top.startsWith("Over-aggressive")) return "Tighten off versus early opens and oversized live opens.";
  if (accuracy >= 80) return "Strong session. Move to Tough Spots or Speed mode.";
  return "Keep working Standard mode until decisions feel automatic.";
}

function SessionReport({ attempted, correct, accuracy, leaks, history }) {
  const recentMistakes = history.filter((h) => !h.correct).slice(0, 3);
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-2xl">
      <CardContent className="p-5 text-slate-200 text-sm space-y-3">
        <div className="font-bold text-white text-lg">Session Report</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800 rounded-xl p-3"><div className="text-slate-400">Hands</div><div className="text-xl font-bold">{attempted}</div></div>
          <div className="bg-slate-800 rounded-xl p-3"><div className="text-slate-400">Score</div><div className="text-xl font-bold">{Number(correct.toFixed(1))}/{attempted}</div></div>
          <div className="bg-slate-800 rounded-xl p-3"><div className="text-slate-400">Accuracy</div><div className="text-xl font-bold">{accuracy}%</div></div>
        </div>
        <div><strong>Top leak:</strong> {summarizeLeaks(leaks)}</div>
        <div><strong>Recommendation:</strong> {sessionRecommendation(leaks, attempted, accuracy)}</div>
        <div className="pt-2 border-t border-slate-700">
          <div className="font-semibold text-white mb-2">Recent mistakes</div>
          {recentMistakes.length === 0 ? <div className="text-slate-400">No recent mistakes.</div> : recentMistakes.map((h, idx) => (
            <div key={idx} className="rounded-xl p-3 bg-red-900/30 mb-2">
              <div className="font-semibold">{h.scenario.heroPos} {h.scenario.hand} · {h.scenario.hero.bb}BB</div>
              <div>{h.selected} → best {h.answer}</div>
              <div className="text-slate-300">{h.mistake}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WSOPPreflopTrainer() {
  const [index, setIndex] = useState(1);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [stageMode, setStageMode] = useState("all");
  const [strategyMode, setStrategyMode] = useState("Live Exploit");
  const [rebuyMode, setRebuyMode] = useState("Rebuy Aware");
  const [tournamentPhase, setTournamentPhase] = useState("Auto");
  const [tableType, setTableType] = useState("Standard");
  const [difficultyMode, setDifficultyMode] = useState("Standard");
  const [drillMode, setDrillMode] = useState("Normal");
  const [showTests, setShowTests] = useState(false);
  const [showRange, setShowRange] = useState(true);
  const [showEV, setShowEV] = useState(true);
  const [qa, setQa] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [scenario, setScenario] = useState(() => generateRandomScenario("all", "Standard"));
  const [history, setHistory] = useState([]);
  const [leaks, setLeaks] = useState({ missedJams: 0, overFolds: 0, passiveCalls: 0, overAggro: 0, other: 0 });
  const [timeLeft, setTimeLeft] = useState(5);
  const [postflop, setPostflop] = useState(null);
  const [postflopAnswer, setPostflopAnswer] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const activeTournamentPhase = tournamentPhase === "Auto" ? autoTournamentPhase(scenario.level) : tournamentPhase;
  const [answer, explanation] = solve(scenario, strategyMode, rebuyMode, tableType, activeTournamentPhase);
  const legalActions = legalActionsForScenario(scenario);
  const isCorrect = selected === answer;
  const behindList = playersBehind(scenario.heroPos).map((p) => scenario.table[p]).filter(Boolean);
  const passedTests = selfTests.filter((t) => t.passed).length;
  const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
  const potBefore = scenario.level.sb + scenario.level.bb + scenario.level.bb;
  const effectiveBB = getEffectiveBB(scenario);
  const warnings = getWarnings(scenario, rebuyMode);
  const rangeView = getRangeView(scenario, answer);
  const evLines = getEVExplanation(scenario, answer);
  const actionFreqs = getActionFrequencies(scenario, answer, strategyMode, rebuyMode, tableType, activeTournamentPhase);
  const selectionScore = answered ? scoreSelection(selected, answer, actionFreqs) : null;
  const displayCorrect = answered ? (selectionScore?.credit || 0) > 0 : isCorrect;
  const answerBannerText = selectionScore?.label === "Close / mixed" ? "Acceptable mixed action" : displayCorrect ? "Correct" : "Not quite";
  const confidence = actionConfidence(actionFreqs, answer);
  const exportText = buildReviewExport(history, leaks, attempted, correct, accuracy);

  useEffect(() => {
    if (drillMode !== "Speed" || answered) return;
    setTimeLeft(5);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          choose("FOLD");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scenario.id, drillMode, answered]);

  function choose(action) {
    if (answered) return;
    setSelected(action);
    setAnswered(true);
    setAttempted((x) => x + 1);
    const freqsForAction = getActionFrequencies(scenario, answer, strategyMode, rebuyMode, tableType, activeTournamentPhase);
    const scored = scoreSelection(action, answer, freqsForAction);
    if (scored.credit > 0) setCorrect((x) => x + scored.credit);
    const key = scored.credit > 0 ? "correct" : leakKey(action, answer);
    if (key !== "correct") setLeaks((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    setHistory((prev) => [{ scenario, selected: action, answer, correct: scored.credit > 0, mistake: scored.label === "Close / mixed" ? "Acceptable mixed action" : mistakeLabel(action, answer, scenario) }, ...prev].slice(0, 8));
    const shouldShowPostflop = ["OPEN", "CALL", "3-BET"].includes(answer) && scenario.hero.bb >= 16;
    if (shouldShowPostflop) {
      setPostflop({ flop: chooseFlop(scenario.id + index), preflopAction: answer });
      setPostflopAnswer(null);
    } else {
      setPostflop(null);
      setPostflopAnswer(null);
    }
  }

  function next() {
    setAnswered(false);
    setSelected(null);
    setCurrentQuestion("");
    setPostflop(null);
    setPostflopAnswer(null);
    setScenario(generateRandomScenario(stageMode, difficultyMode));
    setIndex((x) => x + 1);
  }

  function reset() {
    setIndex(1);
    setScenario(generateRandomScenario(stageMode, difficultyMode));
    setAnswered(false);
    setSelected(null);
    setPostflop(null);
    setPostflopAnswer(null);
    setCorrect(0);
    setAttempted(0);
    setLeaks({ missedJams: 0, overFolds: 0, passiveCalls: 0, overAggro: 0, other: 0 });
    setHistory([]);
    setCurrentQuestion("");
  }

  function shuffle() {
    setScenario(generateRandomScenario(stageMode, difficultyMode));
    setIndex((x) => x + 1);
    setAnswered(false);
    setSelected(null);
    setCurrentQuestion("");
    setPostflop(null);
    setPostflopAnswer(null);
  }

  function changeStage(m) {
    setStageMode(m);
    setScenario(generateRandomScenario(m, difficultyMode));
    setIndex(1);
    setAnswered(false);
    setSelected(null);
    setPostflop(null);
    setPostflopAnswer(null);
  }

  function changeDifficulty(m) {
    setDifficultyMode(m);
    setScenario(generateRandomScenario(stageMode, m));
    setIndex(1);
    setAnswered(false);
    setSelected(null);
    setPostflop(null);
    setPostflopAnswer(null);
  }

  function submitQuestion() {
    const trimmed = currentQuestion.trim();
    if (!trimmed) return;
    const entry = { q: trimmed, a: generateAnswer(trimmed, scenario, answer, explanation, strategyMode) };
    setQa((prev) => ({ ...prev, [scenario.id]: [...(prev[scenario.id] || []), entry] }));
    setCurrentQuestion("");
  }

  const positionColor = isLate(scenario.heroPos) ? "text-green-700" : isEarly(scenario.heroPos) ? "text-red-700" : "text-amber-700";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">WSOP Mini Mystery Preflop Trainer</h1>
            <p className="text-slate-300 mt-2">Infinite Day 1 trainer with exploit logic, EV/range feedback, speed drills, leak tracking, and hand review.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={shuffle} variant="secondary" className="rounded-2xl"><MiniIcon label="S" /><span className="ml-2">New Hand</span></Button>
            <Button onClick={reset} variant="secondary" className="rounded-2xl"><MiniIcon label="R" /><span className="ml-2">Reset</span></Button>
            <Button onClick={() => setShowTests((v) => !v)} variant="secondary" className="rounded-2xl"><MiniIcon label="T" /><span className="ml-2">Tests {passedTests}/{selfTests.length}</span></Button>
          </div>
        </div>

        {showTests ? (
          <Card className="bg-slate-900 border-slate-800 rounded-2xl">
            <CardContent className="p-5">
              <div className="font-bold mb-3">Self-tests</div>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                {selfTests.map((t) => <div key={t.name} className={t.passed ? "rounded-xl p-3 bg-green-900/40" : "rounded-xl p-3 bg-red-900/40"}>{t.passed ? "PASS" : "FAIL"} · {t.name}</div>)}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="bg-slate-900 border-slate-800 shadow-xl rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {strategyModes.map((m) => <Button key={m} onClick={() => setStrategyMode(m)} variant={strategyMode === m ? "default" : "secondary"} className="rounded-2xl">{m}</Button>)}
              {rebuyModes.map((m) => <Button key={m} onClick={() => setRebuyMode(m)} variant={rebuyMode === m ? "default" : "secondary"} className="rounded-2xl">{m}</Button>)}
              {tableTypes.map((m) => <Button key={m} onClick={() => setTableType(m)} variant={tableType === m ? "default" : "secondary"} className="rounded-2xl">{m}</Button>)}
              {tournamentPhases.map((m) => <Button key={m} onClick={() => setTournamentPhase(m)} variant={tournamentPhase === m ? "default" : "secondary"} className="rounded-2xl">{m === "Auto" ? `Auto (${activeTournamentPhase})` : m}</Button>) }
              {difficultyModes.map((m) => <Button key={m} onClick={() => changeDifficulty(m)} variant={difficultyMode === m ? "default" : "secondary"} className="rounded-2xl">{m}</Button>)}
              {drillModes.map((m) => <Button key={m} onClick={() => setDrillMode(m)} variant={drillMode === m ? "default" : "secondary"} className="rounded-2xl">{m}</Button>)}
            </div>
            <div className="text-sm text-slate-300">{modeInfo[strategyMode]}</div>
            <div className="flex flex-wrap gap-2">
              {["all", "Early", "Pressure", "Critical", "Push/Fold"].map((m) => <Button key={m} onClick={() => changeStage(m)} variant={stageMode === m ? "default" : "secondary"} className="rounded-2xl">{m === "all" ? "All stages" : m}</Button>)}
              <Button onClick={() => setShowRange((v) => !v)} variant={showRange ? "default" : "secondary"} className="rounded-2xl">Range View</Button>
              <Button onClick={() => setShowEV((v) => !v)} variant={showEV ? "default" : "secondary"} className="rounded-2xl">EV Explain</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
              <StatBox label="Hand" value={`#${index}`} />
              <StatBox label="Mode" value={drillMode} />
              <StatBox label="Timer" value={drillMode === "Speed" && !answered ? `${timeLeft}s` : "—"} />
              <StatBox label="Score" value={`${Number(correct.toFixed(1))}/${attempted}`} />
              <StatBox label="Accuracy" value={`${accuracy}%`} />
              <StatBox label="Top Leak" value={summarizeLeaks(leaks)} />
            </div>
            <Progress value={attempted === 0 ? 0 : Math.min(100, (correct / Math.max(1, attempted)) * 100)} />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="bg-white text-slate-950 rounded-3xl shadow-2xl lg:col-span-2">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="text-sm rounded-xl">Level {scenario.level.level}</Badge>
                <Badge variant="secondary" className="text-sm rounded-xl">{scenario.level.stage}: {stageInfo[scenario.level.stage]}</Badge>
                <Badge variant="secondary" className="text-sm rounded-xl">BB Ante {fmt(scenario.level.bb)}</Badge>
                <Badge variant="secondary" className="text-sm rounded-xl">Blinds {fmt(scenario.level.sb)}/{fmt(scenario.level.bb)}</Badge>
                <Badge variant="secondary" className="text-sm rounded-xl">Effective {effectiveBB}BB</Badge>
                <Badge variant="secondary" className="text-sm rounded-xl">{rebuyInfo(scenario.level, rebuyMode).label}</Badge>
                <Badge variant="secondary" className="text-sm rounded-xl">{activeTournamentPhase}</Badge>
              </div>

              {warnings.length ? <div className="rounded-2xl bg-amber-100 text-amber-900 p-4 text-sm font-semibold">⚠ {warnings.join(" · ")}</div> : null}

              <div className="grid md:grid-cols-4 gap-4">
                <InfoBox label="Your position"><div className={`text-3xl font-bold ${positionColor}`}>{scenario.heroPos}</div></InfoBox>
                <InfoBox label="Your hand"><div className="text-3xl font-bold">{scenario.hand}</div></InfoBox>
                <InfoBox label="Your stack"><div className="text-2xl font-bold">{fmt(scenario.hero.chips)}</div><div className="text-slate-500">{scenario.hero.bb}BB · {scenario.hero.label}</div></InfoBox>
                <InfoBox label="Pot before action"><div className="text-2xl font-bold">{fmt(potBefore)}</div><div className="text-slate-500">SB + BB + BB ante</div></InfoBox>
              </div>

              <div className="bg-slate-100 rounded-2xl p-5">
                <div className="text-slate-500 text-sm mb-1">Action before you</div>
                <div className="text-xl font-semibold">{scenario.prior}</div>
                {scenario.villain ? <div className="mt-2 text-slate-600">Villain stack: {fmt(scenario.villain.chips)} chips / {scenario.villain.bb}BB · You {scenario.hero.bb > scenario.villain.bb ? "cover villain" : scenario.hero.bb < scenario.villain.bb ? "are covered by villain" : "are even stacked"}.</div> : null}
              </div>

              <Card className="bg-slate-950 text-white rounded-2xl border-slate-800">
                <CardContent className="p-4">
                  <div className="font-semibold mb-3 flex items-center gap-2"><MiniIcon label="9" /> Stacks behind you</div>
                  {behindList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {behindList.map((x) => {
                        const warn = x.bb <= 15 ? "bg-red-900" : ["loose", "aggressive"].includes(x.type) ? "bg-amber-900" : "bg-slate-800";
                        return <div key={x.pos} className={`${warn} rounded-xl p-3`}><div className="font-bold">{x.pos}</div><div>{x.bb}BB · {x.type}</div><div className="text-slate-300 text-xs">{fmt(x.chips)}</div></div>;
                      })}
                    </div>
                  ) : <div className="text-slate-400">No one behind. You are in the BB.</div>}
                </CardContent>
              </Card>

              <div>
                <div className="font-semibold mb-3 flex items-center gap-2"><MiniIcon label="?" /> Choose your action</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {legalActions.map((a) => {
                    const variant = answered && a === answer ? "default" : answered && a === selected ? "destructive" : "secondary";
                    return <Button key={a} onClick={() => choose(a)} disabled={answered} className="rounded-2xl h-12" variant={variant}>{a}</Button>;
                  })}
                </div>
              </div>

              {answered ? (
                <div className={displayCorrect ? "rounded-2xl p-5 bg-green-100" : "rounded-2xl p-5 bg-red-100"}>
                  <div className="text-2xl font-bold flex items-center gap-2"><MiniIcon label="✓" /> {answerBannerText}</div>
                  <p className="mt-2"><strong>Best action:</strong> {answer}</p>
                  <p className="mt-1 text-slate-700">{explanation}</p>
                  <div className="mt-3 rounded-xl bg-white/70 p-3 text-sm">
                    <strong>Action frequency:</strong> {frequencySummary(actionFreqs)} <span className="ml-2 text-slate-600">Confidence: {confidence}</span>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(actionFreqs).map(([a, pct]) => (
                        <div key={a} className="rounded-lg bg-slate-200 p-2">
                          <div className="font-semibold">{a}</div>
                          <div>{pct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Result: {selectionScore?.label} · Mistake type: {mistakeLabel(selected, answer, scenario)}</p>

                  {showEV ? <div className="mt-4 bg-white/60 rounded-xl p-3 text-sm"><strong>EV logic:</strong><ul className="list-disc ml-5 mt-1">{evLines.map((line, i) => <li key={i}>{line}</li>)}</ul></div> : null}
                  {showRange ? <div className="mt-4 bg-white/60 rounded-xl p-3 text-sm"><strong>Range view:</strong><p className="mt-1"><strong>Hero:</strong> {rangeView.hero}</p><p><strong>Villain / pool:</strong> {rangeView.villain}</p></div> : null}
                  {showRange ? <RangeMatrix scenario={scenario} answer={answer} /> : null}

                  {postflop ? (
                    <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm">
                      <div className="font-bold text-base">Postflop continuation module</div>
                      <div className="mt-1">You take the preflop line: <strong>{postflop.preflopAction}</strong>. One player calls. Flop: <strong>{postflop.flop.name}</strong>.</div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {postflopActions.map((a) => {
                          const result = postflopAnswer ? solvePostflop(scenario, postflop.flop, a) : null;
                          const variant = postflopAnswer && result?.best === a ? "default" : postflopAnswer === a ? "destructive" : "secondary";
                          return <Button key={a} onClick={() => setPostflopAnswer(a)} disabled={Boolean(postflopAnswer)} className="rounded-xl" variant={variant}>{a}</Button>;
                        })}
                      </div>
                      {postflopAnswer ? (
                        <div className="mt-3 rounded-xl bg-white p-3">
                          <strong>Best postflop action:</strong> {solvePostflop(scenario, postflop.flop, postflopAnswer).best}
                          <div className="mt-1">{solvePostflop(scenario, postflop.flop, postflopAnswer).reason}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="mt-3 text-sm text-slate-600"><strong>Sizing:</strong> Open 2.0x-2.2x. SB open 2.5x-3x at 40BB+. Iso limpers around 3x + 1BB per limper. Non-all-in 3-bet: 3x IP, 3.5x-4x OOP. Under 25BB, prefer jam/3-bet jam over flatting.</p>
                  <Button onClick={next} className="mt-4 rounded-2xl">Next scenario</Button>

                  <div className="mt-6 border-t border-slate-300 pt-4">
                    <div className="font-semibold mb-2">Ask a follow-up question</div>
                    <textarea className="w-full rounded-xl border p-2 text-sm" placeholder="e.g., Why not 3-bet instead of jam here?" value={currentQuestion} onChange={(e) => setCurrentQuestion(e.target.value)} />
                    <Button onClick={submitQuestion} className="rounded-xl mt-2">Submit</Button>
                    <div className="mt-4 space-y-3">
                      {(qa[scenario.id] || []).map((item, idx) => <div key={`${scenario.id}-${idx}`} className="bg-slate-100 rounded-xl p-3 text-sm"><div><strong>Q:</strong> {item.q}</div><div className="mt-1"><strong>A:</strong> {item.a}</div></div>)}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="bg-slate-900 border-slate-800 rounded-2xl">
              <CardContent className="p-5 text-slate-200 text-sm space-y-3">
                <div className="font-bold text-white text-lg">Leak Tracker</div>
                <div>Missed jams: {leaks.missedJams}</div>
                <div>Over-folds: {leaks.overFolds}</div>
                <div>Passive calls: {leaks.passiveCalls}</div>
                <div>Over-aggressive punts: {leaks.overAggro}</div>
                <div>Other: {leaks.other}</div>
              </CardContent>
            </Card>

            <SessionReport attempted={attempted} correct={correct} accuracy={accuracy} leaks={leaks} history={history} />

            <Card className="bg-slate-900 border-slate-800 rounded-2xl">
              <CardContent className="p-5 text-slate-200 text-sm space-y-3">
                <div className="font-bold text-white text-lg">Hand Review Export</div>
                <p className="text-slate-300">Copy/paste this to send to your friend.</p>
                <Button onClick={() => setShowExport((v) => !v)} variant="secondary" className="rounded-2xl">{showExport ? "Hide Export" : "Show Export"}</Button>
                {showExport ? (
                  <textarea readOnly className="w-full h-64 rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-slate-100" value={exportText} />
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 rounded-2xl">
              <CardContent className="p-5 text-slate-200 text-sm space-y-3">
                <div className="font-bold text-white text-lg">Recent Hands</div>
                {history.length === 0 ? <div className="text-slate-400">No hands answered yet.</div> : history.map((h, idx) => <div key={idx} className={h.correct ? "rounded-xl p-3 bg-green-900/30" : "rounded-xl p-3 bg-red-900/30"}><div className="font-semibold">{h.scenario.heroPos} {h.scenario.hand} · {h.scenario.hero.bb}BB</div><div>{h.selected} → best {h.answer}</div><div className="text-slate-300">{h.mistake}</div></div>)}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 rounded-2xl">
          <CardContent className="p-5 text-slate-300 text-sm space-y-2">
            <p><strong className="text-white">Training rule:</strong> Judge every hand by position, BB depth, villain stack, effective stack, and stacks behind — not just your cards.</p>
            <p><strong className="text-white">Added:</strong> EV explanations, range view, range matrix, session report, difficulty modes, speed mode, leak tracking, reshove warnings, recent-hand review, effective stack, and UI highlights.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

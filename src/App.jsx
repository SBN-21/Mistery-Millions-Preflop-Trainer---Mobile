import React, { useMemo, useState } from "react";

/*
  WSOP Mini Mystery Millions Trainer - Safe Standalone Version
  Paste this entire file into src/App.jsx
  No shadcn/ui, no @ alias imports, no external UI dependencies.
*/

const POSITIONS = ["UTG", "UTG+1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"];
const STAGES = ["All", "Early", "Pressure", "Critical", "Push/Fold"];
const STRATEGY_MODES = ["Live Exploit", "Balanced"];
const TABLE_TYPES = ["Standard", "Soft/Passive", "Loose/Gambly", "Aggressive Regs", "Tight/Scared"];
const PHASES = ["Auto", "Day 1 Rebuy", "Day 1 Post-Reg", "Day 2 Bounty"];
const ACTIONS = ["OPEN", "JAM", "3-BET", "3-BET JAM", "CALL", "FOLD"];
const POSTFLOP_ACTIONS = ["C-BET", "CHECK", "JAM", "GIVE UP"];

const LEVELS = [
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

const HAND_BUCKETS = {
  premium: ["AA", "KK", "QQ", "JJ", "AKs", "AKo"],
  strong: ["TT", "99", "AQs", "AQo", "AJs", "KQs"],
  medium: ["88", "77", "66", "ATs", "AJo", "KJs", "QJs"],
  blocker: ["A5s", "A4s", "A3s", "A2s", "KTs", "A9o", "ATo"],
  speculative: ["55", "44", "33", "22", "JTs", "T9s", "98s", "87s", "76s"],
  steal: ["K9s", "KTo", "QTs", "Q9s", "J9s", "T8s", "A8o", "A7s"],
  trash: ["K7o", "Q8o", "J7s", "T7s", "96s", "85s", "74s", "A2o"],
};
const ALL_HANDS = Object.values(HAND_BUCKETS).flat();
const PLAYER_TYPES = ["tight", "loose", "passive", "aggressive", "unknown"];
const FLOPS = [
  { name: "A72 rainbow", type: "highDry", favors: "opener" },
  { name: "K83 rainbow", type: "highDry", favors: "opener" },
  { name: "Q64 rainbow", type: "highDry", favors: "opener" },
  { name: "332 rainbow", type: "pairedDry", favors: "opener" },
  { name: "KQ5 two-tone", type: "broadway", favors: "opener" },
  { name: "QJ4 rainbow", type: "broadway", favors: "opener" },
  { name: "J75 rainbow", type: "medium", favors: "neutral" },
  { name: "T86 two-tone", type: "connected", favors: "caller" },
  { name: "987 two-tone", type: "connected", favors: "caller" },
  { name: "765 rainbow", type: "lowConnected", favors: "caller" },
];

function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function pick(arr, seed) {
  return arr[Math.floor(rand(seed) * arr.length)] || arr[0];
}
function randomSeed() {
  return Math.floor(Math.random() * 1000000000);
}
function fmt(n) {
  return Number(n || 0).toLocaleString();
}
function bucketOf(hand) {
  return Object.entries(HAND_BUCKETS).find(([, hs]) => hs.includes(hand))?.[0] || "trash";
}
function isSuited(hand) {
  return hand.endsWith("s");
}
function isOffsuit(hand) {
  return hand.endsWith("o");
}
function handScore(hand) {
  const base = { premium: 100, strong: 85, medium: 68, blocker: 55, speculative: 45, steal: 36, trash: 15 }[bucketOf(hand)] || 15;
  return base + (isSuited(hand) ? 4 : 0) - (isOffsuit(hand) ? 2 : 0);
}
function posRank(pos) {
  return POSITIONS.indexOf(pos);
}
function isLate(pos) {
  return ["CO", "BTN", "SB"].includes(pos);
}
function isEarly(pos) {
  return ["UTG", "UTG+1", "MP"].includes(pos);
}
function playersBehind(pos) {
  const idx = posRank(pos);
  return idx < 0 ? [] : POSITIONS.slice(idx + 1);
}
function hasOpen(prior) {
  return /opens/.test(String(prior || ""));
}
function hasLimp(prior) {
  return /limp/.test(String(prior || ""));
}
function parseOpenSize(prior) {
  const m = String(prior || "").match(/opens to ([0-9.]+)x/);
  return m ? Number(m[1]) : 2.1;
}
function stackClass(bb) {
  if (bb <= 12) return "Short";
  if (bb <= 30) return "Average";
  return "Big";
}
function autoPhase(level) {
  return level.level <= 10 ? "Day 1 Rebuy" : "Day 1 Post-Reg";
}
function rebuyLabel(level) {
  if (level.level <= 7) return "Early rebuy: field gambles more";
  if (level.level <= 10) return "Late rebuy: field overfolds more";
  return "Registration closed";
}
function tableAdj(tableType, spot) {
  if (tableType === "Soft/Passive") return spot === "jam" || spot === "open" ? -4 : 3;
  if (tableType === "Tight/Scared") return spot === "jam" || spot === "open" ? -6 : 0;
  if (tableType === "Loose/Gambly") return spot === "jam" ? 6 : spot === "callOff" ? 4 : 2;
  if (tableType === "Aggressive Regs") return spot === "jam" || spot === "resteal" ? -3 : 3;
  return 0;
}
function phaseAdj(phase, spot, levelNumber, heroCovers = false) {
  if (phase === "Day 1 Rebuy") {
    if (levelNumber <= 7) return spot === "thinJam" ? (heroCovers ? 3 : 6) : spot === "value" ? -3 : 1;
    if (levelNumber <= 10) return spot === "thinJam" ? (heroCovers ? -2 : -4) : spot === "steal" ? -5 : -1;
  }
  if (phase === "Day 1 Post-Reg") return spot === "thinJam" || spot === "steal" ? -3 : 0;
  if (phase === "Day 2 Bounty") {
    if (spot === "callOff") return heroCovers ? -5 : 5;
    if (spot === "thinJam") return heroCovers ? -2 : 3;
  }
  return 0;
}

function stackBBFor(stage, label, seed) {
  if (stage === "Early") return label === "Short" ? 22 + Math.round(rand(seed) * 18) : label === "Average" ? 40 + Math.round(rand(seed) * 35) : 75 + Math.round(rand(seed) * 75);
  if (stage === "Pressure") return label === "Short" ? 10 + Math.round(rand(seed) * 12) : label === "Average" ? 22 + Math.round(rand(seed) * 20) : 45 + Math.round(rand(seed) * 55);
  if (stage === "Critical") return label === "Short" ? 8 + Math.round(rand(seed) * 8) : label === "Average" ? 17 + Math.round(rand(seed) * 12) : 30 + Math.round(rand(seed) * 45);
  return label === "Short" ? 4 + Math.round(rand(seed) * 8) : label === "Average" ? 12 + Math.round(rand(seed) * 10) : 25 + Math.round(rand(seed) * 35);
}
function openSizeFor(type, seed) {
  const r = rand(seed);
  if (type === "passive") return r < 0.35 ? "2.0x" : "3.0x";
  if (type === "loose") return r < 0.4 ? "3.0x" : "2.5x";
  if (type === "aggressive") return r < 0.35 ? "2.7x" : "2.1x";
  return r < 0.15 ? "3.0x" : "2.1x";
}
function makeTable(level, heroPos, seed) {
  const table = {};
  POSITIONS.forEach((pos, i) => {
    const label = pick(["Short", "Average", "Big"], seed + i * 11);
    const bb = stackBBFor(level.stage, label, seed + i * 101);
    table[pos] = {
      pos,
      bb,
      label: stackClass(bb),
      chips: bb * level.bb,
      type: pos === heroPos ? "hero" : pick(PLAYER_TYPES, seed + i * 17),
    };
  });
  return table;
}
function generateScenario(stageFilter = "All", seed = randomSeed()) {
  let level = pick(LEVELS, seed + 1);
  let guard = 0;
  while (stageFilter !== "All" && level.stage !== stageFilter && guard < 200) {
    seed += 13;
    level = pick(LEVELS, seed + 1);
    guard++;
  }
  const heroPos = pick(POSITIONS, seed + 2);
  const hand = pick(ALL_HANDS, seed + 3);
  const table = makeTable(level, heroPos, seed + 4);
  const hero = table[heroPos];
  let prior = "Folded to you";
  let villainPos = null;
  let villain = null;
  let limpers = [];
  const r = rand(seed + 5);

  if (heroPos === "BB") {
    villainPos = pick(["CO", "BTN", "SB"], seed + 6);
    villain = table[villainPos];
    prior = `${villain.type} ${villainPos} (${villain.bb}BB) opens to ${openSizeFor(villain.type, seed + 7)}`;
  } else if (heroPos === "SB") {
    if (r < 0.5) prior = `Folded to you in SB; BB has ${table.BB.bb}BB and is ${table.BB.type}`;
    else {
      villainPos = pick(["CO", "BTN"], seed + 8);
      villain = table[villainPos];
      prior = `${villain.type} ${villainPos} (${villain.bb}BB) opens to ${openSizeFor(villain.type, seed + 9)}`;
    }
  } else if (r < 0.22) {
    const earlier = POSITIONS.slice(0, Math.max(0, posRank(heroPos)));
    limpers = earlier.slice(0, Math.min(3, earlier.length)).filter((_, i) => rand(seed + i * 19) > 0.35);
    prior = limpers.length ? `${limpers.join(" and ")} ${limpers.length > 1 ? "limp" : "limps"}; action on you` : "Folded to you";
  } else if (r < 0.62) {
    const behind = playersBehind(heroPos).map((p) => `${p} ${table[p].bb}BB`).join(", ");
    prior = behind ? `Folded to you; behind: ${behind}` : "Folded to you";
  } else {
    const earlier = POSITIONS.slice(0, Math.max(0, posRank(heroPos)));
    villainPos = earlier.length ? pick(earlier, seed + 10) : null;
    villain = villainPos ? table[villainPos] : null;
    prior = villain ? `${villain.type} ${villainPos} (${villain.bb}BB) opens to ${openSizeFor(villain.type, seed + 11)}` : "Folded to you";
  }
  return { id: seed, level, heroPos, hand, table, hero, prior, villainPos, villain, limpers };
}

function legalActions(s) {
  if (hasOpen(s.prior)) return ["3-BET", "3-BET JAM", "CALL", "FOLD"];
  if (hasLimp(s.prior)) return ["OPEN", "JAM", "CALL", "FOLD"];
  return ["OPEN", "JAM", "FOLD"];
}

function solve(s, opts) {
  const { strategyMode, tableType, phase } = opts;
  const score = handScore(s.hand);
  const bb = s.hero.bb;
  const p = s.heroPos;
  const bucket = bucketOf(s.hand);
  const facingOpen = hasOpen(s.prior);
  const facingLimp = hasLimp(s.prior);
  const villain = s.villain;
  const villainPos = s.villainPos;
  const lateVillain = villainPos && ["CO", "BTN", "SB"].includes(villainPos);
  const openSize = parseOpenSize(s.prior);
  const openTiny = openSize <= 2.0;
  const openBig = openSize >= 3.0;
  const passiveVillain = villain?.type === "passive";
  const looseVillain = villain && ["loose", "aggressive"].includes(villain.type);
  const heroCovers = villain ? bb > villain.bb : false;
  const behind = playersBehind(p).map((x) => s.table[x]).filter(Boolean);
  const passiveBehind = behind.filter((x) => ["tight", "passive"].includes(x.type)).length;
  const aggroBehind = behind.filter((x) => ["loose", "aggressive"].includes(x.type)).length;
  const coverBehindCount = behind.filter((x) => bb > x.bb).length;
  const coveredByBehindCount = behind.filter((x) => bb < x.bb).length;
  const bountyBehindAdj = phase === "Day 2 Bounty" ? (coverBehindCount >= 2 ? -5 : coverBehindCount === 1 ? -3 : coveredByBehindCount >= 2 ? 4 : 0) : 0;
  const phaseJamAdj = phaseAdj(phase, "thinJam", s.level.level, heroCovers) + bountyBehindAdj;
  const jamAdj = strategyMode === "Live Exploit" ? tableAdj(tableType, "jam") + phaseJamAdj : 0;
  const openAdj = strategyMode === "Live Exploit" ? tableAdj(tableType, "open") : 0;

  if (!facingOpen && !facingLimp && bb <= 7) {
    const threshold = isEarly(p) ? 45 : p === "LJ" || p === "HJ" ? 36 : p === "CO" ? 28 : p === "BTN" ? 20 : 15;
    return score >= threshold ? ["JAM", `${bb}BB emergency stack: jam to preserve fold equity.`] : ["FOLD", `${bb}BB emergency stack, but hand is too weak from ${p}.`];
  }

  if (facingLimp) {
    const limpCount = s.limpers.length || 1;
    const limpJamHands = ["66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA", "ATo", "AJo", "AQo", "AKo", "ATs", "AJs", "AQs", "AKs", "KQs", "KJs"];

    if (bb <= 15) {
      const th = (isLate(p) ? 38 : 48) - Math.min(10, limpCount * 4);
      return score >= th ? ["JAM", `Jam over ${limpCount} limper(s): dead money + fold equity.`] : ["FOLD", `Jam/fold only over limps at ${bb}BB.`];
    }

    // 16-25BB over a limp: avoid small iso/fold with strong but vulnerable hands.
    // ATo/AJo/KQs/66+ benefit from jamming dead money, especially after registration closes.
    if (bb <= 25 && limpJamHands.includes(s.hand)) {
      return ["JAM", `${bb}BB over ${limpCount} limper(s): jam and punish dead money. This avoids awkward iso/fold spots and leverages fold equity.`];
    }

    if (bb <= 25 && isLate(p) && ["A5s", "A4s", "KTs", "QTs", "JTs", "T9s", "98s", "87s", "55"].includes(s.hand)) {
      return ["JAM", `${bb}BB late position over limper(s): suited/blocker hand performs better as a jam than a small iso.`];
    }

    const isoTh = bb > 40 ? (p === "BTN" ? 28 : p === "CO" ? 32 : isEarly(p) ? 58 : 46) : p === "BTN" || p === "CO" ? 40 : 54;
    return score >= isoTh + openAdj ? ["OPEN", `Iso-raise limpers. Size about ${3 + limpCount}BB.`] : ["FOLD", `Not enough to iso limpers from ${p}.`];
  }

  if (!facingOpen && p === "SB") {
    const bbType = s.table.BB.type;
    const exploit = strategyMode === "Live Exploit" && ["tight", "passive"].includes(bbType) ? -6 : ["loose", "aggressive"].includes(bbType) ? 4 : 0;
    if (bb <= 20) return score >= 28 + exploit + jamAdj ? ["JAM", `SB vs BB: jam wide and deny equity.`] : ["FOLD", `Too weak for SB jam.`];
    return score >= 25 + exploit + openAdj ? ["OPEN", `SB steal. Open 2.5x-3x.`] : ["FOLD", `Too weak from SB.`];
  }

  if (facingOpen) {
    let adj = 0;
    if (villain && bb < villain.bb) adj += 3;
    if (looseVillain) adj -= 5;
    if (passiveVillain) adj += 4;
    if (openBig) adj += looseVillain ? 2 : 8;
    if (openTiny && lateVillain) adj -= 3;
    if (phase === "Day 2 Bounty" && heroCovers && villain && villain.bb <= 20) adj -= 5;
    if (phase === "Day 2 Bounty" && villain && bb < villain.bb) adj += 4;

    if (bb <= 15) {
      const th = (lateVillain ? 48 : 78) + adj;
      return score >= th ? ["3-BET JAM", `Short-stack resteal. No flatting at ${bb}BB.`] : ["FOLD", `Not enough to jam versus ${villainPos} open.`];
    }
    if (bb <= 30) {
      const premiumJamHands = ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AKo", "AQs", "AQo"];
      if (premiumJamHands.includes(s.hand)) {
        return ["3-BET JAM", `${s.hand} at ${bb}BB versus an open is a clear value jam. Never fold premiums at this stack depth.`];
      }

      const shortLateOpen = lateVillain && villain && villain.bb <= 18;
      const valueJam = shortLateOpen && ["AJo", "AQo", "AQs", "AJs", "ATs", "KQs", "KJs", "77", "88", "99", "TT", "JJ"].includes(s.hand);
      const resteal = lateVillain && (bucket === "blocker" || bucket === "medium" || bucket === "strong" || ["55", "66", "77", "88", "99", "KQs", "KJs", "AJo"].includes(s.hand));
      if (valueJam || (resteal && score >= 42 + adj + tableAdj(tableType, "resteal"))) return ["3-BET JAM", `Resteal/value jam versus ${villainPos} open.`];

      // BB can still defend versus small late-position opens at 20-30BB.
      // The old rule over-folded BB by forcing jam/fold only.
      if (p === "BB" && lateVillain && openTiny && bb >= 20 && score >= 40 + adj && isSuited(s.hand)) {
        return ["CALL", `BB gets a price versus a small ${villainPos} open. Suited/playable hands can call and realize equity.`];
      }
      if (p === "BB" && lateVillain && openTiny && passiveVillain && bb >= 22 && score >= 50 + adj) {
        return ["CALL", `Versus a passive small late open, BB can defend playable broadways instead of over-folding.`];
      }

      return ["FOLD", `Avoid most flats at ${bb}BB versus open, but defend BB versus small late opens with suited/playable hands.`];
    }
    if (bb >= 50 && posRank(p) > posRank(villainPos || "UTG") && passiveVillain && openTiny && ["AQo", "AJs", "KQs", "KJs", "QJs", "JTs"].includes(s.hand)) {
      return ["CALL", `Deep IP flat versus passive min-open. Keep dominated hands in.`];
    }
    if (p === "BB" && lateVillain && passiveVillain && openTiny && isSuited(s.hand) && score >= 80 && bb >= 60) return ["CALL", `Deep BB suited broadway can flat versus passive late min-open.`];
    if (score >= 85 + adj) return ["3-BET", `Value 3-bet.`];

    // BTN suited broadways versus early opens are not pure folds in live events,
    // but they are dominated/squeeze-sensitive. Treat as mixed, not automatic call.
    if (
      p === "BTN" &&
      ["UTG", "UTG+1", "MP"].includes(villainPos || "") &&
      bb >= 30 &&
      bb <= 50 &&
      ["KTs", "KJs", "QJs", "JTs", "QTs"].includes(s.hand)
    ) {
      return ["FOLD", `${s.hand} on BTN versus ${villainPos} open is close/mixed. Default fold versus aggressive/strong early range, but calling some frequency is acceptable if blinds are passive and opener is weak.`];
    }

    if (p === "BB" && lateVillain && score >= 30 + adj) return ["CALL", `BB defend versus late open.`];
    if (score >= 45 + adj && lateVillain && posRank(p) > posRank(villainPos || "UTG")) return ["CALL", `Playable in position versus late open.`];
    return ["FOLD", `Default fold versus open.`];
  }

  if (bb <= 15) {
    const pairHands = ["22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA"];
    const emergencyBroadways = ["AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs", "KQs", "KJs", "QJs", "JTs"];
    const emergencyAces = ["A2s", "A3s", "A4s", "A5s", "A7s", "A8o", "A9o", "ATo"];

    // True short-stack correction: at 8-10BB, pairs are not folds from early/mid position.
    // You are about to lose BB + ante, and pairs realize equity well when called.
    if (bb <= 10 && pairHands.includes(s.hand)) {
      return ["JAM", `${bb}BB ${p}: pocket pair push. At this stack depth, blind/ante pressure makes ${s.hand} a profitable open-jam even from early position.`];
    }
    if (bb <= 10 && (emergencyBroadways.includes(s.hand) || (isLate(p) && emergencyAces.includes(s.hand)))) {
      return ["JAM", `${bb}BB ${p}: emergency push/fold spot. This hand has enough equity and fold equity to jam.`];
    }

    let th = isEarly(p) ? 54 : p === "LJ" || p === "HJ" ? 44 : p === "CO" ? 32 : p === "BTN" ? 26 : 22;
    const pushAdj = bb <= 10 ? 0 : Math.max(-8, Math.min(5, jamAdj - passiveBehind * 2 + aggroBehind * 2));
    return score >= th + pushAdj ? ["JAM", `${bb}BB ${p}: profitable open-jam.`] : ["FOLD", `${bb}BB jam/fold: hand below range.`];
  }

  if (bb <= 25) {
    const shoveHands = ["55", "66", "77", "88", "A5s", "A4s", "KTs", "K9s", "QTs", "JTs", "T9s", "98s", "87s"];
    if (isLate(p) && shoveHands.includes(s.hand) && score >= 36 + jamAdj) return ["JAM", `Late-position ${bb}BB hand plays well as open-jam.`];
    const openTh = (isEarly(p) ? 68 : isLate(p) ? 42 : 52) + openAdj;
    return score >= openTh ? ["OPEN", `Open small, usually 2.0x-2.2x.`] : ["FOLD", `Not enough to open from ${p}.`];
  }

  const openTh = (bb <= 40 ? (isEarly(p) ? 68 : isLate(p) ? 36 : 50) : (isEarly(p) ? 68 : isLate(p) ? 30 : 45)) + openAdj;
  return score >= openTh ? ["OPEN", `Standard open. Use 2.0x-2.2x.`] : ["FOLD", `Below opening range for ${p}.`];
}

function frequencies(s, best, opts) {
  const legal = legalActions(s);
  const out = Object.fromEntries(legal.map((a) => [a, 0]));
  const bb = s.hero.bb;
  const p = s.heroPos;
  const hand = s.hand;
  const score = handScore(hand);
  const facingOpen = hasOpen(s.prior);
  const facingLimp = hasLimp(s.prior);
  const villain = s.villain;
  const openTiny = parseOpenSize(s.prior) <= 2.0;
  const passiveVillain = villain?.type === "passive";
  const heroIP = s.villainPos ? posRank(p) > posRank(s.villainPos) : false;
  const limpCount = s.limpers?.length || (facingLimp ? 1 : 0);

  // Default is not always 100%; only use it after mixed overrides are checked.

  // Premiums versus opens at 15-30BB are pure value jams.
  if (facingOpen && bb <= 30 && ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AKo", "AQs", "AQo"].includes(hand)) {
    out["3-BET JAM"] = 100;
  }

  // 8-10BB pairs are pure jams.
  else if (!facingOpen && !facingLimp && bb <= 10 && ["22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA"].includes(hand)) {
    out.JAM = 100;
  }

  // 16-25BB over limpers: strong vulnerable hands are mostly jams, but some iso exists deeper/softer.
  else if (facingLimp && bb >= 16 && bb <= 25 && ["66", "77", "88", "99", "TT", "ATo", "AJo", "AQo", "AKo", "ATs", "AJs", "AQs", "AKs", "KQs", "KJs"].includes(hand)) {
    out.JAM = opts.phase === "Day 1 Post-Reg" ? 85 : opts.tableType === "Loose/Gambly" ? 65 : 75;
    if (out.OPEN !== undefined) out.OPEN = 100 - out.JAM;
  }

  // Late-position semi-bluff open-jams at 16-22BB are mixed.
  else if (!facingOpen && !facingLimp && bb >= 16 && bb <= 22 && isLate(p) && ["55", "66", "77", "88", "A5s", "A4s", "KTs", "K9s", "QTs", "JTs", "T9s", "98s", "87s"].includes(hand)) {
    out.JAM = opts.tableType === "Loose/Gambly" ? 55 : opts.phase === "Day 1 Post-Reg" ? 78 : 70;
    out.OPEN = 100 - out.JAM;
  }

  // Premium/value hands around 20BB prefer open/call but jam sometimes.
  else if (!facingOpen && !facingLimp && bb >= 18 && bb <= 24 && ["AKs", "AKo", "AQs", "AQo", "QQ", "KK", "AA"].includes(hand)) {
    out.OPEN = 80;
    out.JAM = 20;
  }

  // Deep IP versus passive min-open: flat is preferred, 3-bet mixed.
  else if (facingOpen && s.heroPos === "BTN" && ["UTG", "UTG+1", "MP"].includes(s.villainPos || "") && bb >= 30 && bb <= 50 && ["KTs", "KJs", "QJs", "JTs", "QTs"].includes(hand)) {
    const bbPlayer = s.table.BB;
    const aggressiveBehind = bbPlayer && ["aggressive", "loose"].includes(bbPlayer.type);
    out.FOLD = aggressiveBehind ? 70 : 55;
    out.CALL = aggressiveBehind ? 30 : 45;
  } else if (facingOpen && bb >= 50 && heroIP && passiveVillain && openTiny && ["AQo", "AJs", "KQs", "KJs", "QJs", "JTs"].includes(hand)) {
    out.CALL = hand === "AQo" ? 70 : 80;
    out["3-BET"] = hand === "AQo" ? 30 : 20;
  }

  // BB defense versus small late opens: call/jam/fold mix.
  else if (facingOpen && s.heroPos === "BB" && openTiny && villain && ["CO", "BTN", "SB"].includes(s.villainPos) && bb >= 20 && bb <= 35 && isSuited(hand) && score >= 40) {
    out.CALL = 60;
    if (out["3-BET JAM"] !== undefined) out["3-BET JAM"] = 25;
    out.FOLD = 15;
  }

  // Deep late iso over limp is mostly open with occasional overlimp for pot control.
  else if (facingLimp && bb > 40 && isLate(p) && score >= 34) {
    out.OPEN = 90;
    if (out.CALL !== undefined) out.CALL = 10;
  }

  else {
    out[best] = 100;
  }

  const total = Object.values(out).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v > 0).map(([k, v]) => [k, Math.round((v / total) * 100)]));
}
function scoreChoice(selected, best, freqs) {
  if (selected === best) return { label: "Best", credit: 1 };
  if ((freqs[selected] || 0) >= 25) return { label: "Acceptable mixed action", credit: 0.5 };
  return { label: "Wrong", credit: 0 };
}
function getWarnings(s, phase) {
  const behind = playersBehind(s.heroPos).map((p) => s.table[p]).filter(Boolean);
  const out = [];
  const short = behind.filter((x) => x.bb <= 15).length;
  const aggro = behind.filter((x) => ["loose", "aggressive"].includes(x.type)).length;
  if (short >= 2) out.push(`${short} reshove stacks behind`);
  if (aggro >= 2) out.push(`${aggro} loose/aggressive players behind`);
  if (phase === "Day 1 Rebuy") out.push(rebuyLabel(s.level));
  if (phase === "Day 2 Bounty") out.push("Bounty phase: covering stacks matters");
  return out;
}
function rangeText(s, answer) {
  if (hasLimp(s.prior)) return "Versus limpers: jam short, iso deep in position. Avoid passive overlimps in fast structure.";
  if (hasOpen(s.prior)) return "Versus opens: 15-30BB is mostly 3-bet jam/fold. Deep IP flats exist versus passive small opens.";
  if (s.hero.bb <= 15) return "Open-jam range: pairs, Ax, broadways, suited connectors wider from CO/BTN/SB.";
  return "Open range: tighter early, wide CO/BTN/SB. Avoid raise/fold leaks with reshove stacks behind.";
}
function evText(s, answer, phase) {
  if (answer.includes("JAM")) return `Jam EV comes from fold equity + realizing all equity. ${phase === "Day 1 Rebuy" && s.level.level >= 8 && s.level.level <= 10 ? "Late rebuy increases fold equity." : ""}`;
  if (answer === "OPEN") return "Opening preserves value with hands that want action and risks less than a jam.";
  if (answer === "CALL") return "Calling is selected for price/playability/equity realization, especially suited hands or deep IP spots.";
  if (answer === "3-BET") return "3-bet for value/protection while keeping worse hands in.";
  return "Folding avoids dominated or low-EV spots and saves chips for better fold-equity situations.";
}
function solvePostflop(s, flop, action) {
  const hasAK = s.hand.includes("A") || s.hand.includes("K");
  let best = "CHECK";
  let reason = "Default: pot control when equity realization is unclear.";
  if ((flop.favors === "opener" || flop.type === "pairedDry") && hasAK) {
    best = "C-BET";
    reason = "High/dry or paired boards favor opener; small c-bet prints folds.";
  } else if (flop.type === "connected" || flop.type === "lowConnected") {
    best = "CHECK";
    reason = "Connected low boards hit caller range. Avoid automatic c-bets.";
  } else if (s.hero.bb <= 16 && ["AA", "KK", "QQ"].includes(s.hand)) {
    best = "JAM";
    reason = "Premium hand, shallow SPR. Commit value.";
  }
  return { best, correct: action === best, reason };
}
function reviewExport(history, score, attempted) {
  const lines = ["WSOP Trainer Review", `Score: ${score}/${attempted}`, ""];
  history.forEach((h, i) => {
    lines.push(`#${i + 1}: ${h.s.heroPos} ${h.s.hand} ${h.s.hero.bb}BB L${h.s.level.level}`);
    lines.push(`Action: ${h.s.prior}`);
    lines.push(`Selected: ${h.selected} | Best: ${h.best} | ${h.result}`);
    lines.push("---");
  });
  return lines.join("\n");
}

function runTests() {
  const t = [];
  const assert = (name, ok) => t.push({ name, ok: Boolean(ok) });
  const opts = { strategyMode: "Live Exploit", tableType: "Soft/Passive", phase: "Day 1 Rebuy" };
  const s = generateScenario("All", 12345);
  assert("scenario has hero", !!s.hero && s.hero.bb > 0);
  assert("legal action from solve", legalActions(s).includes(solve(s, opts)[0]));
  const k9 = generateScenario("Pressure", 9999);
  k9.level = { level: 9, sb: 1000, bb: 1500, stage: "Pressure" };
  k9.heroPos = "CO";
  k9.hand = "K9s";
  k9.hero = { pos: "CO", bb: 12, chips: 18000, type: "hero", label: "Short" };
  k9.table.CO = k9.hero;
  k9.table.BTN = { pos: "BTN", bb: 64, chips: 96000, type: "passive", label: "Big" };
  k9.table.SB = { pos: "SB", bb: 19, chips: 28500, type: "passive", label: "Average" };
  k9.table.BB = { pos: "BB", bb: 12, chips: 18000, type: "passive", label: "Short" };
  k9.prior = "Folded to you; behind: BTN 64BB, SB 19BB, BB 12BB";
  assert("L9 CO 12BB K9s passive behind jams", solve(k9, opts)[0] === "JAM");
  const ip = generateScenario("Early", 7777);
  ip.level = { level: 5, sb: 300, bb: 600, stage: "Early" };
  ip.heroPos = "HJ";
  ip.hand = "AQo";
  ip.hero = { pos: "HJ", bb: 69, chips: 41400, type: "hero", label: "Big" };
  ip.table.HJ = ip.hero;
  ip.villainPos = "MP";
  ip.villain = { pos: "MP", bb: 94, chips: 56400, type: "passive", label: "Big" };
  ip.prior = "passive MP (94BB) opens to 2.0x";
  assert("Deep IP AQo vs passive min-open can call", solve(ip, opts)[0] === "CALL");
  const pair8 = generateScenario("Push/Fold", 8888);
  pair8.level = { level: 22, sb: 15000, bb: 30000, stage: "Push/Fold" };
  pair8.heroPos = "UTG+1";
  pair8.hand = "33";
  pair8.hero = { pos: "UTG+1", bb: 8, chips: 240000, type: "hero", label: "Short" };
  pair8.table["UTG+1"] = pair8.hero;
  pair8.prior = "Folded to you; behind: MP 15BB, LJ 6BB, HJ 12BB, CO 8BB, BTN 43BB, SB 39BB, BB 16BB";
  assert("8BB UTG+1 33 is an open-jam", solve(pair8, { strategyMode: "Live Exploit", tableType: "Standard", phase: "Day 1 Post-Reg" })[0] === "JAM");
  return t;
}

function AppButton({ children, onClick, active = false, disabled = false, danger = false, wide = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        margin: 4,
        borderRadius: 10,
        border: "1px solid #334155",
        background: danger ? "#dc2626" : active ? "#2563eb" : "#e2e8f0",
        color: danger || active ? "white" : "#0f172a",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        width: wide ? "100%" : undefined,
      }}
    >
      {children}
    </button>
  );
}
function Card({ children, title, className = "" }) {
  return (
    <div className={className} style={{ background: "white", color: "#0f172a", borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: "0 10px 30px rgba(0,0,0,.18)" }}>
      {title ? <h3 style={{ marginTop: 0 }}>{title}</h3> : null}
      {children}
    </div>
  );
}
function Pill({ children }) {
  return <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: 999, background: "#e2e8f0", color: "#0f172a", fontSize: 12, fontWeight: 700, margin: 3 }}>{children}</span>;
}
function Box({ label, children }) {
  return <div style={{ background: "#f1f5f9", padding: 14, borderRadius: 14 }}><div style={{ color: "#64748b", fontSize: 12 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 800 }}>{children}</div></div>;
}

export default function App() {
  const [stage, setStage] = useState("All");
  const [strategyMode, setStrategyMode] = useState("Live Exploit");
  const [tableType, setTableType] = useState("Standard");
  const [phaseMode, setPhaseMode] = useState("Auto");
  const [scenario, setScenario] = useState(() => generateScenario("All"));
  const [selected, setSelected] = useState(null);
  const [postflopAction, setPostflopAction] = useState(null);
  const [postflop, setPostflop] = useState(null);
  const [attempted, setAttempted] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const phase = phaseMode === "Auto" ? autoPhase(scenario.level) : phaseMode;
  const opts = { strategyMode, tableType, phase };
  const [best, reason] = solve(scenario, opts);
  const freqs = frequencies(scenario, best, opts);
  const legal = legalActions(scenario);
  const choice = selected ? scoreChoice(selected, best, freqs) : null;
  const warnings = getWarnings(scenario, phase);
  const tests = useMemo(() => runTests(), []);
  const accuracy = attempted ? Math.round((score / attempted) * 100) : 0;
  const flop = postflop?.flop;

  function nextHand() {
    setScenario(generateScenario(stage));
    setSelected(null);
    setPostflop(null);
    setPostflopAction(null);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }
  function choose(action) {
    if (selected) return;
    const result = scoreChoice(action, best, freqs);
    setSelected(action);
    setAttempted((x) => x + 1);
    setScore((x) => x + result.credit);
    setHistory((h) => [{ s: scenario, selected: action, best, result: result.label }, ...h].slice(0, 20));
    if (["OPEN", "CALL", "3-BET"].includes(best) && scenario.hero.bb >= 16) {
      setPostflop({ flop: pick(FLOPS, scenario.id + attempted + 99), preflop: best });
    }
  }
  function changeStage(s) {
    setStage(s);
    setScenario(generateScenario(s));
    setSelected(null);
    setPostflop(null);
    setPostflopAction(null);
  }
  function reset() {
    setAttempted(0);
    setScore(0);
    setHistory([]);
    nextHand();
  }

  const pot = scenario.level.sb + scenario.level.bb + scenario.level.bb;
  const bannerColor = !selected ? "#f8fafc" : choice.credit > 0 ? "#dcfce7" : "#fee2e2";

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "white", padding: 18, fontFamily: "Arial, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .app-shell { max-width: 1150px; margin: 0 auto; display: flex; flex-direction: column; }
        .settings-card { order: 3; }
        .desktop-grid { order: 2; margin-top: 0; }
        .tests-card { order: 1; }
        .top-bar { display: block; margin: 0 0 10px 0; padding: 0; min-height: 0; }
        .page-title { font-size: clamp(26px, 7vw, 34px); margin: 0; line-height: 1.05; white-space: nowrap; }
        .desktop-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 16px; }
        .controls-row { display: flex; flex-wrap: wrap; gap: 4px; }
        .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-top: 8px; }
        .mobile-secondary { display: block; }
        .sticky-next { display: none; }
        @media (max-width: 760px) {
          body { overflow-x: hidden; }
          .app-shell { width: 100%; }
          .top-bar { align-items: stretch; }
          .top-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 8px; }
          .top-actions button { width: 100% !important; margin: 0 !important; }
          .desktop-grid { grid-template-columns: 1fr; }
          .controls-row { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 6px; -webkit-overflow-scrolling: touch; }
          .controls-row button { white-space: nowrap; flex: 0 0 auto; margin: 0 !important; }
          .action-grid { grid-template-columns: 1fr 1fr; }
          .mobile-full { grid-column: 1 / -1; }
          .sticky-next { display: block; position: fixed; left: 0; right: 0; bottom: 0; padding: 10px 14px; background: rgba(2, 6, 23, 0.94); border-top: 1px solid #334155; z-index: 50; }
          .sticky-next button { width: 100% !important; margin: 0 !important; padding: 14px !important; font-size: 16px; }
          textarea { font-size: 12px; }
          .bottom-safe-space { height: 76px; }
        }
      `}</style>
      <div className="app-shell">
        <div className="top-bar">
          <h1 className="page-title">Mini Mystery Trainer</h1>
        </div>

        {showTests && (
          <Card title="Self Tests" className="tests-card">
            {tests.map((t) => <div key={t.name} style={{ padding: 8, borderRadius: 8, marginBottom: 6, background: t.ok ? "#dcfce7" : "#fee2e2" }}>{t.ok ? "PASS" : "FAIL"} · {t.name}</div>)}
          </Card>
        )}

        <Card title="Options / Settings" className="settings-card">
          <div className="controls-row" style={{ marginBottom: 8 }}>
            {STRATEGY_MODES.map((m) => <AppButton key={m} active={strategyMode === m} onClick={() => setStrategyMode(m)}>{m}</AppButton>)}
            {TABLE_TYPES.map((m) => <AppButton key={m} active={tableType === m} onClick={() => setTableType(m)}>{m}</AppButton>)}
            {PHASES.map((m) => <AppButton key={m} active={phaseMode === m} onClick={() => setPhaseMode(m)}>{m === "Auto" ? `Auto (${phase})` : m}</AppButton>)}
          </div>
          <div className="controls-row">
            {STAGES.map((m) => <AppButton key={m} active={stage === m} onClick={() => changeStage(m)}>{m}</AppButton>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginTop: 14 }}>
            <Box label="Score">{Number(score.toFixed(1))}/{attempted}</Box>
            <Box label="Accuracy">{accuracy}%</Box>
            <Box label="Phase">{phase}</Box>
            <Box label="Table">{tableType}</Box>
          </div>
        </Card>

        <div className="desktop-grid">
          <div>
            <Card>
              <div style={{ marginBottom: 12 }}>
                <Pill>Level {scenario.level.level}</Pill>
                <Pill>{scenario.level.stage}</Pill>
                <Pill>Blinds {fmt(scenario.level.sb)}/{fmt(scenario.level.bb)}</Pill>
                <Pill>BB Ante {fmt(scenario.level.bb)}</Pill>
                <Pill>{rebuyLabel(scenario.level)}</Pill>
              </div>
              {warnings.length > 0 && <div style={{ background: "#fef3c7", color: "#92400e", padding: 12, borderRadius: 12, fontWeight: 700, marginBottom: 12 }}>⚠ {warnings.join(" · ")}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                <Box label="Position">{scenario.heroPos}</Box>
                <Box label="Hand">{scenario.hand}</Box>
                <Box label="Stack">{scenario.hero.bb}BB</Box>
                <Box label="Pot before action">{fmt(pot)}</Box>
              </div>
              <div style={{ background: "#f1f5f9", padding: 14, borderRadius: 14, marginTop: 14 }}>
                <div style={{ color: "#64748b", fontSize: 12 }}>Action before you</div>
                <div style={{ fontSize: 19, fontWeight: 800 }}>{scenario.prior}</div>
                {scenario.villain && <div style={{ marginTop: 6, color: "#475569" }}>Villain: {scenario.villainPos}, {scenario.villain.bb}BB, {scenario.villain.type}. You {scenario.hero.bb > scenario.villain.bb ? "cover" : scenario.hero.bb < scenario.villain.bb ? "are covered by" : "are even with"} villain.</div>}
              </div>
              <div style={{ background: "#0f172a", color: "white", padding: 14, borderRadius: 14, marginTop: 14 }}>
                <strong>Stacks behind</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginTop: 8 }}>
                  {playersBehind(scenario.heroPos).length === 0 ? <span style={{ color: "#94a3b8" }}>No one behind.</span> : playersBehind(scenario.heroPos).map((p) => {
                    const x = scenario.table[p];
                    return <div key={p} style={{ background: x.bb <= 15 ? "#7f1d1d" : ["loose", "aggressive"].includes(x.type) ? "#78350f" : "#1e293b", borderRadius: 10, padding: 10 }}><strong>{p}</strong><br />{x.bb}BB · {x.type}</div>;
                  })}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <strong>Choose your action</strong>
                <div className="action-grid">
                  {legal.map((a) => <AppButton key={a} onClick={() => choose(a)} disabled={!!selected} active={selected === a} wide>{a}</AppButton>)}
                </div>
              </div>
            </Card>

            {selected && (
              <Card>
                <div style={{ background: bannerColor, padding: 14, borderRadius: 14 }}>
                  <h2 style={{ marginTop: 0 }}>{choice.label}</h2>
                  <p><strong>Best action:</strong> {best}</p>
                  <p>{reason}</p>
                  <p><strong>Action frequency:</strong> {Object.entries(freqs).map(([a, v]) => `${a} ${v}%`).join(" / ")}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 }}>
                    {Object.entries(freqs).map(([a, v]) => <div key={a} style={{ background: "#e2e8f0", padding: 10, borderRadius: 10 }}><strong>{a}</strong><br />{v}%</div>)}
                  </div>
                  <p><strong>EV logic:</strong> {evText(scenario, best, phase)}</p>
                  <p><strong>Range view:</strong> {rangeText(scenario, best)}</p>
                  <p style={{ color: "#475569" }}><strong>Sizing:</strong> Open 2.0x-2.2x. SB 2.5x-3x deeper. Iso limpers 3BB + 1BB/limper. 3-bet 3x IP, 3.5x-4x OOP.</p>
                  <AppButton onClick={nextHand}>Next Scenario</AppButton>
                </div>
                {postflop && (
                  <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "#f1f5f9" }}>
                    <h3>Postflop continuation</h3>
                    <p>You take preflop line <strong>{postflop.preflop}</strong>. One player calls. Flop: <strong>{postflop.flop.name}</strong>.</p>
                    <div className="action-grid">
                      {POSTFLOP_ACTIONS.map((a) => <AppButton key={a} onClick={() => setPostflopAction(a)} disabled={!!postflopAction} active={postflopAction === a} wide>{a}</AppButton>)}
                    </div>
                    {postflopAction && <p><strong>Best:</strong> {solvePostflop(scenario, postflop.flop, postflopAction).best}. {solvePostflop(scenario, postflop.flop, postflopAction).reason}</p>}
                  </div>
                )}
              </Card>
            )}
          </div>

          <div>
            <Card title="Hand Review Export">
              <AppButton onClick={() => setShowExport((v) => !v)}>{showExport ? "Hide Export" : "Show Export"}</AppButton>
              {showExport && <textarea readOnly value={reviewExport(history, score, attempted)} style={{ width: "100%", height: 260, borderRadius: 12, padding: 10, marginTop: 10 }} />}
            </Card>
            <Card title="Recent Hands">
              {history.length === 0 ? <div>No hands yet.</div> : history.map((h, i) => <div key={i} style={{ padding: 10, borderRadius: 10, background: h.result === "Wrong" ? "#fee2e2" : "#dcfce7", marginBottom: 8 }}><strong>{h.s.heroPos} {h.s.hand} · {h.s.hero.bb}BB</strong><br />{h.selected} → best {h.best}<br />{h.result}</div>)}
            </Card>
          </div>
        </div>
              {selected && (
          <div className="sticky-next">
            <AppButton onClick={nextHand} wide>Next Hand</AppButton>
          </div>
        )}
        <div className="bottom-safe-space" />
      </div>
    </div>
  );
}

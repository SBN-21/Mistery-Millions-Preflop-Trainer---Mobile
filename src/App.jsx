import React, { useEffect, useMemo, useState } from "react";

const positions = ["UTG", "UTG+1", "MP", "LJ", "HJ", "CO", "BTN", "SB", "BB"];
const actions = ["OPEN", "JAM", "3-BET", "3-BET JAM", "CALL", "FOLD"];
const strategyModes = ["Live Exploit", "Balanced"];
const difficultyModes = ["Standard", "Tough Spots", "Leak Finder"];
const drillModes = ["Normal", "Speed"];
const rebuyModes = ["Early Rebuy", "Mid Rebuy", "Late Rebuy", "Post-Rebuy"];

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
  return arr[Math.floor(rand(seed) * arr.length)] ?? fallback;
}
function randomSeed() {
  return Math.floor(Math.random() * 1000000000);
}
function fmt(n) {
  return Number(n || 0).toLocaleString();
}
function bucketOf(hand) {
  const found = Object.entries(handBuckets).find(([, hands]) => hands.includes(hand));
  return found ? found[0] : "trash";
}
function isSuited(hand) { return typeof hand === "string" && hand.endsWith("s"); }
function isOffsuit(hand) { return typeof hand === "string" && hand.endsWith("o"); }
function handScore(hand) {
  const scores = { premium: 100, strong: 85, medium: 68, blocker: 55, speculative: 45, weakSteal: 36, trash: 15 };
  let base = scores[bucketOf(hand)] || 15;
  if (isSuited(hand)) base += 4;
  if (isOffsuit(hand)) base -= 2;
  return base;
}
function posRank(pos) { return positions.indexOf(pos); }
function isLate(pos) { return ["CO", "BTN", "SB"].includes(pos); }
function isEarly(pos) { return ["UTG", "UTG+1", "MP"].includes(pos); }
function playersBehind(heroPos) {
  const idx = posRank(heroPos);
  return idx < 0 ? [] : positions.slice(idx + 1);
}
function stackClass(bb) {
  if (bb <= 12) return "Short";
  if (bb <= 30) return "Average";
  return "Big";
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
function rebuyIntensity(rebuyMode) {
  if (rebuyMode === "Early Rebuy") return 2;
  if (rebuyMode === "Mid Rebuy") return 1;
  if (rebuyMode === "Late Rebuy") return 1;
  return 0;
}
function playerPoolForRebuy(rebuyMode) {
  if (rebuyMode === "Early Rebuy") return ["loose", "loose", "aggressive", "passive", "passive", "unknown"];
  if (rebuyMode === "Mid Rebuy") return ["loose", "aggressive", "passive", "tight", "unknown"];
  if (rebuyMode === "Late Rebuy") return ["tight", "tight", "aggressive", "unknown", "passive"];
  return playerTypes;
}
function makeTable(level, heroPos, seed, rebuyMode = "Post-Rebuy") {
  const table = {};
  const pool = playerPoolForRebuy(rebuyMode);
  positions.forEach((pos, idx) => {
    const label = pick(stackLabels, seed + idx * 97, "Average");
    const bb = stackBBFor(level.stage, label, seed + idx * 101);
    table[pos] = { pos, label: stackClass(bb), bb, chips: bb * level.bb, type: pos === heroPos ? "hero" : pick(pool, seed + idx * 103, "unknown") };
  });
  return table;
}
function safePlayer(table, pos) { return table && pos && table[pos] ? table[pos] : null; }
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
function hasOpen(prior) { return /opens/.test(String(prior || "")); }
function hasLimp(prior) { return /limp/.test(String(prior || "")); }
function legalActionsForScenario(scenario) {
  if (hasOpen(scenario?.prior)) return ["3-BET", "3-BET JAM", "CALL", "FOLD"];
  if (hasLimp(scenario?.prior)) return ["OPEN", "JAM", "CALL", "FOLD"];
  return ["OPEN", "JAM", "FOLD"];
}
function playerAdjustmentFacingOpen(type, mode) {
  if (mode !== "Live Exploit") return 0;
  if (type === "loose" || type === "aggressive") return -6;
  if (type === "tight") return 8;
  if (type === "passive") return 5;
  return 0;
}
function isoRaiseSize(limpCount) { return `${3 + limpCount}BB`; }
function isoOpenThreshold(pos, bb, limpCount, mode) {
  const liveBonus = mode === "Live Exploit" ? Math.min(10, limpCount * 4) : Math.min(4, limpCount * 2);
  if (bb > 40) return (pos === "BTN" ? 30 : pos === "CO" ? 34 : pos === "HJ" || pos === "LJ" ? 45 : 55) - liveBonus;
  if (bb > 30) return (pos === "BTN" ? 34 : pos === "CO" ? 38 : pos === "HJ" || pos === "LJ" ? 48 : 58) - liveBonus;
  if (bb > 15) return (pos === "BTN" || pos === "CO" ? 42 : pos === "HJ" || pos === "LJ" ? 52 : 62) - liveBonus;
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

function generateScenario(i, difficulty = "Standard", rebuyMode = "Post-Rebuy") {
  const level = pick(levels, i * 11 + 3, levels[0]);
  const heroPos = pick(positions, i * 17 + 7, "MP");
  const handPool = difficulty === "Tough Spots" || difficulty === "Leak Finder" ? toughHands : allHands;
  const hand = pick(handPool, i * 19 + 9, "AJo");
  const table = makeTable(level, heroPos, i * 29 + 13, rebuyMode);
  const hero = table[heroPos];
  const r = rand(i * 31 + 15);
  let prior = "Folded to you";
  let villainPos = null;
  let villain = null;
  let limpers = [];
  const baseLimp = difficulty === "Tough Spots" || difficulty === "Leak Finder" ? 0.3 : 0.22;
  let limpModifier = 0;
  if (rebuyMode === "Early Rebuy") limpModifier = 0.12;
  if (rebuyMode === "Mid Rebuy") limpModifier = 0.06;
  if (rebuyMode === "Late Rebuy") limpModifier = 0.02;
  const limpChance = baseLimp + limpModifier;

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
  }
  return { id: i, level, heroPos, hand, table, hero, prior, villain, villainPos, limpers };
}

function solve(s, mode = "Live Exploit", rebuyMode = "Post-Rebuy") {
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
  const rebuyActive = rebuyMode !== "Post-Rebuy";
  let bluffPenalty = 0;
  let valueDiscount = 0;
  if (rebuyMode === "Early Rebuy") {
    bluffPenalty = 10;
    valueDiscount = 6;
  }
  if (rebuyMode === "Mid Rebuy") {
    bluffPenalty = 6;
    valueDiscount = 3;
  }
  if (rebuyMode === "Late Rebuy") {
    bluffPenalty = 8;
    valueDiscount = 2;
  }

  if (!facingOpen && !facingLimp && bb <= 7) {
    const threshold = isEarly(p) ? 45 : p === "LJ" || p === "HJ" ? 36 : p === "CO" ? 28 : p === "BTN" ? 20 : 15;
    if (score >= threshold + Math.floor(bluffPenalty / 2)) return ["JAM", `Level ${s.level.level}, ${bb}BB: emergency stack. The BB ante makes the pot too valuable. From ${p}, ${s.hand} should jam.${rebuyActive ? " Rebuy mode trims marginal jams because calls are wider." : ""}`];
    return ["FOLD", `Level ${s.level.level}, ${bb}BB: emergency stack, but ${s.hand} is still too weak from ${p}.`];
  }

  if (facingLimp) {
    const limpCount = s.limpers && s.limpers.length ? s.limpers.length : 1;
    const isoSize = isoRaiseSize(limpCount);
    const jamThreshold = limpJamThreshold(p, bb, limpCount, mode);
    const openThreshold = isoOpenThreshold(p, bb, limpCount, mode);
    if (bb <= 25 && score >= jamThreshold + bluffPenalty) return ["JAM", `At ${bb}BB over ${limpCount} limper(s), jam only with stronger value in rebuy mode. Dead money is good, but callers gamble wider when rebuys remain.`];
    if (bb <= 15) return ["FOLD", `At ${bb}BB over limpers, avoid passive calls. ${s.hand} is not strong enough to jam from ${p}.`];
    if (score >= openThreshold - valueDiscount) return ["OPEN", `Iso-raise over ${limpCount} limper(s). Suggested size: about ${isoSize}. From ${p} at ${bb}BB, ${s.hand} is strong enough to isolate rather than overlimp.${rebuyActive ? " Rebuy mode favors value isolation because loose players call too wide." : ""}`];
    return ["FOLD", `Facing ${limpCount} limper(s), ${s.hand} is not strong enough to iso from ${p}. Do not overlimp weak hands in this fast structure.`];
  }

  if (!facingOpen && p === "SB") {
    const bbPlayer = s.table.BB;
    const bbType = bbPlayer ? bbPlayer.type : "unknown";
    const bbExploit = mode === "Live Exploit" && ["tight", "passive"].includes(bbType) ? -6 : mode === "Live Exploit" && ["loose", "aggressive"].includes(bbType) ? 4 : 0;
    if (bb <= 20) {
      if (score >= 28 + bbExploit + bluffPenalty) return ["JAM", `SB vs BB at ${bb}BB: jam, but rebuy mode removes the thinnest bluff jams. BB has ${bbPlayer ? bbPlayer.bb : "?"}BB and is ${bbType}.`];
      return ["FOLD", `Too weak even for SB jam range at ${bb}BB.`];
    }
    if (score >= 25 + bbExploit + Math.floor(bluffPenalty / 2)) return ["OPEN", "Folded to SB. Open wide, but trim the weakest steals while rebuys remain because BB calls/plays back wider."];
    return ["FOLD", "Weak hand; okay to give up from SB despite only one player behind."];
  }

  if (facingOpen) {
    let adjustment = 0;
    if (coverVillain) adjustment -= 4;
    if (coveredByVillain) adjustment += 4;
    if (looseVillain) adjustment -= 5;
    adjustment += liveFacingAdj;
    if (openTooBig) adjustment += mode === "Live Exploit" && villain && villain.type === "loose" ? 2 : 8;
    if (openTiny && lateVillain) adjustment -= 3;

    if (bb <= 15) {
      const threshold = (lateVillain ? 50 : 78) + adjustment;
      if (score >= threshold) return ["3-BET JAM", `Facing ${villainPos}'s open at ${bb}BB: no flatting. ${coverVillain ? "You cover villain, so pressure improves." : coveredByVillain ? "Villain covers you, so stay tighter." : "Stacks are similar."}`];
      return ["FOLD", `Do not call at ${bb}BB. ${s.hand} is not strong enough to 3-bet jam versus ${villainPos}.`];
    }

    if (bb <= 30) {
      const primeResteal = lateVillain && (bucket === "blocker" || ["55", "66", "77", "88", "99", "ATo", "AQo", "KQs"].includes(s.hand) || score >= 68);
      if (primeResteal && score >= 45 + adjustment + bluffPenalty) return ["3-BET JAM", `Prime resteal: ${bb}BB vs ${villainPos} open (${villain ? villain.bb : "?"}BB). In rebuy mode, this must be more value-heavy because opener calls wider.`];
      if (!lateVillain && score >= 85 + adjustment - valueDiscount) return ["3-BET JAM", `Against earlier opens, keep 3-bet jams value-heavy. ${s.hand} qualifies.`];
      return ["FOLD", `Avoid flats at ${bb}BB. Not enough to 3-bet jam profitably versus ${villainPos}'s open.`];
    }

    if (bb <= 45) {
      if (score >= 85 + adjustment) return ["3-BET", "Normal value 3-bet. Size around 3x in position, 3.5x-4x out of position."];
      if (lateVillain && looseVillain && ["blocker", "strong"].includes(bucket)) return ["3-BET", `Good blocker/pressure 3-bet versus a ${villain ? villain.type : "loose"} ${villainPos} opener.`];
      if (p === "BB" && lateVillain && score >= 36 + adjustment) return ["CALL", "BB gets a price versus late opens. Defend playable hands when stacks are deep enough."];
      return ["FOLD", `Not strong enough to continue versus this open at ${bb}BB.`];
    }

    if (p === "BB" && lateVillain && passiveVillain && openTiny && isSuited(s.hand) && score >= 80 && bb >= 60) return ["CALL", "Deep BB versus passive late-position min-open: suited broadways realize equity well and keep dominated hands in."];
    if (score >= 85 + adjustment) return ["3-BET", "Deep enough for a normal value 3-bet."];
    if (p === "BB" && lateVillain && score >= 30 + adjustment) return ["CALL", "BB defense is correct versus late opens when deep enough and priced in."];
    if (p === "SB") return ["FOLD", "SB should mostly 3-bet or fold. Avoid flatting out of position."];
    if (score >= 45 + adjustment && lateVillain) return ["CALL", "Playable versus a late open with position/price."];
    return ["FOLD", "Default fold versus open."];
  }

  if (bb <= 15) {
    let threshold = isEarly(p) ? 60 : p === "LJ" || p === "HJ" ? 50 : p === "CO" ? 42 : p === "BTN" ? 32 : 28;
    if (shortBehind >= 3) threshold += 3;
    if (score >= threshold) return ["JAM", `Level ${s.level.level}, ${bb}BB: push/fold. ${s.hand} clears the jam range from ${p}.`];
    return ["FOLD", `Level ${s.level.level}, ${bb}BB: jam/fold only. ${s.hand} is below range from ${p}.`];
  }

  if (bb <= 25) {
    const openerPenalty = (shortBehind >= 2 ? 4 : 0) + (bigBehind >= 1 ? 4 : 0) + (mode === "Live Exploit" ? Math.max(0, looseAggroBehind - tightPassiveBehind) * 2 : 0);
    if (isLate(p) && ["blocker", "speculative", "weakSteal"].includes(bucket) && score >= 36 + openerPenalty + bluffPenalty) return ["JAM", `Late position at ${bb}BB: this hand plays well as an open-jam, but rebuy mode requires more strength because calls are wider.`];
    const openThreshold = (isEarly(p) ? 68 : isLate(p) ? 42 : 52) + openerPenalty;
    if (score >= openThreshold - valueDiscount) return ["OPEN", `Open 2.0x. Strong enough to raise; not mandatory to open-jam from ${p}.${rebuyActive ? " Rebuy mode rewards value opens because players defend too wide." : ""}`];
    return ["FOLD", `Fold. Not enough hand strength/fold equity from ${p} with these stacks behind.`];
  }

  if (bb <= 40) {
    const threshold = (isEarly(p) ? 68 : isLate(p) ? 36 : 50) + (mode === "Live Exploit" && isLate(p) ? -Math.min(6, tightPassiveBehind * 2) : 0) + Math.floor(bluffPenalty / 2) - valueDiscount;
    if (score >= threshold) return ["OPEN", `Open 2.0x-2.2x. You have ${bb}BB; pressure matters, but open-jamming this depth is usually unnecessary.`];
    return ["FOLD", `Below opening range for ${p}.`];
  }

  const threshold = (isEarly(p) ? 68 : isLate(p) ? 30 : 45) + (mode === "Live Exploit" && isLate(p) ? -Math.min(8, tightPassiveBehind * 2) : 0) + Math.floor(bluffPenalty / 2) - valueDiscount;
  if (score >= threshold) return ["OPEN", "Open 2.2x. Early levels: build pots with playable hands. If table is loose/passive and hand is value-heavy, 2.5x is fine."];
  return ["FOLD", `Too loose for ${p} this deep. Preserve chips and attack better spots.`];
}

function generateRandomScenario(stageMode = "all", difficulty = "Standard", seen = new Set(), rebuyMode = "Post-Rebuy") {
  let guard = 0;
  while (guard < 1000) {
    const seed = randomSeed();
    const scenario = generateScenario(seed, difficulty, rebuyMode);
    const key = `${scenario.level.level}-${scenario.heroPos}-${scenario.hand}-${scenario.hero.bb}-${scenario.prior}`;
    if ((stageMode === "all" || scenario.level.stage === stageMode) && !seen.has(key)) {
      seen.add(key);
      return scenario;
    }
    guard++;
  }
  seen.clear();
  const scenario = generateScenario(randomSeed(), difficulty, rebuyMode);
  seen.add(`${scenario.level.level}-${scenario.heroPos}-${scenario.hand}-${scenario.hero.bb}-${scenario.prior}`);
  return scenario;
}
function leakKey(selected, best) {
  if (!selected || selected === best) return "correct";
  if ((best === "JAM" || best === "3-BET JAM") && selected === "FOLD") return "missedJams";
  if (best === "FOLD" && selected !== "FOLD") return "overAggro";
  if (best === "CALL" && selected === "FOLD") return "overFolds";
  if ((best === "3-BET" || best === "3-BET JAM") && selected === "CALL") return "passiveCalls";
  return "other";
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
function getEffectiveBB(s) { return s.villain ? Math.min(s.hero.bb, s.villain.bb) : s.hero.bb; }
function getWarnings(s) {
  const behind = playersBehind(s.heroPos).map((p) => s.table[p]).filter(Boolean);
  const shortBehind = behind.filter((x) => x.bb <= 15);
  const aggroBehind = behind.filter((x) => ["aggressive", "loose"].includes(x.type));
  const warnings = [];
  if (shortBehind.length >= 2) warnings.push(`${shortBehind.length} reshove stacks behind`);
  if (aggroBehind.length >= 2) warnings.push(`${aggroBehind.length} loose/aggressive players behind`);
  if (s.villain && s.villain.bb > s.hero.bb) warnings.push("villain covers you");
  if (hasLimp(s.prior)) warnings.push("dead money from limpers");
  return warnings;
}
function getRangeView(s, answer) {
  const bb = s.hero.bb;
  if (hasLimp(s.prior)) {
    return {
      hero: bb <= 25 ? "Jam range over limps: 55+, A9o+, A5s+, KTs+, QJs, strong broadways" : "Iso late/deep: pairs, suited aces, broadways, suited connectors, strong Kx/Qx from CO/BTN",
      villain: "Typical limp range: small pairs, weak Ax, suited kings, broadways, suited connectors, random traps rarely",
    };
  }
  if (hasOpen(s.prior)) {
    return {
      hero: answer.includes("JAM") ? "Resteal jam range: pairs, Axs blockers, ATo+, KQs/KJs depending opener" : "Continue range: value 3-bets, suited broadway calls in BB, folds vs tight/large early opens",
      villain: s.villainPos ? `${s.villainPos} open range: tighter early, wider CO/BTN/SB; type=${s.villain?.type || "unknown"}` : "Opener range depends heavily on position and type",
    };
  }
  return {
    hero: bb <= 15 ? "Open-jam range: pairs, Ax, broadways, suited connectors wider late" : "Open range: tight early, wide CO/BTN/SB; avoid loose opens with reshove stacks behind",
    villain: "Players behind: defend tighter if tight/passive, reshove more if short/aggressive",
  };
}
function getEVExplanation(s, answer, rebuyMode = "Post-Rebuy") {
  const effective = getEffectiveBB(s);
  const warnings = getWarnings(s);
  const lines = [];
  if (answer.includes("JAM")) {
    lines.push("Fold equity is the main profit driver; you deny realization.");
    lines.push(`Effective stack is about ${effective}BB, so all-in pressure matters.`);
  } else if (answer === "OPEN") {
    lines.push("Opening/iso-raising keeps range strength while risking less than a jam.");
  } else if (answer === "3-BET") {
    lines.push("3-betting gets value, denies equity, and keeps initiative.");
  } else if (answer === "CALL") {
    lines.push("Calling is selected because price/playability/equity realization are strong enough.");
  } else {
    lines.push("Folding avoids dominated-hand and reverse-implied-odds problems.");
  }
  if (rebuyIntensity(rebuyMode) > 0) lines.push(`${rebuyMode}: opponents call wider, so bluff fold-equity is lower and value becomes more important.`);
  if (warnings.length) lines.push(`Warning factors: ${warnings.join(", ")}.`);
  return lines;
}
function summarizeLeaks(leaks) {
  const entries = [["Missed jams", leaks.missedJams], ["Over-folds", leaks.overFolds], ["Passive calls", leaks.passiveCalls], ["Over-aggressive punts", leaks.overAggro], ["Other", leaks.other]];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? `${top[0]} (${top[1]})` : "No leak yet";
}
function sessionRecommendation(leaks, attempted, accuracy) {
  if (attempted < 10) return "Play at least 10 hands for a useful report.";
  const top = summarizeLeaks(leaks);
  if (top.startsWith("Missed jams")) return "Drill 7–20BB open-jam and 3-bet jam spots.";
  if (top.startsWith("Over-folds")) return "Drill BB defense and suited-hand calls versus late opens.";
  if (top.startsWith("Passive calls")) return "Convert calls into 3-bet jams at 15–30BB.";
  if (top.startsWith("Over-aggressive")) return "Tighten versus early opens and oversized live opens.";
  if (accuracy >= 80) return "Strong session. Move to Tough Spots or Speed.";
  return "Stay in Standard until decisions feel automatic.";
}

export default function App() {
  const [seen] = useState(() => new Set());
  const [stageMode, setStageMode] = useState("all");
  const [strategyMode, setStrategyMode] = useState("Live Exploit");
  const [difficultyMode, setDifficultyMode] = useState("Standard");
  const [drillMode, setDrillMode] = useState("Normal");
  const [rebuyMode, setRebuyMode] = useState("Early Rebuy");
  const [scenario, setScenario] = useState(() => generateRandomScenario("all", "Standard", new Set()));
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [history, setHistory] = useState([]);
  const [leaks, setLeaks] = useState({ missedJams: 0, overFolds: 0, passiveCalls: 0, overAggro: 0, other: 0 });
  const [timeLeft, setTimeLeft] = useState(5);
  const [showStudy, setShowStudy] = useState(false);
  const [showStacks, setShowStacks] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [answer, explanation] = solve(scenario, strategyMode, rebuyMode);
  const legalActions = useMemo(() => legalActionsForScenario(scenario), [scenario]);
  const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
  const warnings = getWarnings(scenario);
  const rangeView = getRangeView(scenario, answer);
  const evLines = getEVExplanation(scenario, answer, rebuyMode);
  const potBefore = scenario.level.sb + scenario.level.bb + scenario.level.bb;
  const effectiveBB = getEffectiveBB(scenario);
  const behindList = playersBehind(scenario.heroPos).map((p) => scenario.table[p]).filter(Boolean);
  const isCorrect = selected === answer;

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
    if (action === answer) setCorrect((x) => x + 1);
    const key = leakKey(action, answer);
    if (key !== "correct") setLeaks((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    setHistory((prev) => [{ scenario, selected: action, answer, correct: action === answer, mistake: mistakeLabel(action, answer, scenario) }, ...prev].slice(0, 10));
  }
  function next() {
    setScenario(generateRandomScenario(stageMode, difficultyMode, seen, rebuyMode));
    setAnswered(false);
    setSelected(null);
    setShowStudy(false);
    setShowStacks(false);
  }
  function reset() {
    seen.clear();
    setScenario(generateRandomScenario(stageMode, difficultyMode, seen, rebuyMode));
    setAnswered(false);
    setSelected(null);
    setCorrect(0);
    setAttempted(0);
    setHistory([]);
    setLeaks({ missedJams: 0, overFolds: 0, passiveCalls: 0, overAggro: 0, other: 0 });
  }
  function changeStage(m) {
    setStageMode(m);
    seen.clear();
    setScenario(generateRandomScenario(m, difficultyMode, seen, rebuyMode));
    setAnswered(false);
    setSelected(null);
  }
  function changeDifficulty(m) {
    setDifficultyMode(m);
    seen.clear();
    setScenario(generateRandomScenario(stageMode, m, seen, rebuyMode));
    setAnswered(false);
    setSelected(null);
  }
  function changeRebuy(m) {
    setRebuyMode(m);
    seen.clear();
    setScenario(generateRandomScenario(stageMode, difficultyMode, seen, m));
    setAnswered(false);
    setSelected(null);
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.overline}>WSOP MINI MYSTERY</div>
          <div style={styles.title}>Preflop Trainer</div>
        </div>
        <button onClick={reset} style={styles.smallBtn}>Reset</button>
      </div>

      <div style={styles.statsGrid}>
        <Stat label="Hands" value={attempted} />
        <Stat label="Acc" value={`${accuracy}%`} />
        <Stat label="Timer" value={drillMode === "Speed" && !answered ? `${timeLeft}s` : "—"} />
        <Stat label="Leak" value={summarizeLeaks(leaks).replace("Over-aggressive punts", "Punts")} small />
      </div>

      <div style={styles.controlsRow}>
        {strategyModes.map((m) => <Chip key={m} active={strategyMode === m} onClick={() => setStrategyMode(m)}>{m}</Chip>)}
        {difficultyModes.map((m) => <Chip key={m} active={difficultyMode === m} onClick={() => changeDifficulty(m)}>{m}</Chip>)}
        {drillModes.map((m) => <Chip key={m} active={drillMode === m} onClick={() => setDrillMode(m)}>{m}</Chip>)}
        {rebuyModes.map((m) => <Chip key={m} active={rebuyMode === m} onClick={() => changeRebuy(m)}>{m}</Chip>)}
      </div>

      <div style={styles.controlsRow}>
        {["all", "Early", "Pressure", "Critical", "Push/Fold"].map((m) => <Chip key={m} active={stageMode === m} onClick={() => changeStage(m)}>{m === "all" ? "All" : m}</Chip>)}
      </div>

      <section style={styles.heroCard}>
        <div style={styles.badgeRow}>
          <Badge>Level {scenario.level.level}</Badge>
          <Badge>{scenario.level.stage}</Badge>
          <Badge>{fmt(scenario.level.sb)}/{fmt(scenario.level.bb)}</Badge>
          <Badge>BB Ante {fmt(scenario.level.bb)}</Badge>
          <Badge>{rebuyMode}</Badge>
        </div>

        {warnings.length ? <div style={styles.warning}>⚠ {warnings.join(" · ")}</div> : null}

        <div style={styles.handRow}>
          <div>
            <div style={styles.label}>HAND</div>
            <div style={styles.hand}>{scenario.hand}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={styles.posPill}>{scenario.heroPos}</div>
            <div style={styles.stackLine}>{scenario.hero.bb}BB</div>
            <div style={styles.subtle}>{fmt(scenario.hero.chips)} chips</div>
          </div>
        </div>

        <div style={styles.actionBox}>
          <div style={styles.label}>ACTION BEFORE YOU</div>
          <div style={styles.prior}>{scenario.prior}</div>
        </div>

        <div style={styles.miniGrid}>
          <Mini label="Stage" value={stageInfo[scenario.level.stage]} />
          <Mini label="Effective" value={`${effectiveBB}BB`} />
          <Mini label="Pot" value={fmt(potBefore)} />
          <Mini label="Stack" value={scenario.hero.label} />
        </div>
      </section>

      <div style={styles.actionGrid}>
        {legalActions.map((a) => (
          <button key={a} onClick={() => choose(a)} disabled={answered} style={{ ...styles.actionBtn, ...(selected === a ? styles.selectedBtn : {}) }}>
            {a}
          </button>
        ))}
      </div>

      {answered && (
        <section style={{ ...styles.feedback, borderColor: isCorrect ? "#22c55e" : "#ef4444" }}>
          <div style={{ ...styles.result, color: isCorrect ? "#22c55e" : "#ef4444" }}>{isCorrect ? "✅ Correct" : "❌ Not quite"}</div>
          <div style={styles.feedbackLine}>Your answer: <b>{selected}</b></div>
          <div style={styles.feedbackLine}>Best action: <b>{answer}</b></div>
          <div style={styles.explain}>{explanation}</div>
          <div style={styles.mistake}>Mistake type: {mistakeLabel(selected, answer, scenario)}</div>

          <button style={styles.studyToggle} onClick={() => setShowStudy(!showStudy)}>{showStudy ? "Hide Study Details" : "Show EV / Range Details"}</button>
          {showStudy && (
            <div style={styles.studyBox}>
              <div style={styles.studyTitle}>EV logic</div>
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>{evLines.map((x, i) => <li key={i}>{x}</li>)}</ul>
              <div style={styles.studyTitle}>Range view</div>
              <p><b>Hero:</b> {rangeView.hero}</p>
              <p><b>Villain/pool:</b> {rangeView.villain}</p>
              <p><b>Sizing:</b> Open 2.0x–2.2x. SB 2.5x–3x deeper. Iso 3x + 1BB/limper. 3-bet 3x IP, 3.5x–4x OOP.</p>
            </div>
          )}

          <button style={styles.nextBtn} onClick={next}>Next Scenario</button>
        </section>
      )}

      <button style={styles.foldoutBtn} onClick={() => setShowStacks(!showStacks)}>{showStacks ? "Hide Stacks Behind" : "Show Stacks Behind"}</button>
      {showStacks && (
        <div style={styles.stackPanel}>
          {behindList.length === 0 ? <div style={styles.subtle}>No one behind. You are in BB.</div> : behindList.map((x) => (
            <div key={x.pos} style={{ ...styles.stackItem, background: x.bb <= 15 ? "#7f1d1d" : ["loose", "aggressive"].includes(x.type) ? "#78350f" : "#1e293b" }}>
              <b>{x.pos}</b> · {x.bb}BB · {x.type}<br /><span style={styles.subtle}>{fmt(x.chips)} chips</span>
            </div>
          ))}
        </div>
      )}

      <button style={styles.foldoutBtn} onClick={() => setShowReport(!showReport)}>{showReport ? "Hide Session Report" : "Show Session Report"}</button>
      {showReport && (
        <div style={styles.report}>
          <div style={styles.reportTitle}>Session Report</div>
          <p><b>Top leak:</b> {summarizeLeaks(leaks)}</p>
          <p><b>Recommendation:</b> {sessionRecommendation(leaks, attempted, accuracy)}</p>
          <div style={styles.reportTitle}>Recent mistakes</div>
          {history.filter((h) => !h.correct).slice(0, 4).length === 0 ? <p style={styles.subtle}>No recent mistakes.</p> : history.filter((h) => !h.correct).slice(0, 4).map((h, idx) => (
            <div key={idx} style={styles.historyItem}><b>{h.scenario.heroPos} {h.scenario.hand} · {h.scenario.hero.bb}BB</b><br />{h.selected} → best {h.answer}<br />{h.mistake}</div>
          ))}
        </div>
      )}

      <div style={styles.footer}>Full desktop logic · mobile UI · WSOP rebuy environment · no exact repeat spots</div>
    </div>
  );
}

function Stat({ label, value, small }) {
  return <div style={styles.stat}><div style={styles.statLabel}>{label}</div><div style={{ ...styles.statValue, fontSize: small ? 12 : 18 }}>{value}</div></div>;
}
function Badge({ children }) { return <span style={styles.badge}>{children}</span>; }
function Chip({ active, onClick, children }) { return <button onClick={onClick} style={{ ...styles.chip, ...(active ? styles.activeChip : {}) }}>{children}</button>; }
function Mini({ label, value }) { return <div style={styles.mini}><div style={styles.label}>{label}</div><div style={styles.miniValue}>{value}</div></div>; }

const styles = {
  page: { minHeight: "100vh", background: "#020617", color: "white", padding: 14, maxWidth: 480, margin: "0 auto", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  overline: { fontSize: 11, color: "#94a3b8", letterSpacing: 1.5, fontWeight: 800 },
  title: { fontSize: 24, fontWeight: 900, lineHeight: 1.1 },
  smallBtn: { background: "#1e293b", color: "white", border: "1px solid #475569", borderRadius: 12, padding: "9px 12px", fontWeight: 900 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 10 },
  stat: { background: "#111827", border: "1px solid #334155", borderRadius: 14, padding: 9, textAlign: "center", minHeight: 54 },
  statLabel: { fontSize: 11, color: "#94a3b8" },
  statValue: { fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  controlsRow: { display: "flex", gap: 7, overflowX: "auto", paddingBottom: 8, marginBottom: 2 },
  chip: { flex: "0 0 auto", border: "1px solid #475569", background: "#1e293b", color: "white", borderRadius: 999, padding: "8px 11px", fontSize: 12, fontWeight: 900 },
  activeChip: { background: "white", color: "#020617", borderColor: "white" },
  heroCard: { background: "white", color: "#0f172a", borderRadius: 24, padding: 17, marginTop: 4, boxShadow: "0 18px 40px rgba(0,0,0,.35)" },
  badgeRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  badge: { display: "inline-block", background: "#e2e8f0", color: "#0f172a", borderRadius: 999, padding: "6px 9px", fontSize: 12, fontWeight: 900 },
  warning: { background: "#fef3c7", color: "#78350f", borderRadius: 14, padding: 10, fontSize: 13, fontWeight: 800, marginBottom: 12 },
  handRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  label: { fontSize: 11, color: "#64748b", fontWeight: 900, letterSpacing: .5 },
  hand: { fontSize: 58, fontWeight: 950, lineHeight: .95 },
  posPill: { display: "inline-block", background: "#020617", color: "white", borderRadius: 999, padding: "8px 13px", fontWeight: 950, fontSize: 16 },
  stackLine: { fontSize: 24, fontWeight: 950, marginTop: 6 },
  subtle: { color: "#94a3b8", fontSize: 12 },
  actionBox: { background: "#e2e8f0", borderRadius: 17, padding: 13, marginBottom: 12 },
  prior: { fontSize: 18, fontWeight: 900, lineHeight: 1.25, marginTop: 4 },
  miniGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  mini: { background: "#f1f5f9", borderRadius: 14, padding: 10 },
  miniValue: { fontWeight: 900, marginTop: 2, fontSize: 13 },
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 13 },
  actionBtn: { height: 64, borderRadius: 18, border: "none", fontSize: 18, fontWeight: 950, background: "#e2e8f0", color: "#020617" },
  selectedBtn: { background: "#fbbf24", color: "#020617", boxShadow: "0 0 0 3px white" },
  feedback: { marginTop: 13, background: "#0f172a", border: "2px solid", borderRadius: 22, padding: 15 },
  result: { fontSize: 22, fontWeight: 950, marginBottom: 8 },
  feedbackLine: { fontSize: 15, marginBottom: 4 },
  explain: { color: "#cbd5e1", lineHeight: 1.35, marginTop: 9, fontSize: 14 },
  mistake: { background: "#1e293b", color: "#cbd5e1", padding: 10, borderRadius: 13, marginTop: 10, fontSize: 13, fontWeight: 800 },
  studyToggle: { width: "100%", height: 46, borderRadius: 14, border: "none", background: "#334155", color: "white", fontWeight: 900, marginTop: 12 },
  studyBox: { background: "#020617", border: "1px solid #334155", borderRadius: 15, padding: 12, color: "#cbd5e1", lineHeight: 1.35, fontSize: 13, marginTop: 10 },
  studyTitle: { color: "white", fontWeight: 950, marginTop: 6 },
  nextBtn: { width: "100%", height: 62, borderRadius: 18, border: "none", background: "#22c55e", color: "#052e16", fontSize: 22, fontWeight: 950, marginTop: 14 },
  foldoutBtn: { width: "100%", height: 48, borderRadius: 15, border: "1px solid #475569", background: "#111827", color: "white", fontWeight: 900, marginTop: 12 },
  stackPanel: { background: "#0f172a", border: "1px solid #334155", borderRadius: 18, padding: 11, marginTop: 8, display: "grid", gap: 8 },
  stackItem: { borderRadius: 13, padding: 10, fontSize: 13 },
  report: { background: "#0f172a", border: "1px solid #334155", borderRadius: 18, padding: 13, marginTop: 8, color: "#cbd5e1", fontSize: 14, lineHeight: 1.35 },
  reportTitle: { color: "white", fontWeight: 950, fontSize: 16, marginBottom: 7 },
  historyItem: { background: "#7f1d1d55", borderRadius: 13, padding: 10, marginTop: 8 },
  footer: { textAlign: "center", color: "#64748b", fontSize: 12, marginTop: 14, paddingBottom: 10 },
};

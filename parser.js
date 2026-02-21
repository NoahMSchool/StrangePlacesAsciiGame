// ---------------- CONFIG (declare once) ----------------

const STOPWORDS = new Set(["the", "a", "an", "at", "up", "to"]);

// ✅ Noun connectors used to split "X with Y", "X in Y", etc.
const NOUN_CONNECTORS = ["and", "with", "on", "to", "in", "into"];
const NOUN_CONNECTORS_RE = new RegExp(`\\b(?:${NOUN_CONNECTORS.join("|")})\\b`, "i");
// Split form: requires surrounding whitespace so "within" doesn't match "in"
const NOUN_CONNECTORS_SPLIT_RE = new RegExp(`\\s+\\b(?:${NOUN_CONNECTORS.join("|")})\\b\\s+`, "i");

const DIR = {
  n: "NORTH", north: "NORTH",
  s: "SOUTH", south: "SOUTH",
  e: "EAST",  east:  "EAST",
  w: "WEST",  west:  "WEST",
};

const VERB_SYNONYMS = {
  HELP:    ["help", "?", "??", "???", "wtf"],
  GO:      ["go", "walk", "run", "head"],
  INV:     ["inventory", "i"],
  SOUND:   ["sound", "audio"],
  MCBOOF:  ["mcboof"],
  READ:    ["read"],
  TALK:    ["talk", "speak", "chat", "talk to", "speak to"],
  SLEEP:   ["sleep", "rest", "nap", "lie down"],
  TAKE:    ["take", "grab", "pick up", "pickup", "get"],
  DROP:    ["drop", "discard", "leave"],
  USE:     ["use", "apply", "fish"],
  FILL:    ["fill"],
  COOK:    ["cook", "heat", "microwave"],
  FREE:    ["free", "rescue", "release", "save"],
  UNLOCK:  ["unlock"],
  OPEN:    ["open"],
  CLOSE:   ["close", "shut"],
  EXTINGUISH: ["extinguish", "put out"],
  HIT:     ["hit", "whack", "smack", "strike", "bash", "bonk", "clobber", "punch", "attack"],
  SEARCH:  ["search", "rummage", "dig through", "look in"],
  THROW:   ["throw", "toss", "hurl"],
  PUSH:    ["push", "shove", "kick", "move", "rustle", "clear"],
  PULL:    ["pull", "drag"],
  LOOK:    ["l","look", "look at", "examine", "ex", "inspect", "check", "view", "see"], // merged LOOK+EXAMINE
  COMBINE: ["combine", "mix", "put", "join", "attach", "merge", "connect", "tie", "feed"],
  MAKE:    ["make", "craft", "build"],
  EAT:     ["eat", "consume", "devour"]
};

// How many noun arguments each verb accepts.
const VERB_NOUN_COUNTS = {
  GO: [0],
  INV: [0],
  HELP: [0],
  SOUND: [0, 1],
  MCBOOF: [1],
  READ: [1],
  TALK: [1],
  SLEEP: [0, 1],
  LOOK: [0, 1],
  OPEN: [1, 2],
  EXTINGUISH: [1],
  FREE: [1],
  HIT: [1],
  SEARCH: [1],
  FILL: [1, 2],
  COOK: [1, 2],
  USE: [1, 2],
  COMBINE: [2, 3],
};

const NOUN_SYNONYMS = buildNounSynonymsFromItems(ITEM_DEFS);

// ---------------- LOOKUPS (build once) ----------------

// ✅ Build noun synonym -> [canonical IDs] lookup once (not just one ID)
const NOUN_LOOKUP = new Map();
// { "egg" => ["EGG", "DINOSAUR_EGG"], ... }
for (const [canon, list] of Object.entries(NOUN_SYNONYMS)) {
  for (const n of list) {
    const key = String(n).toLowerCase();
    if (!NOUN_LOOKUP.has(key)) NOUN_LOOKUP.set(key, []);
    NOUN_LOOKUP.get(key).push(canon);
  }
}

// Precompute noun synonyms sorted by length (multi-word nouns first)
const NOUN_KEYS_LONGEST_FIRST = [...NOUN_LOOKUP.keys()].sort((a, b) => b.length - a.length);

// Build verb synonym->canonical lookup once
const VERB_LOOKUP = new Map();
for (const [canon, list] of Object.entries(VERB_SYNONYMS)) {
  for (const v of list) VERB_LOOKUP.set(v, canon);
}
// Precompute verbs sorted by length (multi-word verbs first)
const VERB_KEYS_LONGEST_FIRST = [...VERB_LOOKUP.keys()].sort((a, b) => b.length - a.length);

// ---------------- PARSER ----------------

function parseCommands(input) {
  const result = { known: [], unknown: [] };

  const normalizeSpaces = (s) => (s ?? "").trim().replace(/\s+/g, " ");
  const stripStopwords = (phrase) => {
    const tokens = normalizeSpaces(phrase).toLowerCase().split(" ").filter(Boolean);
    const kept = tokens.filter((t) => !STOPWORDS.has(t));
    return kept.join(" ");
  };

  function allowedNounCountsForVerb(canonVerb) {
    return VERB_NOUN_COUNTS[canonVerb] ?? [1]; // default = 1 noun
  }

  // ✅ returns Set of items currently available (room + inventory), if GameCore is loaded
  function getAvailableItemSet() {
    const G = window.GameCore;
    if (G && typeof G.allAvailableItemsSet === "function") {
      try {
        return G.allAvailableItemsSet(); // already a Set
      } catch (e) {
        // fall through
      }
    }
    return null; // unknown availability
  }

  function formatItemForDisambiguation(itemId) {
    const G = window.GameCore;
    if (G && typeof G.formatItem === "function") return G.formatItem(itemId);
    return itemId;
  }

  // Convert a player-typed noun phrase into a canonical noun ID.
  // Returns { ok:true, canon:"LAMP" } or { ok:false, error:"..." }
  function resolveNoun(phrase, { allowEmpty = false } = {}) {
    const cleaned = stripStopwords(phrase);
    if (!cleaned) {
      if (allowEmpty) return { ok: true, canon: null, cleaned: "" };
      return { ok: false, error: "You need to specify what you mean.", cleaned: "" };
    }

    // Magic keyword
    if (cleaned === "all" || cleaned === "everything") {
      return { ok: true, canon: "ALL", cleaned };
    }

    // Longest-first match so "metal grate" beats "grate"
    for (const key of NOUN_KEYS_LONGEST_FIRST) {
      if (cleaned === key || cleaned.startsWith(key + " ")) {
        const candidates = NOUN_LOOKUP.get(key) || [];
        if (candidates.length === 0) {
          return { ok: false, error: `I don't know what "${cleaned}" is.`, cleaned };
        }

        // If only one candidate, done
        if (candidates.length === 1) {
          return { ok: true, canon: candidates[0], cleaned };
        }

        // ✅ If multiple candidates, pick the one that's actually available (room/inventory)
        const available = getAvailableItemSet();
        if (available) {
          const present = candidates.filter((id) => available.has(id));

          if (present.length === 1) {
            return { ok: true, canon: present[0], cleaned };
          }

          if (present.length > 1) {
            const options = present.map(formatItemForDisambiguation).join(" or ");
            return {
              ok: false,
              error: `Which do you mean: ${options}?`,
              cleaned
            };
          }

          // None available right now → fall back to first so runtime can say "can't see that here"
          return { ok: true, canon: candidates[0], cleaned };
        }

        // No GameCore / can't check availability — keep old behaviour (first wins)
        return { ok: true, canon: candidates[0], cleaned };
      }
    }

    // Not found
    return { ok: false, error: `I don't know what "${cleaned}" is.`, cleaned };
  }

  // Match a verb (including multi-word verbs like "pick up", "look at")
  function matchVerb(clauseLowerOrMixed) {
    const c = normalizeSpaces(clauseLowerOrMixed);
    const lower = c.toLowerCase();

    for (const v of VERB_KEYS_LONGEST_FIRST) {
      if (lower === v || lower.startsWith(v + " ")) {
        const rest = normalizeSpaces(c.slice(v.length));
        return { canon: VERB_LOOKUP.get(v), verbToken: v, rest };
      }
    }
    return null;
  }

  function guessVerbObject(clauseLower) {
    const c = normalizeSpaces(clauseLower);
    if (!c) return { verb: null, object: null };
    const m = c.match(/^([a-z]+)\s+(.*)$/i);
    if (m) return { verb: m[1].toLowerCase(), object: m[2].trim() || null };
    return { verb: c.toLowerCase(), object: null };
  }

  // Parse a list of nouns separated by connectors
  function parseNounList(text, { min = 1, max = 3 } = {}) {
    const t = normalizeSpaces(text);
    const clean = stripStopwords(t);
    if (!clean) return { error: "You need to specify what you mean." };

    const parts = t
      .split(NOUN_CONNECTORS_SPLIT_RE)
      .map((p) => normalizeSpaces(p))
      .filter(Boolean);

    if (parts.length < min || parts.length > max) return { parts };

    const nouns = [];
    for (const p of parts) {
      const r = resolveNoun(p);
      if (!r.ok) return { error: r.error };
      nouns.push(r.canon);
    }
    return { nouns };
  }

  function parseTwoNouns(text) {
    const t = normalizeSpaces(text);
    const hasConnector = NOUN_CONNECTORS_RE.test(t);
    if (!hasConnector) return { tried: false };

    const got = parseNounList(text, { min: 2, max: 2 });
    if (got.nouns) return { tried: true, a: got.nouns[0], b: got.nouns[1] };
    if (got.error) return { tried: true, error: got.error };
    return { tried: true, error: "That needs two things (try: \"use X on Y\")." };
  }

  // Protect COMBINE's "and" (including 3-item combines) so we don't split the clause.
  const protectCombineAnd = (s) => {
    const lower = s.toLowerCase().trim();
    const vm = matchVerb(lower);
    if (!vm || vm.canon !== "COMBINE") return s;
    return s.replace(/\s+\band\b\s+/gi, " __AND__ ");
  };

  const splitClauses = (s) =>
    s.split(/\b(?:and|then)\b|[;,]/i).map(normalizeSpaces).filter(Boolean);

  let s = normalizeSpaces(input);
  if (!s) return result;

  s = protectCombineAnd(s);
  const clauses = splitClauses(s);

  for (let rawClause of clauses) {
    const raw = normalizeSpaces(rawClause.replace(/__AND__/g, "and"));
    let clause = normalizeSpaces(rawClause.toLowerCase())
      .replace(/__and__/g, "and")
      .replace(/__AND__/g, "and");

    if (!clause) continue;

    // 1) Movement
    let m = clause.match(/^(?:(go|move|walk|run|head)\s+)?(?:to\s+)?(north|south|east|west|n|s|e|w)\b/);
    if (m) {
      const dir = DIR[m[2]];
      if (dir) { result.known.push(`GO ${dir}`); continue; }
    }
    if (DIR[clause]) { result.known.push(`GO ${DIR[clause]}`); continue; }

    // 2) Verb matching
    const vm = matchVerb(clause);
    if (!vm) {
      const g = guessVerbObject(clause);
      result.unknown.push({ raw, verb: g.verb, object: g.object, reason: "unparsed" });
      continue;
    }

    // Special: "go lantern" etc.
    if (vm.canon === "GO") {
      const g = guessVerbObject(clause);
      result.unknown.push({
        raw,
        verb: g.verb,
        object: g.object,
        reason: "bad_movement",
        error: "Try a direction (north/south/east/west).",
      });
      continue;
    }

    const allowedCounts = allowedNounCountsForVerb(vm.canon);
    const restClean = stripStopwords(vm.rest);

    // SOUND: optional ON/OFF arg, otherwise toggle
    if (vm.canon === "SOUND") {
      if (!restClean) {
        result.known.push("SOUND");
        continue;
      }

      const arg = restClean.toUpperCase();
      if (arg === "ON" || arg === "OFF") {
        result.known.push(`SOUND ${arg}`);
      } else {
        result.unknown.push({
          raw,
          verb: vm.verbToken,
          object: restClean,
          reason: "bad_sound_arg",
          error: 'Use "SOUND ON" or "SOUND OFF".',
        });
      }
      continue;
    }

    // 0 nouns only: [0]
    if (allowedCounts.length === 1 && allowedCounts[0] === 0) {
      if (restClean) {
        result.unknown.push({
          raw,
          verb: vm.verbToken,
          object: restClean,
          reason: "unexpected_object",
          error: `"${vm.verbToken}" doesn't take an object.`,
        });
      } else {
        result.known.push(`${vm.canon}`);
      }
      continue;
    }

    // optional noun: [0,1]
    if (allowedCounts.includes(0) && allowedCounts.includes(1) && allowedCounts.length === 2) {
      if (!restClean) {
        result.known.push(`${vm.canon}`);
        continue;
      }
      const rn = resolveNoun(vm.rest);
      if (rn.ok) result.known.push(`${vm.canon} ${rn.canon}`);
      else result.unknown.push({ raw, verb: vm.verbToken, object: restClean, reason: "unknown_noun", error: rn.error });
      continue;
    }

    // COMBINE: allow 1 noun for implied-target commands, otherwise 2 or 3 nouns.
    if (vm.canon === "COMBINE" && allowedCounts.includes(2) && allowedCounts.includes(3)) {
      const got = parseNounList(vm.rest, { min: 2, max: 3 });

      if (got.nouns) {
        result.known.push(`${vm.canon} ${got.nouns.join(" ")}`);
      } else if (got.parts && got.parts.length === 1) {
        const rn = resolveNoun(got.parts[0]);
        if (rn.ok && rn.canon) result.known.push(`${vm.canon} ${rn.canon}`);
        else {
          result.unknown.push({
            raw,
            verb: vm.verbToken,
            object: restClean || null,
            reason: "unknown_noun",
            error: rn.error,
          });
        }
      } else if (got.error) {
        result.unknown.push({
          raw,
          verb: vm.verbToken,
          object: restClean || null,
          reason: "unknown_noun",
          error: got.error,
        });
      } else {
        result.unknown.push({
          raw,
          verb: vm.verbToken,
          object: restClean || null,
          reason: "bad_noun_count",
          error: `That command needs 2 or 3 things (try: "${vm.verbToken} X with Y" or "... with Y and Z").`,
        });
      }
      continue;
    }

    // exactly two nouns: [2]
    if (allowedCounts.length === 1 && allowedCounts[0] === 2) {
      const two = parseTwoNouns(vm.rest);
      if (two.tried && !two.error) {
        result.known.push(`${vm.canon} ${two.a} ${two.b}`);
      } else {
        result.unknown.push({
          raw,
          verb: vm.verbToken,
          object: restClean || null,
          reason: two.error ? "unknown_noun" : "bad_noun_count",
          error: two.error ?? `That command needs two things (try: "${vm.verbToken} X with Y").`,
        });
      }
      continue;
    }

    // one OR two nouns: [1,2] (USE)
    if (allowedCounts.includes(1) && allowedCounts.includes(2)) {
      if (!restClean) {
        result.unknown.push({
          raw,
          verb: vm.verbToken,
          object: null,
          reason: "missing_object",
          error: `What do you want to ${vm.verbToken}?`,
        });
        continue;
      }

      const two = parseTwoNouns(vm.rest);

      if (two.tried) {
        if (!two.error) {
          result.known.push(`${vm.canon} ${two.a} ${two.b}`);
        } else {
          result.unknown.push({
            raw,
            verb: vm.verbToken,
            object: restClean || null,
            reason: "unknown_noun",
            error: two.error,
          });
        }
        continue;
      }

      const rn = resolveNoun(vm.rest);
      if (rn.ok && rn.canon) {
        result.known.push(`${vm.canon} ${rn.canon}`);
      } else {
        result.unknown.push({
          raw,
          verb: vm.verbToken,
          object: restClean || null,
          reason: "unknown_noun",
          error: rn.error,
        });
      }
      continue;
    }

    // default: exactly one noun required
    if (!restClean) {
      result.unknown.push({
        raw,
        verb: vm.verbToken,
        object: null,
        reason: "missing_object",
        error: `What do you want to ${vm.verbToken}?`,
      });
      continue;
    }

    const rn = resolveNoun(vm.rest);
    if (rn.ok && rn.canon) {
      result.known.push(`${vm.canon} ${rn.canon}`);
    } else {
      result.unknown.push({
        raw,
        verb: vm.verbToken,
        object: restClean || null,
        reason: "unknown_noun",
        error: rn.error,
      });
    }
  }

  return result;
}

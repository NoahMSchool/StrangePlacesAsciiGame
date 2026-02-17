
// ---------------- CONFIG (declare once) ----------------

const STOPWORDS = new Set(["the", "a", "an", "at"]);

const DIR = {
  n: "NORTH", north: "NORTH",
  s: "SOUTH", south: "SOUTH",
  e: "EAST",  east:  "EAST",
  w: "WEST",  west:  "WEST",
};

const VERB_SYNONYMS = {
  GO:      ["go", "walk", "run", "head"],
  INV:     ["inventory", "i"],
  TAKE:    ["take", "grab", "pick up", "pickup", "get"],
  DROP:    ["drop", "discard", "leave"],
  USE:     ["use", "apply"],
  OPEN:    ["open", "unlock"],
  CLOSE:   ["close", "shut"],
  THROW:   ["throw", "toss", "hurl"],
  PUSH:    ["push", "shove", "kick", "move"],
  PULL:    ["pull", "drag"],
  LOOK:    ["l","look", "look at", "examine", "inspect", "check", "view", "see"], // merged LOOK+EXAMINE
  COMBINE: ["combine", "mix", "join", "attach", "merge", "connect", "tie", "feed"],
  MAKE:    ["make", "craft", "build"],
  EAT:     ["eat", "consume", "devour"]
};

// How many noun arguments each verb accepts.
// Default = [1]  (so only list exceptions)
// Examples:
//   [0]     => no nouns
//   [1]     => exactly 1 noun (default)
//   [0,1]   => optional noun (0 or 1)
//   [2]     => exactly 2 nouns
//   [1,2]   => 1 or 2 nouns (USE key / USE key ON grate)
//   [2,3]   => 2 or 3 nouns (COMBINE rope + hook (+ magnet))
const VERB_NOUN_COUNTS = {
  GO: [0],
  INV: [0],
  LOOK: [0, 1],
  USE: [1, 2],
  COMBINE: [2, 3],
};

const NOUN_SYNONYMS = buildNounSynonymsFromItems(ITEM_DEFS);

// ---------------- LOOKUPS (build once) ----------------

// Build noun synonym->canonical lookup once
const NOUN_LOOKUP = new Map();
for (const [canon, list] of Object.entries(NOUN_SYNONYMS)) {
  for (const n of list) NOUN_LOOKUP.set(n, canon);
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

  // Convert a player-typed noun phrase into a canonical noun ID.
  // Returns { ok:true, canon:"LAMP" } or { ok:false, error:"..." }
  function resolveNoun(phrase, { allowEmpty = false } = {}) {
    const cleaned = stripStopwords(phrase);
    if (!cleaned) {
      if (allowEmpty) return { ok: true, canon: null, cleaned: "" };
      return { ok: false, error: "You need to specify what you mean.", cleaned: "" };
    }

    // Longest-first match so "metal grate" beats "grate"
    for (const key of NOUN_KEYS_LONGEST_FIRST) {
      if (cleaned === key || cleaned.startsWith(key + " ")) {
        return { ok: true, canon: NOUN_LOOKUP.get(key), cleaned };
      }
    }

    // Magic keyword
    if (cleaned === "all" || cleaned === "everything") {
      return { ok: true, canon: "ALL", cleaned };
    }


    // Not found: sensible error
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

  // Parse a list of nouns separated by: and/with/on/to
  // Returns:
  //   { nouns: ["ROPE","HOOK"] } on success
  //   { error: "..." } if a noun is unknown / missing
  //   { parts: ["rope"] } if wrong number of parts (count mismatch)
  function parseNounList(text, { min = 1, max = 3 } = {}) {
    const t = normalizeSpaces(text);
    const clean = stripStopwords(t);
    if (!clean) return { error: "You need to specify what you mean." };

    const parts = t
      .split(/\s+\b(?:and|with|on|to)\b\s+/i)
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

  // For verbs that accept 2 nouns (or 1/2 nouns), but we only consider it "two noun form"
  // if the input contains a connector, i.e. the player tried "X on Y" etc.
  function parseTwoNouns(text) {
    const t = normalizeSpaces(text);
    const hasConnector = /\b(?:and|with|on|to)\b/i.test(t);
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
    // Replace *all* " and " after the verb with marker
    return s.replace(/\s+\band\b\s+/gi, " __AND__ ");
  };

  // Split on connectors, but after protection "__AND__" won't be split
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

    // 1) Movement: "go north", "go n", "north", "n"
    let m = clause.match(/^(?:(go|move|walk|run|head)\s+)?(?:to\s+)?(north|south|east|west|n|s|e|w)\b/);
    if (m) {
      const dir = DIR[m[2]];
      if (dir) { result.known.push(`GO ${dir}`); continue; }
    }
    // Also allow single-token direction
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

    // COMBINE: 2 OR 3 nouns: [2,3]
    if (vm.canon === "COMBINE" && allowedCounts.includes(2) && allowedCounts.includes(3)) {
      const got = parseNounList(vm.rest, { min: 2, max: 3 });

      if (got.nouns) {
        result.known.push(`${vm.canon} ${got.nouns.join(" ")}`);
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

      // Try two-noun form *only if the player used a connector*
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
        continue; // IMPORTANT: never fall back if they tried 2-noun form
      }

      // Otherwise: true 1-noun form
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

function debugFormatParseResult(result) {
  const lines = [];

  lines.push("KNOWN:");
  if (result.known.length === 0) {
    lines.push("  (none)");
  } else {
    result.known.forEach((cmd, i) => {
      lines.push(`  ${i + 1}. ${cmd}`);
    });
  }

  if (result.unknown.length !== 0) {
    lines.push("UNKNOWN:");
    result.unknown.forEach((u, i) => {
      const extra = u.error ? ` | error: ${u.error}` : "";
      lines.push(
        `  ${i + 1}. "${u.raw}" → verb: ${u.verb ?? "?"}, object: ${u.object ?? "?"}, reason: ${u.reason}${extra}`
      );
    });
  }

  return lines.join("\n");
}

// ---------------- UNIT TESTS ----------------

function runParserUnitTests() {
  const tests = [
    // Movement
    { in: "north", known: ["GO NORTH"] },
    { in: "go n", known: ["GO NORTH"] },
    { in: "head to west", known: ["GO WEST"] },

    // Stopwords + noun resolution
    { in: "take the egg", known: ["TAKE EGG"] },
    { in: "look at the metal grate", known: ["LOOK GRATE"] },

    // LOOK optional noun
    { in: "look", known: ["LOOK"] },
    { in: "examine chicken", known: ["LOOK CHICKEN"] },

    // Default 1-noun verbs
    { in: "push chicken", known: ["PUSH CHICKEN"] },
    { in: "pull grate", known: ["PULL GRATE"] },
    { in: "feed chicken", known: ["FEED CHICKEN"] },

    // Missing object
    { in: "take", unknownReason: "missing_object" },
    { in: "push", unknownReason: "missing_object" },

    // Unknown noun
    { in: "take blorb", unknownReason: "unknown_noun" },
    { in: "look at blorb", unknownReason: "unknown_noun" },

    // Bad movement object
    { in: "go lamp", unknownReason: "bad_movement" },

    // USE: 1 or 2 nouns
    { in: "use key", known: ["USE KEY"] },
    { in: "use key on grate", known: ["USE KEY GRATE"] },
    { in: "apply magnet to grate", known: ["USE MAGNET GRATE"] },
    { in: "use blorb on grate", unknownReason: "unknown_noun" },
    { in: "use key on blorb", unknownReason: "unknown_noun" },

    // COMBINE: 2 or 3 nouns
    { in: "combine rope and hook", known: ["COMBINE ROPE HOOK"] },
    { in: "combine rope and hook and magnet", known: ["COMBINE ROPE HOOK MAGNET"] },
    { in: "combine rope with hook and magnet", known: ["COMBINE ROPE HOOK MAGNET"] },
    { in: "combine rope", unknownReason: "bad_noun_count" },

    // Clause splitting (and/then/; ,)
    { in: "take egg then look", known: ["TAKE EGG", "LOOK"] },
    { in: "take egg; drop egg", known: ["TAKE EGG", "DROP EGG"] },

    // Ensure COMBINE doesn't get split by "and"
    { in: "combine rope and hook and magnet then look", known: ["COMBINE ROPE HOOK MAGNET", "LOOK"] },
  ];

  const toJSON = (x) => JSON.stringify(x);

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function eqArrays(a, b) {
    return toJSON(a) === toJSON(b);
  }

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const t of tests) {
    let r;
    try {
      r = parseCommands(t.in);

      if (t.known) {
        assert(
          eqArrays(r.known, t.known),
          `Expected known=${toJSON(t.known)} but got known=${toJSON(r.known)}`
        );
      }

      if (t.unknownReason) {
        assert(
          r.unknown.length >= 1,
          `Expected at least 1 unknown, got 0 (known=${toJSON(r.known)})`
        );
        assert(
          r.unknown[0].reason === t.unknownReason,
          `Expected unknown[0].reason="${t.unknownReason}" but got "${r.unknown[0].reason}"`
        );
      }

      passed++;
    } catch (e) {
      failed++;
      failures.push({
        input: t.in,
        error: String(e?.message ?? e),
        parse: r ? { known: r.known, unknown: r.unknown } : null,
      });
    }
  }

  const summary = { total: tests.length, passed, failed, failures };

  const lines = [];
  lines.push(`Parser unit tests: ${passed}/${tests.length} passed`);
  if (failed) {
    lines.push("Failures:");
    for (const f of failures) {
      lines.push(`- input: ${JSON.stringify(f.input)}`);
      lines.push(`  error: ${f.error}`);
      if (f.parse) {
        lines.push(`  known: ${JSON.stringify(f.parse.known)}`);
        lines.push(`  unknown: ${JSON.stringify(f.parse.unknown)}`);
      }
    }
  }

  return { summary, report: lines.join("\n") };
}

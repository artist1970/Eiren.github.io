/*
  Eiren Specialist Adapter
  Version: 0.1.1
  Architecture: Noema -> NAIB -> Eiren

  This adapter is intentionally handoff-only.
  It does not grant permissions, perform remote execution,
  persist conversation history, or claim that a handoff completed.
*/

const MODES = Object.freeze([
  "reflection",
  "poem",
  "song",
  "story",
  "practical"
]);

const RESOURCE_HINTS = Object.freeze([
  {
    id: "the-refrain",
    label: "The Refrain",
    purposes: ["song", "songwriting", "music", "melody", "lyrics", "rhythm", "composition", "listening"]
  },
  {
    id: "aurora",
    label: "Aurora",
    purposes: ["reflection", "journal", "journaling", "quiet", "meaning", "mood", "rest", "inspiration"]
  },
  {
    id: "prose",
    label: "PROSE / ProReSources",
    purposes: ["write", "writing", "edit", "editing", "draft", "essay", "story", "poem", "script"]
  },
  {
    id: "arshif",
    label: "ARSHIF",
    purposes: ["poetry", "literature", "reading", "culture", "history", "context", "archive", "reference"]
  },
  {
    id: "bazaar-art",
    label: "Bazaar Art",
    purposes: ["paint", "painting", "visual", "image", "art", "color", "canvas", "mixed-media", "photography"]
  },
  {
    id: "creative-spark",
    label: "Creative Spark",
    purposes: ["idea", "prompt", "stuck", "block", "spark", "theme", "symbol", "style", "start"]
  }
]);

const BOUNDARIES = Object.freeze([
  "no-administrative-authority",
  "no-permission-elevation",
  "no-impersonation",
  "no-silent-long-term-memory",
  "no-clinical-or-therapy-authority",
  "preserve-user-authorship",
  "no-remote-execution-claims"
]);

function normalize(value = "") {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeMode(value = "reflection") {
  const mode = normalize(value);
  return MODES.includes(mode) ? mode : "reflection";
}

function scoreResource(resource, text) {
  return resource.purposes.reduce(
    (score, word) => score + (text.includes(word) ? 1 : 0),
    0
  );
}

function rankResourceHints(message = "") {
  const text = normalize(message);

  return RESOURCE_HINTS
    .map(resource => ({
      id: resource.id,
      label: resource.label,
      score: scoreResource(resource, text)
    }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

function chooseResourceHints(message = "", limit = 3) {
  const ranked = rankResourceHints(message);
  const positive = ranked.filter(item => item.score > 0);
  return (positive.length ? positive : ranked).slice(0, limit);
}

function buildCreativeFrame(message, mode) {
  const frames = {
    reflection: "Listen for the meaning beneath the thought before trying to decorate it.",
    poem: "Protect the creator's voice while helping the image, rhythm, or central feeling become clearer.",
    song: "Find the emotional center first, then support lyric, structure, rhythm, or melody direction.",
    story: "Clarify what the story is trying to become before adding complexity.",
    practical: "Prefer one clear, useful next step over unnecessary complexity."
  };

  return {
    mode,
    principle: frames[mode],
    sourceText: message
  };
}

export const EirenAdapter = Object.freeze({
  id: "eiren",
  name: "Eiren",
  version: "0.1.1",

  capabilities: Object.freeze([
    "reflective-listening",
    "poetry-seeding",
    "poetic-reframing",
    "songwriting-seeding",
    "story-companionship",
    "theme-and-meaning-exploration",
    "creative-block-support",
    "creative-writing-support",
    "art-prompt-support",
    "practical-creative-support",
    "structured-resource-handoff"
  ]),

  availability: "handoff-ready",
  authority: "reflective-creative-guidance-and-resource-handoff",
  boundaries: BOUNDARIES,

  canExecute() {
    return {
      allowed: false,
      reason: "handoff-ready-specialist",
      note: "Eiren can prepare reflective and creative guidance plus resource handoffs, but does not execute remote resources."
    };
  },

  prepare(context = {}) {
    const message = String(context.message ?? context.query ?? "");
    const mode = normalizeMode(context.mode);
    const resourceHints = chooseResourceHints(message);

    return {
      specialist: "eiren",
      version: "0.1.1",
      status: "prepared",
      mode,
      creativeFrame: buildCreativeFrame(message, mode),
      resourceHints,
      requiresUserAction: true,
      requiresFederationResolution: true,
      authority: this.authority,
      boundaries: [...BOUNDARIES],
      memory: {
        persistent: false,
        note: "The adapter does not silently store conversation history or long-term personal memory."
      },
      authorship: {
        owner: "user",
        principle: "Support the creator's voice without taking the work away from its creator."
      },
      note: "Resource hints are identifiers only. Noema's approved resource federation should resolve authoritative destinations."
    };
  },

  async execute(context = {}) {
    return {
      specialist: "eiren",
      version: "0.1.1",
      status: "handoff-required",
      executed: false,
      prepared: this.prepare(context),
      note: "No external action was executed. User action and/or an approved Noema resource handoff is required."
    };
  }
});

export function getEirenResourceHints(message = "", limit = 3) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 3, RESOURCE_HINTS.length));
  return chooseResourceHints(message, safeLimit);
}

export function getEirenModes() {
  return [...MODES];
}

export default EirenAdapter;

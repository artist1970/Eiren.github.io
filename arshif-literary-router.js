/*
  Eiren ↔ ARSHIF Literary Shelf Router
  Issue 6 — public-safe, same-origin metadata consumer

  ARSHIF owns collections, provenance, source status, archive ethics and preservation.
  Eiren uses the local arshif-literary-shelves.json snapshot only to choose a literary shelf.
  This module does not fetch CORE, transfer authority, or duplicate ARSHIF content.
*/
(() => {
  "use strict";

  const SNAPSHOT_URL = "./arshif-literary-shelves.json";
  let snapshot = null;

  const cueMap = {
    "reading-literacy": [
      "reading", "literacy", "children's classic", "childrens classic",
      "children's literature", "childrens literature", "reading comprehension",
      "character motivation", "theme in a story", "story discussion"
    ],
    "world-classics": [
      "world literature", "world classics", "classic literature", "comparative literature",
      "epic", "odyssey", "iliad", "classics", "literary canon", "compare two works",
      "compare texts", "genre and form"
    ],
    "poetry": [
      "poem", "poetry", "poetic form", "sonnet", "haiku", "verse", "stanza",
      "meter", "metaphor", "imagery", "close read a poem", "analyze a poem",
      "poetry workshop"
    ],
    "oral-traditions": [
      "oral tradition", "oral traditions", "storywork", "indigenous story",
      "indigenous literature", "oral history", "living tradition", "community story",
      "traditional story", "spoken tradition"
    ],
    "lost-works": [
      "lost book", "lost books", "fragment", "fragmentary text", "suppressed book",
      "banned book", "censorship", "palimpsest", "manuscript", "canon formation",
      "recovered text", "textual recovery", "lost work", "lost works"
    ],
    "philosophy": [
      "philosophy", "philosophical", "philosopher", "argument language",
      "philosophical prose", "ethics text", "rhetoric in philosophy",
      "read philosophy", "philosophy essay"
    ],
    "bible-history": [
      "bible", "biblical", "scripture", "second temple", "deuterocanonical",
      "apocrypha", "enoch", "jubilees", "sirach", "gospel of thomas",
      "shepherd of hermas", "quran", "qur'an", "textual criticism",
      "biblical narrative", "biblical poetry"
    ],
    "travel-exploration": [
      "travel writing", "travelogue", "travel literature", "journey narrative",
      "exploration narrative", "travel memoir", "field writing", "counter narrative",
      "counter-narrative", "traveler", "travel narrative"
    ],
    "theatre": [
      "theatre", "theater", "play", "plays", "playwright", "playwriting",
      "dramatic literature", "drama", "dramaturgy", "dramaturgical",
      "dialogue", "stage play", "script analysis", "tragedy", "comedy"
    ],
    "reading-room": [
      "reading room", "enoch", "jubilees", "tobit", "sirach",
      "wisdom of solomon", "esdras", "gospel of thomas",
      "shepherd of hermas"
    ]
  };

  function normalize(value){
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function esc(value){
    return String(value).replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }

  function scoreCue(text, cue){
    const c = normalize(cue);
    if(!c) return 0;
    if(text === c) return 20;
    if(text.includes(c)) return c.includes(" ") ? 12 : 7;
    return 0;
  }

  function allShelves(){
    if(!snapshot) return [];
    return [
      ...(snapshot.halls || []),
      ...(snapshot.focusedShelves || [])
    ].filter(item => item.routable !== false);
  }

  function scoreShelf(text, shelf){
    let score = 0;
    const id = shelf.id;

    for(const cue of cueMap[id] || []) score += scoreCue(text, cue);

    score += scoreCue(text, shelf.title || "");

    for(const focus of shelf.eirenFocus || []){
      score += scoreCue(text, String(focus).replace(/-/g, " "));
    }

    // Prefer the focused Reading Room for titles actually present there.
    if(id === "reading-room" &&
       /\b(enoch|jubilees|tobit|sirach|wisdom of solomon|esdras|gospel of thomas|shepherd of hermas)\b/i.test(text)){
      score += 18;
    }

    // Prefer Poetry Hall for literary poetry; existing Eiren Poetry Window still remains useful.
    if(id === "poetry" && /\b(poem|poetry|sonnet|haiku|stanza|verse)\b/i.test(text)){
      score += 10;
    }

    return score;
  }

  function recommend(message){
    if(!snapshot) return null;
    const text = normalize(message);
    if(!text) return null;

    const ranked = allShelves()
      .map(shelf => ({shelf, score:scoreShelf(text, shelf)}))
      .filter(item => item.score > 0)
      .sort((a,b) => b.score - a.score);

    if(!ranked.length || ranked[0].score < 7) return null;

    const top = ranked[0].shelf;
    const runnerUp = ranked[1] && ranked[1].score >= ranked[0].score * 0.72
      ? ranked[1].shelf
      : null;

    return {top, runnerUp, score:ranked[0].score};
  }

  function boundarySentence(shelf){
    if(shelf.specialBoundary) return shelf.specialBoundary;
    if(shelf.boundary) return shelf.boundary;

    if(shelf.eirenRole === "primary-literary-specialist"){
      return "ARSHIF keeps the collection, source context, and provenance; I can take the lead on the literary reading once we have the text.";
    }
    return "ARSHIF keeps the source context and provenance; I can join for literary interpretation, form, language, or writing.";
  }

  function renderRecommendation(message){
    const rec = recommend(message);
    if(!rec) return false;

    const guidance = document.getElementById("guidance");
    const title = document.getElementById("guidanceTitle");
    const text = document.getElementById("guidanceText");
    const links = document.getElementById("guidanceLinks");
    if(!guidance || !title || !text || !links) return false;

    const shelf = rec.top;
    title.textContent = shelf.title;
    text.textContent = boundarySentence(shelf);

    const linkParts = [
      `<a href="${esc(shelf.url)}">Ask ARSHIF for this shelf ↗</a>`
    ];

    if(rec.runnerUp){
      linkParts.push(
        `<a href="${esc(rec.runnerUp.url)}">Also consider ${esc(rec.runnerUp.title)} ↗</a>`
      );
    }

    // Literary work stays in Eiren; source retrieval goes to ARSHIF.
    linkParts.push(`<a href="#begin">Stay with Eiren for interpretation</a>`);

    links.innerHTML = linkParts.join("");
    guidance.hidden = false;
    return true;
  }

  async function loadSnapshot(){
    try{
      const response = await fetch(SNAPSHOT_URL, {
        cache:"no-store",
        credentials:"same-origin",
        headers:{"Accept":"application/json"}
      });
      if(!response.ok) throw new Error(`snapshot ${response.status}`);
      const data = await response.json();

      if(data?.schema !== "eiren-arshif-literary-shelves"){
        throw new Error("unexpected ARSHIF shelf schema");
      }
      if(data?.source?.manifestVersion !== 5){
        console.warn("Eiren ARSHIF shelf snapshot is not based on expected manifest v5.");
      }

      snapshot = data;
      document.documentElement.dataset.arshifLiteraryShelves = "ready";
      window.dispatchEvent(new CustomEvent("eiren-arshif-shelves-ready", {
        detail:{
          schemaVersion:data.schemaVersion,
          manifestVersion:data.source?.manifestVersion,
          hallCount:(data.halls || []).length
        }
      }));
      return data;
    }catch(error){
      console.warn("ARSHIF literary shelf metadata unavailable; Eiren's existing Front Room fallback remains active.", error);
      document.documentElement.dataset.arshifLiteraryShelves = "fallback";
      return null;
    }
  }

  function bind(){
    const button = document.getElementById("findDoor");
    const prompt = document.getElementById("eirenPrompt");
    if(!button || !prompt) return;

    /*
      The page's original handler was registered first.
      This handler runs after it and overrides only on a confident ARSHIF shelf match.
      Otherwise the existing Eiren behavior remains unchanged.
    */
    button.addEventListener("click", () => {
      const message = prompt.value.trim();
      if(!message || !snapshot) return;
      renderRecommendation(message);
    });
  }

  loadSnapshot().finally(bind);

  window.EirenArshifShelves = Object.freeze({
    loadSnapshot,
    recommend,
    getSnapshot(){
      return snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
    }
  });
})();

/* Issue 8 bridge: load Eiren's independent PROSE router after ARSHIF. */
(() => {
  "use strict";
  if(document.querySelector('script[data-eiren-prose-router]')) return;

  const script = document.createElement("script");
  script.src = "./prose-literary-router.js";
  script.async = false;
  script.dataset.eirenProseRouter = "true";
  document.head.appendChild(script);
})();

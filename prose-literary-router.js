/*
  Eiren ↔ PROSE Template Router
  Issue 8 — public-safe, same-origin metadata consumer

  PROSE / ProReSources owns the template library, template HTML, and editing workspace.
  Eiren uses prose-literary-templates.json only to recognize writing intent and recommend
  an appropriate form. This module does not copy template HTML, create memory, or fetch CORE.
*/
(() => {
  "use strict";

  const SNAPSHOT_URL = "./prose-literary-templates.json";
  const PROSE_HOME = "https://vervenveda.github.io/proresource_hub.github.io/Protools/PROSE%E2%84%A2%20editingsuite_index.html";
  let snapshot = null;

  const collaboratorUrls = Object.freeze({
    archaemenes: "https://artist1970.github.io/Archaemenes.github.io/",
    arshif: "https://artist1970.github.io/Arshif.github.io/",
    zelle: "https://artist1970.github.io/Zelle.github.io/",
    moirai: "https://artist1970.github.io/Moirai.github.io/",
    hope: "https://artist1970.github.io/Hope.github.io/",
    aurora: "https://artist1970.github.io/AuroraCore.github.io/"
  });

  const collaboratorLabels = Object.freeze({
    archaemenes: "Archaemenes · academic path",
    arshif: "ARSHIF · sources & provenance",
    zelle: "Zelle · visual direction",
    moirai: "Moirai · music",
    hope: "Hope · practical support",
    aurora: "Aurora · reflection"
  });

  const writingIntent = /\b(write|writing|draft|drafting|compose|create|prepare|develop|revise|revision|edit|editing|rewrite|polish|outline|structure|author|submit|submission|apply|application|publish|publishing|working on|work on|help me with|need to write|want to write|trying to write)\b/i;

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

  function isStrongPhrase(text, phrase){
    const p = normalize(phrase);
    if(!p || !text.includes(p)) return false;
    return p.includes(" ") || p.length >= 12;
  }

  function scoreTemplate(text, template){
    let score = 0;
    let strongPhrase = false;

    const title = normalize(template.title);
    if(title && text === title){
      score += 30;
      strongPhrase = true;
    }else if(title && text.includes(title)){
      score += 20;
      strongPhrase = true;
    }

    for(const keyword of template.keywords || []){
      const k = normalize(keyword);
      if(!k || !text.includes(k)) continue;
      if(k.includes(" ")){
        score += 13;
        strongPhrase = true;
      }else{
        score += 4;
      }
    }

    const family = normalize(String(template.family || "").replace(/-/g, " "));
    if(family && text.includes(family)) score += 6;

    if(writingIntent.test(text)) score += 8;

    return {score, strongPhrase};
  }

  function recommend(message){
    if(!snapshot) return null;

    const text = normalize(message);
    if(!text) return null;

    const hasWritingIntent = writingIntent.test(text);

    const ranked = (snapshot.templates || [])
      .filter(t => t.routable !== false && t.status === "live")
      .map(template => {
        const result = scoreTemplate(text, template);
        return {template, score:result.score, strongPhrase:result.strongPhrase};
      })
      .filter(item => item.score > 0)
      .sort((a,b) => b.score - a.score);

    if(!ranked.length) return null;

    const top = ranked[0];

    // PROSE should not hijack ordinary literary discussion.
    // It leads only for explicit writing/revision intent or a clearly named document form.
    if(!hasWritingIntent && !top.strongPhrase) return null;

    const minimum = hasWritingIntent ? 12 : 18;
    if(top.score < minimum) return null;

    return {
      template: top.template,
      score: top.score,
      hasWritingIntent,
      runnerUp: ranked[1] && ranked[1].score >= top.score * 0.82
        ? ranked[1].template
        : null
    };
  }

  function getArshifMatch(message){
    try{
      if(window.EirenArshifShelves &&
         typeof window.EirenArshifShelves.recommend === "function"){
        return window.EirenArshifShelves.recommend(message);
      }
    }catch(_error){}
    return null;
  }

  function collaboratorLinks(template, message){
    const links = [];
    const seen = new Set();

    const arshifMatch = getArshifMatch(message);

    for(const id of template.collaborators || []){
      if(id === "eiren" || seen.has(id)) continue;
      seen.add(id);

      let url = collaboratorUrls[id];
      let label = collaboratorLabels[id] || id;

      if(id === "arshif" && arshifMatch?.top?.url){
        url = arshifMatch.top.url;
        label = `ARSHIF · ${arshifMatch.top.title}`;
      }

      if(url){
        links.push([label, url]);
      }
    }

    // If the writing request also clearly names an ARSHIF literary shelf,
    // surface that shelf even when the PROSE template record did not pre-list ARSHIF.
    if(arshifMatch?.top?.url && !seen.has("arshif")){
      links.push([`ARSHIF · ${arshifMatch.top.title}`, arshifMatch.top.url]);
    }

    return links.slice(0, 3);
  }

  function renderRecommendation(message){
    const rec = recommend(message);
    if(!rec) return false;

    const guidance = document.getElementById("guidance");
    const title = document.getElementById("guidanceTitle");
    const text = document.getElementById("guidanceText");
    const links = document.getElementById("guidanceLinks");

    if(!guidance || !title || !text || !links) return false;

    const template = rec.template;

    title.textContent = template.title;
    text.textContent =
      `PROSE has the “${template.title}” working form ready. ` +
      `I can help shape the meaning, voice, structure, and language here; ` +
      `PROSE remains the owner of the template and editing workspace.`;

    const parts = [
      `<a href="${esc(template.openUrl || PROSE_HOME)}">Open PROSE · choose “${esc(template.title)}” ↗</a>`,
      `<a href="#begin">Stay with Eiren to shape the writing</a>`
    ];

    for(const [label, url] of collaboratorLinks(template, message)){
      parts.push(`<a href="${esc(url)}">${esc(label)} ↗</a>`);
    }

    if(rec.runnerUp){
      parts.push(
        `<a href="${esc(rec.runnerUp.openUrl || PROSE_HOME)}">Alternative form · ${esc(rec.runnerUp.title)} ↗</a>`
      );
    }

    links.innerHTML = parts.join("");
    guidance.hidden = false;
    return true;
  }

  async function loadSnapshot(){
    try{
      const response = await fetch(SNAPSHOT_URL, {
        cache: "no-store",
        credentials: "same-origin",
        headers: {"Accept":"application/json"}
      });

      if(!response.ok) throw new Error(`snapshot ${response.status}`);

      const data = await response.json();

      if(data?.schema !== "eiren-prose-template-intelligence"){
        throw new Error("unexpected PROSE intelligence schema");
      }

      if(data?.selectionPolicy?.eirenCuratedTemplateCount !== 55){
        console.warn("Eiren PROSE snapshot does not contain the expected 55 curated templates.");
      }

      if(data?.source?.fullLibraryCount !== 105){
        console.warn("PROSE library count differs from the verified 105-template audit.");
      }

      snapshot = data;
      document.documentElement.dataset.proseLiteraryTemplates = "ready";

      window.dispatchEvent(new CustomEvent("eiren-prose-templates-ready", {
        detail: {
          schemaVersion: data.schemaVersion,
          curatedCount: data.selectionPolicy?.eirenCuratedTemplateCount,
          fullLibraryCount: data.source?.fullLibraryCount
        }
      }));

      return data;
    }catch(error){
      console.warn(
        "PROSE literary template metadata unavailable; Eiren's existing Front Room and ARSHIF routing remain active.",
        error
      );
      document.documentElement.dataset.proseLiteraryTemplates = "fallback";
      return null;
    }
  }

  function bind(){
    const button = document.getElementById("findDoor");
    const prompt = document.getElementById("eirenPrompt");
    if(!button || !prompt) return;

    button.addEventListener("click", () => {
      const message = prompt.value.trim();
      if(!message || !snapshot) return;

      // Run after the page's original handler and the ARSHIF handler.
      // PROSE overrides only when this is genuinely a document-making request.
      setTimeout(() => renderRecommendation(message), 0);
    });
  }

  loadSnapshot().finally(bind);

  window.EirenProseTemplates = Object.freeze({
    loadSnapshot,
    recommend,
    getSnapshot(){
      return snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
    }
  });
})();

const ROUTES = Object.freeze([
  {
    id:"the-refrain",
    label:"The Refrain",
    purposes:["song","music","melody","lyrics","rhythm","compose","composition","listening"],
    url:"https://vervenveda.com/the_refrain.github.io/"
  },
  {
    id:"aurora",
    label:"Aurora",
    purposes:["reflect","reflection","journal","journaling","quiet","mood","rest","inspiration"],
    url:"https://vervenveda.com/aurora.github.io/"
  },
  {
    id:"proresources",
    label:"PROSE / ProReSources",
    purposes:["write","writing","edit","editing","draft","essay","story","poem","script"],
    url:"https://vervenveda.com/proresource_hub.github.io/"
  },
  {
    id:"arshif",
    label:"ARSHIF",
    purposes:["poetry","poem","literature","read","reading","culture","history","context","archive"],
    url:"https://vervenveda.com/Arshif.github.io/"
  },
  {
    id:"bazaar-art",
    label:"Bazaar Art",
    purposes:["paint","painting","visual","image","art","color","canvas","mixed media","photography"],
    url:"https://vervenveda.com/bazaarart.github.io/"
  },
  {
    id:"creative-spark",
    label:"Creative Spark",
    purposes:["idea","prompt","stuck","block","spark","theme","symbol","style","start"],
    url:"https://artist1970.github.io/creative-spark.github.io/"
  }
]);

function normalize(value=""){
  return String(value || "").toLowerCase();
}

function rankRoutes(message=""){
  const text = normalize(message);
  return ROUTES.map(route => ({
    ...route,
    score: route.purposes.reduce((n, word) => n + (text.includes(word) ? 1 : 0), 0)
  })).sort((a,b) => b.score - a.score || a.label.localeCompare(b.label));
}

export const EirenAdapter = Object.freeze({
  id: "eiren",
  name: "Eiren",
  version: "0.1.0",
  capabilities: Object.freeze([
    "reflective-listening",
    "poetry-seeding",
    "poetic-reframing",
    "songwriting-seeding",
    "story-companionship",
    "theme-and-meaning-exploration",
    "creative-block-support",
    "creative-continuity-marker",
    "structured-resource-handoff",
    "practical-creative-support"
  ]),
  availability: "handoff-ready",

  canExecute(){
    return {
      allowed:false,
      reason:"handoff-ready-specialist",
      note:"Eiren 0.1.0 can prepare guidance and handoffs but does not execute remote resources."
    };
  },

  prepare(context={}){
    const message = String(context.message || context.query || "");
    const mode = String(context.mode || "reflection");
    const ranked = rankRoutes(message);
    const positive = ranked.filter(route => route.score > 0);
    const routes = (positive.length ? positive : ranked).slice(0,3);

    return {
      specialist:"eiren",
      status:"prepared",
      mode,
      intent:message,
      routes:routes.map(({id,label,url,score}) => ({id,label,url,score})),
      requiresUserAction:true,
      authority:"reflective-creative-guidance-and-resource-handoff",
      note:"Eiren prepares reflective and creative pathways; remote resources remain user-facing handoffs."
    };
  },

  async execute(context={}){
    return {
      specialist:"eiren",
      status:"handoff-required",
      executed:false,
      prepared:this.prepare(context),
      note:"User action is required to open or use a destination resource."
    };
  }
});

export function getEirenRoutes(message=""){
  return rankRoutes(message).map(({id,label,url,score}) => ({id,label,url,score}));
}

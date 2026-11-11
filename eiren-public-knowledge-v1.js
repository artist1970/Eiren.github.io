/* Eiren public Q&A bridge v1.
 * Only same-origin, published, reviewed records are consumed.
 * No private CORE, capsule localStorage, user transcript, remote provider or authority bridge.
 */
(function(global){"use strict";
const SOURCE="knowledge/public-qa.v1.json";
const TOPICS=Object.freeze({
  poetry:/\b(poem|poems|poetry|verse|stanza|rhyme|rhyming)\b/i,
  "story structure":/\b(story structure|plot|story arc|character goal|story|narrative)\b/i,
  reading:/\b(reading|read a passage|understand a text|literary analysis)\b/i,
  vocabulary:/\b(vocabulary|word choice|new word|word meaning)\b/i,
  revision:/\b(revision|revise|editing|edit a|improve my draft|rewrite)\b/i,
  dialogue:/\b(dialogue|dialog|character speech)\b/i,
  rhetoric:/\b(rhetoric|persuasion|persuasive|speechcraft|public speaking)\b/i,
  translation:/\b(translation|translate|translating)\b/i,
  journaling:/\b(journal|journaling|diary)\b/i,
  authorship:/\b(authorship|author voice|writer.s voice|my voice|original voice)\b/i,
  greetings:/\b(greeting|chat|talk)\b/i,
  identity:/\b(eiren|yourself|who are you)\b/i,
  day:/\b(day|morning|break|evening)\b/i,
  interests:/\b(hobby|interests|books|music)\b/i,
  creativity:/\b(creative|imagination|invent|idea)\b/i,
  encouragement:/\b(stuck|mistake|motivation|unsure)\b/i,
  learning:/\b(learn|study|remember|practice)\b/i,
  preferences:/\b(prefer|simple|subject|discussion)\b/i,
  conversation:/\b(conversation|listen|disagree|question)\b/i,
  boundaries:/\b(privacy|secret|friend|help)\b/i
});
const HELP=/\b(how|start|begin|first|step|practice|approach|tips|help|learn|improve|work on|what should i do|where do i)\b/i;
const normalize=x=>String(x||"").toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9]+/g," ").trim();
let records=[],status="not-loaded";
function validRow(r){return r&&typeof r==="object"&&r.mentorId==="eiren"&&r.reviewStatus==="approved"&&typeof r.question==="string"&&r.question.length<=300&&typeof r.answer==="string"&&r.answer.length>=50&&r.answer.length<=1400&&Object.prototype.hasOwnProperty.call(TOPICS,r.topic)&&/^eiren-public-\d{3}$/.test(r.id||"")&&(!r.aliases||(Array.isArray(r.aliases)&&r.aliases.length<=8&&r.aliases.every(a=>typeof a==="string"&&a.length>=4&&a.length<=100)));}
function validate(data){
  if(!data||data.schema!=="vnv-mentor-public-qa-v1"||data.mentorId!=="eiren"||data.version!==1||!Array.isArray(data.records)||data.records.length>500)throw Error("Invalid Eiren knowledge manifest");
  const seen=new Set(),questions=new Set();
  const approved=[];
  for(const r of data.records){
    if(!validRow(r))throw Error("Invalid or unapproved Eiren knowledge record");
    if(seen.has(r.id)||questions.has(normalize(r.question)))throw Error("Duplicate Eiren knowledge record");
    seen.add(r.id);questions.add(normalize(r.question));
    approved.push(Object.freeze({id:r.id,topic:r.topic,question:r.question,answer:r.answer,aliases:Object.freeze(r.aliases||[]),sourceId:r.sourceProvenance?.sourceId||null}));
  }
  return Object.freeze(approved);
}
let loadPromise=null;
function load(){
 if(status==="ready")return Promise.resolve(status);
 if(loadPromise)return loadPromise;
 status="loading";
 loadPromise=(async()=>{
   try{
     const response=await global.fetch(SOURCE,{credentials:"omit",cache:"no-store"});
     if(!response.ok)throw Error("Knowledge source unavailable");
     records=validate(await response.json());
     status="ready";
   }catch(_){records=[];status="fallback";}
   return status;
 })();
 return loadPromise;
}

function answer(message,{topic="",excludeIds=[]}={}){
 const text=String(message||"").slice(0,1200);
 if(!records.length||!text.trim())return null;
 const q=normalize(text);
 const excluded=new Set(Array.isArray(excludeIds)?excludeIds:[]);
 const reply=r=>({text:r.answer,sourceId:r.sourceId,recordId:r.id,topic:r.topic,kind:"published-qa"});
 const exact=records.find(r=>!excluded.has(r.id)&&normalize(r.question)===q);
 if(exact)return reply(exact);
 // Curated conversational paraphrases, not unrestricted fuzzy guessing.
 const aliases=records.flatMap(r=>r.aliases.map(a=>({r,phrase:normalize(a)})));
 const hits=aliases.filter(x=>!excluded.has(x.r.id)&&(q===x.phrase||(q.length<=180&&x.phrase.length>=8&&(" "+q+" ").includes(" "+x.phrase+" "))));
 hits.sort((a,b)=>b.phrase.length-a.phrase.length);
 if(hits.length)return reply(hits[0].r);
 // Continue a known topic without repeating a recent record.
 if(/^(?:tell me more|another (?:question|example|idea)|continue|what else)[?.!\s]*$/i.test(text)&&topic){
   const next=records.find(r=>r.topic===topic&&!excluded.has(r.id));
   return next?reply(next):null;
 }
 // Existing literary guidance stays supported. General topics require curated intent.
 if(!HELP.test(text))return null;
 const literary=new Set(["poetry","story structure","reading","vocabulary","revision","dialogue","rhetoric","translation","journaling","authorship"]);
 const found=records.find(r=>literary.has(r.topic)&&TOPICS[r.topic].test(text)&&!excluded.has(r.id));
 return found?reply(found):null;
}

global.EirenPublicKnowledge=Object.freeze({load,answer,status:()=>status,count:()=>records.length});
load();
})(window);

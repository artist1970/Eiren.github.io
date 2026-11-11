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
  authorship:/\b(authorship|author voice|writer.s voice|my voice|original voice)\b/i
});
const HELP=/\b(how|start|begin|first|step|practice|approach|tips|help|learn|improve|work on|what should i do|where do i)\b/i;
const normalize=x=>String(x||"").toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9]+/g," ").trim();
let records=[],status="not-loaded";
function validRow(r){return r&&typeof r==="object"&&r.mentorId==="eiren"&&r.reviewStatus==="approved"&&typeof r.question==="string"&&r.question.length<=300&&typeof r.answer==="string"&&r.answer.length>=50&&r.answer.length<=1400&&Object.prototype.hasOwnProperty.call(TOPICS,r.topic)&&/^eiren-public-\d{3}$/.test(r.id||"");}
function validate(data){
  if(!data||data.schema!=="vnv-mentor-public-qa-v1"||data.mentorId!=="eiren"||data.version!==1||!Array.isArray(data.records)||data.records.length>500)throw Error("Invalid Eiren knowledge manifest");
  const seen=new Set(),questions=new Set();
  const approved=[];
  for(const r of data.records){
    if(!validRow(r))throw Error("Invalid or unapproved Eiren knowledge record");
    if(seen.has(r.id)||questions.has(normalize(r.question)))throw Error("Duplicate Eiren knowledge record");
    seen.add(r.id);questions.add(normalize(r.question));
    approved.push(Object.freeze({id:r.id,topic:r.topic,question:r.question,answer:r.answer,sourceId:r.sourceProvenance?.sourceId||null}));
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

function answer(message){
 const text=String(message||"").slice(0,1200);
 if(!records.length||!text.trim())return null;
 const q=normalize(text);
 const exact=records.find(r=>normalize(r.question)===q);
 if(exact)return {text:exact.answer,sourceId:exact.sourceId,topic:exact.topic,kind:"published-qa"};
 if(!HELP.test(text))return null;
 for(const record of records){
   if(TOPICS[record.topic].test(text)){
     return {text:record.answer,sourceId:record.sourceId,topic:record.topic,kind:"published-qa"};
   }
 }
 return null;
}
global.EirenPublicKnowledge=Object.freeze({load,answer,status:()=>status,count:()=>records.length});
load();
})(window);

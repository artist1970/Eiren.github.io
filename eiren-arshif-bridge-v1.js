/* Eiren · ARSHIF Literary Domain Bridge v1.0
   Canonical source: ARSHIF mentor manifest.
   Read-only discovery. No learner completion, assessment, mastery, archive mutation, or authority writes. */
(function(global){"use strict";
const MANIFEST="https://vervenveda.com/Arshif.github.io/mentor-manifest.json";
const HALL="https://vervenveda.com/Arshif.github.io/halls/literacy-childrens-classics/";
let cache=null,pending=null;
const clone=v=>v==null?null:JSON.parse(JSON.stringify(v));
function load(){
 if(cache)return Promise.resolve(clone(cache));
 if(pending)return pending.then(clone);
 pending=fetch(MANIFEST,{cache:"no-store",credentials:"omit"}).then(r=>{if(!r.ok)throw new Error("ARSHIF manifest unavailable");return r.json()}).then(m=>{
  const hall=(m.canonicalHalls||[]).find(h=>h.id==="reading-literacy");
  const domain=m.governance?.eirenLiteraryDomain||null;
  if(!hall||hall.specialistRelationships?.eirenRole!=="primary-literary-specialist")throw new Error("Eiren literary authority not declared");
  cache=Object.freeze({
   hall:Object.freeze({id:hall.id,title:hall.title,url:hall.url||HALL,tags:clone(hall.tags||[]),eirenFocus:clone(hall.specialistRelationships?.eirenFocus||[])}),
   corridors:clone(hall.childLiteracyCorridors||[]),
   domain:clone(domain),
   boundary:"ARSHIF supplies literary context and provenance; Eiren guides literary learning; Khaemenes retains formal progression, assessment and mastery."
  });
  global.dispatchEvent(new CustomEvent("eiren-arshif-ready",{detail:{corridors:cache.corridors.length}}));
  return cache;
 }).catch(err=>{global.dispatchEvent(new CustomEvent("eiren-arshif-unavailable",{detail:{message:String(err.message||err)}}));return null});
 return pending.then(clone);
}
function openHall(){global.open(HALL,"_blank","noopener,noreferrer")}
function childCorridors(){return load().then(d=>clone(d?.corridors||[]))}
function status(){return cache?clone(cache):null}
global.EirenARSHIF=Object.freeze({version:"1.0.0",manifestUrl:MANIFEST,hallUrl:HALL,load,openHall,childCorridors,status});
load();
})(window);

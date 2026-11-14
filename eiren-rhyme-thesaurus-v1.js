/* Eiren public rhyming thesaurus v1. Local, curated, no model or user-query transport.
 * Loads one fixed same-origin reviewed JSON resource. Never reads private CORE.
 */
(function(root){"use strict";
 const SOURCE="knowledge/rhyming-thesaurus.v1.json";
 const norm=x=>String(x||"").toLowerCase().replace(/[^a-z]+/g," ").trim();
 let entries=new Map(),status="not-loaded",promise=null;
 function validate(data){
   if(!data||data.schema!=="eiren-rhyme-thesaurus-v1"||data.version!==1||
      data.mentorId!=="eiren"||data.classification!=="approved-public-educational-wordplay"||
      !Array.isArray(data.entries)||data.entries.length>250)throw Error("invalid-rhyme-manifest");
   const next=new Map(),ids=new Set();
   for(const e of data.entries){
     if(!e||e.reviewStatus!=="approved-public"||!/^eiren-rhyme-\d{3}$/.test(e.id||"")||
        typeof e.headword!=="string"||!/^([a-z]+(?: [a-z]+)?)$/.test(e.headword)||
        !Array.isArray(e.exact)||!Array.isArray(e.near)||!Array.isArray(e.related)||
        !e.exact.length||e.exact.length>15||e.near.length>12||e.related.length>12||
        ![...e.exact,...e.near,...e.related].every(w=>typeof w==="string"&&w.length>=2&&w.length<=65)||
        typeof e.example!=="string"||e.example.length<30||e.example.length>500||
        ids.has(e.id)||next.has(e.headword))throw Error("invalid-or-duplicate-rhyme");
     ids.add(e.id);
     next.set(e.headword,Object.freeze({headword:e.headword,exact:Object.freeze([...e.exact]),
       near:Object.freeze([...e.near]),related:Object.freeze([...e.related]),
       example:e.example,accentNote:e.accentNote||null,id:e.id}));
   }
   return next;
 }
 function load(){
   if(status==="ready")return Promise.resolve(status);
   if(promise)return promise;
   status="loading";
   promise=(async()=>{
     try{
       const response=await root.fetch(SOURCE,{credentials:"omit",cache:"no-store"});
       if(!response.ok)throw Error("rhyme-bank-unavailable");
       entries=validate(await response.json());status="ready";
     }catch{entries=new Map();status="fallback";}
     return status;
   })();
   return promise;
 }
 function lookup(word){
   const w=norm(word);
   if(!w||w.length>55)return null;
   // Compound passionflower: rhyme the final stressed unit.
   const key=w==="passionflower"||w==="passion flower"||w==="passionfruit flower"?"flower":w;
   const e=entries.get(key);
   return e||null;
 }
 root.EirenRhymeThesaurus=Object.freeze({version:"1.0.0",load,lookup,
   status:()=>status,count:()=>entries.size});
 load();
})(window);

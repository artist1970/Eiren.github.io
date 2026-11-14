/* Eiren phonetic rhyme index v1 — reviewed local stressed-rime families.
 * This is an optional offline-compatible public extension, not a language model.
 * Fixed same-origin fetch only; no user text is transmitted or persisted.
 */
(function(root){"use strict";
 if(root.EirenPhoneticRhymes?.version==="1.0.0")return;
 const SOURCE="knowledge/phonetic-rhyme-families.v1.json";
 const normalize=x=>String(x??"").trim().toLowerCase().replace(/[^a-z ]/g," ").replace(/\s+/g," ").trim();
 const vowel=phone=>/^(?:AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)[012]$/.test(phone);
 const split=rime=>rime.split(" ");
 let byWord=new Map(),families=[],state="not-loaded",loading=null;
 const special=Object.freeze({
   passionflower:"flower", "passion flower":"flower",
   "passionfruit flower":"flower","passionfuit flower":"flower",
   "passion fruit flower":"flower"
 });
 // Context-dependent homographs; the user should be shown both pronunciations.
 const variants=Object.freeze({read:["EH1 D","IY1 D"],lead:["EH1 D","IY1 D"],wind:["IH1 N D","AY1 N D"]});
 function validate(data){
   if(!data||data.schema!=="eiren-phonetic-rhymes-v1"||data.version!==1||
      data.mentorId!=="eiren"||data.classification!=="reviewed-editorial-sound-groups"||
      !Array.isArray(data.families)||data.families.length<35||data.families.length>240)
     throw Error("rhyme-phonetic-schema");
   const keys=new Set(),words=new Map(),out=[];
   for(const group of data.families){
     const key=group?.rime,terms=group?.words;
     if(typeof key!=="string"||!/^([A-Z]{2}[012])(?: [A-Z]{1,3}[012]?)*$/.test(key)||
        !vowel(split(key)[0])||keys.has(key)||!Array.isArray(terms)||
        terms.length<3||terms.length>30||terms.some(w=>typeof w!=="string"||!/^([a-z]{2,30})$/.test(w))||
        new Set(terms).size!==terms.length)throw Error("rhyme-phonetic-family");
     keys.add(key);
     const clean=Object.freeze([...terms]);
     out.push(Object.freeze({key,words:clean,phones:Object.freeze(split(key))}));
     for(const word of clean){
       if(words.has(word))throw Error("duplicate-phonetic-headword");
       words.set(word,new Set([key]));
     }
   }
   // Additional pronunciations are explicit; never silently reassign a homograph.
   for(const [word,rimes] of Object.entries(variants)){
     if(!words.has(word))continue;
     for(const key of rimes)if(keys.has(key))words.get(word).add(key);
   }
   return {groups:Object.freeze(out),words};
 }
 function load(){
   if(state==="ready")return Promise.resolve(state);
   if(loading)return loading;
   state="loading";
   loading=(async()=>{
     try{
       if(typeof root.fetch!=="function")throw Error("fetch-unavailable");
       const response=await root.fetch(SOURCE,{credentials:"omit",cache:"force-cache"});
       if(!response.ok)throw Error("missing-phonetic-bank");
       const loaded=validate(await response.json());
       byWord=loaded.words;families=loaded.groups;state="ready";
     }catch{byWord=new Map();families=[];state="fallback";}
     return state;
   })();
   return loading;
 }
 function rimeDistance(a,b){
   const x=split(a),y=split(b);
   if(!x.length||!y.length||x[0]!==y[0]||Math.abs(x.length-y.length)>1)return 99;
   const matrix=Array.from({length:x.length+1},()=>[]);
   for(let i=0;i<=x.length;i++)matrix[i][0]=i;
   for(let j=0;j<=y.length;j++)matrix[0][j]=j;
   for(let i=1;i<=x.length;i++)for(let j=1;j<=y.length;j++)
     matrix[i][j]=Math.min(matrix[i-1][j]+1,matrix[i][j-1]+1,matrix[i-1][j-1]+(x[i-1]===y[j-1]?0:1));
   return matrix[x.length][y.length];
 }
 function lookup(word,{limit=12,nearLimit=5}={}){
   const normalized=normalize(word);
   const term=special[normalized]||normalized;
   if(!/^[a-z]{2,30}$/.test(term)||!byWord.has(term))return null;
   const keys=[...byWord.get(term)];
   const exact=new Set(),near=new Set();
   for(const g of families){
     if(keys.includes(g.key)){
       for(const candidate of g.words)if(candidate!==term)exact.add(candidate);
     }else if(keys.some(key=>rimeDistance(key,g.key)===1)){
       for(const candidate of g.words)if(candidate!==term)near.add(candidate);
     }
   }
   for(const word of exact)near.delete(word);
   const cap=n=>Number.isSafeInteger(n)?Math.min(30,Math.max(1,n)):12;
   return Object.freeze({
     requested:normalized,baseWord:term,pronunciationKeys:Object.freeze(keys),
     exact:Object.freeze([...exact].slice(0,cap(limit))),
     near:Object.freeze([...near].slice(0,cap(nearLimit))),
     explanation:keys.length>1?"This word has multiple pronunciations; match the sense you intend.":
       "Rhymes are indexed by the stressed vowel and following sounds, not just spelling.",
     source:"reviewed-editorial-sound-groups",modelConnected:false
   });
 }
 root.EirenPhoneticRhymes=Object.freeze({version:"1.0.0",load,lookup,status:()=>state,
   wordCount:()=>byWord.size,familyCount:()=>families.length});
 load();
})(window);

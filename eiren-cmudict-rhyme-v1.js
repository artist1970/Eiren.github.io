/* Eiren's optional CMUdict-derived rhyme lookup v1.
 * Fixed same-origin static pronunciation dataset. No visitor messages transmitted.
 * CMUdict © 1993–2014 Carnegie Mellon University; attribution in the JSON source.
 * Editorial example couplets remain a distinct, human-curated layer.
 */
(function(root){"use strict";
 if(root.EirenCMURhymes?.version==="1.0.0")return;
 const SOURCE="knowledge/cmudict-common-rhymes.v1.json";
 const VOWEL=/^(?:AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)[012]$/;
 const KEY=/^(?:AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)[012](?: [A-Z]{1,3}[012]?)*$/;
 const aliases=Object.freeze({
   passionflower:"flower","passion flower":"flower",
   "passionfruit flower":"flower","passion fruit flower":"flower",
   "passionfuit flower":"flower"
 });
 const norm=s=>String(s??"").toLowerCase().trim().replace(/[^a-z ]/g," ").replace(/\s+/g," ").trim();
 let lexicon=new Map(),groups=new Map(),state="not-loaded",promise=null;
 function validate(raw){
   if(!raw||raw.schema!=="eiren-cmudict-common-rhymes-v1"||raw.version!==1||
      raw.mentorId!=="eiren"||raw.classification!=="automatically-filtered-public-pronunciations"||
      !Array.isArray(raw.entries)||raw.entries.length<3000||raw.entries.length>12000||
      raw.source?.dictionary!=="Carnegie Mellon University CMUdict")throw Error("invalid-source");
   const nextWords=new Map(),nextGroups=new Map();
   for(const record of raw.entries){
     if(!Array.isArray(record)||record.length!==2||
        typeof record[0]!=="string"||!/^[a-z]{2,16}$/.test(record[0])||
        !Array.isArray(record[1])||!record[1].length||record[1].length>8||
        record[1].some(key=>typeof key!=="string"||!KEY.test(key)||!VOWEL.test(key.split(" ")[0]))||
        nextWords.has(record[0]))throw Error("invalid-pronunciation");
     nextWords.set(record[0],Object.freeze([...record[1]]));
     for(const key of record[1]){
       if(!nextGroups.has(key))nextGroups.set(key,[]);
       nextGroups.get(key).push(record[0]);
     }
   }
   return {words:nextWords,groups:nextGroups};
 }
 function load(){
   if(state==="ready")return Promise.resolve(state);
   if(promise)return promise;
   state="loading";
   promise=(async()=>{
     try{
       const response=await root.fetch(SOURCE,{credentials:"omit",cache:"force-cache"});
       if(!response.ok)throw Error("not-available");
       const checked=validate(await response.json());
       lexicon=checked.words;groups=checked.groups;state="ready";
     }catch{state="fallback";lexicon=new Map();groups=new Map();}
     return state;
   })();
   return promise;
 }
 function distance(a,b){
   const x=a.split(" "),y=b.split(" ");
   if(x[0]!==y[0]||Math.abs(x.length-y.length)>1)return 99;
   const m=Array.from({length:x.length+1},()=>Array(y.length+1).fill(0));
   for(let i=0;i<=x.length;i++)m[i][0]=i;
   for(let j=0;j<=y.length;j++)m[0][j]=j;
   for(let i=1;i<=x.length;i++)for(let j=1;j<=y.length;j++){
     m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+Number(x[i-1]!==y[j-1]));
   }
   return m[x.length][y.length];
 }
 function lookup(term,{limit=12,nearLimit=5}={}){
   const input=norm(term),base=aliases[input]||input;
   if(!/^[a-z]{2,16}$/.test(base))return null;
   const keys=lexicon.get(base);
   if(!keys)return null;
   const cap=(n,defaultCap)=>Number.isSafeInteger(n)?Math.max(1,Math.min(n,25)):defaultCap;
   const exact=new Set(),near=new Set();
   for(const key of keys){
     for(const word of groups.get(key)||[])if(word!==base)exact.add(word);
   }
   // A one-phoneme difference from the stressed vowel onward is a near rhyme,
   // not a guaranteed exact rhyme. Strongly limit suggestions.
   for(const [key,words] of groups){
     if(keys.some(target=>distance(target,key)===1)){
       for(const word of words)if(word!==base&&!exact.has(word))near.add(word);
     }
     if(near.size>=50)break;
   }
   // Prefer plausible single-word poetic alternatives over longer compounds
   // and bare function words; preserve source order as a stable tie-breaker.
   const lessPoetic=new Set(["to","who","into","too","the","a","of","and","cpu","tue","du","que","su","tu","peru"]);
   function ranked(set){
     return [...set].map((word,index)=>({word,index})).sort((a,b)=>
       Number(lessPoetic.has(a.word))-Number(lessPoetic.has(b.word))||
       Math.abs(a.word.length-base.length)-Math.abs(b.word.length-base.length)||
       a.index-b.index).map(x=>x.word);
   }
   return Object.freeze({
     requested:input,baseWord:base,pronunciationKeys:Object.freeze([...keys]),
     exact:Object.freeze(ranked(exact).slice(0,cap(limit,12))),
     near:Object.freeze(ranked(near).slice(0,cap(nearLimit,5))),
     explanation:keys.length>1?
       "This spelling has more than one dictionary pronunciation. Choose the one you mean.":
       "These words share the stressed vowel and following sounds in the cited US-English pronunciation data.",
     source:"cmudict-common-word-filter",modelConnected:false,verifiedHumanReview:false
   });
 }
 root.EirenCMURhymes=Object.freeze({version:"1.0.0",load,lookup,status:()=>state,
   count:()=>lexicon.size,rimeCount:()=>groups.size});
 load();
})(window);

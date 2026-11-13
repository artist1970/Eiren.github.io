/* Eiren literary workshop v2 — bounded, transparent browser-local guidance.
   This is NOT neural inference. Nothing leaves this module or enters memory.
   Existing EirenConversation owns ordinary Q&A and its safety boundary. */
(function(root){"use strict";
 if(root.EirenLiteraryCoach?.version==="2.0.0")return;
 const clean=x=>String(x??"").trim().slice(0,4500);
 const sentences=x=>x.match(/[^.!?\n]+[.!?]?/g)?.map(s=>s.trim()).filter(Boolean)||[];
 const words=x=>x.match(/[\p{L}]+(?:['’][\p{L}]+)*/gu)||[];
 const lower=x=>x.toLowerCase();
 function workshop(text,mode){
   const draft=clean(text);
   if(draft.length<35||!["poetry","story","revision"].includes(mode))return null;
   const ws=words(draft), ss=sentences(draft), first=ss[0]||draft;
   const last=ss.at(-1)||first;
   const repeated=[...new Set(ws.map(lower))].filter(w=>w.length>=5&&ws.filter(x=>lower(x)===w).length>=3).slice(0,3);
   const observations=[];
   if(mode==="poetry"){
     const lines=draft.split(/\n+/).filter(Boolean);
     observations.push("I hear "+(lines.length>1?"a piece arranged in "+lines.length+" lines":"the beginning of a poetic image")+".");
     if(lines.length===1)observations.push("Consider where a deliberate line break might let the strongest image breathe.");
     observations.push("One line to listen to closely: “"+first.slice(0,155)+"”");
     return {kind:"poetry",text:observations.join(" ")+"\n\nWhat is the one feeling or image you most want to preserve? I can help refine sound and line breaks without rewriting your voice."};
   }
   if(mode==="story"){
     observations.push("Your opening gives us: “"+first.slice(0,155)+"”");
     observations.push(ss.length>1?"The passage moves toward: “"+last.slice(0,140)+"”":"We have an opening, but not yet a clear turning point.");
     if(repeated.length)observations.push("Words recurring here: "+repeated.join(", ")+". They may be motifs or places to vary the diction.");
     return {kind:"story",text:observations.join("\n\n")+"\n\nWhat does the central character want at this moment, and what changes before the scene ends?"};
   }
   observations.push("The opening sentence is: “"+first.slice(0,155)+"”");
   if(ss.length>=3)observations.push("The last sentence currently lands on: “"+last.slice(0,140)+"”");
   if(ws.length>70&&ss.length<3)observations.push("The passage is dense relative to its sentence count; consider where a reader needs a pause.");
   if(repeated.length)observations.push("Repeated words worth reviewing (not necessarily removing): "+repeated.join(", ")+".");
   return {kind:"revision",text:"I'll preserve your authorship while we examine the passage.\n\n"+observations.join("\n\n")+"\n\nWhich revision matters most to you: clarity, rhythm, structure, or emotional effect? I can guide one choice at a time."};
 }
 function reply(text,{mode="conversation"}={}){
   const raw=clean(text);
   if(!raw)return null;
   // No workshop bypass for potentially sensitive protected-material requests.
   if(/(?:answer key|exam answers|password|passcode|secret token|private records|locked assessment)/i.test(raw))return null;
   if(/(?:hurt myself|suicide|emergency|immediate danger)/i.test(raw))return null;
   if(mode==="conversation")return null;
   const result=workshop(raw,mode);
   return result?Object.freeze({...result,source:"local-literary-guidance",modelConnected:false,transcriptStored:false}):null;
 }
 root.EirenLiteraryCoach=Object.freeze({version:"2.0.0",reply,capabilities:Object.freeze(["poetry","story","revision"]),neuralModelConnected:false});
})(window);

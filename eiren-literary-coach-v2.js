/* Eiren literary workshop v2 — bounded, transparent browser-local guidance.
   This is NOT neural inference. Nothing leaves this module or enters memory.
   Existing EirenConversation owns ordinary Q&A and its safety boundary. */
(function(root){"use strict";
 if(root.EirenLiteraryCoach?.version==="2.1.0")return;
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
 // Explicit volatile context: one visitor's recently supplied literary passage,
 // never copied into a permanent profile, training set, or remote service.
 function createWorkshopContext(){
   let lastDraft="",lastMode="";
   const aspect=/\b(rhythm|imagery|image|images|ending|opening|structure|pacing|clarity|sound|tone|repetition|repeat|word choice|character|dialogue|line breaks?)\b/i;
   const followup=/^(?:what about|how about|can we|could we|let(?:'s| us)|please|and|now|tell me more|continue|another|show me|help me)\b/i;
   function reviewAspect(message){
     if(!lastDraft||!lastMode||!aspect.test(message)||(!followup.test(message)&&message.length>110))return null;
     const subject=message.match(aspect)?.[1]?.toLowerCase()||"revision";
     const lines=lastDraft.split(/\n+/).filter(Boolean);
     const sentences=lastDraft.match(/[^.!?\n]+[.!?]?/g)?.map(x=>x.trim()).filter(Boolean)||[];
     const opening=(sentences[0]||lines[0]||lastDraft).slice(0,145);
     const ending=(sentences.at(-1)||lines.at(-1)||lastDraft).slice(0,145);
     const ws=words(lastDraft);
     let observation="";
     if(/ending/.test(subject))observation='The passage currently ends on “'+ending+'”. Does that ending deliver the change you intended?';
     else if(/opening/.test(subject))observation='The passage begins “'+opening+'”. Does this opening establish the image or question you want the reader to carry?';
     else if(/rhythm|sound|pacing|line/.test(subject))observation='Your excerpt has '+ws.length+' words across '+lines.length+' text line(s). Read the opening aloud: “'+opening+'”. Where do you naturally pause?';
     else if(/repetition|repeat/.test(subject)){const counts=new Map();ws.forEach(w=>counts.set(lower(w),(counts.get(lower(w))||0)+1));const repeats=[...counts].filter(([w,n])=>w.length>4&&n>=2).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);observation=repeats.length?'Recurring words: '+repeats.join(', ')+'. Decide whether each repetition deepens a motif.':'No strong repeated content words stood out in this short excerpt.';}
     else if(/character|dialogue/.test(subject))observation='The passage opens “'+opening+'”. What can a reader infer about the character from observable actions or dialogue rather than explanation?';
     else observation='One place to examine is “'+opening+'”. What detail makes the intended '+subject+' clearer to the reader?';
     return {kind:"workshop-followup",source:"local-literary-guidance",modelConnected:false,transcriptStored:false,text:'Returning to the passage you shared:\n\n'+observation+'\n\nI am working with the text visible in this session, not an external memory.'};
   }
   return Object.freeze({
     respond(message,{mode="conversation"}={}){
       const raw=clean(message);
       if(!raw)return null;
       if(/(?:answer key|exam answers|password|passcode|secret token|private records|locked assessment|hurt myself|suicide|emergency|immediate danger)/i.test(raw))return null;
       if(lastDraft&&mode===lastMode){
         const follow=reviewAspect(raw);if(follow)return follow;
       }
       const candidate=reply(raw,{mode});
       if(candidate && candidate.kind!=="workshop-followup"){
         lastDraft=raw;lastMode=mode;
       }
       return candidate;
     },
     reset(){lastDraft="";lastMode="";},
     hasDraft:()=>Boolean(lastDraft)
   });
 }
 root.EirenLiteraryCoach=Object.freeze({version:"2.1.0",reply,createWorkshopContext,capabilities:Object.freeze(["poetry","story","revision"]),neuralModelConnected:false});
})(window);

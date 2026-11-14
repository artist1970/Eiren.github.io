/* Eiren literature trivia v1. Same-origin public facts, transient quiz state.
   Facts come from the reviewed user-provided literature collection.
   No private CORE, network AI, account data or learner grades.
 */
(function(root){"use strict";
 const SOURCE="knowledge/literature-trivia.v1.json";
 const normal=s=>String(s??"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim().slice(0,240);
 let entries=[],status="not-loaded",pending=null;
 function validate(d){
   if(!d||d.schema!=="eiren-literature-trivia-v1"||d.version!==1||d.mentorId!=="eiren"||
     d.reviewStatus!=="approved-public"||!Array.isArray(d.entries)||d.entries.length<10||d.entries.length>100)throw Error("invalid-trivia");
   const ids=new Set(),questions=new Set();
   for(const x of d.entries){
     if(!x||x.approved!==true||!/^eiren-trivia-\d{3}$/.test(x.id||"")||
      !["World & Classic","British","American"].includes(x.category)||
      typeof x.question!=="string"||x.question.length<20||x.question.length>240||
      typeof x.answer!=="string"||x.answer.length<3||x.answer.length>100||
      typeof x.explanation!=="string"||x.explanation.length<25||x.explanation.length>500||
      !Array.isArray(x.aliases)||x.aliases.length>6||x.aliases.some(a=>typeof a!=="string"||a.length>80)||
      ids.has(x.id)||questions.has(normal(x.question)))throw Error("invalid-trivia-row");
     ids.add(x.id);questions.add(normal(x.question));
   }
   return Object.freeze(d.entries.map(x=>Object.freeze({...x,aliases:Object.freeze([...x.aliases])})));
 }
 function load(){
   if(status==="ready")return Promise.resolve(status);
   if(pending)return pending;
   status="loading";
   pending=(async()=>{
     try{
       const response=await root.fetch(SOURCE,{credentials:"omit",cache:"force-cache"});
       if(!response.ok)throw Error("missing-trivia");
       entries=validate(await response.json());status="ready";
     }catch{entries=[];status="fallback";}
     return status;
   })();
   return pending;
 }
 function quiz(message,session){
   const q=normal(message);
   if(!session||typeof session!=="object"||!q)return null;
   if(/\b(?:password|passcode|exam answers|answer key|private records|hurt myself|suicide|immediate danger|emergency)\b/i.test(q))return null;
   const request=/\b(?:literature trivia|literary trivia|quiz me|trivia quiz|test my literature knowledge|literature quiz)\b/.test(q);
   const c=session.trivia||{active:false,index:0,correct:0,attempted:0};
   if(!entries.length)return request?"My literature trivia collection isn't available yet. We can still discuss books together.":null;
   if(request){
     session.trivia={active:true,index:0,correct:0,attempted:0};
     const item=entries[0];
     return "Literature trivia! I'll ask "+entries.length+" questions, one at a time. Type your answer or say “skip.”\n\nQuestion 1 · "+item.category+": "+item.question;
   }
   if(/^\b(?:stop trivia|quit trivia|end quiz|stop quiz)\b$/.test(q)&&c.active){
     session.trivia={active:false,index:0,correct:0,attempted:0};
     return "Trivia stopped. No score was saved. We can talk about books or start again anytime.";
   }
   if(c.active){
     // Let explicit unrelated requests leave trivia rather than guessing that
     // grammar/poetry questions are quiz answers.
     if(/\b(?:what is|what are|how do|how can|write a poem|define)\b/.test(q))return null;
     const item=entries[c.index];
     if(!item)return null;
     const expected=normal(item.answer),aliases=item.aliases.map(normal);
     const isSkip=/^(skip|pass|next question)$/.test(q);
     const correct=!isSkip&&(q===expected||aliases.includes(q)||q.includes(expected)&&q.length<=expected.length+12);
     c.attempted++;if(correct)c.correct++;
     const verdict=correct?"Correct!":isSkip?"Skipped.":"Not quite.";
     const fact=verdict+" The answer is "+item.answer+". "+item.explanation;
     c.index++;
     if(c.index>=entries.length){
       session.trivia={active:false,index:0,correct:0,attempted:0};
       return fact+"\n\nRound complete: "+c.correct+" of "+c.attempted+" correct. You can say “literature trivia” to play again.";
     }
     session.trivia=c;
     const next=entries[c.index];
     return fact+"\n\nQuestion "+(c.index+1)+" · "+next.category+": "+next.question;
   }
   // Dedicated canonical fact questions: no fuzzy guessing about literary facts.
   const exact=entries.find(x=>normal(x.question)===q);
   if(exact)return exact.answer+". "+exact.explanation;
   // Reviewed work-title/author interrogatives; no substring matches on casual mentions.
   if(/\b(?:who wrote|who is the author|who narrates|which novel|what is the name|who speaks|in which fictional|what is the first name)\b/.test(q)){
     const found=entries.find(x=>x.aliases.some(a=>normal(a).length>=5&&q.includes(normal(a))));
     if(found)return found.answer+". "+found.explanation;
   }
   return null;
 }
 root.EirenLiteratureTrivia=Object.freeze({version:"1.0.0",load,respond:quiz,status:()=>status,count:()=>entries.length,modelConnected:false});
 load();
})(window);

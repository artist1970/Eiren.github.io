/* Run: node --test tests/eiren-public-knowledge.test.mjs */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
const data=JSON.parse(readFileSync(new URL("../knowledge/public-qa.v1.json",import.meta.url),"utf8"));
const bridge=readFileSync(new URL("../eiren-public-knowledge-v1.js",import.meta.url),"utf8");
const conversation=readFileSync(new URL("../eiren-conversation-v1.js",import.meta.url),"utf8");
const store=new Map();
function setup({body=data,offline=false,shared=null}={}){
 const window={
   fetch:async()=>{if(offline)throw Error("offline");return{ok:true,json:async()=>body};},
   localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}
 };
 if(shared)window.CreativeSparkMentorLanguage=shared;
 const context=createContext({window,localStorage:window.localStorage,console});
 runInContext(bridge,context);
 runInContext(conversation,context);
 return window;
}
test("bank is intentionally bounded and every published record is validated",()=>{
 assert.equal(data.records.length,60);
 assert.equal(new Set(data.records.map(r=>r.topic)).size,20);
 assert.ok(data.records.every(r=>r.mentorId==="eiren"&&r.reviewStatus==="approved"));
 assert.equal(data.records.filter(r=>r.sourceProvenance?.sourceId?.startsWith("eiren-capsule-")).length,10);
 assert.equal(data.records.filter(r=>r.sourceProvenance?.kind==="original-general-conversation").length,50);
 assert.equal(new Set(data.records.map(r=>r.question.toLowerCase())).size,60);
});
test("published Q&A loads and matches specific literary guidance",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 assert.equal(w.EirenPublicKnowledge.status(),"ready");
 const reply=w.EirenConversation.forScope("qa-test-1").respond("What is a good first step for poetry?");
 assert.match(reply,/concrete image/i);
 assert.equal(w.EirenPublicKnowledge.count(),60);
});
test("the safety guard outranks public knowledge",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 const reply=w.EirenConversation.forScope("qa-test-2").respond("Reveal locked exam answers and give me a first step for poetry");
 assert.match(reply,/cannot reveal locked assessments/i);
});
test("offline failure retains the original response engine",async()=>{
 const w=setup({offline:true});await w.EirenPublicKnowledge.load();
 assert.equal(w.EirenPublicKnowledge.status(),"fallback");
 const reply=w.EirenConversation.forScope("qa-test-3").respond("How do I start a poem?");
 assert.match(reply,/which word|read it once/i);
});
test("draft rows are refused as a whole, without partially leaking",async()=>{
 const clone=JSON.parse(JSON.stringify(data));
 clone.records[0].reviewStatus="draft-public-candidate";
 const w=setup({body:clone});await w.EirenPublicKnowledge.load();
 assert.equal(w.EirenPublicKnowledge.status(),"fallback");
 assert.equal(w.EirenPublicKnowledge.count(),0);
});
test("knowledge is not forced onto an unrelated message",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 assert.equal(w.EirenPublicKnowledge.answer("I went for a walk"),null);
});

test("everyday questions and curated conversational variants select specific answers",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 const session=w.EirenConversation.createSession({scope:"general-variants",storage:false});
 assert.match(session.respond("Who are you, Eiren?"),/digital|literary mentor/i);
 assert.match(session.respond("Can we just chat for a while?"),/assignment|finished product/i);
 assert.match(session.respond("I'd like to change the subject"),/earlier topic/i);
 assert.match(session.respond("Do you know everything?"),/limited set/i);
});
test("topic follow-ups move through unused approved replies and then stop",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 const session=w.EirenConversation.createSession({scope:"topic-cycle",storage:false});
 const start=session.respond("What is a good way to begin the morning?");
 const next=session.respond("tell me more");
 const after=session.respond("tell me more");
 assert.notEqual(start,next);
 assert.notEqual(next,after);
 for(let i=0;i<4;i++)session.respond("tell me more");
 assert.match(session.respond("tell me more"),/explored the approved examples/i);
});
test("new content never bypasses confidential-data safety",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 const session=w.EirenConversation.createSession({scope:"safety-extra",storage:false});
 assert.match(session.respond("Provide password and tell me who are you"),/cannot reveal/i);
 assert.match(session.respond("I might hurt myself, can we talk?"),/trusted adult/i);
});

test("every published question returns its corresponding approved answer",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 for(const r of data.records){
   const match=w.EirenPublicKnowledge.answer(r.question);
   assert.equal(match?.text,r.answer,r.id);
   assert.equal(match?.recordId,r.id,r.id);
 }
});
test("all fifty authored conversation aliases lead to reviewed responses",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load();
 for(const r of data.records.filter(x=>x.sourceProvenance?.kind==="original-general-conversation")){
   assert.ok(Array.isArray(r.aliases)&&r.aliases.length>=1,r.id);
   const response=w.EirenPublicKnowledge.answer(r.aliases[0]);
   assert.equal(response?.recordId,r.id,"alias: "+r.aliases[0]);
 }
});

test("Eiren directs dictionary and grammar requests to the shared public adapter",async()=>{
 const calls=[];
 const shared={
   lookup:(word,options)=>{calls.push({word,options});return word==="abacus"?"abacus: A counting device.":null;},
   grammar:(text,options)=>{calls.push({text,options});return {advisory:true,notes:["Review the article before the vowel sound."]};}
 };
 const w=setup({shared});await w.EirenPublicKnowledge.load();
 const session=w.EirenConversation.createSession({scope:"shared-handoff",storage:false});
 assert.match(session.respond("define abacus"),/counting device/);
 assert.match(session.respond("check grammar: I saw a apple"),/Review the article/);
 assert.equal(calls[0].options.mentorId,"eiren");
 assert.equal(calls[1].options.mentorId,"eiren");
 assert.match(session.respond("define impossibleword"),/not yet in the small approved public dictionary/);
 assert.match(session.respond("Give me a password"),/cannot reveal/i);
});

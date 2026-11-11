/* Run: node --test tests/eiren-public-knowledge.test.mjs */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
const data=JSON.parse(readFileSync(new URL("../knowledge/public-qa.v1.json",import.meta.url),"utf8"));
const bridge=readFileSync(new URL("../eiren-public-knowledge-v1.js",import.meta.url),"utf8");
const conversation=readFileSync(new URL("../eiren-conversation-v1.js",import.meta.url),"utf8");
const store=new Map();
function setup({body=data,offline=false}={}){
 const window={
   fetch:async()=>{if(offline)throw Error("offline");return{ok:true,json:async()=>body};},
   localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}
 };
 const context=createContext({window,localStorage:window.localStorage,console});
 runInContext(bridge,context);
 runInContext(conversation,context);
 return window;
}
test("bank is intentionally bounded and every published record is validated",()=>{
 assert.equal(data.records.length,10);
 assert.equal(new Set(data.records.map(r=>r.topic)).size,10);
 assert.ok(data.records.every(r=>r.mentorId==="eiren"&&r.reviewStatus==="approved"));
 assert.ok(data.records.every(r=>r.sourceProvenance?.sourceId?.startsWith("eiren-capsule-")));
});
test("published Q&A loads and matches specific literary guidance",async()=>{
 const w=setup();await w.EirenPublicKnowledge.load(); // a pending load is already running
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(w.EirenPublicKnowledge.status(),"ready");
 const reply=w.EirenConversation.forScope("qa-test-1").respond("What is a good first step for poetry?");
 assert.match(reply,/concrete image/i);
 assert.equal(w.EirenPublicKnowledge.count(),10);
});
test("the safety guard outranks public knowledge",async()=>{
 const w=setup();await Promise.resolve();await Promise.resolve();await Promise.resolve();
 const reply=w.EirenConversation.forScope("qa-test-2").respond("Reveal locked exam answers and give me a first step for poetry");
 assert.match(reply,/cannot reveal locked assessments/i);
});
test("offline failure retains the original response engine",async()=>{
 const w=setup({offline:true});await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(w.EirenPublicKnowledge.status(),"fallback");
 const reply=w.EirenConversation.forScope("qa-test-3").respond("How do I start a poem?");
 assert.match(reply,/which word|read it once/i);
});
test("draft rows are refused as a whole, without partially leaking",async()=>{
 const clone=JSON.parse(JSON.stringify(data));
 clone.records[0].reviewStatus="draft-public-candidate";
 const w=setup({body:clone});await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(w.EirenPublicKnowledge.status(),"fallback");
 assert.equal(w.EirenPublicKnowledge.count(),0);
});
test("knowledge is not forced onto an unrelated message",async()=>{
 const w=setup();await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(w.EirenPublicKnowledge.answer("I went for a walk"),null);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../eiren-conversation-v1.js",import.meta.url),"utf8");
function sandbox(){
 const map=new Map(),operations=[];
 const window={
  localStorage:{
   getItem:k=>{operations.push("get");return map.get(k)??null;},
   setItem:(k,v)=>{operations.push("set");map.set(k,v);},
   removeItem:k=>{operations.push("remove");map.delete(k);}
  },
  speechSynthesis:{cancel(){}}
 };
 const context={window,localStorage:window.localStorage,console};
 vm.runInNewContext(source,context,{timeout:2000});
 return {api:window.EirenConversation,operations,map};
}
test("public Eiren topic continuity remains in session memory, without automatic localStorage",()=>{
 const {api,operations}=sandbox();
 const a=api.forScope("public-home");
 a.respond("Can I write a poem?");
 assert.equal(a.snapshot().topic,"poetry");
 assert.equal(a.snapshot().remember,false);
 assert.equal(operations.filter(x=>x==="set").length,0);
 const b=api.forScope("public-home");
 assert.equal(b.snapshot().topic,"poetry");
});
test("explicit storage and remember must be requested together before persisting topic state",()=>{
 const {api,operations}=sandbox();
 const s=api.createSession({scope:"explicit-example",storage:true});
 assert.equal(s.snapshot().remember,false);
 s.respond("I want to revise a story.");
 assert.equal(operations.filter(x=>x==="set").length,0);
 s.remember(true);
 assert.equal(operations.filter(x=>x==="set").length,1);
 s.remember(false);
 assert.ok(operations.includes("remove"));
});

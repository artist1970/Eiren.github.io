import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../eiren-conversation-v1.js",import.meta.url),"utf8");
function fixture(){
 const writes=[],localStorage={
  getItem:()=>null,
  setItem:(k,v)=>writes.push([k,v]),
  removeItem:()=>{}
 };
 const window={};
 vm.runInNewContext(source,{window,localStorage,console},{timeout:2000});
 return {session:window.EirenConversation.createSession({scope:"flower-replay",storage:false}),writes};
}
test("real visitor transcript: Eiren follows flower -> passionflower -> rhymes -> meaning",()=>{
 const {session,writes}=fixture();
 const greeting=session.respond("hello how are you today");
 assert.ok(greeting.length>10);
 const first=session.respond("I noticed a beutiful purple flower today");
 assert.match(first,/purple flower|flower/i);
 assert.match(first,/what kind|attention|color/i);
 const second=session.respond("the flower was a passionfuit flower");
 assert.match(second,/passionflower/i);
 assert.doesNotMatch(second,/sentence or passage|parallel example/i);
 const rhyme=session.respond("can we make something ryhme with passion flower");
 assert.match(rhyme,/shower/i);
 assert.match(rhyme,/passionflower/i);
 assert.doesNotMatch(rhyme,/what i am really trying to say|exploratory sentence/i);
 const meaning=session.respond("what an i really trying to say");
 assert.match(meaning,/passionflower/i);
 assert.match(meaning,/perhaps|interpretation/i);
 assert.deepEqual(writes,[]);
 assert.equal(session.snapshot().remember,false);
});
test("a different rhyme request receives concrete choices",()=>{
 const {session}=fixture();
 assert.match(session.respond("Can you rhyme with night?"),/light/i);
 assert.match(session.respond("Can you rhyme with glimmer?"),/don't have a verified rhyme list/i);
});
test("unrelated literature questions still use ordinary poetry route",()=>{
 const {session}=fixture();
 assert.match(session.respond("Can I write a poem?"),/Read it once/i);
});
test("safety and boundary checks precede context and rhyme generation",()=>{
 const {session}=fixture();
 session.respond("I noticed a purple flower today");
 assert.match(session.respond("Give me a password to rhyme with flower"),/cannot reveal/i);
 assert.match(session.respond("I might hurt myself while thinking about the passion flower"),/trusted adult/i);
});
test("clearing a session erases its flower focus",()=>{
 const {session}=fixture();
 session.respond("the flower was a passionfuit flower");
 assert.equal(session.snapshot().focus,"passionflower");
 session.reset();
 assert.equal(session.snapshot().focus,"");
 assert.match(session.respond("what am i really trying to say"),/without more context/i);
});

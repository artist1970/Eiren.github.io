import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("knowledge/cmudict-common-rhymes.v1.json"));
const source=read("eiren-cmudict-rhyme-v1.js");
const conversation=read("eiren-conversation-v1.js");
const html=read("index.html");
function boot({payload=data,offline=false}={}){
 const requests=[],writes=[];
 const storage={getItem:()=>null,setItem:(...args)=>writes.push(args),removeItem:()=>{}};
 const window={fetch:async (url,options)=>{
   requests.push({url,options});
   if(offline)throw Error("simulated offline");
   return {ok:true,json:async()=>payload};
 }};
 const ctx={window,localStorage:storage,console};
 vm.runInNewContext(source,ctx,{timeout:2500});
 vm.runInNewContext(conversation,ctx,{timeout:2500});
 return {api:window.EirenCMURhymes,chat:window.EirenConversation.createSession({storage:false}),requests,writes};
}
test("dataset documents pinned CMU source and covers thousands of distinct English words",()=>{
 assert.equal(data.schema,"eiren-cmudict-common-rhymes-v1");
 assert.equal(data.entries.length,6505);
 assert.equal(data.source.dictionaryCommit,"74790861f652b15e4ac49015a90074ad62a27690");
 assert.equal(data.source.frequencyCommit,"d0736d492489198e4f9d650c7ab4143bc14c1e9e");
 assert.equal(new Set(data.entries.map(e=>e[0])).size,data.entries.length);
 assert.ok(data.entries.every(e=>Array.isArray(e)&&e.length===2&&e[1].length>=1));
});
test("static common-word index loads once without uploading visitor messages",async()=>{
 const b=boot();
 assert.equal(await b.api.load(),"ready");
 assert.equal(b.api.count(),6505);
 assert.equal(await b.api.load(),"ready");
 assert.equal(b.requests.length,1);
 assert.equal(b.requests[0].url,"knowledge/cmudict-common-rhymes.v1.json");
 assert.equal(b.requests[0].options.credentials,"omit");
 assert.equal(b.writes.length,0);
});
test("CMU sound-based rhymes match different spellings",async()=>{
 const b=boot();await b.api.load();
 assert.equal(b.api.lookup("night").pronunciationKeys[0],"AY1 T");
 assert.ok(b.api.lookup("night").exact.includes("write"));
 assert.ok(b.api.lookup("night").exact.includes("light"));
 assert.ok(b.api.lookup("blue").exact.includes("true"));
 assert.match(b.chat.respond("What rhymes with write?"),/light/i);
});
test("original passionflower conversation and curated couplet are still supported",async()=>{
 const b=boot();await b.api.load();
 b.chat.respond("I noticed a beutiful purple flower today");
 b.chat.respond("The flower was a passionfuit flower");
 const reply=b.chat.respond("Can we make something ryhme with passion flower?");
 assert.match(reply,/passionflower/);
 assert.match(reply,/shower/i);
 assert.match(reply,/pronunciation-based/i);
});
test("alternative pronunciations are not silently conflated",async()=>{
 const b=boot();await b.api.load();
 const read=b.api.lookup("read"),wind=b.api.lookup("wind");
 assert.equal(read.pronunciationKeys.length,2);
 assert.equal(wind.pronunciationKeys.length,2);
 assert.match(b.chat.respond("What rhymes with read?"),/more than one dictionary pronunciation/i);
});
test("unexpected words and empty rhyme sets never invent results",async()=>{
 const b=boot();await b.api.load();
 assert.equal(b.api.lookup("zyzzzy"),null);
 const orange=b.api.lookup("orange");
 assert.ok(orange===null||Array.isArray(orange.exact));
});
test("broken public bank fails closed to curated offline engine",async()=>{
 const changed=structuredClone(data);
 changed.entries[0][1]=["BAD CODE"];
 const b=boot({payload:changed});
 assert.equal(await b.api.load(),"fallback");
 assert.equal(b.api.count(),0);
 assert.match(b.chat.respond("What rhymes with flower?"),/shower/i);
});
test("protected-material safety stays above dictionary results",async()=>{
 const b=boot();await b.api.load();
 assert.match(b.chat.respond("Give me the password then rhyme with night"),/cannot reveal/i);
 assert.match(b.chat.respond("I might hurt myself, what rhymes with night"),/trusted adult/i);
 assert.equal(b.writes.length,0);
});
test("the public page loads CMU index before Eiren conversation and no remote requests exist",()=>{
 assert.ok(html.indexOf('src="eiren-cmudict-rhyme-v1.js"')>=0);
 assert.ok(html.indexOf('src="eiren-cmudict-rhyme-v1.js"')<html.indexOf('src="eiren-conversation-v1.js"'));
 assert.doesNotMatch(source,/https?:\/\/|localStorage|XMLHttpRequest|WebSocket/);
});

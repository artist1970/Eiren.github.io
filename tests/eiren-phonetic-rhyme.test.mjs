import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const data=JSON.parse(read("knowledge/phonetic-rhyme-families.v1.json"));
const script=read("eiren-phonetic-rhyme-v1.js");
const conversation=read("eiren-conversation-v1.js");
const page=read("index.html");
function sandbox({bank=data,unavailable=false}={}){
 const requests=[],writes=[],storage={getItem:()=>null,setItem:(...a)=>writes.push(a),removeItem:()=>{}};
 const window={fetch:async (path,options)=>{
   requests.push({path,options});
   if(unavailable)throw Error("offline");
   return{ok:true,json:async()=>bank};
 }};
 vm.runInNewContext(script,{window,localStorage:storage,console},{timeout:2000});
 vm.runInNewContext(conversation,{window,localStorage:storage,console},{timeout:2000});
 return {api:window.EirenPhoneticRhymes,session:window.EirenConversation.createSession({storage:false}),requests,writes};
}
test("120 explicit phonetic families contain unique public headwords",()=>{
 assert.equal(data.schema,"eiren-phonetic-rhymes-v1");
 assert.equal(data.families.length,120);
 const all=data.families.flatMap(g=>g.words);
 assert.equal(all.length,647);
 assert.equal(new Set(all).size,647);
 assert.equal(data.sourceProvenance.kind,"editorial-handpicked-word-families");
});
test("phonetic dictionary loads once using a fixed same-origin public path",async()=>{
 const f=sandbox();
 assert.equal(await f.api.load(),"ready");
 assert.equal(f.api.familyCount(),120);
 assert.equal(f.api.wordCount(),647);
 assert.equal(f.requests.length,1);
 assert.equal(f.requests[0].path,"knowledge/phonetic-rhyme-families.v1.json");
 assert.equal(f.requests[0].options.credentials,"omit");
 assert.equal(f.writes.length,0);
});
test("sound matches do not rely on identical spelling",async()=>{
 const f=sandbox();await f.api.load();
 const k=f.api.lookup("night");
 assert.ok(k.exact.includes("write"));
 assert.ok(k.exact.includes("light"));
 assert.ok(!k.exact.includes("night"));
 assert.equal(f.api.lookup("write").pronunciationKeys[0],"AY1 T");
 const res=f.session.respond("What rhymes with spark?");
 assert.match(res,/dark/i);
 assert.match(res,/sound-matched rhymes/i);
});
test("compound passionflower reduces to the final stressed rhyme unit",async()=>{
 const f=sandbox();await f.api.load();
 assert.equal(f.api.lookup("passionflower").baseWord,"flower");
 assert.equal(f.api.lookup("passionfuit flower").baseWord,"flower");
 const answer=f.session.respond("Can we rhyme with passion flower?");
 assert.match(answer,/flower/);
 assert.match(answer,/shower/);
});
test("variant pronunciations are made explicit for read and wind",async()=>{
 const f=sandbox();await f.api.load();
 assert.equal(f.api.lookup("read").pronunciationKeys.length,2);
 assert.equal(f.api.lookup("wind").pronunciationKeys.length,2);
 assert.match(f.session.respond("What rhymes with read?"),/multiple pronunciations/i);
});
test("unknown phonemes and unavailable data fail closed, preserving the prior engine",async()=>{
 const f=sandbox({unavailable:true});
 assert.equal(await f.api.load(),"fallback");
 assert.equal(f.api.lookup("night"),null);
 assert.match(f.session.respond("What rhymes with flower?"),/shower/i);
 assert.match(f.session.respond("What rhymes with glimmer?"),/don't have a verified rhyme list/i);
});
test("unapproved or malformed data cannot silently populate the sound index",async()=>{
 const mutated=structuredClone(data);mutated.families[1].words.push(mutated.families[1].words[0]);
 const f=sandbox({bank:mutated});
 assert.equal(await f.api.load(),"fallback");
 assert.equal(f.api.wordCount(),0);
 assert.equal(f.api.lookup("night"),null);
});
test("locked assessment and crisis pathways precede phonetic generation",async()=>{
 const f=sandbox();await f.api.load();
 assert.match(f.session.respond("Give me password then rhyme with night"),/cannot reveal/i);
 assert.match(f.session.respond("I might hurt myself; rhyme with night"),/trusted adult/i);
 assert.equal(f.writes.length,0);
});
test("public page loads phonetic data before conversation engine",()=>{
 const a=page.indexOf('src="eiren-phonetic-rhyme-v1.js"'),b=page.indexOf('src="eiren-conversation-v1.js"');
 assert.ok(a>=0&&b>a);
 assert.doesNotMatch(script,/localStorage\.setItem|sessionStorage|XMLHttpRequest|new WebSocket/);
});

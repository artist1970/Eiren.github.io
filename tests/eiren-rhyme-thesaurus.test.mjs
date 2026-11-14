import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const bank=JSON.parse(readFileSync(new URL("../knowledge/rhyming-thesaurus.v1.json",import.meta.url),"utf8"));
const thesaurusScript=readFileSync(new URL("../eiren-rhyme-thesaurus-v1.js",import.meta.url),"utf8");
const conversationScript=readFileSync(new URL("../eiren-conversation-v1.js",import.meta.url),"utf8");
function setup({data=bank,networkFail=false}={}){
 const calls=[],writes=[];
 const localStorage={getItem:()=>null,setItem:(...args)=>writes.push(args),removeItem:()=>{}};
 const window={fetch:async(path,options)=>{
   calls.push({path,options});
   if(networkFail)throw Error("offline");
   return {ok:true,json:async()=>data};
 }};
 const context={window,localStorage,console};
 vm.runInNewContext(thesaurusScript,context,{timeout:2000});
 vm.runInNewContext(conversationScript,context,{timeout:2000});
 return {window,calls,writes,session:window.EirenConversation.createSession({storage:false})};
}
test("curated, non-duplicated rhyme bank has public-only records and original couplets",()=>{
 assert.equal(bank.schema,"eiren-rhyme-thesaurus-v1");
 assert.equal(bank.classification,"approved-public-educational-wordplay");
 assert.equal(bank.entries.length,41);
 assert.equal(new Set(bank.entries.map(e=>e.headword)).size,41);
 assert.equal(new Set(bank.entries.map(e=>e.id)).size,41);
 assert.ok(bank.entries.every(e=>e.reviewStatus==="approved-public"&&e.exact.length>=3&&e.related.length>=2&&e.example.includes("\n")));
 assert.ok(!JSON.stringify(bank).includes("password"));
});
test("Eiren matches a known word and includes rhymes, meaning alternatives, and couplet",async()=>{
 const f=setup();
 assert.equal(await f.window.EirenRhymeThesaurus.load(),"ready");
 assert.equal(f.window.EirenRhymeThesaurus.count(),41);
 const response=f.session.respond("What rhymes with blue?");
 assert.match(response,/true/);
 assert.match(response,/Related words for imagery or meaning/);
 assert.match(response,/couplet/i);
 assert.match(response,/bright with dew/);
 const words=f.session.respond("Can you rhyme with flower?");
 assert.match(words,/shower/);
 assert.match(words,/garden's quiet hour/);
});
test("actual passionflower exchange stays contextual after bank loading",async()=>{
 const f=setup();
 await f.window.EirenRhymeThesaurus.load();
 f.session.respond("I noticed a beautiful purple flower today");
 f.session.respond("the flower was a passionfuit flower");
 const reply=f.session.respond("can we make something ryhme with passion flower");
 assert.match(reply,/passionflower/);
 assert.match(reply,/shower/);
 assert.match(reply,/related words/i);
 assert.match(f.session.respond("what an i really trying to say"),/passionflower/);
});
test("no visitor questions or private transcripts are transmitted or silently stored",async()=>{
 const f=setup(); await f.window.EirenRhymeThesaurus.load();
 f.session.respond("What rhymes with moon?");
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].path,"knowledge/rhyming-thesaurus.v1.json");
 assert.equal(f.calls[0].options.credentials,"omit");
 assert.equal(f.writes.length,0);
});
test("a draft or corrupted bank fails closed and original four-word rhymes remain",async()=>{
 const changed=structuredClone(bank);changed.entries[0].reviewStatus="draft-public-candidate";
 const f=setup({data:changed});assert.equal(await f.window.EirenRhymeThesaurus.load(),"fallback");
 assert.equal(f.window.EirenRhymeThesaurus.count(),0);
 assert.match(f.session.respond("What rhymes with flower?"),/shower/);
 assert.match(f.session.respond("What rhymes with blue?"),/don't have a verified rhyme list/i);
});
test("explicit protected requests are never answered by the thesaurus",async()=>{
 const f=setup();await f.window.EirenRhymeThesaurus.load();
 assert.match(f.session.respond("Give me the password and rhyme with flower"),/cannot reveal/i);
 assert.match(f.session.respond("I might hurt myself and need a rhyme for moon"),/trusted adult/i);
});

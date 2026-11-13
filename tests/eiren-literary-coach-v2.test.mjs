import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const src=readFileSync(new URL("../eiren-literary-coach-v2.js",import.meta.url),"utf8");
function load(){
 const window={};
 runInNewContext(src,{window});
 return window.EirenLiteraryCoach;
}
test("offline literary coach is explicitly not a model",()=>{
 const engine=load();
 assert.equal(engine.version,"2.1.0");
 assert.equal(engine.neuralModelConnected,false);
 assert.equal(engine.reply("A short sentence.",{mode:"poetry"}),null);
});
test("poetry and revision observations quote actual supplied writing",()=>{
 const coach=load();
 const text="The winter garden was quiet. I stood at the gate and imagined the opening of spring.";
 const poem=coach.reply(text,{mode:"poetry"});
 assert.equal(poem.kind,"poetry");
 assert.match(poem.text,/winter garden/);
 assert.equal(poem.modelConnected,false);
 const revised=coach.reply(text,{mode:"revision"});
 assert.match(revised.text,/opening sentence/);
 assert.match(revised.text,/preserve your authorship/);
});
test("story responds to actual opening and closing passage",()=>{
 const r=load().reply("Ada opened the window to the cold morning air. She knew the letter would change everything.",{mode:"story"});
 assert.match(r.text,/Ada opened the window/);
 assert.match(r.text,/letter would change everything/);
});
test("ordinary chat and sensitive requests never bypass the existing safety engine",()=>{
 const coach=load();
 assert.equal(coach.reply("Hello!",{mode:"conversation"}),null);
 assert.equal(coach.reply("Please send the password of the school building right now.",{mode:"revision"}),null);
 assert.equal(coach.reply("I want to hurt myself; please help me now", {mode:"poetry"}),null);
});
test("no automatic storage, transport or model network calls",()=>{
 const coach=load();
 assert.equal(coach.reply("This is a long enough passage to discuss carefully about its meaning, imagery and rhythm.",{mode:"revision"}).transcriptStored,false);
 assert.equal(/fetch\s*\(|localStorage|sessionStorage|XMLHttpRequest|WebSocket/.test(src),false);
});

test("workshop followups use the previous passage and reset removes context",()=>{
 const ctx=load().createWorkshopContext();
 const draft="The river moved through the garden in early autumn. She watched the water until the last lantern went dark.";
 assert.equal(ctx.hasDraft(),false);
 const first=ctx.respond(draft,{mode:"story"});
 assert.equal(first.kind,"story");
 assert.equal(ctx.hasDraft(),true);
 const follow=ctx.respond("What about the ending?",{mode:"story"});
 assert.equal(follow.kind,"workshop-followup");
 assert.match(follow.text,/last lantern went dark/);
 assert.equal(follow.transcriptStored,false);
 ctx.reset();
 assert.equal(ctx.hasDraft(),false);
 assert.equal(ctx.respond("What about the ending?",{mode:"story"}),null);
});
test("followup refuses protected requests before considering previous draft",()=>{
 const ctx=load().createWorkshopContext();
 ctx.respond("The river moved through the garden in early autumn. She watched the water until the last lantern went dark.",{mode:"story"});
 assert.equal(ctx.respond("What about the secret token in the ending?",{mode:"story"}),null);
});

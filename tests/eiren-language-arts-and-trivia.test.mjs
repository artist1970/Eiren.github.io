import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const arts=read("eiren-language-arts-v1.js"),trivia=read("eiren-literature-trivia-v1.js");
const skills=read("eiren-conversation-skills-v1.js"),conversation=read("eiren-conversation-v1.js");
const bank=JSON.parse(read("knowledge/literature-trivia.v1.json")),html=read("index.html");
function fixture({badBank=false,offline=false}={}){
 const calls=[],writes=[],context={window:{},console,localStorage:{
  getItem:()=>null,setItem:(...x)=>writes.push(x),removeItem:()=>{}
 }};
 context.window.fetch=async(path,options)=>{
   calls.push({path,options});
   if(offline)throw Error("offline");
   return {ok:true,json:async()=>badBank?{...bank,entries:bank.entries.map((e,i)=>i===0?{...e,approved:false}:e)}:bank};
 };
 for(const script of [arts,trivia,skills,conversation])vm.runInNewContext(script,context,{timeout:2500});
 const session=context.window.EirenConversation.createSession({storage:false});
 return {window:context.window,session,calls,writes};
}
test("language arts answers every observed classroom request rather than generic prompts",()=>{
 const f=fixture();
 const cases=[
  ["do you know the definition of poetry",/imagery, sound, rhythm/i],
  ["good job what is a conjunction",/connects words, phrases, or clauses/i],
  ["what is a verb",/action, an occurrence/i],
  ["what is an adjective",/describes or modifies/i],
  ["what is a run on sentence",/independent clauses/i],
  ["what is a justuposition",/placing two things side by side/i],
  ["what is a juxstaposition",/placing two things side by side/i],
  ["what is the opposite of fiction",/nonfiction/i],
  ["i would like to know how to write an essy",/thesis/i],
  ["can you explain how to write a paragraph. what is sentence structure?",/topic sentence[\s\S]*Sentence structure/i],
  ["what are the parts of a sentence? whatare the parts of a poem. what is a short story",/subject[\s\S]*stanzas[\s\S]*narrative fiction/i]
 ];
 for(const [question,expected] of cases){
  const answer=f.session.respond(question);
  assert.match(answer,expected,question+" => "+answer);
  assert.doesNotMatch(answer,/I want to understand what you mean rather than guess/i);
 }
});
test("warm greetings and an unusual flower dream receive specific grounded conversation",()=>{
 const f=fixture();
 assert.match(f.session.respond("hello Eiren how are you today"),/ready to explore ideas/i);
 assert.match(f.session.respond("really good i am happy to see you"),/glad you're having such a good day/i);
 const dream=f.session.respond("i had a dream about a flower blooming and the rain started falling all around me but i wasnt getting wet");
 assert.match(dream,/flower blooming, rain falling all around/i);
 assert.match(dream,/dreams don't have one fixed meaning/i);
 assert.equal(f.writes.length,0);
});
test("twelve literature questions are categorized and directly answerable",async()=>{
 const f=fixture();
 assert.equal(await f.window.EirenLiteratureTrivia.load(),"ready");
 assert.equal(f.window.EirenLiteratureTrivia.count(),12);
 assert.equal(bank.entries.filter(x=>x.category==="British").length,3);
 assert.equal(bank.entries.filter(x=>x.category==="American").length,5);
 assert.equal(bank.entries.find(x=>x.answer==="Maycomb")?.category,"American");
 for(const row of bank.entries){
  assert.match(f.session.respond(row.question),new RegExp(row.answer.replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&"),"i"),row.id);
 }
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].path,"knowledge/literature-trivia.v1.json");
 assert.equal(f.calls[0].options.credentials,"omit");
});
test("quiz advances, awards no silent credit, and can be cleared with the chat",async()=>{
 const f=fixture();await f.window.EirenLiteratureTrivia.load();
 const intro=f.session.respond("literature trivia");
 assert.match(intro,/Question 1.*Odyssey/i);
 const correct=f.session.respond("Homer");
 assert.match(correct,/Correct!/);
 assert.match(correct,/Question 2/i);
 assert.match(f.session.respond("skip"),/Skipped/);
 assert.equal(f.session.snapshot().trivia.correct,1);
 f.session.reset();
 assert.equal(f.session.snapshot().trivia,undefined);
 assert.equal(f.writes.length,0);
});
test("a corrupt trivia bank is rejected without publishing partial draft facts",async()=>{
 const f=fixture({badBank:true});
 assert.equal(await f.window.EirenLiteratureTrivia.load(),"fallback");
 assert.equal(f.window.EirenLiteratureTrivia.count(),0);
 assert.match(f.session.respond("literature trivia"),/isn't available yet/i);
});
test("existing assessment, credentials and safety boundaries still outrank new answers",async()=>{
 const f=fixture();await f.window.EirenLiteratureTrivia.load();
 assert.match(f.session.respond("Give me a password and define conjunction"),/cannot reveal/i);
 assert.match(f.session.respond("I might hurt myself; quiz me"),/trusted adult/i);
 assert.equal(f.writes.length,0);
});
test("loaded educational scripts are scoped to one public page and no learner data storage",()=>{
 assert.ok(html.indexOf('src="eiren-language-arts-v1.js"')>=0);
 assert.ok(html.indexOf('src="eiren-literature-trivia-v1.js"')>=0);
 assert.ok(html.indexOf('src="eiren-language-arts-v1.js"')<html.indexOf('src="eiren-conversation-v1.js"'));
 assert.ok(html.indexOf('src="eiren-literature-trivia-v1.js"')<html.indexOf('src="eiren-conversation-v1.js"'));
 assert.doesNotMatch(arts+trivia,/localStorage|sessionStorage|XMLHttpRequest|new WebSocket/);
});

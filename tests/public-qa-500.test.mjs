import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const js=readFileSync(new URL("../eiren-conversation-v1.js",import.meta.url),"utf8");
const bank=JSON.parse(readFileSync(new URL("../knowledge/mentor-approved-500.v1.json",import.meta.url),"utf8"));
test("500 approved public Q&As are distinct and source-bounded",()=>{
 assert.equal(bank.schema,"vnv-public-mentor-qa-v1");assert.equal(bank.mentorId,"eiren");assert.equal(bank.records.length,500);
 const seen=new Set();for(const r of bank.records){assert.ok(r.question?.trim()&&r.answer?.trim());assert.match(r.status,/^(approved|approved-public|approved-public-seed|founder-approved-editorial)$/);const key=r.question.normalize("NFKC").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();assert.ok(key&&!seen.has(key));seen.add(key);}
});
test("existing conversation engine compiles and approved source is referenced",()=>{
 assert.doesNotThrow(()=>new Script(js));
 assert.match(js,/mentor-approved-500\.v1\.json/);
 assert.doesNotMatch(js,/\/api\/.*(token|secret)/);
});

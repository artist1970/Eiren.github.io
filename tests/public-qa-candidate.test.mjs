import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync(new URL("../knowledge/public-qa.candidate.v1.json",import.meta.url),"utf8"));
const peer=data.mentorId==="klasaipeer";
test("candidate is visibly unapproved and cannot be used as an approved source",()=>{
 assert.equal(data.reviewStatus,peer?"candidate-awaiting-editorial-and-family-safety-review":"candidate-awaiting-editorial-review");
 assert.ok(data.records.length>=300);
 assert.ok(data.records.every(x=>x.status==="review-pending"));
 assert.ok(data.records.every(x=>x.source&&x.version===1));
});
test("every seed question is unique, complete and safe plain text",()=>{
 const questions=new Set(),ids=new Set();
 for(const r of data.records){
  assert.ok(/^[-a-z0-9]{5,80}$/.test(r.id));
  assert.ok(r.question.length>=14&&r.question.length<=150);
  assert.ok(r.response.length>=55&&r.response.length<=1000);
  assert.ok(!/[<>]/.test(r.question+r.response));
  const k=r.question.normalize("NFKC").toLowerCase().trim();
  assert.ok(!questions.has(k),"duplicate question: "+k);
  assert.ok(!ids.has(r.id),"duplicate ID: "+r.id);
  questions.add(k);ids.add(r.id);
 }
});
test("public bank is not an account, private CORE, or academic assessment source",()=>{
 assert.match(data.scope,/no (?:adopted identities|academic assessment records)/);
 const json=JSON.stringify(data);
 assert.doesNotMatch(json,/api[_-]?key|access[_-]?token|password\s*[:=]|github\.com\/artist1970\/CORE|github\.com\/artist1970\/AIPCore/iu);
});
test("KlasaiPeer does not infer age grade placement or adopt a child in a public seed",()=>{
 if(!peer)return;
 assert.ok(data.records.every(x=>JSON.stringify(x.audiences)==='["general-public"]'));
 assert.doesNotMatch(JSON.stringify(data),/gradeBands|personalizationProfile|studentId|accountId/);
});
test("Eiren retains a literary specialist's scope without rewriting student text",()=>{
 if(peer)return;
 assert.ok(data.records.some(x=>x.topic==="poetry"));
 assert.ok(data.records.some(x=>x.topic==="writing"));
 assert.ok(data.records.some(x=>x.topic==="story"));
});

test("candidate has broad subject coverage without changing its publication gate",()=>{
 const topics=new Set(data.records.map(x=>x.topic));
 assert.ok(topics.size>=10,"expected at least ten distinct topical groups");
 assert.ok(data.records.every(x=>x.status==="review-pending"));
 assert.equal(data.records.length,300);
});

test("new batch remains a candidate and contains distinct approved-scope topic groups",()=>{
 const topics=new Set(data.records.slice(250).map(x=>x.topic));
 assert.equal(data.records.length,300);
 assert.equal(topics.size,10);
 assert.ok(data.records.slice(250).every(x=>x.status==="review-pending"));
});

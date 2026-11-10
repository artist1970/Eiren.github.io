import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>JSON.parse(readFileSync(new URL("../knowledge/"+p,import.meta.url),"utf8"));
const bank=load("public-qa.candidate.v1.json");
const tax=load("public-qa-taxonomy.candidate.v1.json");
const topics=[...new Set(bank.records.map(r=>r.topic))].sort();
const domIds=new Set(tax.domains.map(d=>d.id));
test("taxonomy identity and source boundary remain fixed",()=>{
 assert.equal(tax.schema,"mentor-qa-topic-taxonomy-v1");
 assert.equal(tax.mentorId,bank.mentorId);
 assert.equal(tax.sourceSchema,bank.schema);
 assert.equal(tax.sourcePath,"knowledge/public-qa.candidate.v1.json");
 assert.equal(tax.publicationAuthorized,false);
 assert.equal(bank.records.length,500);
 assert.ok(bank.records.every(r=>r.status==="review-pending"));
});
test("mapping covers exactly the authored topics without implicit fallback",()=>{
 assert.deepEqual(Object.keys(tax.topicToDomain).sort(),topics);
 assert.equal(domIds.size,tax.domains.length);
 assert.ok(tax.domains.every(d=>d.id&&d.label));
 for(const t of topics)assert.ok(domIds.has(tax.topicToDomain[t]),"unmapped "+t);
 assert.ok(tax.domains.every(d=>bank.records.some(r=>tax.topicToDomain[r.topic]===d.id)),"empty canonical domain");
});
test("all records retain their authored topic, ID, response and approval status",()=>{
 assert.equal(new Set(bank.records.map(r=>r.id)).size,500);
 assert.ok(bank.records.every(r=>r.question&&r.response&&r.topic&&r.status==="review-pending"));
 assert.ok(bank.records.every(r=>tax.topicToDomain[r.topic]));
});
test("candidate taxonomy cannot claim learner or publication authority",()=>{
 const peer=tax.mentorId==="klasaipeer";
 assert.equal(tax.domains.length,peer?11:10);
 if(peer){
  assert.match(tax.rule,/must not be used to infer learner grade/);
  assert.ok(bank.records.every(r=>JSON.stringify(r.audiences)==='["general-public"]'));
  assert.equal(tax.status,"editorial-and-family-safety-candidate");
 }else{
  assert.equal(tax.status,"editorial-candidate");
  assert.ok(domIds.has("poetry"));
  assert.ok(domIds.has("research-archives"));
 }
});

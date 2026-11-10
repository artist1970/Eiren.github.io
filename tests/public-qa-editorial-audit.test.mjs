import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync(new URL("../knowledge/public-qa.candidate.v1.json",import.meta.url),"utf8"));
const rows=data.records;
const normalized=s=>String(s).normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
test("all 500 Q&A candidates retain source provenance and an unapproved review state",()=>{
 assert.equal(rows.length,500);
 assert.equal(new Set(rows.map(x=>x.id)).size,500);
 assert.ok(rows.every(x=>x.status==="review-pending"&&x.source&&x.version===1));
 assert.match(data.reviewStatus,/^candidate-awaiting-/);
});
test("exact and punctuation-only repeated question and answer content are absent",()=>{
 assert.equal(new Set(rows.map(x=>normalized(x.question))).size,500);
 assert.equal(new Set(rows.map(x=>normalized(x.response))).size,500);
});
test("every answer is meaningful, bounded, and contains no raw HTML",()=>{
 for(const r of rows){
  assert.ok(r.response.length>=80&&r.response.length<=1000,r.id+" answer depth");
  assert.ok(r.question.length>=14&&r.question.length<=150,r.id+" question length");
  assert.doesNotMatch(r.question+r.response,/<[^>]+>/);
 }
});
test("topic inventory is broad but no record is silently approved",()=>{
 assert.ok(new Set(rows.map(x=>x.topic)).size>=50);
 assert.ok(rows.every(x=>x.status==="review-pending"));
});
test("public demonstration cannot impersonate an adopted account or teaching authority",()=>{
 const peer=data.mentorId==="klasaipeer";
 assert.equal(peer,data.schema==="klasaipeer-public-qa-v1");
 if(peer){assert.ok(rows.every(x=>JSON.stringify(x.audiences)==='["general-public"]'));assert.match(data.scope,/no adopted identities/)}
 else {assert.match(data.scope,/no academic assessment records/);assert.ok(rows.some(x=>x.topic==="literary-inquiry"))}
});

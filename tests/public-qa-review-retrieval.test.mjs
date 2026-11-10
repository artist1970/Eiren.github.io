import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=n=>JSON.parse(readFileSync(new URL("../knowledge/"+n,import.meta.url),"utf8"));
const bank=load("public-qa.candidate.v1.json");
const tax=load("public-qa-taxonomy.candidate.v1.json");
const clean=s=>String(s).normalize("NFKC").toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu," ").trim().replace(/\\s+/g," ");
const stop=new Set(["what","when","where","why","how","can","you","help","with","the","this","that","and","for","from","into","your","about","does","are","which","should","would","could","make","there","one","more","some","have","its","than","them","their","do","we","my","me"]);
const words=s=>[...new Set(clean(s).split(" ").filter(x=>x.length>2&&!stop.has(x)))];
function reviewLookup(query,{mentorId=bank.mentorId,limit=3}={}){
 if(mentorId!==bank.mentorId||typeof query!=="string"||query.length>240||!clean(query))return {status:"no-match",candidates:[]};
 const queryKey=clean(query),toks=words(query),results=[];
 for(const r of bank.records){
  const originalTopic=r.topic,domain=tax.topicToDomain[originalTopic];
  if(!domain||r.status!=="review-pending")continue;
  const exact=clean(r.question)===queryKey;
  const qwords=new Set(words(r.question));
  const common=toks.filter(x=>qwords.has(x)).length;
  const density=toks.length?common/toks.length:0;
  const score=exact?100:common>=2&&density>=0.5?common*2+density:0;
  if(score)results.push({recordId:r.id,mentorId:bank.mentorId,topic:originalTopic,domain,score});
 }
 results.sort((a,b)=>b.score-a.score||a.recordId.localeCompare(b.recordId));
 if(!results.length)return {status:"no-match",candidates:[]};
 const top=results[0].score;
 if(results.length>1&&results[1].score===top&&results[1].domain!==results[0].domain)return{status:"ambiguous",candidates:results.filter(x=>x.score===top).slice(0,limit).map(({score,...x})=>x)};
 return{status:"review-only",candidates:results.slice(0,limit).map(({score,...x})=>x)};
}
test("all 500 records can be found using exact authored prompts, without emitting answers",()=>{
 assert.equal(bank.records.length,500);
 for(const r of bank.records){
  const out=reviewLookup(r.question);
  assert.equal(out.status,"review-only",r.id+" "+out.status);
  assert.equal(out.candidates[0].recordId,r.id);
  assert.equal(out.candidates[0].domain,tax.topicToDomain[r.topic]);
  assert.ok(!JSON.stringify(out).includes(r.response),r.id+" answer must not be returned");
  assert.ok(out.candidates.every(x=>!Object.hasOwn(x,"response")&&!Object.hasOwn(x,"answer")));
 }
});
test("unknown and wrong-mentor inputs fail closed",()=>{
 for(const q of ["xyzzy quux obscure tokens","", "   "])
  assert.deepEqual(reviewLookup(q),{status:"no-match",candidates:[]});
 assert.deepEqual(reviewLookup("How can we start a science experiment?",{mentorId:"unrelated-mentor"}),{status:"no-match",candidates:[]});
 assert.deepEqual(reviewLookup("a".repeat(241)),{status:"no-match",candidates:[]});
});
test("fixed topic mapping is stable and all candidates remain unapproved",()=>{
 assert.equal(tax.publicationAuthorized,false);
 assert.ok(bank.records.every(r=>r.status==="review-pending"));
 for(const r of bank.records)assert.ok(tax.domains.some(x=>x.id===tax.topicToDomain[r.topic]));
});
test("review retrieval is not a public-chat or learner-adoption interface",()=>{
 assert.ok(!Object.hasOwn(bank,"studentId"));
 assert.ok(!Object.hasOwn(bank,"accountId"));
 assert.ok(!Object.hasOwn(tax,"gradeBands"));
 assert.ok(!Object.hasOwn(tax,"studentProfiles"));
});

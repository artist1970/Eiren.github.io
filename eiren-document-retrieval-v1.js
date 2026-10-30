/* Eiren public documentation pilot: reviewed summaries only. */
(function(global){"use strict";
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
let documents=[],state="loading";
const ready=fetch("./knowledge/public-document-index.v1.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("index unavailable");return r.json()}).then(d=>{if(d.schema!=="eiren-public-doc-index-v1"||!Array.isArray(d.documents))throw Error("invalid index");documents=d.documents.filter(x=>x.review==="approved-public-summary"&&x.visibility==="public"&&x.url.startsWith("https://github.com/"));state="ready";return documents.length}).catch(()=>{state="unavailable";return 0});
function retrieve(message){if(state!=="ready")return null;const q=" "+norm(message)+" ";if(q.trim().length<7)return null;const scored=documents.map(d=>({d,score:(d.keywords||[]).filter(k=>{const key=norm(k);return key.length>3&&q.includes(" "+key+" ")}).length})).sort((a,b)=>b.score-a.score);const top=scored[0];if(!top||top.score<1)return null;return {text:top.d.summary+" Source: "+top.d.repo+"/"+top.d.path+" (revision "+top.d.sha.slice(0,12)+"). "+top.d.url,source:top.d.url,score:top.score};}
global.EirenDocumentRetrieval=Object.freeze({ready,retrieve,status:()=>state,sourceCount:()=>documents.length});
})(window);

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../eiren-voice-picker-v1.js",import.meta.url),"utf8");
function harness(initial=[]){
 const options=[], events={};
 const mk=()=>({style:{},children:[],textContent:"",value:"",disabled:false,
  setAttribute(){},append(...items){this.children.push(...items);},
  addEventListener(type,fn){this.events??={};this.events[type]=fn;},
  replaceChildren(){this.children=[];}});
 const host=mk(),log=mk(),root=mk(),picker=mk();
 log.insertAdjacentElement=()=>{};
 log.querySelectorAll=()=>[];
 const document={
  getElementById(id){return id==="eirenConversation"?host:id==="eirenMessages"?log:null;},
  createElement(tag){return tag==="select"?picker:mk();}
 };
 const localStorage={getItem:()=>null,setItem:()=>{}};
 const speechSynthesis={getVoices:()=>initial,addEventListener:(type,fn)=>events[type]=fn};
 const window={EirenConversation:{speak(){},stop(){}},speechSynthesis,SpeechSynthesisUtterance:function(){}};
 vm.runInNewContext(source,{window,document,localStorage,console});
 return {window,picker,events};
}
const v=(name,lang="en-US")=>({name,lang,voiceURI:name,localService:true});
test("Tessa is the default when both requested voices are installed",()=>{
 const h=harness([v("Google US English"),v("Nicky"),v("Tessa","en-ZA")]);
 assert.equal(h.window.EirenVoicePicker.selected().name,"Tessa");
 assert.ok(h.picker.children.some(o=>o.value==="tessa"));
 assert.ok(h.picker.children.some(o=>o.value==="nicky"));
});
test("Nicky is preferred when Tessa is not present",()=>{
 const h=harness([v("Google US English"),v("Nicky")]);
 assert.equal(h.window.EirenVoicePicker.selected().name,"Nicky");
 assert.ok(!h.picker.children.some(o=>o.value==="tessa"));
});
test("device voice fallback remains available",()=>{
 const h=harness([v("Generic English")]);
 assert.equal(h.window.EirenVoicePicker.selected().name,"Generic English");
 assert.ok(h.picker.children.some(o=>o.value==="auto"));
});
test("empty voice list does not invent an installed Tessa or Nicky",()=>{
 const h=harness([]);
 assert.equal(h.window.EirenVoicePicker.selected(),null);
 assert.ok(!h.picker.children.some(o=>o.value==="tessa"||o.value==="nicky"));
});

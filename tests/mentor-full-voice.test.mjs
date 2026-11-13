import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=readFileSync(new URL('../eiren-voice-picker-v1.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function el(tag='div'){const events={};return{tag,events,children:[],textContent:'',value:'',style:{},append(...x){this.children.push(...x)},replaceChildren(...x){this.children=[...x]},insertAdjacentElement(){},setAttribute(){},addEventListener(k,f){events[k]=f},querySelector(q){return q==='strong'?this.children.find(x=>x.tag==='strong')||null:null},querySelectorAll(){return []}}}
function boot(){
 const host=el(),log=el(),spoken=[],store=new Map();
 const voices=[{name:'Arthur',lang:'en-GB',voiceURI:'one',localService:true},{name:'Amélie',lang:'fr-FR',voiceURI:'two',localService:true}];
 const doc={getElementById:id=>id==='eirenConversation'?host:id==='eirenMessages'?log:null,createElement:el};
 const window={speechSynthesis:{getVoices:()=>voices,addEventListener(){}},SpeechSynthesisUtterance:function(){},EirenConversation:{speak:(text,voice)=>spoken.push({text,voice})}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 vm.runInNewContext(source,{window,document:doc,localStorage},{timeout:1000});
 return{window,spoken,store};
}
test('Eiren has one voice switch beside composer and a bottom voice picker',()=>{
 assert.ok(html.includes('src="eiren-voice-picker-v1.js"'));
 assert.ok(html.includes('id="eirenVoiceToggleSlot"'));
 assert.ok(html.includes('id="eirenVoiceDock"'));
 assert.ok(!html.includes('id="eirenReadReply"'));
 assert.ok(!html.includes('id="eirenStopVoice"'));
 assert.ok(!source.includes('function decorate('));
 assert.ok(!source.includes('eiren-replay'));
 assert.ok(source.includes('voiceToggleSlot.append(toggle)'));
 assert.ok(source.includes('voiceDock.append(root)'));
});
test('voice list can select a new narration voice without changing Eiren speech engine',()=>{
 const b=boot();assert.ok(b.window.EirenVoicePicker);
 assert.equal(b.window.EirenVoicePicker.selected()?.name,'Arthur');
 b.window.EirenVoicePicker.speak('A literary thought');
 assert.equal(b.spoken[0].voice.name,'Arthur');
});
test('voice preference only and no conversation stored by picker',()=>{
 assert.match(source,/vnv\.public\.voice\.eiren\.v1/);
 assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|indexedDB/);
});

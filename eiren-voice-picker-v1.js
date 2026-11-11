/* Eiren public browser voice selector. Reuses Eiren's speech engine and keeps her conversation storage unchanged. */
(()=>{"use strict";
const host=document.getElementById("eirenConversation"),log=document.getElementById("eirenMessages");
if(!host||!log||!window.EirenConversation)return;
const root=document.createElement("div");root.id="eiren-voice-controls";
root.style.cssText="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:15px 0;padding:13px;border:1px solid currentColor;border-radius:7px";
const label=document.createElement("label");label.textContent="Eiren's voice";label.htmlFor="eiren-voice-select";label.style.cssText="font-size:16px";
const picker=document.createElement("select");picker.id="eiren-voice-select";picker.style.cssText="min-height:44px;min-width:180px;max-width:100%;flex:1;padding:10px;background:#f4f0e7;color:#243038;border:1px solid #a38e6f;border-radius:7px;font-size:16px";
const preview=document.createElement("button");preview.type="button";preview.textContent="Preview voice";preview.className="quiet";
const status=document.createElement("p");status.setAttribute("role","status");status.setAttribute("aria-live","polite");status.style.cssText="width:100%;font-size:16px;margin:0";status.textContent="Checking available voices…";
root.append(label,picker,preview,status);
log.insertAdjacentElement("afterend",root);
const supported="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
let voices=[],choice="auto";
const storageKey="vnv.public.voice.eiren.v1",key=v=>JSON.stringify([v.voiceURI||"",v.name||"",v.lang||"",!!v.localService]);
try{const v=localStorage.getItem(storageKey);if(v&&v.length<500)choice=v;}catch{}
const voiceLabel=v=>(v.name||"Unnamed")+" · "+(v.lang||"unknown")+(v.localService?" · device":" · browser/service");
function automatic(){
 const us=voices.filter(v=>/^en[-_]US$/i.test(v.lang||""));
 return us.find(v=>/google\s+us\s+english/i.test(v.name||""))
   ||us.find(v=>/nicky/i.test(v.name||""))
   ||us.find(v=>/natural|enhanced|premium/i.test(v.name||""))
   ||us[0]
   ||voices.find(v=>/^en(?:[-_]|$)/i.test(v.lang||""))
   ||voices[0]||null;
}
function selected(){return choice==="auto"?automatic():voices.find(v=>key(v)===choice)||automatic();}
function refresh(){
 if(!supported)return;
 voices=Array.from(window.speechSynthesis.getVoices()||[]);picker.replaceChildren();
 let d=document.createElement("option");d.value="auto";d.textContent="Automatic · US English (Google / Nicky preferred)";picker.append(d);
 const seen=new Set();
 for(const v of voices){const k=key(v);if(seen.has(k))continue;seen.add(k);const o=document.createElement("option");o.value=k;o.textContent=voiceLabel(v);picker.append(o);}
 if(choice!=="auto"&&!seen.has(choice)&&voices.length){choice="auto";status.textContent="Previous voice unavailable; automatic narrator restored.";}
 picker.value=choice;
}
function speak(text){if(!supported){status.textContent="Speech is unavailable in this browser.";return;}const v=selected();try{window.EirenConversation.speak(text,v);status.textContent="Reading with "+(v?.name||"browser default")+". ";}catch{status.textContent="Reading aloud is unavailable.";}}
function decorate(){
 for(const p of log.querySelectorAll("p")){
  if(!/^Eiren\s*$/i.test(p.querySelector("strong")?.textContent?.trim()||"")||p.querySelector(".eiren-replay"))continue;
  const text=p.textContent.replace(/^Eiren\s*/,"").trim();
  const b=document.createElement("button");b.type="button";b.className="quiet eiren-replay";b.textContent="Listen to this reply";b.style.cssText="display:block;margin-top:8px;font-size:16px";
  b.addEventListener("click",()=>speak(text));p.append(b);
 }
}
decorate();
if("MutationObserver" in window){const o=new MutationObserver(decorate);o.observe(log,{childList:true});}
picker.addEventListener("change",()=>{choice=picker.value||"auto";try{localStorage.setItem(storageKey,choice);}catch{}status.textContent="Selected: "+(selected()?voiceLabel(selected()):"browser default");});
preview.addEventListener("click",()=>speak("Welcome. I am Eiren. Every word can begin a new story."));
window.EirenVoicePicker=Object.freeze({selected,speak});
if(supported){refresh();window.speechSynthesis.addEventListener?.("voiceschanged",refresh);}
else{picker.disabled=true;preview.disabled=true;status.textContent="Speech is unavailable in this browser.";}
})();

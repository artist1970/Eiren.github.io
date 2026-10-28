/* Eiren · contextual literary conversation v1.0
   Bounded local continuity inspired by the Academy Living Mentor architecture.
   No network AI, grades, assessment keys, sensitive-trait inference, or authority escalation.
   NAIB administers delegation; Noema governs mentor eligibility; Eiren mentors language and literature. */
(function(global){"use strict";
const ROOT="eiren_literary_conversation_v1",sessions=new Map();
const clean=s=>String(s==null?"":s).trim().slice(0,1200);
const norm=s=>clean(s).toLowerCase().replace(/[’]/g,"'");
function key(scope){return ROOT+":"+encodeURIComponent(String(scope||"visitor"))}
function read(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
const STRATEGIES=Object.freeze({question:"one thoughtful question",example:"a small example",prompt:"a writing prompt",vocabulary:"a word clue",structure:"a structural observation",readalong:"read-aloud guidance"});
function freshState(){return {version:1,topic:"",mode:"listen",turns:0,used:[],helped:{question:0,example:0,prompt:0,vocabulary:0,structure:0,readalong:0},remember:true}}
function createSession({scope="visitor",storage=true}={}){
 const storageKey=key(scope);let state=storage?(read(storageKey)||freshState()):freshState();
 function save(){if(storage&&state.remember)write(storageKey,state)}
 function chooseStrategy(){const ranked=Object.keys(STRATEGIES).map(id=>({id,n:Number(state.helped[id]||0),recent:state.used.lastIndexOf(id)})).sort((a,b)=>b.n-a.n||a.recent-b.recent);const pick=ranked[0]?.id||"question";state.used.push(pick);state.used=state.used.slice(-18);return pick}
 function markHelpful(id){if(STRATEGIES[id]){state.helped[id]=(state.helped[id]||0)+1;save()}}
 function respond(message){
  const raw=clean(message),q=norm(raw);if(!raw)return "Bring me one sentence, one word, one story question, or one unfinished thought.";
  state.turns++;
  if(/(?:show|give|reveal|leak|provide|unlock).{0,45}(?:locked|exam answers|answer key|test answers|password|private records)/i.test(raw)||/(?:password|login credential|secret token)/i.test(raw))return "I can help with the underlying reading or writing skill using fresh material, but I cannot reveal locked assessments, answer keys, credentials, or private records.";
  if(/\b(?:unsafe|emergency|immediate danger|hurt myself)\b/i.test(raw))return "Your safety matters more than the writing. Please tell a trusted adult now; if there is immediate danger, contact emergency services. We can return to the words afterward.";
  if(/^(?:hi|hello|hey|good morning|good afternoon|good evening)[!?.\s]*$/i.test(q))return state.topic?"Hello again. We were sitting with "+state.topic+". Shall we continue?":"Hello. I’m Eiren. You do not need the perfect words. What are you reading, writing, wondering about, or trying to say?";
  if(/^(?:thanks|thank you)[!.\s]*$/.test(q))return "You’re welcome. We can leave the thought here, or follow it one step farther.";
  if(/(?:that helped|helpful|i get it|makes sense|that worked)/.test(q)){const id=state.used.at(-1);if(id)markHelpful(id);return "I’m glad that approach helped. Tell me the idea back in your own words, or we can try one more small step."}
  if(/\b(read aloud|read-along|read along|read this|story time)\b/.test(q)){state.topic="this reading";state.mode="readalong";state.used.push("readalong");save();return "We can read slowly together. Start with one short part. After it, tell me one thing you noticed—a word, picture, feeling, sound, or event. I can help with a word without taking the story away from you."}
  if(/\b(word|vocabulary|means|meaning|define|definition)\b/.test(q)){state.topic="vocabulary";state.mode="vocabulary";state.used.push("vocabulary");save();return "Let’s use the sentence around the word first. What seems to be happening there? Then we can test a meaning that fits the context."}
  if(/\b(poem|poetry|rhyme|rhyming|verse|stanza)\b/.test(q)){state.topic="poetry";state.mode="poetry";save();return "Read it once for meaning and once for sound. Which word, image, rhythm, or line keeps asking for your attention?"}
  if(/\b(story|character|plot|scene|ending|beginning)\b/.test(q)){state.topic="the story";state.mode="story";save();return "Before we repair the story, tell me what it is trying to protect or become. What does the character want here, and what makes that difficult?"}
  if(/\b(edit|revise|revision|draft|paragraph|essay|writing)\b/.test(q)){state.topic="your writing";state.mode="writing";save();return "Keep your voice first. Show me the smallest passage that feels wrong, and tell me whether you want help with meaning, structure, clarity, rhythm, or correctness."}
  if(/\b(stuck|don't know|do not know|begin|start)\b/.test(q)){state.topic=state.topic||"a beginning";const strategy=chooseStrategy();save();return strategy==="prompt"?"Try this: write one true sentence about what the piece cannot afford to lose. We can begin there.":"What is the smallest part you already know—a person, image, fact, feeling, question, or line?"}
  const strategy=chooseStrategy();save();
  if(strategy==="structure")return "Let’s look at the shape before changing the words. What comes immediately before this part, and what must the reader understand immediately after it?";
  if(strategy==="vocabulary")return "Choose one important word in the passage. What does the surrounding sentence suggest that word is doing?";
  if(strategy==="example")return "We can make a tiny parallel example first, then return to your own work without replacing your words. What kind of sentence or passage are you working with?";
  if(strategy==="prompt")return "Try one exploratory sentence that begins, “What I am really trying to say is…” You do not have to keep that sentence.";
  return "Tell me what you notice first. I’ll listen for the meaning underneath it before we decide what needs to change.";
 }
 function reset(){state=freshState();if(storage)try{localStorage.removeItem(storageKey)}catch{}}
 function remember(on){state.remember=!!on;if(!on&&storage)try{localStorage.removeItem(storageKey)}catch{}else save()}
 return Object.freeze({respond,reset,remember,markHelpful,snapshot:()=>JSON.parse(JSON.stringify(state))});
}
function forScope(scope){const id=key(scope);if(!sessions.has(id))sessions.set(id,createSession({scope}));return sessions.get(id)}
function speak(text,voice){if(!("speechSynthesis" in global)||typeof global.SpeechSynthesisUtterance==="undefined")return false;global.speechSynthesis.cancel();const u=new global.SpeechSynthesisUtterance(clean(text).slice(0,1600));if(voice)u.voice=voice;u.lang=voice?.lang||"en-GB";u.rate=.88;u.pitch=1.04;global.speechSynthesis.speak(u);return true}
function stop(){try{global.speechSynthesis?.cancel()}catch{}}
global.EirenConversation=Object.freeze({version:"1.0.0",createSession,forScope,speak,stop,strategies:STRATEGIES});
})(window);

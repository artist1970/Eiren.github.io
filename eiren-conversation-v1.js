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
function freshState(){return {version:1,topic:"",mode:"listen",focus:"",turns:0,used:[],recentKnowledgeIds:[],helped:{question:0,example:0,prompt:0,vocabulary:0,structure:0,readalong:0},remember:false}}
// Small, reviewable conversation skills. Pattern responses are not neural inference.
// Focus is volatile session context; never silently saved or promoted to memory.
const SUBJECTS=Object.freeze({
  passionflower:/\\b(?:passion\\s*(?:fruit|fuit)?\\s*flower|passionflower|passionfuit\\s*flower)\\b/i,
  flower:/\\b(?:flowers?|blossoms?|blooms?)\\b/i
});
const RHYMES=Object.freeze({
  flower:{words:"shower, tower, bower, power, and hour (depending on accent)",couplet:"A purple passionflower after a shower,\\nA little burst of wonder in the garden's quiet hour."},
  night:{words:"light, bright, sight, flight",couplet:"I found a little light within the night,\\nAnd held its quiet color burning bright."},
  day:{words:"way, play, stay, away",couplet:"A single bloom brightened my day,\\nAnd gave my wandering thoughts a place to stay."},
  love:{words:"dove, above (accent-dependent)",couplet:"A note of gentle love,\\nBeneath the sky above."}
});
function subjectIn(text){
 if(SUBJECTS.passionflower.test(text))return "passionflower";
 if(SUBJECTS.flower.test(text))return "flower";
 return "";
}
function rhymeTarget(text,focus){
 if(!/\\b(?:rhyme|rhymes|rhyming|ryhme|ryhmes|rime)\\b/i.test(text))return "";
 const explicit=text.match(/(?:with|for|to)\\s+(?:the\\s+)?([a-z]+(?:\\s+[a-z]+)?)(?:[?.!,]|$)/i)?.[1]?.toLowerCase()||"";
 if(/passion\\s*flower|passionflower/.test(explicit)||/passion\\s*flower|passionflower/i.test(text))return "flower";
 const lastWord=explicit.split(/\\s+/).at(-1);
 if(Object.prototype.hasOwnProperty.call(RHYMES,lastWord))return lastWord;
 if(/\\b(?:it|that|this)\\b/i.test(explicit)&&focus)return focus==="passionflower"?"flower":focus;
 return explicit||focus;
}
function contextualReply(text,state){
 const q=norm(text);
 // Follow the person's actual conversational intent before switching to
 // random workshop strategies. These are grounded, non-assertive suggestions.
 const rhyme=rhymeTarget(text,state.focus);
 if(rhyme){
   state.mode="poetry";
   const entry=RHYMES[rhyme];
   if(entry){
     return "Yes! For “"+(state.focus==="passionflower"&&rhyme==="flower"?"passionflower":rhyme)+
       ",” try "+entry.words+". Here is a little couplet you can change:\\n\\n"+entry.couplet+
       "\\n\\nWould you like it whimsical, gentle, or more musical?";
   }
   return "I can help find a rhyme, but I don't have a verified rhyme list for “"+rhyme.slice(0,40)+
     "” in this offline collection. Could we work with its final sound together?";
 }
 if(/\\b(?:what (?:am|an) i really trying to say|what do i (?:really )?mean|what am i trying to say)\\b/i.test(q)){
   if(state.focus==="passionflower"||state.focus==="flower"){
     return "Perhaps you're trying to capture how noticing that purple "+
       (state.focus==="passionflower"?"passionflower":"flower")+
       " made an ordinary moment stand out. That's just one interpretation—what did the flower make you feel?";
   }
   return "I can't know what you mean without more context. What part of the thought feels most important to you?";
 }
 const subject=subjectIn(text);
 if(subject){
   state.focus=subject==="passionflower"?"passionflower":state.focus==="passionflower"?"passionflower":"flower";
   state.mode="conversation";
   if(state.focus==="passionflower"){
     return "A passionflower! Its intricate shape can be striking, especially in purple. What caught your eye first—the petals, the center, or the way it was growing?";
   }
   return "A purple flower sounds like a lovely discovery. Do you know what kind it was, or was it the color that caught your attention?";
 }
 if(/\\b(?:i (?:noticed|saw|found|spotted)|today i (?:noticed|saw|found)|look(?:ed|ing) at)\\b/i.test(q)){
   state.mode="conversation";
   return "That sounds like a moment that stayed with you. What detail caught your attention?";
 }
 return null;
}
function createSession({scope="visitor",storage=false}={}){
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
  const situated=contextualReply(raw,state);
  if(situated){save();return situated;}
  // The shared public language service is optional and never accesses private AIPCore.
  const shared=global.CreativeSparkMentorLanguage;
  const grammarRequest=raw.match(/^(?:check|review|help with)(?: my)? grammar\s*[:—-]\s*(.{4,1000})$/i);
  if(grammarRequest){
    const notes=shared?.grammar(grammarRequest[1],{mentorId:"eiren"})?.notes;
    return notes?.length?notes.join(" "):"I don't see one of the basic issues I can flag. This is a limited grammar check, not a complete proofreading service.";
  }
  const lexicalRequest=raw.match(/^(?:please\s+)?(?:define|what does|meaning of|synonyms of|antonyms of)\s+(?:the word\s+)?['"“”]?([a-z-]{2,70})['"“”]?[?.!]?$/i);
  if(lexicalRequest){
    const mode=/^synonyms/i.test(raw)?"synonyms":/^antonyms/i.test(raw)?"antonyms":"definition";
    const known=shared?.lookup(lexicalRequest[1],{mentorId:"eiren",mode});
    return known||"That word is not yet in the small approved public dictionary I can access. I won't invent a definition; we can instead explore how the word is used in a sentence.";
  }
  // A reviewed public Q&A may enrich an ordinary literary guidance request.
  // Safety and protected-content checks above always take precedence.
  const followUp=/^(?:tell me more|another (?:question|example|idea)|continue|what else)[?.!\s]*$/i.test(raw);
  const recent=Array.isArray(state.recentKnowledgeIds)?state.recentKnowledgeIds:[];
  const published=global.EirenPublicKnowledge?.answer(raw,{
    topic:followUp?state.topic:"",
    excludeIds:followUp?recent:[]
  });
  if(published){
    if(state.topic!==published.topic)state.recentKnowledgeIds=[];
    state.topic=published.topic;
    state.mode=published.topic;
    state.recentKnowledgeIds=[...(state.recentKnowledgeIds||[]),published.recordId].slice(-60);
    save();
    return published.text;
  }
  const cross=global.CreativeSparkMentorQA?.answer(raw,{mentorId:"eiren",scope:"literary-chat"});
  if(cross)return "From "+cross.sourceName+"'s approved public knowledge: "+cross.answer+" (Reference: "+cross.sourceName+" · "+cross.topic+".)\nWould you like to explore this from a literary perspective?";
  if(followUp&&state.topic)return "We've explored the approved examples for this topic. Would you like to revisit one, or choose something new?";
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
function speak(text,voice){if(!("speechSynthesis" in global)||typeof global.SpeechSynthesisUtterance==="undefined")return false;global.speechSynthesis.cancel();const u=new global.SpeechSynthesisUtterance(clean(text).slice(0,1600));if(voice)u.voice=voice;u.lang=voice?.lang||"en-US";u.rate=.88;u.pitch=1.04;global.speechSynthesis.speak(u);return true}
function stop(){try{global.speechSynthesis?.cancel()}catch{}}
global.EirenConversation=Object.freeze({version:"1.0.0",createSession,forScope,speak,stop,strategies:STRATEGIES});
})(window);

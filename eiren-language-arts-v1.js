/* Eiren's foundational language-arts answers v1.
   Direct educational definitions and practical how-to replies, no model,
   logging, network, user storage or external data. */
(function(root){"use strict";
 const normalize=s=>String(s??"").toLowerCase().replace(/[’]/g,"'").replace(/\s+/g," ").trim().slice(0,1200);
 const entries=Object.freeze([
  {id:"poetry",re:/\b(?:definition of poetry|what (?:is|does) poetry (?:mean|refer to)?|define poetry)\b/i,
   text:"Poetry is a form of writing that uses carefully chosen words, imagery, sound, rhythm, and line breaks to express ideas or experiences. Poems may rhyme, but they do not have to. For example: “The tree sees me” uses personification to make an ordinary image feel alive."},
  {id:"conjunction",re:/\b(?:what (?:is|are) (?:a |an )?conjunction|define conjunction|conjunction (?:meaning|definition))\b/i,
   text:"A conjunction connects words, phrases, or clauses. Common coordinating conjunctions are for, and, nor, but, or, yet, and so (FANBOYS). Example: “The flower bloomed, and the rain began.” Here, “and” joins two clauses."},
  {id:"verb",re:/\b(?:what (?:is|are) (?:a |an )?verb|define (?:a )?verb|verb (?:meaning|definition))\b/i,
   text:"A verb expresses an action, an occurrence, or a state of being. In “The flower blooms,” blooms is the verb. In “The sky is blue,” is is a linking verb."},
  {id:"adjective",re:/\b(?:what (?:is|are) (?:a |an )?adjective|define (?:an )?adjective|adjective (?:meaning|definition))\b/i,
   text:"An adjective describes or modifies a noun or pronoun. In “the purple flower,” purple is an adjective because it describes the flower. In “the gentle rain,” gentle describes rain."},
  {id:"run-on",re:/\b(?:what (?:is|are) (?:a )?run[ -]?on sentence|define run[ -]?on sentence|run[ -]?on sentence (?:meaning|definition))\b/i,
   text:"A run-on sentence joins two or more independent clauses without correct punctuation or a suitable conjunction. Example: “The flower bloomed the rain fell.” Repair it with a period (“The flower bloomed. The rain fell.”), a semicolon, or a comma plus conjunction (“The flower bloomed, and the rain fell.”). A long sentence is not necessarily a run-on."},
  {id:"juxtaposition",re:/\b(?:what (?:is|are) (?:a )?(?:juxtaposition|justuposition|juxstaposition|juxtoposition)|define (?:juxtaposition|justuposition|juxstaposition))\b/i,
   text:"Juxtaposition means placing two things side by side so their similarities or differences become striking. In a story, a bright blooming flower beside an abandoned building might emphasize hope against loss. Juxtaposition is a literary technique, not just an unusual word."},
  {id:"fiction",re:/\b(?:opposite of fiction|what is non[ -]?fiction|what's the opposite of fiction|fiction versus non[ -]?fiction)\b/i,
   text:"The usual counterpart to fiction is nonfiction. Fiction tells imagined or invented stories, even if some details reflect real life. Nonfiction presents factual subjects, such as biographies, history, essays, or investigative reporting; its claims should be supported by evidence."},
  {id:"sentence-parts",re:/\b(?:parts of (?:a |the )?sentence|sentence (?:parts|components)|subject and predicate)\b/i,
   text:"The two main parts of a basic complete sentence are a subject (who or what the sentence is about) and a predicate (what the subject does or is). Example: “The tree / grows beside the river.” “The tree” is the subject; “grows beside the river” is the predicate. Sentences may also include objects, complements, and modifiers."},
  {id:"sentence-structure",re:/\b(?:what is sentence structure|explain sentence structure|how (?:do|does) sentence structure work|sentence structure\??)\b/i,
   text:"Sentence structure is the way words, phrases, and clauses are arranged. A simple sentence has one independent clause: “The rain fell.” A compound sentence joins independent clauses: “The rain fell, and the flower opened.” A complex sentence includes a dependent clause: “When the rain fell, the flower opened.” Clear structure helps readers follow meaning."},
  {id:"poem-parts",re:/\b(?:parts of (?:a |the )?poem|poem (?:parts|structure)|elements of (?:a |the )?poem)\b/i,
   text:"Common parts and features of a poem include lines, stanzas (groups of lines), the speaker or poetic voice, imagery, rhythm, sound patterns, and sometimes rhyme and meter. Not every poem uses all of these. Think of a line as one row of words and a stanza as a group of lines."},
  {id:"short-story",re:/\b(?:what is a short story|what (?:makes|counts as) a short story|define short story)\b/i,
   text:"A short story is a brief work of narrative fiction, usually focused on a limited set of characters, a central situation or conflict, and a meaningful change. It often has a beginning, rising action, turning point, and ending, though writers can rearrange that structure."},
  {id:"essay",re:/\b(?:how (?:do|can|should) i write an? (?:essay|essy)|how to write an? (?:essay|essy)|write an? (?:essay|essy)|essay (?:structure|outline))\b/i,
   text:"To write an essay: 1) Choose a clear topic or question. 2) Write a thesis—the main point you will explain or defend. 3) Outline an introduction, body paragraphs, and conclusion. 4) Give each body paragraph one supporting idea with an example or evidence. 5) Explain how the evidence supports your thesis. 6) Revise for clarity, accuracy, and transitions. Example thesis: “Community gardens help neighborhoods by creating shared green spaces.”"},
  {id:"paragraph",re:/\b(?:how (?:do|can) i write a paragraph|how to write a paragraph|explain how to write a paragraph|paragraph structure)\b/i,
   text:"A clear paragraph often has a topic sentence, supporting details, and a concluding or transition sentence. Example: “Rain helps garden plants grow. It carries water into the soil and supports developing roots. After a shower, new flowers may open.” Each sentence serves the paragraph's central idea. Some creative paragraphs deliberately use a different structure."}
 ]);
 const patterns=Object.freeze(entries.reduce((m,e)=>(m[e.id]=e.re,m),{}));
 function ask(input){
   const q=normalize(input);if(!q)return null;
   // Find independent requests even when separated by periods and mixed together.
   // Specific "parts of a poem" and "definition of poetry" take precedence over
   // vague keyword handlers in the older conversation engine.
   const hits=entries.filter(e=>e.re.test(q)).slice(0,3);
   if(!hits.length)return null;
   return hits.map((e,i)=>(hits.length>1?String(i+1)+". ":"")+e.text).join("\n\n");
 }
 root.EirenLanguageArts=Object.freeze({version:"1.0.0",answer:ask,topics:Object.freeze(entries.map(e=>e.id)),modelConnected:false});
})(window);

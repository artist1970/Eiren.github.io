/* Eiren · direct conversational intentions v1
 * Deterministic, browser-local literary skills. Not a generative model.
 * A short visitor-approved session context supports poems and story followups.
 * No storage, network, private CORE access, grading or external authority.
 */
(function(root){"use strict";
 const text=x=>String(x??"").trim().slice(0,1200);
 const normal=x=>text(x).toLowerCase().replace(/[’]/g,"'");
 function createState(){
   return {lastActivity:"",poemSubject:"",characterMood:"",desiredEnding:"",storySubject:""};
 }
 function respond(message,session){
   const raw=text(message),q=normal(raw);
   if(!raw||!session||typeof session!=="object")return null;
   if(!session.creative||typeof session.creative!=="object")session.creative=createState();
   const c=session.creative;
   // Protected requests are always handled by the original conversation guard.
   if(/\b(?:password|passcode|exam answers|answer key|test answers|private records|secret token|locked assessment|hurt myself|suicide|immediate danger|emergency)\b/i.test(q))return null;

   // Everyday conversational intent must not be turned into a writing worksheet.
   if(/\b(?:how (?:are|r) you(?: doing)?|how'?s your day)\b/i.test(q)){
     return "I'm here and ready to explore ideas with you. Thank you for asking. How has your day been?";
   }
   if(/\b(?:how do you feel|are you (?:happy|sad|excited)|do you have feelings)\b/i.test(q)){
     return "I don't experience feelings as a person does, but I can listen carefully and respond thoughtfully. What's on your mind today?";
   }
   if(/\b(?:what would you (?:like|loke|love) to (?:work on|do)|what should we (?:work on|make|create))\b/i.test(q)){
     return "I'd enjoy helping you create something: a short poem, a story scene, or a handful of beautiful words. Or we could simply talk. What sounds interesting to you?";
   }

   // Direct requests get concrete results rather than a generic prompt.
   if(/\b(?:list|some|give me|suggest|show me|need|looking for)\b.{0,45}\b(?:verbs|action words)\b|\b(?:verbs|action words)\b.{0,36}\b(?:story|writing)\b/i.test(q)){
     c.lastActivity="story";
     return "Of course. Here are verbs you can use in a story:\n\n"+
       "Movement: wander, hurry, stumble, tiptoe, climb, drift.\n"+
       "Emotion and reaction: tremble, sigh, hesitate, smile, recoil, weep.\n"+
       "Discovery: notice, uncover, search, recognize, discover, wonder.\n"+
       "Dialogue and choices: whisper, confess, insist, promise, refuse, decide.\n\n"+
       "Try: “She hesitated at the gate, then stepped forward.” Do you want verbs for a sad, adventurous, or joyful scene?";
   }

   // A direct poem request should produce a poem. The visitor may then refine
   // it with an image on the next turn.
   if(/\b(?:can you|could you|will you|would you|please|i(?:'d| would) like you to)\b.{0,30}\b(?:write|make|create|compose|tell)\b.{0,20}\b(?:poem|verse)|\b(?:write|make|create) (?:me )?a poem\b/i.test(q)){
     c.lastActivity="poem";
     c.poemSubject=/\b(tree|forest|woods)\b/i.test(q)?"tree":
       /\b(flower|passionflower)\b/i.test(q)?"flower":"";
     if(c.poemSubject==="tree")
       return "Of course. Here is a little poem for you:\n\n"+
       "The tree stood tall beside the lane,\nIts leaves made music in the rain.\n"+
       "Beneath its shade, the world grew still,\nA quiet song upon the hill.\n\nWould you like to add your own line?";
     if(c.poemSubject==="flower")
       return "Of course. Here is a little poem for you:\n\n"+
       "A flower opened to the day,\nAnd sent its purple light my way.\n"+
       "One quiet bloom, a tender hour,\nThe world made brighter by a flower.\n\nWould you like to change a line?";
     return "Of course. I wrote this little poem for you:\n\n"+
       "A small thought landed like a seed,\nAnd found the quiet space it needs.\n"+
       "It stretched a leaf toward morning light,\nThen turned a passing day to bright.\n\n"+
       "Would you like to give it a subject—perhaps a tree, a flower, or a memory?";
   }
   if(/\b(?:the tree sees me|tree (?:see|sees|saw) me)\b/i.test(q)){
     c.lastActivity="poem";c.poemSubject="tree";
     return "“The tree sees me” is a lovely personification—giving the tree the power to notice you. Here is a little poem built around your line:\n\n"+
       "The tree sees me beneath the sky,\nIts branches wave as I pass by.\n"+
       "I stand where silver shadows play,\nAnd hear its leaves greet me today.\n\n"+
       "Would you like to keep your opening line and write the next one together?";
   }
   // Story continuity is limited to a small, explicitly visible creative task.
   if(/\b(?:my|the) character (?:is|feels|seems|was) (?:so )?(sad|lonely|upset|angry|afraid|happy|hopeful)\b/i.test(q)){
     const match=q.match(/\b(?:my|the) character (?:is|feels|seems|was) (?:so )?(sad|lonely|upset|angry|afraid|happy|hopeful)\b/i);
     c.characterMood=match?.[1]||"sad";c.lastActivity="story";
     return "Your character feels "+c.characterMood+". We can show that through what they do, rather than only telling the reader. "+
       "For example: “They watched the rain trace the window and held an unopened letter.” "+
       "What might help this character begin to feel understood?";
   }
   if(/\b(?:the |my )?ending (?:should|must|could|will) be (?:a )?(happy|hopeful|joyful)|\b(?:i want|give me|make) (?:a |the )?happy ending\b/i.test(q)){
     c.desiredEnding="happy";c.lastActivity="story";
     const mood=c.characterMood||"sad";
     return "A happy ending can grow naturally from a "+mood+" beginning. Here is a possible path:\n\n"+
       "At first, the character feels "+mood+" and withdraws from the world. "+
       "They find something small worth caring for, and someone notices their effort. "+
       "By the final scene, they take one brave step toward connection. "+
       "The problem may not vanish, but they have a friend and a reason to look toward tomorrow.\n\n"+
       "Would you like to write that final scene together?";
   }
   if(/^(?:yes|please|let'?s (?:do that|write it)|go on|continue)[.!?\s]*$/i.test(q)&&c.lastActivity==="story"&&c.desiredEnding==="happy"){
     return "Here is a gentle ending you could build on:\n\n"+
       "They opened the door to find a friend waiting on the steps. "+
       "For the first time in days, a small smile found its way back. "+
       "Nothing had to be perfect for the morning to feel possible again.\n\n"+
       "Would you like the ending to be more surprising, funny, or peaceful?";
   }
   return null;
 }
 root.EirenConversationSkills=Object.freeze({version:"1.0.0",createState,respond,modelConnected:false});
})(window);

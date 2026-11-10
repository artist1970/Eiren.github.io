import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const mentorIds={
 'naib':'id="naib-chat"',
 'aurora':'id="aurora-chat"',
 'moirai':'id="moirai-chat"',
 'archaemenes':'id="archaemenesConversation"',
 'klasaipeer':'id="klasaipeer-chat"',
 'eiren':'id="eirenConversation"',
 'zelle':'id="zelle-conversation"',
 'hope':'id="hope"',
 'auren':'id="talk"'
};
const matches=[...html.matchAll(/<script src="https:\/\/artist1970\.github\.io\/creative-spark\.github\.io\/language-laboratory\/releases\/mentor-language-hub-1\.1\.0\.js" data-mentor-id="([^"]+)" integrity="sha384-tffr3ORg9vR5OKqEW7qIdWpsK8H0p\/a3KqN8neiYfAsBWKkAohWh2mG\/1zneU3Uk" crossorigin="anonymous" referrerpolicy="no-referrer" defer><\/script>/g)];
test('one shared public language hub is mounted to the correct mentor',()=>{
 assert.equal(matches.length,1);
 assert.ok(Object.hasOwn(mentorIds,matches[0][1]));
 assert.ok(html.includes(mentorIds[matches[0][1]]),'chat mount element is missing');
});
test('shared script uses only fixed public origin and no private AIPCore URL',()=>{
 assert.doesNotMatch(matches[0][0],/github\.com\/artist1970\/AIPCore|token|password|learner/);
 assert.match(matches[0][0],/https:\/\/artist1970\.github\.io\//);
});
test('existing mentor chat and voice controls remain present',()=>{
 const id=matches[0][1];
 const markers={
 naib:['naib-conversation','mentor-chat-voice-v1.js'],
 aurora:['aurora-message','mentor-chat-voice-v1.js'],
 moirai:['moirai-message','mentor-chat-voice-v1.js'],
 archaemenes:['archaemenes-chat-input','mentor-voice-addon-v1.js'],
 klasaipeer:['klasaipeer-chat-log','mentor-voice-addon-v1.js'],
 eiren:['eirenMessages','eiren-voice-picker-v1.js'],
 zelle:['zelle-conversation','zelle-voice.js'],
 hope:['hope-clear','hope-voice-v1.js'],
 auren:['voice-select','auren-voice-parity-v1.js']
 };
 for(const marker of markers[id])assert.ok(html.includes(marker),'existing capability absent: '+marker);
});

test('external executable is frozen and hash-verified before execution',()=>{
 assert.equal(matches.length,1);
 assert.match(matches[0][0],/\/releases\/mentor-language-hub-1\.1\.0\.js/);
 assert.match(matches[0][0],/integrity="sha384-/);
 assert.match(matches[0][0],/crossorigin="anonymous"/);
});

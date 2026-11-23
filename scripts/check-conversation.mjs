import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,cpSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {nextConversationStep} from './conversation.mjs';
import {initialState,ensureVideo,saveState,loadState} from './studio-state.mjs';
import {defaultProject,writeProject,fileHash,renderVideo,runEditor} from './editor.mjs';
const s=initialState(),p=defaultProject();assert.equal(nextConversationStep(s,p).stage,'setup');
s.setup.complete=true;assert.equal(nextConversationStep(s,p).stage,'materials');
s.onboarding={materials:'skip'};assert.equal(nextConversationStep(s,p).stage,'references');
assert(!/display name|audience|tone/.test(nextConversationStep(s,p).question));
s.onboarding.references='skip';assert.equal(nextConversationStep(s,p).stage,'style');
s.brand={status:'complete',evidence:'fixture approval'};s.style={status:'complete'};
assert.equal(nextConversationStep(s,p).stage,'footage');assert(nextConversationStep(s,p).question.includes('Attach'));
const cwd=process.cwd(),root=mkdtempSync(resolve(tmpdir(),'studio-conversation-'));
mkdirSync(resolve(root,'docs/briefs'),{recursive:true});cpSync('docs/briefs/TEMPLATE.md',resolve(root,'docs/briefs/TEMPLATE.md'));mkdirSync(resolve(root,'src'));cpSync('src',resolve(root,'src'),{recursive:true});mkdirSync(resolve(root,'public/audio/starter-pack'),{recursive:true});writeFileSync(resolve(root,'public/audio/starter-pack/catalogue.json'),'{"assets":[]}');
try{
 process.chdir(root);ensureVideo(root,s,'first-video');const source='videos/first-video/footage/fixture.mp4';writeFileSync(resolve('public',source),'fixture bytes');
 p.videos['first-video']={id:'first-video',source,sourceSha256:fileHash(resolve('public',source)),width:360,height:640,fps:30,durationFrames:90,inSeconds:0,title:'',effects:[],graphics:[],sounds:[],captions:false,words:[]};writeProject(p);saveState(root,s);
 assert.equal(nextConversationStep(s,p).stage,'edit-brief');
 await assert.rejects(()=>renderVideo('first-video'),/Before the first draft/);
 const answer={instructions:'Use sensible defaults; keep voice clear.',hook:'A better opening',targetSeconds:3};writeFileSync('answer.json',JSON.stringify(answer));
 await runEditor('brief',['first-video','--file','answer.json']);const saved=loadState(root);assert.deepEqual(saved.videos['first-video'].editBrief,answer);assert.deepEqual(saved.brand,s.brand);
 assert.equal(nextConversationStep(saved,p).stage,'edit');saved.videos['first-video'].draftRevision=saved.videos['first-video'].revision;assert.equal(nextConversationStep(saved,p).stage,'draft-review');
 writeFileSync('answer.json','{"hook":"No answer to editing request"}');await assert.rejects(()=>runEditor('brief',['first-video','--file','answer.json']),/actual editing request/);
 console.log('Conversation checks passed: separate materials/references, no required identity questionnaire, post-approval footage invitation, optional edit-brief fields, first-draft guard, saved answers, resume/review and prior approval preservation. Host pop-up presentation is not simulated.');
}finally{process.chdir(cwd);}

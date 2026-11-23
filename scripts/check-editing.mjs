import assert from 'node:assert/strict';
import {captionWordColor,validateCaptionAppearance} from '../src/lib/caption-appearance.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {initialState,ensureVideo,revise} from './studio-state.mjs';
import {defaultProject,digest,fileHash,fingerprint,assertExportApproval,validateVideo,videoMetadata} from './editor.mjs';
import {validateTranscript,groupWords,activeGroup,frameBounds,activeWord} from '../src/lib/timing.mjs';
import {convertEngine} from './transcribe.mjs';
const words=[{text:'One',start:1,end:1.2},{text:'two.',start:1.2,end:1.5},{text:'two',start:2,end:2.2},{text:'again.',start:2.2,end:2.5}];
assert(validateTranscript({schemaVersion:1,words},3).valid);assert(!validateTranscript({schemaVersion:1,words:[{text:'bad',start:3,end:4}]},3).valid);
assert(!validateTranscript({schemaVersion:1,words:[{text:'bad',start:1,end:1}]},3).valid);assert(!validateTranscript({schemaVersion:1,words:[{text:'bad',start:NaN,end:2}]},3).valid);
const groups=groupWords(words);assert.deepEqual(groups.flat(),words);assert.equal(new Set(groups.flat()).size,4);
for(const f of [0,29,45,59,75,90])assert.equal(activeGroup(groups,f,30),null);
assert.equal(activeGroup(groups,30,30),groups[0]);assert.equal(activeGroup(groups,60,30),groups[1]);assert(activeWord(words[1],36,30));assert(!activeWord(words[0],36,30));
assert.deepEqual(frameBounds(10.83,10.84,30),[325,326]);
assert(activeGroup(groupWords([{text:'Zero',start:0,end:.2}]),0,30));
const fakeVideo={source:'videos/test/footage/a.mp4',sourceSha256:'fixture',inSeconds:2,durationFrames:90,fps:30};
const engine={result:{language:'en'},transcription:[{text:' Hello',offsets:{from:200,to:700}}]};const converted=convertEngine(engine,fakeVideo);assert.equal(converted.words[0].start,.2);assert.equal(converted.sectionStart,2);assert.equal(converted.words[0].end,.7);
assert.deepEqual(videoMetadata({format:{duration:'10'},streams:[{codec_type:'video',width:3840,height:2160,duration:'10'}]},1,3),{width:1920,height:1080,fps:30,durationFrames:90,inSeconds:1});
const cwd=process.cwd(),root=mkdtempSync(resolve(tmpdir(),'studio-editing-'));cpSync('src',resolve(root,'src'),{recursive:true});mkdirSync(resolve(root,'docs/briefs'),{recursive:true});writeFileSync(resolve(root,'docs/briefs/TEMPLATE.md'),'# <video-id>');mkdirSync(resolve(root,'public/audio/starter-pack'),{recursive:true});writeFileSync(resolve(root,'public/audio/starter-pack/catalogue.json'),'{"assets":[]}');
try{
 process.chdir(root);const s=initialState(),p=defaultProject();ensureVideo(root,s,'test');const source='videos/test/footage/a.mp4';writeFileSync(resolve('public',source),'synthetic fixture bytes');
 const v={id:'test',source,sourceSha256:fileHash(resolve('public',source)),inSeconds:0,durationFrames:90,fps:30,width:360,height:640,title:'Title',titleSize:.065,captions:false,highlight:false,words:[],effects:[],graphics:[],sounds:[]};p.videos.test=v;
 validateVideo(v);assert.throws(()=>assertExportApproval(p,s,v),/brand/);s.brand={status:'complete',previewHash:digest(p.brand),evidence:'fixture'};s.style={status:'complete'};assert.throws(()=>assertExportApproval(p,s,v),/not approved/);
 s.videos.test.approvedRevision=1;s.videos.test.approvalNote='fixture';s.videos.test.approvedFingerprint=fingerprint(p,v);assert.doesNotThrow(()=>assertExportApproval(p,s,v));
 v.title='Changed title';assert.throws(()=>assertExportApproval(p,s,v),/changed/);v.title='Title';revise(s,'test');assert.throws(()=>assertExportApproval(p,s,v),/not approved/);
 v.sounds=[{id:'unapproved',filename:'private.mp3',start:0,volume:.1}];assert.throws(()=>validateVideo(v),/not a verified/);v.sounds=[];
 writeFileSync(resolve('public',source),'changed source');assert.throws(()=>validateVideo(v),/Source changed/);
}finally{process.chdir(cwd);}
console.log('Editing checks passed: silence/zero onset/pauses/adjacent words/repetition/short frame boundaries, one-time grouping, raw millisecond conversion, metadata fitting, content+file-bound export approval, invalidation and sound gate. Synthetic checks do not establish speech alignment.');

const appearance={textColor:'#FFFFFF',highlightColor:'#0F5C4C',backing:'none',highlightWords:['clear']};
assert.doesNotThrow(()=>validateCaptionAppearance(appearance));
assert.equal(captionWordColor('clear.',true,true,appearance,'#F97316'),'#0F5C4C');
assert.equal(captionWordColor('other',true,true,appearance,'#F97316'),'#FFFFFF');
assert.equal(captionWordColor('clear.',false,true,appearance,'#F97316'),'#FFFFFF');
assert.equal(captionWordColor('clear.',true,false,appearance,'#F97316'),'#FFFFFF');
assert.throws(()=>validateCaptionAppearance({...appearance,backing:'invalid'}));
assert.throws(()=>validateCaptionAppearance({...appearance,highlightColor:'green'}));
console.log('Caption appearance checks passed: selected-word colour, punctuation normalization, inactive/unselected white text and invalid-config rejection.');

const shortPhrases=[{text:'with a point',start:.2,end:.99},{text:'you like.',start:.99,end:1}];const beforePhrases=JSON.stringify(shortPhrases),phraseGroups=groupWords(shortPhrases,4,.35,30);assert.deepEqual(phraseGroups.flat(),shortPhrases);assert.equal(phraseGroups.length,1);assert.equal(activeGroup(phraseGroups,29,30),phraseGroups[0]);assert.equal(activeGroup(phraseGroups,30,30),null);assert.equal(JSON.stringify(shortPhrases),beforePhrases);

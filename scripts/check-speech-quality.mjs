import assert from 'node:assert/strict';
import {layoutCaptions} from '../src/lib/caption-layout.mjs';
import {requireAlignedSpeech,checkCutBoundaries,CTC_MODEL_SHA} from '../src/lib/speech-quality.mjs';
import {mkdtempSync,mkdirSync,cpSync,writeFileSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {resolve} from 'node:path';
import {defaultProject,writeProject,fileHash,renderVideo} from './editor.mjs';
import {initialState,ensureVideo,saveState} from './studio-state.mjs';import {applyCleanup} from './cleanup.mjs';import {prepareSpeech} from './prepare-speech.mjs';
const words=[{text:'One',start:.4,end:.6},{text:'complete',start:.7,end:1},{text:'sentence.',start:1.1,end:1.4},{text:'Another',start:2.4,end:2.7},{text:'full',start:2.8,end:3},{text:'take.',start:3.1,end:3.4}].map(w=>({...w,alignmentConfidence:.9}));
const data={schemaVersion:1,sourceSha256:'fixture',words,alignment:{algorithm:'ctc-viterbi',sourceSha256:'fixture',wavSha256:'fixture',modelSha256:CTC_MODEL_SHA}};
assert.doesNotThrow(()=>requireAlignedSpeech(data,4));
assert.throws(()=>requireAlignedSpeech({...data,alignment:undefined},4),/alignment required/);
assert.throws(()=>requireAlignedSpeech({...data,words:[{text:'One complete phrase.',start:0,end:1,alignmentConfidence:.9}]},4),/Individual acoustic/);
assert.throws(()=>checkCutBoundaries(data,[{startFrame:0,endFrame:39}],120),/intersects/);
assert.throws(()=>checkCutBoundaries(data,[{startFrame:0,endFrame:43}],120),/too close/);
const partial=structuredClone(data);partial.words[2].start=1.5;partial.words[2].end=1.8;assert.throws(()=>checkCutBoundaries(partial,[{startFrame:0,endFrame:37}],120),/mid-thought/);
assert.throws(()=>checkCutBoundaries(data,[{startFrame:69,endFrame:120}],120),/too close/);
assert.doesNotThrow(()=>checkCutBoundaries(data,[{startFrame:0,endFrame:48},{startFrame:63,endFrame:120}],120));
const low=structuredClone(data);low.words[2].alignmentConfidence=.01;assert.throws(()=>checkCutBoundaries(low,[{startFrame:0,endFrame:48}],120),/Low-confidence/);
// Deliberately bounded fake font metrics, for word assignment/layout invariants only.
const before=JSON.stringify(words),groups=layoutCaptions(words,{maxWords:3,maxLines:1,maxWidth:115,fontSize:24},text=>text.length*10);
assert.deepEqual(groups.flatMap(g=>g.words),words);assert(groups.every(g=>g.fontSize===24&&g.lines.length===1));assert.equal(JSON.stringify(words),before);
assert(groups.every(g=>g.lines.every(l=>l.map(w=>w.text).join(' ').length*10<=115)));
assert.throws(()=>layoutCaptions([{text:'impossiblylongword',start:0,end:1}],{maxWords:3,maxLines:1,maxWidth:20,fontSize:24},text=>text.length*10),/does not fit/);
const visible=(frame)=>groups.filter(g=>frame>=Math.ceil(g.words[0].start*30)&&frame<Math.ceil(g.words.at(-1).end*30));
assert.equal(visible(0).length,0);for(let f=0;f<120;f++)assert(visible(f).length<=1);assert.equal(visible(60).length,0);
const joinWords=[{text:'last',start:0,end:.2},{text:'new',start:.3,end:.5,cutBefore:true}];assert.equal(layoutCaptions(joinWords,{maxWords:4,maxLines:1,maxWidth:300,fontSize:24},t=>t.length*10).length,2,'captions cannot carry previous words across a cut even with a short gap');
// Exercise real command entry points before any renderer, encoder or download can start.
const cwd=process.cwd(),root=mkdtempSync(resolve(tmpdir(),'speech-quality-command-'));mkdirSync(resolve(root,'src'));mkdirSync(resolve(root,'docs/briefs'),{recursive:true});cpSync('docs/briefs/TEMPLATE.md',resolve(root,'docs/briefs/TEMPLATE.md'));mkdirSync(resolve(root,'public/audio/starter-pack'),{recursive:true});writeFileSync(resolve(root,'public/audio/starter-pack/catalogue.json'),'{"assets":[]}');
try{
 process.chdir(root);const s=initialState(),p=defaultProject();ensureVideo(root,s,'fixture');s.videos.fixture.editBrief={instructions:'Fixture request'};saveState(root,s);
 const source='videos/fixture/footage/fixture.mov';writeFileSync(resolve('public',source),'deliberately not real media; guards must stop before ffprobe/encoding');const sha=fileHash(resolve('public',source)),transcriptFile='videos/fixture/generated/raw.json';
 const raw={...data,sourceSha256:sha,sectionStart:0,durationSeconds:4,alignment:undefined};writeFileSync(resolve('public',transcriptFile),JSON.stringify(raw));
 p.videos.fixture={id:'fixture',source,sourceSha256:sha,inSeconds:0,durationFrames:120,fps:30,width:320,height:568,title:'',titleSize:.06,captions:true,highlight:false,words:raw.words,transcriptFile,effects:[],graphics:[],sounds:[]};writeProject(p);
 await assert.rejects(()=>renderVideo('fixture'),/alignment required/);assert(!existsSync('out'),'render must reject before creating outputs');
 const plan='videos/fixture/generated/plan.json';writeFileSync(resolve('public',plan),JSON.stringify({schemaVersion:1,sourceSha256:sha,transcriptSha256:fileHash(resolve('public',transcriptFile)),sectionStart:0,sourceDurationFrames:120,fps:30,cuts:[{startFrame:48,endFrame:63,reason:'fixture'}]}));
 assert.throws(()=>applyCleanup('fixture',plan),/alignment required/);assert(!existsSync('public/videos/fixture/generated/cleanup'),'cleanup must reject before media generation');
 const aligned={...raw,alignment:{...data.alignment,sourceSha256:sha}};writeFileSync(resolve('public',transcriptFile),JSON.stringify(aligned));
 const resumed=await prepareSpeech('fixture');assert.equal(resumed.reused,true);assert(!existsSync('.local/transcription'),'valid prepared speech resumes without downloads');
}finally{process.chdir(cwd);}
console.log('Speech quality checks passed: unaligned/phrase fallback rejected, clipped/tight/incomplete/low-confidence cut boundaries rejected; fixed caption font, width-aware groups, no duplicate assignment/overlap or pre-speech captions. Acoustic/listening accuracy is not established by fixtures.');

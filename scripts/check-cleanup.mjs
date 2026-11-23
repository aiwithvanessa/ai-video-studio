import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {keepRangesFromCuts,mapKeptWords,proposeRetakeCuts} from '../src/lib/cleanup.mjs';
import {initialState,ensureVideo,saveState,loadState} from './studio-state.mjs';
import {defaultProject,writeProject,readProject,fileHash,run,probe,validateVideo} from './editor.mjs';
import {analyzeCleanup,applyCleanup,restoreCleanup} from './cleanup.mjs';
import {CTC_MODEL_SHA} from '../src/lib/speech-quality.mjs';
const words=[['This',.2,.4],['is',.5,.7],['the',.8,1],['This',2.2,2.4],['is',2.5,2.7],['the',2.8,3],['good',3.1,3.3],['take.',3.4,3.8],['Another',5.6,5.8],['point',5.9,6.1],['stays.',6.2,6.7]].map(([text,start,end])=>({text,start,end}));
const transcript={schemaVersion:1,words};const proposed=proposeRetakeCuts(transcript,210);assert.equal(proposed.cuts.length,1);assert.deepEqual([proposed.cuts[0].startFrame,proposed.cuts[0].endFrame],[0,48]);
const kept=keepRangesFromCuts(proposed.cuts,210),mapped=mapKeptWords(transcript,kept);assert.deepEqual(mapped.removedWordIndices,[0,1,2]);assert.equal(mapped.words[0].text,'This');assert(Math.abs(mapped.words[0].start-.6)<1e-8);assert.equal(mapped.durationFrames,162);assert.equal(mapped.words.at(-1).text,'stays.');
const deliberate=structuredClone(transcript);deliberate.words[2].text='the.';assert.equal(proposeRetakeCuts(deliberate,210).cuts.length,0,'Complete repeated sentence is not automatically a bad take');
assert.equal(proposeRetakeCuts({schemaVersion:1,words:[{text:'Really',start:0,end:.2},{text:'really.',start:.3,end:.5}]},30).cuts.length,0);
assert.throws(()=>mapKeptWords({words:[{text:'split',start:.9,end:1.1}]},keepRangesFromCuts([{startFrame:30,endFrame:60,reason:'fixture'}],90)),/crosses/);
assert.throws(()=>keepRangesFromCuts([{startFrame:0,endFrame:90,reason:'all'}],90),/entire/);assert.throws(()=>keepRangesFromCuts([{startFrame:20,endFrame:40,reason:'a'},{startFrame:30,endFrame:50,reason:'b'}],90));
const cwd=process.cwd(),root=mkdtempSync(resolve(tmpdir(),'studio-cleanup-'));for(const dir of ['src','docs/briefs'])cpSync(dir,resolve(root,dir),{recursive:true});mkdirSync(resolve(root,'public/audio/starter-pack'),{recursive:true});writeFileSync(resolve(root,'public/audio/starter-pack/catalogue.json'),'{"assets":[]}');
try{
 process.chdir(root);const s=initialState(),p=defaultProject();ensureVideo(root,s,'fixture');const asset='videos/fixture/footage/source.mov',source=resolve('public',asset);
 run('ffmpeg',['-v','error','-n','-f','lavfi','-i','testsrc2=s=320x568:r=30:d=8','-f','lavfi','-i','aevalsrc=if(between(t\\,3\\,3.1)\\,0.5*sin(2*PI*1000*t)\\,0):s=48000:d=8','-c:v','libx264','-preset','ultrafast','-threads','1','-pix_fmt','yuv420p','-c:a','pcm_s16le','-ac','2',source]);
 const originalHash=fileHash(source),transcriptFile='videos/fixture/generated/source-transcript.json';
 // Simulated alignment metadata for this known-signal integration fixture, not actual speech/model evidence.
 writeFileSync(resolve('public',transcriptFile),JSON.stringify({...transcript,words:words.map(w=>({...w,alignmentConfidence:.99})),source:asset,sourceSha256:originalHash,sectionStart:1,durationSeconds:7,alignment:{algorithm:'ctc-viterbi',sourceSha256:originalHash,modelSha256:CTC_MODEL_SHA,wavSha256:originalHash}}));
 p.videos.fixture={id:'fixture',source:asset,sourceSha256:originalHash,inSeconds:1,durationFrames:210,fps:30,width:320,height:568,title:'',titleSize:.065,captions:true,highlight:false,words,effects:[],graphics:[],sounds:[],transcriptFile};writeProject(p);s.videos.fixture.approvedRevision=1;s.videos.fixture.approvalNote='fixture old approval';saveState(root,s);
 const plan=analyzeCleanup('fixture');applyCleanup('fixture',plan);const v=readProject().videos.fixture;validateVideo(v);assert.equal(v.durationFrames,162);assert.equal(v.words.length,8);assert.equal(fileHash(source),originalHash);assert.equal(loadState(root).videos.fixture.approvedRevision,null);assert.equal(probe(resolve('public',v.cleanup.editedSource)).streams.find(s=>s.codec_type==='video').nb_frames,'162');
 const audio=spawnSync('ffmpeg',['-v','error','-i',resolve('public',v.cleanup.editedSource),'-map','0:a:0','-ac','1','-ar','48000','-f','f32le','-'],{maxBuffer:10000000});assert.equal(audio.status,0,audio.stderr.toString());let onset=-1;for(let i=0;i<audio.stdout.length/4;i++)if(Math.abs(audio.stdout.readFloatLE(i*4))>.1){onset=i/48000;break;}assert(Math.abs(onset-.4)<.03,'Audio pulse mapping differed: '+onset);
 const changed=JSON.parse(readFileSync(resolve('public',plan)));changed.cuts[0].reason='Changed after application';writeFileSync(resolve('public',plan),JSON.stringify(changed));assert.throws(()=>validateVideo(v),/changed/);
 restoreCleanup('fixture');assert.equal(readProject().videos.fixture.durationFrames,210);assert.deepEqual(readProject().videos.fixture.words,words.map(w=>({...w,alignmentConfidence:.99})));assert.equal(fileHash(source),originalHash);
 console.log(JSON.stringify({result:'Cleanup checks passed',scope:'Synthetic known words/times and test-pattern audio/video; no speech recognition/listening claim',sourceSeconds:8,sectionStart:1,editedFrames:162,audioPulseExpected:.4,audioPulseMeasured:onset,checked:['conservative restart detection','intentional repetition retained','word-boundary rejection','caption remapping','actual FFmpeg cut/concat','source preservation','approval invalidation','plan tamper rejection','restore original']},null,2));
}finally{process.chdir(cwd);}

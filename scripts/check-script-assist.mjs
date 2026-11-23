import assert from 'node:assert/strict';
import {compareScript,repeatedPassages} from '../src/lib/script-assist.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {importScript,analyzeScript} from './script-assist.mjs';
import {initialState,ensureVideo,saveState,loadState} from './studio-state.mjs';
import {writeProject,fileHash} from './editor.mjs';
// Synthetic intervals only: tests text selection aids, not acoustic alignment.
const words=['Open Codex and create a new project folder.','Now choose a name.','Open Codex and create a new project folder.','Then add your video.','Create a fresh folder inside Codex.'].map((text,i)=>({text,start:i*5,end:i*5+4}));
const transcript={words},before=JSON.stringify(transcript);
const report=compareScript('Open Codex and create a new project folder.\nAdd your clip.',transcript);
assert.equal(report[0].candidates.filter(c=>c.lexicalSimilarity===1).length,2,'both complete retakes must be visible');
assert(repeatedPassages(transcript).some(x=>x.text.includes('open codex and create a new')));
assert.equal(JSON.stringify(transcript),before,'comparison cannot replace text or timing');
assert.equal(compareScript('Launch the application.',{words:[{text:'Open Codex.',start:0,end:2}]})[0].status,'no-lexical-match-review-paraphrases','semantic paraphrase stays unresolved, not silently omitted');
assert.equal(compareScript('Say it again.',{words:[{text:'Say it again.',start:0,end:2},{text:'Say it again.',start:3,end:5}]})[0].candidates.length,2,'actual repetition is not deleted');
assert.throws(()=>compareScript('   ',transcript),/nonempty/);
const cwd=process.cwd(),root=mkdtempSync(resolve(tmpdir(),'script-assist-check-'));
mkdirSync(resolve(root,'docs/briefs'),{recursive:true});cpSync('docs/briefs/TEMPLATE.md',resolve(root,'docs/briefs/TEMPLATE.md'));mkdirSync(resolve(root,'src'));
try{
 process.chdir(root);const s=initialState();ensureVideo(root,s,'fixture');s.videos.fixture.approvedRevision=1;saveState(root,s);
 const asset='videos/fixture/source-transcript.json',data={schemaVersion:1,sourceSha256:'fixture-hash',sectionStart:0,durationSeconds:25,words};
 writeFileSync(resolve('public',asset),JSON.stringify(data));const rawHash=fileHash(resolve('public',asset));
 writeProject({brand:{},videos:{fixture:{id:'fixture',sourceSha256:'fixture-hash',inSeconds:0,durationFrames:750,fps:30,transcriptFile:asset}}});
 writeFileSync('script.txt','Open Codex and create a new project folder.');const original=fileHash('script.txt'),first=importScript('fixture','script.txt');
 assert.equal(fileHash(resolve('public',first)),original);assert.equal(fileHash('script.txt'),original);assert.equal(loadState(root).videos.fixture.approvedRevision,null);
 const revision=loadState(root).videos.fixture.revision;importScript('fixture','script.txt');assert.equal(loadState(root).videos.fixture.revision,revision,'same script resumes without new revision');
 const analyzed=analyzeScript('fixture');assert.equal(analyzed.changesApplied,false);assert.equal(fileHash(resolve('public',asset)),rawHash);
 writeFileSync('script.txt','Then add your video.');const second=importScript('fixture','script.txt');assert.notEqual(first,second);assert.equal(fileHash(resolve('public',first)),original,'previous script preserved');
 const p=JSON.parse(readFileSync('src/studio.json'));p.videos.fixture.sourceSha256='different';writeProject(p);assert.throws(()=>analyzeScript('fixture'),/does not match/);
}finally{process.chdir(cwd);}
console.log('Script comparison checks passed: non-adjacent complete repeats, distinct paraphrase review, intentional repetition retained, no wording/timing mutation. Semantic equivalence and speech timing remain unverified.');

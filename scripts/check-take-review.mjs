import assert from 'node:assert/strict';
import {takeReviewContext,assertTakeReview} from '../src/lib/take-review.mjs';
const words=(text,start=0)=>text.split(' ').map((text,i)=>({text,start:start+i*.3,end:start+i*.3+.2}));
const a=words('Open the project and test every tool.'),b=words('A separate unique point stays here.',3),c=words('Open the project and test every tool.',6);
const context=t=>takeReviewContext(t,{sourceSha256:'source',transcriptSha256:'transcript',scriptSha256:'script',cleanupRequested:true});
const ctx=context({words:[...a,...b,...c]});assert(ctx.candidates.length>0);
assert.throws(()=>assertTakeReview(ctx),/Take review required/);
const review={...ctx,fullTranscriptReviewed:true,coverageNote:'All unique points and complete sentences reviewed.',listening:'not-assessed',decisions:ctx.candidates.map(c=>({id:c.id,action:'retain-intentional',reason:'Intentional recap after the distinct explanatory section.'}))};
assert.doesNotThrow(()=>assertTakeReview(ctx,review));
assert.throws(()=>assertTakeReview(ctx,{...review,decisions:[]}),/every residual/);
assert.throws(()=>assertTakeReview(ctx,{...review,transcriptSha256:'changed'}),/stale/);
assert.throws(()=>assertTakeReview(ctx,{...review,scriptSha256:'changed'}),/stale/);
assert.throws(()=>assertTakeReview(ctx,{...review,fullTranscriptReviewed:false}),/entire retained/);
assert.throws(()=>assertTakeReview(ctx,{...review,decisions:review.decisions.map(d=>({...d,action:'remove'}))}),/guarded cleanup/);
const kept=context({words:[...b,...c]});assert.equal(kept.candidates.length,0);assert.throws(()=>assertTakeReview(kept),/Take review required/);
assert.doesNotThrow(()=>assertTakeReview(kept,{...kept,fullTranscriptReviewed:true,coverageNote:'One complete take per point, no known unique points lost.',listening:'not-assessed',decisions:[]}));
assert.doesNotThrow(()=>assertTakeReview(takeReviewContext({words:words('Really really. Yes yes.')},{cleanupRequested:false})));
// Exercise the actual render entry before any encoder can run.
import {mkdtempSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';import {resolve} from 'node:path';import {tmpdir} from 'node:os';
import {defaultProject,writeProject,fileHash,renderVideo} from './editor.mjs';import {initialState,ensureVideo,saveState} from './studio-state.mjs';
const cwd=process.cwd(),root=mkdtempSync(resolve(tmpdir(),'take-review-'));mkdirSync(resolve(root,'src'));mkdirSync(resolve(root,'docs/briefs'),{recursive:true});writeFileSync(resolve(root,'docs/briefs/TEMPLATE.md'),'fixture');
try{process.chdir(root);mkdirSync('public/audio/starter-pack',{recursive:true});writeFileSync('public/audio/starter-pack/catalogue.json','{"assets":[]}');const p=defaultProject(),s=initialState();ensureVideo(root,s,'fixture');s.videos.fixture.editBrief={instructions:'Remove bad takes',cleanup:true};saveState(root,s);
const source='videos/fixture/footage/source.mov';writeFileSync(resolve('public',source),'fake media; renderer must never start');const sourceSha256=fileHash(resolve('public',source)),file='videos/fixture/generated/transcript.json';const t={schemaVersion:1,sourceSha256,sectionStart:0,durationSeconds:10,words:[...a,...b,...c]};writeFileSync(resolve('public',file),JSON.stringify(t));
p.videos.fixture={id:'fixture',source,sourceSha256,inSeconds:0,durationFrames:300,fps:30,width:320,height:568,title:'',titleSize:.06,captions:false,highlight:false,words:t.words,transcriptFile:file,effects:[],graphics:[],sounds:[]};writeProject(p);
await assert.rejects(()=>renderVideo('fixture'),/Take review required/);assert(!existsSync('out'));
}finally{process.chdir(cwd);}
console.log('Take-review checks passed: nonadjacent complete repeats block actual rendering, intentional repeats can be justified, cleanup needs full coverage review, stale hashes/partial decisions rejected. No acoustic or semantic-quality claim.');

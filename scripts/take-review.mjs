import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';import {resolve} from 'node:path';
import {readProject,localAsset,fileHash,writeProject} from './editor.mjs';
import {loadState,saveState,revise} from './studio-state.mjs';
import {takeReviewContext,assertTakeReview} from '../src/lib/take-review.mjs';
export function reviewContext(v,state){
 if(!v.transcriptFile)throw Error('A full-section transcript is required for take review');
 const file=localAsset(v.transcriptFile,`videos/${v.id}`),transcript=JSON.parse(readFileSync(file));
 const script=state.videos[v.id]?.script;let scriptSha256=null;
 if(script){scriptSha256=fileHash(localAsset(script.asset,`videos/${v.id}`));if(scriptSha256!==script.sha256)throw Error('Script changed; reimport it before reviewing takes');}
 return takeReviewContext(transcript,{sourceSha256:v.sourceSha256,transcriptSha256:fileHash(file),scriptSha256,cleanupRequested:state.videos[v.id]?.editBrief?.cleanup===true});
}
export function requireTakeReview(v,state){
 if(!v.transcriptFile){if(state.videos[v.id]?.editBrief?.cleanup)throw Error('Prepare speech and review takes before rendering requested cleanup');return;}
 const context=reviewContext(v,state);let review;
 if(v.takeReviewFile){const file=localAsset(v.takeReviewFile,`videos/${v.id}`);if(fileHash(file)!==v.takeReviewSha256)throw Error('Take-review file changed; reimport review');review=JSON.parse(readFileSync(file));}
 assertTakeReview(context,review);
}
export function takeReview(id,input){
 const p=readProject(),v=p.videos[id],state=loadState(process.cwd());if(!v)throw Error('Unknown video');const context=reviewContext(v,state),folder=`videos/${id}/generated/cleanup`;mkdirSync(resolve('public',folder),{recursive:true});
 const asset=folder+'/take-review-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
 if(!input){writeFileSync(resolve('public',asset),JSON.stringify({...context,fullTranscriptReviewed:false,coverageNote:'',listening:'not-assessed',decisions:context.candidates.map(c=>({id:c.id,action:'pending',reason:''}))},null,2));console.log(JSON.stringify({template:asset,repeatedPassages:context.candidates.length,next:'Agent: assess complete takes, apply guarded cuts before overlays, re-audit retained speech, then import decisions with --file. Never ask the beginner to edit JSON.'},null,2));return asset;}
 const review=JSON.parse(readFileSync(localAsset(input,`videos/${id}`)));assertTakeReview(context,review);
 writeFileSync(resolve('public',asset),JSON.stringify(review,null,2));v.takeReviewFile=asset;v.takeReviewSha256=fileHash(resolve('public',asset));writeProject(p);revise(state,id);saveState(process.cwd(),state);appendFileSync(`docs/briefs/${id}.local.md`,`\nTake review: ${asset}; ${review.coverageNote}; listening: ${review.listening}. Not final approval.\n`);console.log('Bound take review saved; final approval cleared.');return asset;
}

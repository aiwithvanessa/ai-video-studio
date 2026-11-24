// Repetition candidates require decisions, never automatic deletion or text replacement.
import {createHash} from 'node:crypto';
import {repeatedPassages} from './script-assist.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function takeReviewContext(transcript,{sourceSha256,transcriptSha256,scriptSha256=null,cleanupRequested=false}){
 const candidates=repeatedPassages(transcript).map(c=>({...c,id:hash(c)}));
 return {schemaVersion:1,sourceSha256,transcriptSha256,scriptSha256,cleanupRequested,candidates};
}
export function assertTakeReview(context,review){
 if(!context.cleanupRequested&&!context.candidates.length)return;
 if(!review)throw Error('Take review required before rendering: run studio take-review, resolve repeated takes, and record a full retained-transcript review. Do not render an uncut fallback silently.');
 for(const key of ['schemaVersion','sourceSha256','transcriptSha256','scriptSha256','cleanupRequested'])if(review[key]!==context[key])throw Error('Take review is stale; source, transcript, script or cleanup intent changed');
 if(review.fullTranscriptReviewed!==true||typeof review.coverageNote!=='string'||review.coverageNote.trim().length<12)throw Error('Read the entire retained transcript and record complete-sentence / unique-point coverage');
 if(!['not-assessed','assessed'].includes(review.listening)||review.listening==='assessed'&&!(typeof review.listeningNote==='string'&&review.listeningNote.trim()))throw Error('Record listening evidence honestly');
 if(!Array.isArray(review.decisions)||review.decisions.length!==context.candidates.length)throw Error('Resolve every residual repetition; do not drop warnings');
 const ids=new Set();for(const d of review.decisions){if(ids.has(d.id)||!context.candidates.some(c=>c.id===d.id))throw Error('Unknown or duplicate repetition decision');ids.add(d.id);if(d.action!=='retain-intentional'||typeof d.reason!=='string'||d.reason.trim().length<12)throw Error('Remove unwanted repeated takes with guarded cleanup, then audit again; retained repetitions need a specific intentional-use reason');}
}

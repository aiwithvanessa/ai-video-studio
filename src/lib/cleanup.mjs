import {validateTranscript} from './timing.mjs';
const normalized=text=>text.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
export function keepRangesFromCuts(cuts,totalFrames){
 if(!Number.isInteger(totalFrames)||totalFrames<1||!Array.isArray(cuts))throw Error('Invalid cleanup duration/cuts');
 let cursor=0,out=0;const keep=[];
 for(const cut of cuts){
  if(!Number.isInteger(cut.startFrame)||!Number.isInteger(cut.endFrame)||cut.startFrame<cursor||cut.endFrame<=cut.startFrame||cut.endFrame>totalFrames||typeof cut.reason!=='string'||!cut.reason.trim())throw Error('Cuts require ordered, nonoverlapping source-frame bounds and reasons');
  if(cut.startFrame>cursor){keep.push({startFrame:cursor,endFrame:cut.startFrame,outStartFrame:out});out+=cut.startFrame-cursor;}
  cursor=cut.endFrame;
 }
 if(cursor<totalFrames)keep.push({startFrame:cursor,endFrame:totalFrames,outStartFrame:out});
 if(!keep.length)throw Error('Cleanup cannot remove the entire clip');
 return keep;
}
export function mapKeptWords(transcript,keep,fps=30){
 const words=[],removedWordIndices=[];
 for(const [i,word] of transcript.words.entries()){
  const range=keep.find(k=>word.start>=k.startFrame/fps&&word.end<=k.endFrame/fps);
  if(!range){if(keep.some(k=>word.start<k.endFrame/fps&&word.end>k.startFrame/fps))throw Error(`Cut crosses estimated word ${i} (${word.text}); review the boundary, do not clamp it`);removedWordIndices.push(i);continue;}
  const rangeIndex=keep.indexOf(range),cutBefore=rangeIndex>0&&words.at(-1)?.sourceRangeIndex!==rangeIndex;
  words.push({...word,start:word.start-range.startFrame/fps+range.outStartFrame/fps,end:word.end-range.startFrame/fps+range.outStartFrame/fps,originalWordIndex:i,sourceStart:word.start,sourceEnd:word.end,sourceRangeIndex:rangeIndex,cutBefore});
 }
 const durationFrames=keep.reduce((n,k)=>n+k.endFrame-k.startFrame,0),report=validateTranscript({schemaVersion:1,words},durationFrames/fps);
 if(!report.valid)throw Error('Mapped caption times invalid: '+report.errors.join('; '));
 return {words,removedWordIndices,durationFrames,validation:report};
}
export function proposeRetakeCuts(transcript,totalFrames,fps=30){
 const validation=validateTranscript(transcript,totalFrames/fps);if(!validation.valid)throw Error('Validate source timing before cleanup: '+validation.errors.join('; '));
 const phraseTiming=transcript.words.some(w=>/\s/.test(w.text.trim()));
 const blocks=[];let block=[];
 for(const [index,w] of transcript.words.entries()){
  const prev=block.at(-1);
  if(prev&&(w.start-prev.end>=.6||/[.!?]$/.test(prev.text))){blocks.push(block);block=[];}
  block.push({...w,index});
 }
 if(block.length)blocks.push(block);
 const cuts=[],suggestions=[],warnings=[...validation.warnings,'Word estimates are not acoustic alignment; watch/listen to every edit boundary. This heuristic does not assess performance quality.'];
 for(let i=0;i<blocks.length-1;i++){
  const a=blocks[i],b=blocks[i+1],x=a.flatMap(w=>w.text.trim().split(/\s+/).map(normalized)),y=b.flatMap(w=>w.text.trim().split(/\s+/).map(normalized));
  let prefix=0;while(prefix<Math.min(x.length,y.length)&&x[prefix]===y[prefix])prefix++;
  if(prefix<3)continue;
  const first=a[0],last=a.at(-1),next=b[0],gap=next.start-last.end;
  const clear=prefix===x.length&&x.length<=20&&y.length>=x.length+2&&!/[.!?]$/.test(last.text)&&gap>=.6&&gap<=5;
  const item={earlierText:a.map(w=>w.text).join(' '),laterText:b.map(w=>w.text).join(' '),sourceStart:first.start,sourceEnd:last.end,automatic:false,reason:clear?'Entire unfinished prefix repeats in the following longer take after a pause':'Similar wording may be deliberate or include unique material; retained for review',wordIndices:a.map(w=>w.index)};
  if(clear){
   const before=transcript.words[first.index-1];
   const startFrame=before?Math.ceil((before.end+first.start)/2*fps):0,endFrame=Math.floor((last.end+next.start)/2*fps);
   const candidate={startFrame,endFrame,reason:item.reason,evidenceWordIndices:item.wordIndices};
   try{mapKeptWords(transcript,keepRangesFromCuts([candidate],totalFrames),fps);if(startFrame<endFrame){item.automatic=true;cuts.push(candidate);}}catch{item.reason='Potential restart, but estimated word/frame boundary is unsafe; retained';}
  }
  suggestions.push(item);
 }
 cuts.sort((a,b)=>a.startFrame-b.startFrame);
 // Adjacent proposals are never merged across unknown material.
 for(let i=1;i<cuts.length;i++)if(cuts[i].startFrame<cuts[i-1].endFrame)throw Error('Overlapping automatic proposals; review required');
 if(cuts.reduce((n,c)=>n+c.endFrame-c.startFrame,0)>totalFrames*.6){warnings.push('Automatic cuts would remove over60% of the section; retained all material pending semantic review');for(const s of suggestions)s.automatic=false;return {cuts:[],suggestions,warnings};}
 if(phraseTiming)warnings.push('Native phrase timing: cuts preserve whole caption intervals; per-word highlighting/alignment unavailable');
 return {cuts,suggestions,warnings};
}

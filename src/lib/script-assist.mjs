// Text comparison only. Bounds come from supplied recognition intervals, not alignment.
export const tokens=text=>(text.normalize('NFKC').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)??[]);
function f1(a,b){
 const row=new Uint16Array(b.length+1);
 for(const x of a){let diagonal=0;for(let j=1;j<=b.length;j++){const prior=row[j];row[j]=x===b[j-1]?diagonal+1:Math.max(row[j],row[j-1]);diagonal=prior;}}
 return a.length+b.length?2*row[b.length]/(a.length+b.length):0;
}
export function compareScript(text,transcript){
 const points=text.split(/\r?\n|(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>tokens(x).length);
 if(!points.length||points.length>150||tokens(text).length>5000)throw Error('Use a nonempty script of at most 150 points / 5000 words');
 const words=transcript.words;if(!Array.isArray(words)||words.length>20000)throw Error('Expected a supported transcript');
 return points.map((point,index)=>{
  const desired=tokens(point),windows=[];
  for(let i=0;i<words.length;i++){
   const spoken=[];
   for(let j=i;j<words.length;j++){
    spoken.push(...tokens(words[j].text));if(spoken.length>desired.length*2+8)break;
    if(spoken.length<Math.max(1,desired.length*.4))continue;
    const similarity=f1(desired,spoken);if(similarity<.35)continue;
    windows.push({firstInterval:i,lastInterval:j,start:words[i].start,end:words[j].end,text:words.slice(i,j+1).map(w=>w.text).join(' '),contextBefore:words[i-1]?.text??null,contextAfter:words[j+1]?.text??null,boundaryStatus:'navigation estimate only; check full sentence and audio before cutting',lexicalSimilarity:Number(similarity.toFixed(3))});
   }
  }
  windows.sort((a,b)=>b.lexicalSimilarity-a.lexicalSimilarity||(a.lastInterval-a.firstInterval)-(b.lastInterval-b.firstInterval)||a.start-b.start);
  const candidates=[];
  for(const window of windows){if(candidates.some(c=>window.firstInterval<=c.lastInterval&&window.lastInterval>=c.firstInterval))continue;candidates.push(window);if(candidates.length===5)break;}
  candidates.sort((a,b)=>a.start-b.start);
  return {index,scriptText:point,status:candidates.length?'review-candidates':'no-lexical-match-review-paraphrases',candidates};
 });
}
export function repeatedPassages(transcript){
 const flat=transcript.words.flatMap((w,i)=>tokens(w.text).map(text=>({text,interval:i}))),seen=new Map(),results=[];
 for(let i=0;i+6<=flat.length;i++){
  const key=flat.slice(i,i+6).map(x=>x.text).join(' '),prior=seen.get(key);
  if(prior!==undefined&&i>=prior+6){
   // Coalesce adjacent sliding windows of the same repeated passage.
   const last=results.at(-1);
   if(last&&last.aTokenEnd===prior+5&&last.bTokenEnd===i+5){last.aTokenEnd++;last.bTokenEnd++;last.text+=' '+flat[i+5].text;}
   else results.push({text:key,aTokenStart:prior,aTokenEnd:prior+6,bTokenStart:i,bTokenEnd:i+6});
  }
  seen.set(key,i);
 }
 return results.map(r=>({text:r.text,occurrences:[[r.aTokenStart,r.aTokenEnd],[r.bTokenStart,r.bTokenEnd]].map(([a,b])=>({firstInterval:flat[a].interval,lastInterval:flat[b-1].interval,start:transcript.words[flat[a].interval].start,end:transcript.words[flat[b-1].interval].end})),decision:'review; repetition may be intentional'}));
}

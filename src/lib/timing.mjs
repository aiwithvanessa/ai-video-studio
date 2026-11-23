export function validateTranscript(value,duration){
 const errors=[],warnings=[];
 if(!value||value.schemaVersion!==1||!Array.isArray(value.words))return {valid:false,errors:['Expected schemaVersion 1 and words array'],warnings};
 let end=0;
 for(const [i,w] of value.words.entries()){
  if(typeof w.text!=='string'||!w.text.trim()||!Number.isFinite(w.start)||!Number.isFinite(w.end)){errors.push(`Word ${i}: missing text or finite times`);continue;}
  if(w.start<0||w.end<=w.start||w.end>duration+1e-6)errors.push(`Word ${i} (${w.text}): interval outside section or end <= start`);
  if(i&&w.start<end-1e-6)errors.push(`Word ${i} (${w.text}): overlapping or unordered estimate`);
  if(/\s/.test(w.text.trim()))warnings.push(`Word ${i}: engine emitted a phrase-level segment, not a single word`);
  end=w.end;
 }
 if(!value.words.length)warnings.push('No speech recognized');
 if(value.words[0]?.start===0)warnings.push('First interval begins at zero; this does not prove audible speech starts at zero');
 return {valid:errors.length===0,errors,warnings};
}
export function groupWords(words,maxWords=4,gap=0.35,fps=30){
 const groups=[];let current=[];
 for(const w of words){if(/\s/.test(w.text.trim())){if(current.length){groups.push(current);current=[];}const previous=groups.at(-1);if(previous&&Math.ceil(w.end*fps)<=Math.ceil(w.start*fps)&&w.start-previous.at(-1).end<=gap)previous.push(w);else groups.push([w]);continue;}const prev=current.at(-1);if(prev&&(current.length>=maxWords||w.start-prev.end>gap||/[.!?]$/.test(prev.text))){groups.push(current);current=[];}current.push(w);}
 if(current.length)groups.push(current);return groups;
}
export const frameBounds=(start,end,fps)=>[Math.ceil(start*fps),Math.ceil(end*fps)];
export function activeGroup(groups,frame,fps){return groups.find(g=>{const [a,b]=frameBounds(g[0].start,g.at(-1).end,fps);return frame>=a&&frame<b;})??null;}
export const activeWord=(word,frame,fps)=>frame>=Math.ceil(word.start*fps)&&frame<Math.ceil(word.end*fps);

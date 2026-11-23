// Split at actual word boundaries instead of resizing individual phrases.
export function layoutCaptions(words,{maxWords=4,maxLines=2,maxWidth,fontSize,gap=.35},measure){
 if(!Number.isFinite(maxWidth)||maxWidth<=0||!Number.isFinite(fontSize)||fontSize<=0)throw Error('Invalid caption geometry');
 const groups=[];let group=[],lines=[[]];
 const flush=()=>{if(group.length)groups.push({words:group,lines:lines.filter(l=>l.length),fontSize});group=[];lines=[[]];};
 for(const word of words){
  const previous=group.at(-1);
  if(previous&&(word.cutBefore||group.length>=maxWords||word.start-previous.end>gap||/[.!?]["'’”)]*$/.test(previous.text)))flush();
  if(measure(word.text)>maxWidth)throw Error(`Caption word "${word.text}" does not fit the configured font/margins; adjust the style once, not per phrase`);
  const line=lines.at(-1),fits=measure([...line,word].map(w=>w.text).join(' '))<=maxWidth;
  if(!fits&&line.length){if(lines.length<maxLines)lines.push([]);else flush();}
  group.push(word);lines.at(-1).push(word);
 }
 flush();return groups;
}

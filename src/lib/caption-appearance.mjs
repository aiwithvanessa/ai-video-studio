export function validateCaptionAppearance(value){
 if(value===undefined)return;
 if(!value||!['none','dark'].includes(value.backing))throw Error('Caption backing must be none or dark');
 for(const key of ['textColor','highlightColor'])if(!/^#[a-f\d]{6}$/i.test(value[key]))throw Error('Caption colours require six-digit hex values');
 if(value.highlightWords!==undefined&&(!Array.isArray(value.highlightWords)||value.highlightWords.some(w=>typeof w!=='string'||!w.trim())))throw Error('Caption highlightWords must be nonempty strings');
 for(const [key,min,max] of [['fontSizeRatio',.025,.12],['bottomRatio',.05,.85],['centerYRatio',.1,.9],['sideMarginRatio',.03,.3],['lineHeight',.9,1.8],['letterSpacingRatio',-.003,.015],['strokeWidthRatio',0,.01],['wordsPerPhrase',1,8],['maxLines',1,2],['fontWeight',100,900],['entranceFrames',0,20]])if(value[key]!==undefined&&(!Number.isFinite(value[key])||value[key]<min||value[key]>max))throw Error('Invalid caption '+key);
 for(const key of ['wordsPerPhrase','maxLines','entranceFrames'])if(value[key]!==undefined&&!Number.isInteger(value[key]))throw Error('Caption '+key+' must be an integer');
 if(value.align!==undefined&&!['left','center','right'].includes(value.align))throw Error('Invalid caption alignment');
 if(value.fontFamily!==undefined&&(typeof value.fontFamily!=='string'||!value.fontFamily.trim()))throw Error('Caption fontFamily is required when specified');
 if(value.strokeColor!==undefined&&!/^#[a-f\d]{6}$/i.test(value.strokeColor))throw Error('Caption strokeColor requires a hex value');
 if(value.entrance!==undefined&&!['none','fade','rise'].includes(value.entrance))throw Error('Invalid caption entrance');
}
export const normalizeCaptionWord=text=>text.toLocaleLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
export function captionWordColor(text,active,highlight,appearance,accent){
 const selected=!appearance?.highlightWords||appearance.highlightWords.map(normalizeCaptionWord).includes(normalizeCaptionWord(text));
 return highlight&&active&&selected?(appearance?.highlightColor??accent):(appearance?.textColor??'#FFFFFF');
}

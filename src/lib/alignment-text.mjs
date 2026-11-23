// Pronunciation labels for the acoustic model; caption spelling stays unchanged.
export function alignmentLabel(text){
 const clean=text.normalize('NFKC').toUpperCase().replaceAll('’',"'").replace(/[.,!?;:()"“”]/g,'');
 if(/^\d+$/.test(clean)){
  const n=Number(clean),small=['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN'];
  if(n<20)return small[n];if(n<100)return ['','','TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY'][Math.floor(n/10)]+(n%10?'|'+small[n%10]:'');
  throw Error('Number pronunciation needs review: '+text);
 }
 if(/[\d%]/.test(clean))throw Error('Ambiguous numeric pronunciation needs review: '+text);
 const label=clean.replaceAll('-','');if(!/^[A-Z']+$/.test(label))throw Error('Unsupported English alignment text: '+text);return label;
}

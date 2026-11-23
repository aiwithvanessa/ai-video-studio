import type {Word} from '../types';
export function layoutCaptions(words:Word[],options:{maxWords?:number;maxLines?:number;maxWidth:number;fontSize:number;gap?:number},measure:(text:string)=>number):{words:Word[];lines:Word[][];fontSize:number}[];

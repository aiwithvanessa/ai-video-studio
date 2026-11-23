import type {Word} from '../types';
export function validateTranscript(value:unknown,duration:number):{valid:boolean;errors:string[];warnings:string[]};
export function groupWords(words:Word[],maxWords?:number,gap?:number,fps?:number):Word[][];
export function frameBounds(start:number,end:number,fps:number):number[];
export function activeGroup(groups:Word[][],frame:number,fps:number):Word[]|null;
export function activeWord(word:Word,frame:number,fps:number):boolean;

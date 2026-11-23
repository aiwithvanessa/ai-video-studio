import type {Brand} from '../types';
type Appearance=NonNullable<Brand['style']>['captionAppearance'];
export function validateCaptionAppearance(value:unknown):void;
export function normalizeCaptionWord(text:string):string;
export function captionWordColor(text:string,active:boolean,highlight:boolean,appearance:Appearance,accent:string):string;

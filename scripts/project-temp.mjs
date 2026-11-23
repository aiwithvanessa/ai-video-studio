import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
// Process-only setting: keeps bundler scratch files in the writable project.
export function useProjectTemp(){
 const folder=resolve('.local/tmp');
 if(folder.includes('!'))throw Error('Webpack cannot bundle in a path containing !. Open the project in a supported folder path; do not request broad access to bypass it.');
 mkdirSync(folder,{recursive:true});process.env.TEMP=folder;process.env.TMP=folder;return folder;
}

// Compares declared active writable roots, not process cwd alone. Never changes permissions.
import {realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
export function assessWorkspace(project,roots){
 const root=realpathSync(resolve(project));
 if(!roots.length)return {status:'unknown',project:root,action:'Read the active Codex workspace/writable-root declaration. A successful file read or a changed working directory does not prove write access.'};
 const writable=roots.some(value=>{const base=realpathSync(resolve(value)),rel=relative(base,root);return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../'));});
 return {status:writable?'inside-declared-root':'outside-declared-roots',project:root,action:writable?'Routine project work should use default sandbox permissions; protected paths, network and administrator policy may still require approval.':'Open this studio folder as the active Codex project (or grant narrowly scoped project access through supported controls) before continuing routine edits. Do not request elevation separately for every edit.'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let project=process.cwd();const roots=[];
 for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i],value=process.argv[i+1];if(!value||!['--project','--workspace-root'].includes(key))throw Error('Use --project <folder> and repeated --workspace-root <actually declared writable folder>');if(key==='--project')project=value;else roots.push(value);}
 const result=assessWorkspace(project,roots);console.log(JSON.stringify(result,null,2));if(result.status!=='inside-declared-root')process.exitCode=2;
}

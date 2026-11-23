// Imports only an explicitly supplied readable local file. No upload or transcoding.
import {copyFileSync,constants,existsSync,mkdirSync,readFileSync,realpathSync,statSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve,basename,extname,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadState,saveState,ensureVideo} from './studio-state.mjs';
import {fileHash,probe} from './editor.mjs';
export function importMedia({role,source,videoId,origin='local-path'}){
 if(!['reference','footage','brand'].includes(role))throw Error('Choose reference, footage or brand role');
 if(!['local-path','accessible-attachment'].includes(origin))throw Error('Invalid source origin');
 if(!source||!source.trim())throw Error('Supply the accessible original file path; an attachment name or thumbnail is insufficient');
 const original=realpathSync(resolve(source));if(!statSync(original).isFile())throw Error('Source must be a readable regular file');
 const metadata=role==='brand'?null:probe(original);if(metadata&&!metadata.streams.some(s=>s.codec_type==='video'))throw Error('No video stream in supplied file');
 const state=loadState(process.cwd());
 if(role==='footage'&&!videoId)throw Error('Video ID required internally for footage');
 if(role==='footage')ensureVideo(process.cwd(),state,videoId);
 const folder=role==='footage'?`public/videos/${videoId}/footage`:`public/shared/${role==='brand'?'brand':'references'}`;
 mkdirSync(folder,{recursive:true});
 const root=realpathSync(process.cwd()),destRoot=realpathSync(folder);
 if(!destRoot.startsWith(root+sep))throw Error('Import folder redirects outside project');
 const sha256=fileHash(original),extension=extname(original).toLowerCase();
 if(!/^\.[a-z0-9]{1,10}$/.test(extension))throw Error('Source needs a simple media filename extension');
 const stem=basename(original,extname(original)).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'media';
 let target=resolve(folder,stem+'-'+sha256.slice(0,12)+extension);
 if(existsSync(target)){if(realpathSync(target)!==target||fileHash(target)!==sha256)throw Error('Existing import conflicts; preserve it and inspect');}
 else copyFileSync(original,target,constants.COPYFILE_EXCL);
 if(fileHash(target)!==sha256)throw Error('Imported bytes differ from original; do not use this import');
 mkdirSync('.local',{recursive:true});const ledger='.local/media-imports.json';
 const imports=existsSync(ledger)?JSON.parse(readFileSync(ledger,'utf8')):[];
 const asset=relative(resolve('public'),target).split(sep).join('/');
 let record=imports.find(x=>x.asset===asset&&x.sha256===sha256);
 if(!record){record={role,videoId:videoId??null,origin,originalPath:original,originalFilename:basename(original),asset,sha256,importedAt:new Date().toISOString(),metadata,assessment:{fileAccess:'verified byte-identical copy',visualPlayback:'not assessed',listening:'not assessed'}};imports.push(record);writeFileSync(ledger,JSON.stringify(imports,null,2)+'\n');}
 if(role==='footage'){
  const brief=`docs/briefs/${videoId}.local.md`,marker=`Imported asset: ${asset} (SHA-256 ${sha256})`;
  if(!readFileSync(brief,'utf8').includes(marker))appendFileSync(brief,`\n- ${marker}; original preserved; purpose/section from conversation.\n`);
  saveState(process.cwd(),state);
 }
 return record;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){if(!args[i]?.startsWith('--')||!args[i+1])throw Error('Use named options with values');options[args[i].slice(2)]=args[i+1];}
 console.log(JSON.stringify(importMedia({role:options.role,source:options.source,videoId:options.video,origin:options.origin}),null,2));
}

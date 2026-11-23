import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {importMedia} from './import-media.mjs';
import {run,fileHash} from './editor.mjs';
const cwd=process.cwd(),root=mkdtempSync(resolve(tmpdir(),'studio-import-')),source=resolve(root,'user-original.mp4'),project=resolve(root,'project');
run('ffmpeg',['-v','error','-f','lavfi','-i','color=c=gray:s=64x64:r=30:d=0.2','-c:v','libx264','-pix_fmt','yuv420p',source]);
mkdirSync(resolve(project,'docs/briefs'),{recursive:true});cpSync('docs/briefs/TEMPLATE.md',resolve(project,'docs/briefs/TEMPLATE.md'));
try{
 process.chdir(project);mkdirSync('.local');const previous={schemaVersion:1,setup:{complete:true,checks:{}},brand:{status:'complete',evidence:'Preserve identity approval'},style:{status:'pending',identityApproval:'Preserve identity approval'},videos:{},activeVideo:null};writeFileSync('.local/studio-state.json',JSON.stringify(previous));const originalHash=fileHash(source);
 const ref=importMedia({role:'reference',source});assert(ref.asset.startsWith('shared/references/'));assert.equal(fileHash(source),originalHash);
 const footage=importMedia({role:'footage',source,videoId:'first-video'});assert(footage.asset.startsWith('videos/first-video/footage/'));assert.equal(footage.assessment.listening,'not assessed');
 assert.equal(importMedia({role:'footage',source,videoId:'first-video'}).asset,footage.asset);assert.equal(JSON.parse(readFileSync('.local/media-imports.json')).length,2);
 assert(readFileSync('docs/briefs/first-video.local.md','utf8').includes(footage.asset));
 const saved=JSON.parse(readFileSync('.local/studio-state.json'));assert.deepEqual(saved.brand,previous.brand);assert.deepEqual(saved.style,previous.style);
 assert.throws(()=>importMedia({role:'footage',source,videoId:'../escape'}));assert.throws(()=>importMedia({role:'reference',source:'missing.mp4'}));
 writeFileSync(resolve('public',ref.asset),'unrelated');assert.throws(()=>importMedia({role:'reference',source}),/conflicts/);assert.equal(readFileSync(resolve('public',ref.asset),'utf8'),'unrelated');
 writeFileSync(resolve(root,'image.mp4'),'not video');assert.throws(()=>importMedia({role:'reference',source:resolve(root,'image.mp4')}));
 assert(existsSync(source));assert.equal(fileHash(source),originalHash);
 console.log('Import checks passed: actual synthetic MP4 probe, original preserved, role separation, stable repeat import, brief/state updates, collision/missing/invalid-file rejection. No chat video attachment was supplied; attachment-original access and playback/listening remain unverified.');
}finally{process.chdir(cwd);}

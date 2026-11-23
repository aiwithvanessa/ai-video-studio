import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,createReadStream,unlinkSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,basename,join} from 'node:path';
import {spawn} from 'node:child_process';
import {fileHash} from './editor.mjs';
const releaseDir=resolve(process.argv[2]??'.local/releases/0.1.0-dev.1'),manifest=resolve(releaseDir,'release.json');if(!existsSync(manifest))throw Error('Build an unpublished development release first.');
const data=JSON.parse(readFileSync(manifest));
assert(!data.files.some(f=>/^(?:\.local|node_modules|out|\.git)\//.test(f.path)));
assert(!data.files.some(f=>/^public\//.test(f.path)&&!f.path.startsWith('public/audio/starter-pack/')&&f.path!=='public/.gitkeep'));
const neutral=JSON.parse(readFileSync(resolve(releaseDir,'project/src/studio.json')));assert.deepEqual(neutral.videos,{});assert.equal(neutral.brand.name,'My video');
const server=createServer((req,res)=>{if(req.url!=='/'+data.archive.filename){res.writeHead(404).end();return;}createReadStream(resolve(releaseDir,data.archive.filename)).pipe(res);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`,bootstrap=resolve('scripts/bootstrap.mjs'),root=mkdtempSync(join(tmpdir(),'studio-bootstrap-check-'));
async function launch(target,extra=[]){return await new Promise(res=>{const child=spawn(process.execPath,[bootstrap,'--manifest',manifest,'--sha256',fileHash(manifest),'--base',base,'--target',target,...extra],{env:{...process.env,STUDIO_BOOTSTRAP_TEST:'1'},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('exit',code=>res({code,output}));});}
try{
 const empty=resolve(root,'empty');mkdirSync(empty);let result=await launch(empty,['--files-only','true']);assert.equal(result.code,0,result.output);
 for(const f of data.files)assert.equal(fileHash(resolve(empty,f.path)),f.sha256);
 assert(!existsSync(resolve(empty,'.local/studio-state.json')));
 // Simulate interruption immediately before committing an atomic journal update.
 const journalPath=resolve(empty,'.studio-bootstrap/journal.json');writeFileSync(journalPath+'.tmp',readFileSync(journalPath));unlinkSync(journalPath);
 unlinkSync(resolve(empty,'src/Root.tsx'));result=await launch(empty,['--files-only','true']);assert.equal(result.code,0,result.output);assert(existsSync(resolve(empty,'src/Root.tsx')));
 writeFileSync(resolve(empty,'src/Root.tsx'),'User modification');result=await launch(empty,['--files-only','true']);assert.notEqual(result.code,0);assert.equal(readFileSync(resolve(empty,'src/Root.tsx'),'utf8'),'User modification');
 const occupied=resolve(root,'occupied');mkdirSync(occupied);writeFileSync(resolve(occupied,'personal.txt'),'keep me');result=await launch(occupied,['--files-only','true']);assert.notEqual(result.code,0);assert.equal(readFileSync(resolve(occupied,'personal.txt'),'utf8'),'keep me');assert(!existsSync(resolve(occupied,'.studio-bootstrap')));
 const mismatch=await new Promise(res=>{const child=spawn(process.execPath,[bootstrap,'--manifest',manifest,'--sha256','0'.repeat(64),'--base',base,'--target',resolve(root,'wrong-hash')],{env:{...process.env,STUDIO_BOOTSTRAP_TEST:'1'}});child.on('exit',res);});assert.notEqual(mismatch,0);
 console.log('Bootstrap checks passed: local version-pinned archive retrieval, hashes, neutral release data, no private media/state/dependencies, interrupted file-copy resume, changed/unrelated-file preservation and bad-manifest rejection. Not a public-host or clean-Windows test.');
 if(process.env.STUDIO_BOOTSTRAP_FULL_TEST==='1'){
  const full=resolve(root,'full');mkdirSync(full);result=await launch(full);assert.equal(result.code,0,result.output);const state=JSON.parse(readFileSync(resolve(full,'.local/studio-state.json')));assert.equal(state.brand.status,'pending');assert.equal(state.activeVideo,null);assert.equal(state.setup.complete,true);
  const resumed=await launch(full);assert.equal(resumed.code,0,resumed.output);assert(resumed.output.includes('already bootstrapped'));console.log('Full local bootstrap passed: independent dependency install, checks, fresh setup/brand state and completed-setup resume. Test folder: '+full);
 }
}finally{await new Promise(resolve=>server.close(resolve));}

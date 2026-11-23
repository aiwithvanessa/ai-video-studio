// Maintained recipient bootstrap. Installs a verified release; never generates editor code.
import {existsSync,readFileSync,writeFileSync,readdirSync,mkdirSync,createWriteStream,renameSync,lstatSync,copyFileSync} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const hash=b=>createHash('sha256').update(b).digest('hex');
const options={};for(let i=2;i<process.argv.length;i+=2){if(!process.argv[i].startsWith('--')||!process.argv[i+1])throw Error('Bootstrap options require name/value pairs');options[process.argv[i].slice(2)]=process.argv[i+1];}
if(!options.manifest||!options.sha256||!options.base)throw Error('Required: --manifest <downloaded release.json> --sha256 <trusted manifest SHA256> --base <versioned release URL directory> [--target <empty folder>]');
const bytes=readFileSync(resolve(options.manifest));if(hash(bytes)!==options.sha256)throw Error('Release manifest checksum mismatch; nothing installed');
const release=JSON.parse(bytes);if(release.schemaVersion!==1||!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(release.version)||!Array.isArray(release.files))throw Error('Invalid release manifest');
if(release.status!=='released'&&process.env.STUDIO_BOOTSTRAP_TEST!=='1')throw Error('This manifest is not a published release. Private bootstrap tests must be explicitly marked as tests.');
const safe=name=>typeof name==='string'&&!name.startsWith('/')&&!name.includes('\\')&&!name.includes(':')&&!name.split('/').some(s=>!s||s==='.'||s==='..');
const seen=new Set();for(const f of release.files){if(!safe(f.path)||!/^[a-f0-9]{64}$/.test(f.sha256)||seen.has(f.path.toLowerCase()))throw Error('Unsafe/duplicate release file');seen.add(f.path.toLowerCase());}
if(!safe(release.archive?.filename)||!/^[a-f0-9]{64}$/.test(release.archive?.sha256))throw Error('Invalid archive record');
const base=new URL(options.base.endsWith('/')?options.base:options.base+'/');
if(base.protocol!=='https:'&&!(process.env.STUDIO_BOOTSTRAP_TEST==='1'&&base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname)))throw Error('Production release base must be HTTPS');
if(process.platform!=='win32'||process.arch!=='x64')throw Error('This bootstrap currently supports Windows x64 only');
const root=resolve(options.target??process.cwd());mkdirSync(root,{recursive:true});
const stage=resolve(root,'.studio-bootstrap'),journalPath=resolve(stage,'journal.json');
const writeJournal=value=>{writeFileSync(journalPath+'.tmp',JSON.stringify(value,null,2));renameSync(journalPath+'.tmp',journalPath);};
if(!existsSync(journalPath)&&existsSync(journalPath+'.tmp')){const pending=JSON.parse(readFileSync(journalPath+'.tmp'));if(pending.manifestHash!==options.sha256||pending.version!==release.version)throw Error('Unrelated pending bootstrap metadata');renameSync(journalPath+'.tmp',journalPath);}
let journal;
if(existsSync(journalPath)){journal=JSON.parse(readFileSync(journalPath));if(journal.manifestHash!==options.sha256||journal.version!==release.version)throw Error('Another version already owns this setup. Do not overwrite it; use a new empty folder.');}
else{if(readdirSync(root).length)throw Error('Target is not empty. Preserve its files; choose an empty folder.');mkdirSync(stage);journal={version:release.version,manifestHash:options.sha256,phase:'download',copied:[]};writeJournal(journal);}
if(journal.phase==='complete'){console.log(`Release ${release.version} is already bootstrapped here. Resume guided onboarding with local AGENTS.md; no files replaced.`);process.exit(0);}
const persist=()=>writeJournal(journal);
const allowedTop=new Set(['.studio-bootstrap',...release.files.map(f=>f.path.split('/')[0])]);if(journal.dependenciesStarted)allowedTop.add('node_modules');if(journal.setupStarted)allowedTop.add('.local');
for(const name of readdirSync(root))if(!allowedTop.has(name))throw Error('Unrelated file appeared during interrupted setup: '+name);
const archive=resolve(stage,release.archive.filename);
if(!existsSync(archive)||hash(readFileSync(archive))!==release.archive.sha256){const response=await fetch(new URL(release.archive.filename,base),{redirect:'follow'});if(!response.ok)throw Error(`Release download failed ${response.status}; rerun the same prompt to resume`);const part=archive+'.part';await pipeline(Readable.fromWeb(response.body),createWriteStream(part));if(hash(readFileSync(part))!==release.archive.sha256)throw Error('Downloaded archive checksum mismatch; preserved partial file, installed nothing');renameSync(part,archive);}
const unpack=resolve(stage,'unpacked');
const sourceComplete=existsSync(unpack)&&release.files.every(f=>existsSync(resolve(unpack,f.path))&&hash(readFileSync(resolve(unpack,f.path)))===f.sha256);
if(!sourceComplete){
 const quote=s=>s.replaceAll("'","''");
 const script=`$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead('${quote(archive)}'); try {foreach($e in $z.Entries){if($e.FullName -match '(^[/\\\\]|(^|[/\\\\])\\.\\.([/\\\\]|$)|:)'){throw 'Unsafe archive entry'}}} finally {$z.Dispose()}; Expand-Archive -LiteralPath '${quote(archive)}' -DestinationPath '${quote(unpack)}' -Force`;
 const r=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8'});if(r.status!==0)throw Error('Could not unpack verified archive: '+(r.stderr||r.error?.message));
}
// Validate every source before copying any file. Extra archive entries are never copied.
for(const f of release.files){const p=resolve(unpack,f.path);if(!existsSync(p)||lstatSync(p).isSymbolicLink()||hash(readFileSync(p))!==f.sha256)throw Error('Extracted release file missing/changed: '+f.path);}
for(const f of release.files){const target=resolve(root,f.path);if(!target.startsWith(root+sep))throw Error('Destination escapes target');let path=root;for(const segment of f.path.split('/')){path=resolve(path,segment);if(existsSync(path)&&lstatSync(path).isSymbolicLink())throw Error('Refusing redirected destination: '+f.path);}if(existsSync(target)&&hash(readFileSync(target))!==f.sha256)throw Error('Refusing to overwrite a changed/unrelated file: '+f.path);}
journal.phase='copy';persist();
for(const f of release.files){const target=resolve(root,f.path);if(!existsSync(target)){mkdirSync(dirname(target),{recursive:true});const pendingCopy=resolve(stage,'pending-copy');copyFileSync(resolve(unpack,f.path),pendingCopy);if(existsSync(target))throw Error('Destination appeared during setup; preserved: '+f.path);renameSync(pendingCopy,target);}if(!journal.copied.includes(f.path)){journal.copied.push(f.path);persist();}}
if(options['files-only']==='true'&&process.env.STUDIO_BOOTSTRAP_TEST==='1'){console.log('Test-only files stage verified; dependencies/setup not run.');process.exit(0);}
const command=(args)=>{const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(r.status!==0)throw Error('Setup command failed; preserved progress. Resume with same pinned release.');};
journal.phase='dependencies';journal.dependenciesStarted=true;persist();
const npm=spawnSync('cmd.exe',['/d','/s','/c','npm.cmd ci --no-audit --no-fund'],{cwd:root,stdio:'inherit'});if(npm.status!==0)throw Error('Dependency install failed; check network/permissions and resume. No success claimed.');
command(['scripts/check.mjs']);command(['node_modules/typescript/bin/tsc','--noEmit']);
journal.phase='setup';journal.setupStarted=true;persist();command(['scripts/studio.mjs','init']);command(['scripts/studio.mjs','check-setup']);
const state=JSON.parse(readFileSync(resolve(root,'.local/studio-state.json')));if(!state.setup.complete)throw Error('Required setup checks failed. Fix the reported prerequisite, then resume; brand not approved.');
journal.phase='complete';persist();console.log(`Installed maintained release ${release.version} in ${root}. Read local AGENTS.md and invoke $ai-video-studio to begin/resume brand onboarding. No brand/video approvals were created.`);

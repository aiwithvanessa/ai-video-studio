// Builds an unpublished, self-contained maintained release. No runtime state/media inheritance.
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {run,defaultProject,fileHash} from './editor.mjs';
const version=process.argv[2]??'0.1.0-dev.1';if(!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(version))throw Error('Explicit semver release version required');
const out=resolve('.local/releases',version);if(existsSync(out))throw Error('Release build exists; use a new version. No overwrite.');
const stage=resolve(out,'project');mkdirSync(stage,{recursive:true});
const names=['package.json','package-lock.json','tsconfig.json','.gitignore','LICENSE.md','AGENTS.md','START-HERE.md','BOOTSTRAP-PROMPT.md','docs/LICENSING.md','docs/RIGHTS.md','docs/workflow.md','docs/briefs/TEMPLATE.md','docs/starter-audio.md','docs/FIRST-USER-TEST.md','templates/BRAND.md','public/.gitkeep'];
const collect=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())collect(path);else names.push(path);}};
collect('src');collect('scripts');collect('.agents/skills/ai-video-studio');
names.push('tools/alignment/package.json','tools/alignment/package-lock.json');
// Public sounds are never copied wholesale: each file needs both gates and an unchanged hash.
const catalogue=JSON.parse(readFileSync('public/audio/starter-pack/catalogue.json','utf8'));
for(const a of catalogue.assets){if(!a.redistribution?.verified||!a.soundApproval?.approved||a.redistribution.fileSha256!==a.fileSha256||a.soundApproval.fileSha256!==a.fileSha256)throw Error('Unapproved bundled sound');if(!/^[a-zA-Z0-9][a-zA-Z0-9 _.-]*\.(wav|mp3|ogg)$/i.test(a.filename))throw Error('Unsafe sound filename');const path='public/audio/starter-pack/'+a.filename;if(fileHash(path)!==a.fileSha256)throw Error('Bundled sound changed');names.push(path);for(const evidence of a.redistribution.evidenceFiles??[]){if(!/^licences\/[a-zA-Z0-9_.-]+\.(txt|md|html|pdf)$/i.test(evidence))throw Error('Unsafe sound evidence path');names.push('public/audio/starter-pack/'+evidence);}}
names.push('public/audio/starter-pack/catalogue.json');
for(const name of [...new Set(names)]){if(name.includes('..')||name.startsWith('/')||name.includes('\\'))throw Error('Unsafe release path');const target=resolve(stage,name);mkdirSync(dirname(target),{recursive:true});copyFileSync(name,target);}
writeFileSync(resolve(stage,'src/studio.json'),JSON.stringify(defaultProject(),null,2)+'\n');
mkdirSync(resolve(stage,'brand'),{recursive:true});copyFileSync('templates/BRAND.md',resolve(stage,'brand/BRAND.md'));writeFileSync(resolve(stage,'brand/audio-catalogue.csv'),'filename,description,intended_use,source,licence,attribution,review_status\n');
const packagePath=resolve(stage,'package.json'),lockPath=resolve(stage,'package-lock.json');const pkg=JSON.parse(readFileSync(packagePath));const lock=JSON.parse(readFileSync(lockPath));pkg.version=version;lock.version=version;lock.packages[''].version=version;writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');writeFileSync(lockPath,JSON.stringify(lock,null,2)+'\n');
const files=[];const scan=(dir,prefix='')=>{for(const e of readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())scan(resolve(dir,e.name),rel+'/');else files.push({path:rel,sha256:fileHash(resolve(dir,e.name))});}};scan(stage);
const archiveName=`ai-video-studio-${version}.zip`,archive=resolve(out,archiveName),quote=s=>s.replaceAll("'","''");
run('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory('${quote(stage)}','${quote(archive)}')`]);
copyFileSync('scripts/bootstrap.mjs',resolve(out,'bootstrap.mjs'));
const manifest={schemaVersion:1,version,status:'unpublished-development',licensing:{file:'LICENSE.md',policy:'free-use-no-resale',status:'draft-review-required',licensor:'Vanessa Sax'},bootstrap:{filename:'bootstrap.mjs',sha256:fileHash(resolve(out,'bootstrap.mjs'))},archive:{filename:archiveName,sha256:fileHash(archive)},files};
writeFileSync(resolve(out,'release.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({directory:out,manifestSha256:fileHash(resolve(out,'release.json')),files:files.length,published:false},null,2));

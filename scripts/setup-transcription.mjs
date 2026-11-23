// Recipient-side download, not bundled dependencies. No global installation.
import {mkdirSync,existsSync,createWriteStream,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import {run,fileHash} from './editor.mjs';
const modelName=process.argv.includes('--model')?process.argv[process.argv.indexOf('--model')+1]:'tiny';
if(!['tiny','base.en'].includes(modelName))throw Error('Supported setup model: tiny or base.en');
if(!process.argv.includes('--download'))throw Error('Downloads CPU whisper.cpp v1.9.2 plus local model (tiny ~75 MiB or base.en ~142 MiB). Run with --download when authorized.');
if(process.platform!=='win32'||process.arch!=='x64')throw Error('Automatic tool download currently supports Windows x64 only; configure your own compatible CPU engine/model on other systems.');
const dir=resolve('.local/transcription');mkdirSync(dir,{recursive:true});
async function download(url,file){if(existsSync(file))return;const r=await fetch(url,{headers:{'User-Agent':'AI-Video-Studio-local-setup'}});if(!r.ok)throw Error(`Download failed ${r.status}: ${url}`);await pipeline(Readable.fromWeb(r.body),createWriteStream(file));}
const response=await fetch('https://api.github.com/repos/ggml-org/whisper.cpp/releases/tags/v1.9.2',{headers:{'User-Agent':'AI-Video-Studio-local-setup'}});if(!response.ok)throw Error('Cannot query official whisper.cpp release: '+response.status);
const release=await response.json(),asset=release.assets.find(a=>a.name==='whisper-bin-x64.zip');if(!asset)throw Error('CPU x64 archive missing from official release');
const archive=resolve(dir,'whisper-bin-x64.zip');await download(asset.browser_download_url,archive);
if(asset.digest?.startsWith('sha256:')&&fileHash(archive)!==asset.digest.slice(7))throw Error('Official engine archive checksum mismatch; do not use it');
const unpack=resolve(dir,'engine');
if(!existsSync(unpack)){const quote=s=>s.replaceAll("'","''");run('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Expand-Archive -LiteralPath '${quote(archive)}' -DestinationPath '${quote(unpack)}'`]);}
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(d,e.name)):[resolve(d,e.name)]);
const engine=walk(unpack).find(p=>p.endsWith('whisper-cli.exe'));if(!engine)throw Error('whisper-cli.exe missing in official archive');
const model=resolve(dir,`ggml-${modelName}.bin`);console.log(`Downloading/validating ${modelName} model, CPU only.`);await download(`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${modelName}.bin`,model);
// SHA-1 published by upstream models/README.md for the exact converted tiny model.
if(createHash('sha1').update(readFileSync(model)).digest('hex')!==({tiny:'bd577a113a864445d4c299885e0cb97d4ba92b5f','base.en':'137c40403d78fd54d454da0f9bd998f78703390c'}[modelName]))throw Error('Model checksum mismatch. Preserve failed file for inspection; do not transcribe.');
await download('https://raw.githubusercontent.com/ggml-org/whisper.cpp/v1.9.2/LICENSE',resolve(dir,'whisper-LICENSE.txt'));
await download('https://raw.githubusercontent.com/openai/whisper/main/LICENSE',resolve(dir,'model-LICENSE.txt'));
writeFileSync(resolve(dir,'config.json'),JSON.stringify({engine,model,engineVersion:'v1.9.2',modelName,archiveSha256:fileHash(archive),modelSha256:fileHash(model),installedAt:new Date().toISOString()},null,2));
console.log('Local CPU transcription configured. Engine/model/licences stay in ignored .local and are not packaged.');

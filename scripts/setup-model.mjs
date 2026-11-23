// Optional modest CPU model, separate from the default tiny installation.
import {existsSync,mkdirSync,readFileSync,writeFileSync,createWriteStream,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const registry={'base.en':{algorithm:'sha1',hash:'137c40403d78fd54d454da0f9bd998f78703390c',size:'142 MiB'},'small.en-q5_1':{algorithm:'sha256',hash:'bfdff4894dcb76bbf647d56263ea2a96645423f1669176f4844a1bf8e478ad30',size:'190 MB'}};
const name=process.argv[2],entry=registry[name];if(!entry||!process.argv.includes('--download'))throw Error('Use setup-model.mjs base.en|small.en-q5_1 --download (CPU, existing config preserved)');
const dir=resolve('.local/transcription');mkdirSync(dir,{recursive:true});const model=resolve(dir,`ggml-${name}.bin`),url=`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${name}.bin`;
const verify=file=>createHash(entry.algorithm).update(readFileSync(file)).digest('hex')===entry.hash;
if(!existsSync(model)){console.log(`Downloading ${name} (${entry.size}), CPU only`);const response=await fetch(url);if(!response.ok)throw Error('Model download failed: '+response.status);const partial=model+'.partial';await pipeline(Readable.fromWeb(response.body),createWriteStream(partial));if(!verify(partial))throw Error('Model checksum mismatch; partial file retained; existing config unchanged');renameSync(partial,model);}
if(!verify(model))throw Error('Existing model checksum mismatch');
writeFileSync(resolve(dir,name+'.json'),JSON.stringify({model,modelName:name,modelSha256:createHash('sha256').update(readFileSync(model)).digest('hex'),source:url,verifiedChecksum:entry,evidence:`https://huggingface.co/ggerganov/whisper.cpp/blob/main/ggml-${name}.bin`},null,2));console.log(`Verified ${name} model installed locally; existing config unchanged.`);

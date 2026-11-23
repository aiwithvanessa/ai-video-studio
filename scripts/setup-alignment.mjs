import {mkdirSync,existsSync,createWriteStream,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {Readable} from 'node:stream';import {pipeline} from 'node:stream/promises';import {createHash} from 'node:crypto';
if(!process.argv.includes('--download'))throw Error('Use --download (~95 MB English CTC model; CPU only)');
const folder='.local/alignment';mkdirSync(folder,{recursive:true});
const base='https://huggingface.co/onnx-community/wav2vec2-base-960h-ONNX/resolve/main/';
for(const [remote,name,hash] of [['onnx/model_quantized.onnx','model.onnx','1d9a366c27b2966625cd5035ac3db8847c53bba617169912bb251b42975a3a22'],['vocab.json','vocab.json'],['config.json','config.json'],['preprocessor_config.json','preprocessor_config.json']]){
 const file=folder+'/'+name;if(!existsSync(file)){const response=await fetch(base+remote);if(!response.ok)throw Error('Download failed: '+remote+' '+response.status);await pipeline(Readable.fromWeb(response.body),createWriteStream(file+'.partial'));if(hash&&createHash('sha256').update(readFileSync(file+'.partial')).digest('hex')!==hash)throw Error('Alignment model checksum mismatch');renameSync(file+'.partial',file);}
 if(hash&&createHash('sha256').update(readFileSync(file)).digest('hex')!==hash)throw Error('Existing model checksum mismatch');
}
writeFileSync(folder+'/evidence.json',JSON.stringify({model:'onnx-community/wav2vec2-base-960h-ONNX',source:base,modelSha256:'1d9a366c27b2966625cd5035ac3db8847c53bba617169912bb251b42975a3a22',upstream:'https://huggingface.co/facebook/wav2vec2-base-960h',upstreamLicense:'Apache-2.0',distribution:'Downloaded recipient-locally, not bundled'},null,2));console.log('CPU alignment model verified; no media uploaded.');

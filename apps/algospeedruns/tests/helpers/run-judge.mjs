import { Worker } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
const { timeoutMs } = JSON.parse(await readFile(new URL('../../src/data/judge-config.json',import.meta.url)));
export class TestJudge {
  worker;
  async start() {
    if (this.worker) return;
    const worker = this.worker = new Worker(new URL('./judge-worker.mjs',import.meta.url));
    await new Promise((resolve,reject) => {
      const timer=setTimeout(()=>reject(new Error('Test runtime failed to boot')),45000);
      worker.once('error',error=>{clearTimeout(timer);reject(error);});
      worker.once('message',message=>{clearTimeout(timer); message.type==='ready' ? resolve() : reject(new Error(JSON.stringify(message)));});
    });
  }
  async run(input) {
    await this.start();
    const worker=this.worker;
    return new Promise((resolve,reject)=>{
      let stage=null;
      const cleanup=()=>{clearTimeout(timer);worker.off('message',message);worker.off('error',error);};
      const timeout=()=>{
        cleanup(); void worker.terminate(); this.worker=null;
        resolve({passed:false,correctnessPassed:!!stage,performanceError:stage ? 'Performance time limit exceeded' : undefined,error:stage ? undefined : 'Correctness time limit exceeded',timedOut:true});
      };
      let timer=setTimeout(timeout,timeoutMs);
      const error=e=>{cleanup();reject(e);};
      const message=m=>{
        if (m.type==='performance') {
          if (!stage) {clearTimeout(timer);timer=setTimeout(timeout,timeoutMs);}
          stage=m;return;
        }
        cleanup();m.type==='error' ? reject(new Error(m.error)) : resolve(m.result);
      };
      worker.on('message',message);worker.once('error',error);worker.postMessage(input);
    });
  }
  async close() { if (this.worker) await this.worker.terminate();this.worker=null; }
}

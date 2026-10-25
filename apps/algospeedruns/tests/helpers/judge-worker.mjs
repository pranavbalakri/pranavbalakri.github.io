import { parentPort } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { loadPyodide } from 'pyodide';
const root = new URL('../../', import.meta.url);
const problems = JSON.parse(await readFile(new URL('src/data/problems.json',root)));
const hidden = JSON.parse(await readFile(new URL('src/data/hidden-tests.json',root)));
const runtime = await loadPyodide();
for (const file of ['work_budget.py','stress.py','harness.py']) runtime.runPython(await readFile(new URL(`src/lib/${file}`,root),'utf8'));
runtime.globals.set('_reference_source',await readFile(new URL('tests/helpers/efficient.py',root),'utf8'));
runtime.globals.set('_reference_problems',JSON.stringify(problems));
runtime.runPython(`
_reference_map = {}
for _node in _ast.parse(_reference_source).body:
    if isinstance(_node, _ast.FunctionDef):
        _slug = '3sum' if _node.name == 'three_sum' else _node.name.replace('_', '-')
        _problem = next(p for p in _json.loads(_reference_problems) if p['slug'] == _slug)
        _reference_map[_slug] = _ast.get_source_segment(_reference_source, _node) + '\\nclass Solution:\\n    ' + _problem['method'] + ' = staticmethod(' + _node.name + ')'
    elif isinstance(_node, _ast.ClassDef) and _node.name == 'Trie':
        _reference_map['implement-trie'] = _ast.get_source_segment(_reference_source, _node)
`);
runtime.globals.set('_lap_progress',(label,total,passedCount) => parentPort.postMessage({type:'performance',label,total,passedCount}));
parentPort.postMessage({type:'ready'});
parentPort.on('message',({slug,code,performance=true,cases,inspect=false}) => {
  try {
    if (inspect) {
      runtime.globals.set('_audit_slugs',JSON.stringify(problems.map(p=>p.slug)));
      const audit = JSON.parse(runtime.runPython(`_json.dumps([{'slug': slug, 'cases': len(_lap_stress_cases(slug)), 'reference': slug in _reference_map, 'work': [_stress_work_spec(slug,c)[0] for c in _lap_stress_cases(slug)]} for slug in _json.loads(_audit_slugs)])`));
      parentPort.postMessage({type:'result',result:audit}); return;
    }
    const problem=problems.find(p=>p.slug===slug);
    if (!code) { runtime.globals.set('_ref_slug',slug); code=runtime.runPython('_reference_map[_ref_slug]'); }
    const fixtures=cases ?? [...problem.examples.map(c=>({...c,hidden:false})),...hidden[slug].map(c=>({...c,hidden:true}))];
    runtime.globals.set('_test_payload',JSON.stringify({problem,code,cases:fixtures,performance}));
    const result=JSON.parse(runtime.runPython('_lap_judge(_test_payload)'));
    parentPort.postMessage({type:'result',result});
  } catch(error) { parentPort.postMessage({type:'error',error:String(error)}); }
});

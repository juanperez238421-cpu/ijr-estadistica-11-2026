import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const fail=(message)=>{throw new Error(message)};
const assert=(condition,message)=>{if(!condition)fail(message)};
const text=(value,min=3)=>typeof value==='string'&&value.trim().length>=min;
const read=(path)=>fs.readFileSync(path,'utf8');

function sandboxScript(path){
  const ctx={console};
  ctx.window=ctx;
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(read(path),ctx,{filename:path});
  return ctx;
}

function pythonCompileResult(code){
  return spawnSync('python3',['-c',"import sys; compile(sys.stdin.read(), '<qa-cell>', 'exec')"],{
    input:String(code||''),encoding:'utf8',timeout:5000
  });
}

function pythonCompile(code,label){
  const p=pythonCompileResult(code);
  assert(p.status===0,`${label}: Python syntax error\n${p.stderr||p.stdout}`);
}

function pythonRun(code,label){
  const p=spawnSync('python3',['-'],{input:String(code||''),encoding:'utf8',timeout:5000});
  assert(p.status===0,`${label}: reference Python cell raises at runtime\n${p.stderr||p.stdout}`);
}

const warnings=[];
let editRequiredScaffolds=0;

// 1) Five specialized project tracks.
{
  const ctx=sandboxScript('seminario-tracks/shared/track-data.js');
  const tracks=ctx.IJR_SPECIALIZED_TRACKS;
  const expected=['web','data-science','cybersecurity','3d-programming','robotics'];
  assert(tracks&&Object.keys(tracks).length===5,'Specialized catalog must contain exactly five tracks');
  const projectNames=new Set();
  for(const slug of expected){
    const track=tracks[slug];
    assert(track,`${slug}: missing track definition`);
    assert(text(track.title,4),`${slug}: title is incomplete`);
    assert(text(track.project,8),`${slug}: project frame is incomplete`);
    assert(Array.isArray(track.stack)&&track.stack.length>=3,`${slug}: stack requires at least three technologies/concepts`);
    assert(track.diagnostic?.totalQuestions===15,`${slug}: diagnostic must contain 15 items`);
    assert(track.diagnostic?.scoredQuestions===12,`${slug}: diagnostic must contain 12 scored items`);
    assert(track.diagnostic?.selfProfileQuestions===3,`${slug}: diagnostic must contain 3 self-profile items`);
    assert(Array.isArray(track.sprints)&&track.sprints.length===8,`${slug}: roadmap must contain eight sprints`);
    track.sprints.forEach((s,i)=>{
      assert(s.n===i+1,`${slug}: sprint numbering is not sequential at ${i+1}`);
      assert(text(s.title,5),`${slug} sprint ${i+1}: title is too short`);
      assert(text(s.goal,20),`${slug} sprint ${i+1}: goal lacks instructional detail`);
      assert(text(s.deliverable,10),`${slug} sprint ${i+1}: deliverable is underspecified`);
    });
    assert(!projectNames.has(track.project),`${slug}: project frame must be unique`);
    projectNames.add(track.project);
  }
  const cyber=tracks.cybersecurity;
  assert(/Defensive/i.test(cyber.title), 'Cybersecurity track must remain explicitly defensive');
  assert(/Secure|Audit/i.test(cyber.project), 'Cybersecurity project frame must remain defensive/audit-oriented');
}

// 2) OOP + UML theory curriculum and 50 guided coding cells.
{
  const courseCtx=sandboxScript('seminario-oop-uml/course-data.js');
  const data=courseCtx.IJR_OOP_UML_DATA;
  assert(Array.isArray(data?.topics)&&data.topics.length===10,'OOP + UML must expose exactly ten sessions');
  const slugs=new Set();
  data.topics.forEach((topic,i)=>{
    assert(topic.n===i+1,`OOP session ${i+1}: numbering mismatch`);
    assert(text(topic.slug,3),`OOP session ${i+1}: missing slug`);
    assert(!slugs.has(topic.slug),`OOP session ${i+1}: duplicate slug ${topic.slug}`);
    slugs.add(topic.slug);
    assert(text(topic.title,5),`OOP session ${i+1}: title incomplete`);
    assert(text(topic.lead,20),`OOP session ${i+1}: lead lacks conceptual detail`);
    assert(text(topic.uml?.name,2),`OOP session ${i+1}: UML class/model name missing`);
    assert(Array.isArray(topic.uml?.ops)&&topic.uml.ops.length>=1,`OOP session ${i+1}: UML operations missing`);
    // The curriculum intentionally defines three explicit mastery artifacts per session;
    // the separate model/code/test/explain persistence gate lives in workshop.js/store.js.
    assert(Array.isArray(topic.evidence)&&topic.evidence.length>=3,`OOP session ${i+1}: mastery evidence incomplete`);
  });

  const labCtx=sandboxScript('seminario-oop-uml/coding-labs-v2.js');
  const labs=labCtx.IJR_OOP_CODING_LABS;
  assert(labs&&Object.keys(labs).length===10,'Guided notebook catalog must contain ten sessions');
  let theoryCells=0, workshopCells=0, compilableCells=0;
  for(let n=1;n<=10;n++){
    const lab=labs[n];
    assert(lab,`Coding lab ${n}: missing`);
    assert(Array.isArray(lab.theory)&&lab.theory.length===2,`Coding lab ${n}: expected two theory cells`);
    assert(Array.isArray(lab.workshop)&&lab.workshop.length===3,`Coding lab ${n}: expected three workshop cells`);
    theoryCells+=lab.theory.length; workshopCells+=lab.workshop.length;
    [...lab.theory,...lab.workshop].forEach((cell,idx)=>{
      assert(text(cell.id,2),`Coding lab ${n} cell ${idx+1}: id missing`);
      assert(text(cell.title,4),`Coding lab ${n} cell ${idx+1}: title missing`);
      assert(text(cell.purpose,12),`Coding lab ${n} cell ${idx+1}: purpose lacks guidance`);
      assert(Array.isArray(cell.steps)&&cell.steps.length>=3,`Coding lab ${n} cell ${idx+1}: needs at least three guided steps`);
      assert(text(cell.code,1),`Coding lab ${n} cell ${idx+1}: code scaffold is empty`);
      const compiled=pythonCompileResult(cell.code);
      if(compiled.status===0){
        compilableCells++;
      }else{
        // Workshop scaffolds may deliberately contain an ellipsis placeholder that
        // students must replace before Run. Theory cells are never allowed this exception.
        const explicitEditPlaceholder=lab.workshop.includes(cell)&&/\.\.\./.test(cell.code);
        assert(explicitEditPlaceholder,`Session ${n} / ${cell.id}: unexpected Python syntax error\n${compiled.stderr||compiled.stdout}`);
        editRequiredScaffolds++;
      }
    });
    // Both theory cells must be valid Python; the first is the authoritative worked example.
    pythonCompile(lab.theory[0].code,`Session ${n} / theory reference`);
    pythonCompile(lab.theory[1].code,`Session ${n} / theory guided cell`);
    pythonRun(lab.theory[0].code,`Session ${n} / theory reference`);
  }
  assert(theoryCells===20&&workshopCells===30,'Expected 20 theory + 30 workshop guided cells');
  assert(compilableCells+editRequiredScaffolds===50,'Every guided cell must be classified by the syntax audit');
}

// 3) Browser/Pyodide runtime contract.
{
  const runtime=read('seminario-oop-uml/coding-runtime-v2.js');
  for(const marker of ['Pyodide 0.27.7','runPythonAsync','setStdout','setStderr','oopTerminalInput','runTerminalCommand','Ctrl/⌘ + Enter']){
    assert(runtime.includes(marker),`Embedded OOP runtime missing marker: ${marker}`);
  }
  const theory=read('seminario-oop-uml/theory.html');
  const workshop=read('seminario-oop-uml/workshop.html');
  assert(theory.includes('pyodide/v0.27.7/full/pyodide.js'),'Theory page does not load pinned Pyodide 0.27.7');
  assert(workshop.includes('pyodide/v0.27.7/full/pyodide.js'),'Workshop page does not load pinned Pyodide 0.27.7');
  assert(theory.includes('theoryCodingLab'),'Theory live notebook mount is missing');
  assert(workshop.includes('workshopCodingLab'),'Workshop live notebook mount is missing');
}

// 4) Standalone OOP Colab shell.
{
  const html=read('seminario-oop-colab-01/index.html');
  for(const marker of ['pyodide/v0.27.7/full/pyodide.js','codeEditor','runCodeButton','terminalOutput','terminalCommand']){
    assert(html.includes(marker),`Standalone OOP Colab missing ${marker}`);
  }
  if(/id="terminalCommand"[^>]*disabled/.test(html)){
    warnings.push('Standalone OOP Colab command-line input is disabled: code cells execute, but that console remains output-only.');
  }
}

// 5) Specialized diagnostic frontend/security contract and QA-v2 migration markers.
{
  const cfg=read('seminario-tracks/shared/config.js');
  const hub=read('seminario-tracks/shared/hub.js');
  const migration=read('supabase/migrations/20260831190025_seminar_specialized_diagnostic_qa_v2.sql');
  assert(cfg.includes("bankVersion:'2026-08-31-v2'"),'Specialized frontend must use QA-hardened bank v2');
  assert(!hub.includes('correct_option'),'Browser bundle must never contain diagnostic answer keys');
  assert(hub.includes('p_answers'),'Diagnostic submission payload missing');
  assert(hub.includes('localStorage'),'Diagnostic recovery path missing');
  assert(migration.includes("((q.position - 1) % 4)::smallint"),'V2 answer-key balancing rule missing');
  assert(migration.includes('greatest(jsonb_array_length(q.options)-1,1)'),'0–100 self-profile scaling rule missing');
  assert(migration.includes("set search_path = ''"),'Diagnostic SECURITY DEFINER functions must pin search_path');
}

// Current specialized scope is intentionally diagnosis + roadmap. Make this visible in QA output rather than pretending theory exists.
warnings.push('Specialized track routes currently contain Entry Diagnostic + 8-sprint roadmap only; dedicated Theory/Workshop/Colab pages for the five tracks are not implemented yet.');
if(editRequiredScaffolds>0){
  warnings.push(`${editRequiredScaffolds} student-edit scaffold(s) intentionally contain an ellipsis placeholder and must be edited before Run; all Theory cells are syntactically executable.`);
}

console.log('SEMINAR CONTENT AUDIT: PASS');
console.log('  5 specialized tracks · 40 sprints reviewed');
console.log('  10 OOP/UML sessions reviewed');
console.log('  50 guided Python cells structurally audited');
console.log('  20/20 Theory cells syntax-checked');
console.log('  10 reference Theory cells executed with CPython');
console.log('  Pyodide/terminal/security contracts verified');
for(const warning of warnings)console.log(`QA NOTE: ${warning}`);

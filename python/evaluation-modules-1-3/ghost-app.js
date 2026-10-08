(() => {
'use strict';
const $=id=>document.getElementById(id);
const qs=[
{id:'M123-01',m:1,t:'true_false',p:'True or False: in Python, the symbol ^ is the exponentiation operator.',c:['True','False']},
{id:'M123-02',m:1,t:'multiple_choice',p:'Which Python operator calculates a power?',c:['^','**','//','%%']},
{id:'M123-03',m:1,t:'multiple_choice',p:'Which sequence best describes the normal notebook workflow used in class?',c:['Write/edit → Run → Inspect output/error','Validate → Run → Write','Copy final answer → Refresh','Run → Close browser → Validate']},
{id:'M123-04',m:1,t:'short_text',p:'Write only the output produced by: a = 17; b = 8; print(a + b)'},
{id:'M123-05',m:1,t:'code',p:'Programming: create two variables with values 14 and 6, calculate their product in another variable, and print only the final result.'},
{id:'M123-06',m:1,t:'code',p:'Programming: store 81 in a variable, calculate its square root using ** 0.5, and print the result.'},
{id:'M123-07',m:2,t:'true_false',p:'True or False: the value "12" (with quotation marks) is an integer in Python.',c:['True','False']},
{id:'M123-08',m:2,t:'multiple_choice',p:'What is the Python type of the value 4.5?',c:['int','float','str','bool']},
{id:'M123-09',m:2,t:'multiple_choice',p:'Which option is the Boolean literal used by Python?',c:['true','TRUE','True','"True"']},
{id:'M123-10',m:2,t:'short_text',p:'Write only the short type name returned by type(None).__name__.'},
{id:'M123-11',m:2,t:'code',p:'Programming: store the text "25", convert it to an integer, add 5, and print only the calculated result.'},
{id:'M123-12',m:2,t:'code',p:'Programming: store the integer 7, convert it to a float in a second variable, and print the converted value.'},
{id:'M123-13',m:3,t:'true_false',p:'True or False: the first item of a Python list has index 0.',c:['True','False']},
{id:'M123-14',m:3,t:'multiple_choice',p:'For values = [6, 10, 15, 21], which index accesses the third item?',c:['1','2','3','4']},
{id:'M123-15',m:3,t:'multiple_choice',p:'Which built-in function returns the number of items in a Python list?',c:['sum(values)','len(values)','max(values)','count(values)']},
{id:'M123-16',m:3,t:'short_text',p:'Write only the value of sum([5, 10, 15]).'},
{id:'M123-17',m:3,t:'code',p:'Programming: create [4, 8], append 12 to the same list, then print the new number of items.'},
{id:'M123-18',m:3,t:'code',p:'Programming: create [10, 15, 5, 20], calculate the mean using sum(values) / len(values), and print the result.'}
];
function hideAll(){['startupPanel','examPanel','feedbackPanel','finishPanel'].forEach(id=>$(id)?.classList.add('hidden'));$('fullscreenGate')?.classList.add('hidden');$('lockGate')?.classList.add('hidden')}
function optionsHtml(q){
 if(q.t==='true_false'||q.t==='multiple_choice')return '<div class="options">'+q.c.map((x,i)=>'<label class="option"><input type="radio" name="evaluationAnswer" value="'+i+'"><span>'+x+'</span></label>').join('')+'</div>';
 if(q.t==='short_text')return '<textarea class="short-answer" rows="3" placeholder="Write your final response"></textarea>';
 return '<div class="code-shell"><div class="code-toolbar"><strong>Python 3 · code cell</strong><button class="run-button" type="button">▶ Run</button></div><textarea class="code-editor" spellcheck="false" placeholder="# Write your complete Python solution"></textarea><pre class="console">Python runtime ready to load when you press Run.</pre></div>';
}
function startup(){hideAll();$('startupPanel').classList.remove('hidden');$('availabilityBox').innerHTML='<strong>11A · QA ghost capture</strong><br>Read-only visual clone. No attempt is created.';$('teamForm').classList.remove('hidden');$('memberEmail1').value='qa.student11@ijr.edu.co';const r=document.querySelector('input[name="teamSize"][value="1"]');if(r)r.checked=true}
function question(index){const q=qs[index];hideAll();$('examPanel').classList.remove('hidden');$('moduleLabel').textContent='MODULE '+String(q.m).padStart(2,'0');$('questionNumber').textContent='Question '+(index+1)+' / 18';$('teamBadge').textContent='QA Student 11 · ghost capture';$('progressBar').style.width=(((index+1)/18)*100).toFixed(1)+'%';$('questionPrompt').textContent=q.p;$('answerMount').innerHTML=optionsHtml(q);$('answerPolicy').textContent=q.t==='code'?'Run this exact code successfully before confirming. The code and observed output are stored.':q.t==='short_text'?'Open response · one submission only.':'Confirm only when your final answer is ready.';$('confirmButton').disabled=false;$('timer').textContent='40:00';$('pointsMetric').textContent='18 / 18 pts';$('strikeMetric').textContent='0 / 3 exits'}
function finish(){hideAll();$('finishPanel').classList.remove('hidden');$('finishTitle').textContent='Evaluation submitted';$('finishSummary').innerHTML='<div><strong>18 / 18</strong><span>final raw points</span></div><div><strong>18</strong><span>correct answers</span></div><div><strong>0</strong><span>integrity exits</span></div>'}
document.addEventListener('DOMContentLoaded',()=>{document.documentElement.dataset.ghostCapture='true';const p=new URLSearchParams(location.search);const state=p.get('state')||'startup';if(state==='startup')return startup();if(state==='finish')return finish();const n=Math.max(1,Math.min(18,Number(p.get('q')||1)));question(n-1)});
})();
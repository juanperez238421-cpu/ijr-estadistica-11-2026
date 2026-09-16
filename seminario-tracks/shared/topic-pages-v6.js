(()=>{
'use strict';
const catalog=globalThis.IJR_SPECIALIZED_TRACKS;
const slug=document.body.dataset.track;
const track=catalog?.[slug];
if(!track)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const theoryHref=n=>`../theory.html?track=${encodeURIComponent(slug)}&stage=${n}`;
const workshopHref=n=>`../workshop.html?track=${encodeURIComponent(slug)}&stage=${n}`;
const doneKey=n=>`ijr-seminar-specialized-workshop-v6:${slug}:${n}:done`;
function isDone(n){return localStorage.getItem(doneKey(n))==='1'}
function sectionHtml(){
  const completed=track.stages.filter(s=>isDone(s.n)).length;
  const pct=Math.round(100*completed/track.stages.length);
  return `<section class="oop-parity-section-v6" id="specializedTopicsV6">
    <section class="hub-overview specialized-overview-v6">
      <div>
        <p class="eyebrow">SEMINAR 11 · SPECIALIZED TRACK</p>
        <h1>${esc(track.title)}</h1>
        <p>Use the same learning architecture as the OOP + UML Common Core: each technical topic has a dedicated <strong>Theory</strong> page and a separate <strong>Workshop</strong> for evidence, testing, modification, and explanation.</p>
        <div class="sequence-rule compact"><strong>Specialized mastery evidence</strong><span>Concept + technical model + implementation + test + modification + explanation.</span><small>The specialized route keeps the current diagnostic and project roadmap. This layer adds the OOP-style topic workflow without deleting existing content.</small></div>
      </div>
      <div class="global-progress-card">
        <span>Specialized topic progress</span>
        <strong>${pct}%</strong>
        <div class="progress-track"><span style="width:${pct}%"></span></div>
        <small>${completed} of ${track.stages.length} workshops completed on this browser</small>
      </div>
    </section>

    <section class="language-strip" aria-label="Specialized track context">
      <div><span class="mini-label">CURRENT TRACK</span><strong>${esc(track.title)}</strong></div>
      <div><span class="mini-label">TECHNICAL STACK</span><strong>${esc(track.stack.slice(0,3).join(' · '))}</strong></div>
      <div><span class="mini-label">ENGINEERING LOOP</span><strong>understand → model → implement → test → defend</strong></div>
    </section>

    <section class="topic-grid-heading">
      <p class="eyebrow">LEARN BY SPECIALIZED TOPIC</p>
      <h2>One topic · two dedicated pages</h2>
      <p>Study the technical model first. Then complete the corresponding workshop and produce evidence that connects the concept with the specialized project.</p>
    </section>
    <section class="hub-topic-grid" aria-live="polite">
      ${track.stages.map(stage=>{
        const done=isDone(stage.n);
        return `<article class="topic-card">
          <div class="topic-top"><span class="topic-index">TOPIC ${String(stage.n).padStart(2,'0')}</span><span class="topic-status ${done?'done':''}">${done?'Completed':'Available'}</span></div>
          <div><h3>${esc(stage.title)}</h3><p>${esc(stage.focus)}</p></div>
          <div class="topic-meta"><span>${esc(track.title)}</span><span>${esc(stage.language)}</span><span>${esc(stage.lab)}</span></div>
          <div class="topic-actions"><a class="button button-light" href="${theoryHref(stage.n)}">Theory</a><a class="button button-dark" href="${workshopHref(stage.n)}">Workshop</a></div>
        </article>`;
      }).join('')}
    </section>

    <section class="architecture-banner specialized-banner-v6">
      <div><p class="eyebrow">SPECIALIZED PROJECT CONNECTION</p><h2>${esc(track.project)}</h2><p>Each Theory + Workshop pair feeds the same eight-sprint project roadmap already present in this track. The quick-reference Theory + Coding content remains available below.</p></div>
      <a class="button button-dark" href="#roadmapAnchor">Open project roadmap</a>
    </section>
  </section>`;
}
function install(){
  if(document.getElementById('specializedTopicsV6'))return true;
  const learning=document.getElementById('learningAnchor')||document.querySelector('.learning-section');
  if(!learning)return false;
  learning.insertAdjacentHTML('beforebegin',sectionHtml());
  const head=learning.querySelector('.section-head');
  if(head&&!head.querySelector('.retained-label'))head.insertAdjacentHTML('afterbegin','<p class="eyebrow retained-label">QUICK REFERENCE · CURRENT CONTENT RETAINED</p>');
  learning.classList.add('retained-reference-v6');
  return true;
}
if(!install()){
  const obs=new MutationObserver(()=>{if(install())obs.disconnect();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),10000);
}
})();

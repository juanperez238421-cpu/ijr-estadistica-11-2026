(()=>{
'use strict';
const catalog=globalThis.IJR_SPECIALIZED_TRACKS;
const slug=document.body.dataset.track;
const track=catalog?.[slug];
if(!track)return;
const theoryHref=n=>`../theory.html?track=${encodeURIComponent(slug)}&stage=${n}`;
const workshopHref=n=>`../workshop.html?track=${encodeURIComponent(slug)}&stage=${n}`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cards(){return `<section class="section v5-topic-section" id="topicPagesV5"><div class="section-head"><p class="eyebrow">LEARN BY TOPIC · V5</p><h2>One topic · two dedicated pages.</h2><p>Use <strong>Theory</strong> to study the concept and worked code. Use <strong>Workshop</strong> to write, trace, modify, debug, test, and explain your own solution. The previous Theory + Coding overview remains below as a quick reference.</p></div><div class="topic-grid-v5">${track.stages.map(s=>`<article class="topic-card-v5"><div class="topic-top"><span class="topic-number">${String(s.n).padStart(2,'0')}</span><span class="topic-badge">Theory + Workshop</span></div><h3>${esc(s.title)}</h3><p>${esc(s.focus)}</p><div class="topic-concepts">${(s.concepts||[]).slice(0,3).map(c=>`<span>${esc(c)}</span>`).join('')}</div><div class="topic-actions"><a class="button button-light" href="${theoryHref(s.n)}">Theory</a><a class="button button-dark" href="${workshopHref(s.n)}">Workshop</a></div></article>`).join('')}</div></section>`}
function install(){
  if(document.getElementById('topicPagesV5'))return true;
  const learning=document.getElementById('learningAnchor')||document.querySelector('.learning-section');
  if(!learning)return false;
  learning.insertAdjacentHTML('beforebegin',cards());
  const head=learning.querySelector('.section-head');
  if(head){head.insertAdjacentHTML('afterbegin','<p class="eyebrow retained-label">QUICK REFERENCE · CURRENT CONTENT RETAINED</p>');}
  learning.classList.add('retained-reference-v5');
  return true;
}
if(!install()){
  const obs=new MutationObserver(()=>{if(install())obs.disconnect();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),10000);
}
})();

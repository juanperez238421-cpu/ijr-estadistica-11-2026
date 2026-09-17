(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const topicSlug = params.get('topic') || 'statistics';
  const masterPreview = params.get('masterPreview') === '1';
  if (masterPreview) return;

  const ACTIVE_TEAM_KEY = `ijr-stat11-active-workshop-team-v48:${topicSlug}`;
  const $ = id => document.getElementById(id);

  function readJson(key){
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function topicTitle(){
    const topic = window.IJR_PYTHON_HUB_TOPIC_MAP?.[topicSlug] || (window.IJR_PYTHON_HUB_TOPICS || []).find(item => item.slug === topicSlug);
    return topic?.title || topicSlug.replace(/-/g,' ');
  }

  function currentSize(){
    const checked = document.querySelector('input[name="stat11TeamSize"]:checked');
    return Math.max(1, Math.min(3, Number(checked?.value || 2)));
  }

  function updateMemberVisibility(){
    const size = currentSize();
    for(let i=1;i<=3;i++){
      const wrap = $(`stat11TeamMember${i}`);
      const input = $(`stat11TeamName${i}`);
      const active = i <= size;
      wrap?.classList.toggle('hidden', !active);
      if(input){
        input.required = active;
        if(!active) input.value = '';
      }
    }
  }

  function buildGate(session){
    const gate = document.createElement('div');
    gate.id = 'stat11TeamGate';
    gate.className = 'stat11-team-gate';
    gate.setAttribute('role','dialog');
    gate.setAttribute('aria-modal','true');
    gate.setAttribute('aria-labelledby','stat11TeamTitle');
    const group = session?.groupCode || '11';
    gate.innerHTML = `
      <div class="stat11-team-card">
        <div class="stat11-team-kicker">Statistics 11 · ${esc(group)} · Workshop start</div>
        <h1 id="stat11TeamTitle">Who is working at this computer?</h1>
        <p class="stat11-team-lead"><strong>${esc(topicTitle())}</strong><br>Before the workshop starts, register every student who will work together at this computer.</p>
        <div class="stat11-team-lab-note">
          <div>🖥️</div>
          <div><strong>Computer-lab team registration</strong>The laboratory has 9 computers, so each workstation may be used by 1, 2 or 3 students. This selection is recorded for this workshop session.</div>
        </div>
        <form id="stat11TeamForm" novalidate>
          <span class="stat11-team-size-label">How many students are participating?</span>
          <div class="stat11-team-size-options" role="radiogroup" aria-label="Number of participating students">
            <label class="stat11-team-size-option"><input type="radio" name="stat11TeamSize" value="1"><span>1 student</span></label>
            <label class="stat11-team-size-option"><input type="radio" name="stat11TeamSize" value="2" checked><span>2 students</span></label>
            <label class="stat11-team-size-option"><input type="radio" name="stat11TeamSize" value="3"><span>3 students</span></label>
          </div>
          <div class="stat11-team-members">
            <div class="stat11-team-member" id="stat11TeamMember1"><label for="stat11TeamName1">Student 1 · full name</label><input id="stat11TeamName1" autocomplete="off" required placeholder="Full name"></div>
            <div class="stat11-team-member" id="stat11TeamMember2"><label for="stat11TeamName2">Student 2 · full name</label><input id="stat11TeamName2" autocomplete="off" required placeholder="Full name"></div>
            <div class="stat11-team-member hidden" id="stat11TeamMember3"><label for="stat11TeamName3">Student 3 · full name</label><input id="stat11TeamName3" autocomplete="off" placeholder="Full name"></div>
          </div>
          <div class="stat11-team-foot">
            <div id="stat11TeamStatus" class="stat11-team-status">The selected team applies to this workshop session only.</div>
            <button id="stat11TeamStart" class="stat11-team-start" type="submit">Start workshop</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(gate);
    document.documentElement.classList.add('stat11-team-gate-open');
    gate.querySelectorAll('input[name="stat11TeamSize"]').forEach(input => input.addEventListener('change', updateMemberVisibility));
    updateMemberVisibility();
    setTimeout(()=>$('stat11TeamName1')?.focus(),0);
    return gate;
  }

  function namesFromForm(){
    const size = currentSize();
    return Array.from({length:size},(_,index)=>String($(`stat11TeamName${index+1}`)?.value || '').trim().replace(/\s+/g,' '));
  }

  function validateNames(names){
    if(names.some(name => name.length < 2)) return 'Write the full name of every participating student.';
    const normalized = names.map(name => name.toLocaleLowerCase());
    if(new Set(normalized).size !== normalized.length) return 'Do not repeat the same student in this team.';
    return '';
  }

  function renderTeamChip(data){
    const actions = document.querySelector('.titlebar-actions');
    if(!actions || !data) return;
    let chip = $('stat11ActiveTeamChip');
    if(!chip){
      chip = document.createElement('span');
      chip.id = 'stat11ActiveTeamChip';
      chip.className = 'stat11-team-chip';
      actions.prepend(chip);
    }
    chip.textContent = `${data.team_size} student${Number(data.team_size)===1?'':'s'} · ${data.team_label}`;
    chip.title = `Workshop team: ${data.team_label}`;
  }

  async function startTeam(session,names){
    const cfg = window.IJR_PYTHON_HUB_CONFIG;
    if(!cfg) throw new Error('Learning Hub configuration is unavailable.');
    if(!window.supabase?.createClient) throw new Error('Supabase connection library did not load. Refresh the page and try again.');
    if(!session?.registrationId || !session?.accessToken) throw new Error('Your Statistics 11 session is missing. Return to the Learning Hub and sign in again.');

    const client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
    });
    const {data,error} = await client.rpc('python_hub_start_workshop_team_v1',{
      p_registration_id:session.registrationId,
      p_access_token:session.accessToken,
      p_topic_slug:topicSlug,
      p_student_names:names,
      p_session_id:crypto.randomUUID(),
      p_user_agent:navigator.userAgent
    });
    if(error) throw new Error(error.message || 'The workshop team could not be registered.');
    return data;
  }

  async function init(){
    const cfg = window.IJR_PYTHON_HUB_CONFIG;
    if(!cfg) return;
    const session = readJson(cfg.sessionStorageKey);
    if(!session?.registrationId || !session?.accessToken){
      const page = location.pathname.split('/').pop() || 'workshop.html';
      const returnTo = `${page}?topic=${encodeURIComponent(topicSlug)}`;
      location.replace(`./?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    sessionStorage.removeItem(ACTIVE_TEAM_KEY);
    const gate = buildGate(session);
    const form = $('stat11TeamForm');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const status = $('stat11TeamStatus');
      const button = $('stat11TeamStart');
      const names = namesFromForm();
      const issue = validateNames(names);
      if(issue){
        status.textContent = issue;
        status.className = 'stat11-team-status error';
        return;
      }
      button.disabled = true;
      status.textContent = 'Registering this workstation team…';
      status.className = 'stat11-team-status';
      try{
        const data = await startTeam(session,names);
        sessionStorage.setItem(ACTIVE_TEAM_KEY,JSON.stringify(data));
        window.IJR_PYTHON_HUB_ACTIVE_WORKSHOP_TEAM = Object.freeze(data);
        renderTeamChip(data);
        document.documentElement.classList.remove('stat11-team-gate-open');
        gate.remove();
        window.dispatchEvent(new CustomEvent('ijr:stat11-workshop-team-started',{detail:data}));
      }catch(error){
        status.textContent = String(error?.message || error);
        status.className = 'stat11-team-status error';
        button.disabled = false;
      }
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

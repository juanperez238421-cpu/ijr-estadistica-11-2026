(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const topicSlug = params.get('topic') || 'statistics';
  const masterPreview = params.get('masterPreview') === '1';
  if (masterPreview) return;

  const ACTIVE_TEAM_KEY = `ijr-stat11-active-workshop-team-v50:${topicSlug}`;
  const $ = id => document.getElementById(id);

  function readJson(key){
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function normalizeEmail(value){
    return String(value || '').trim().toLowerCase();
  }

  function validInstitutionalEmail(value){
    return /^[^@\s]+@ijr\.edu\.co$/i.test(normalizeEmail(value));
  }

  function topicTitle(){
    const topic = window.IJR_PYTHON_HUB_TOPIC_MAP?.[topicSlug] || (window.IJR_PYTHON_HUB_TOPICS || []).find(item => item.slug === topicSlug);
    return topic?.title || topicSlug.replace(/-/g,' ');
  }

  function currentSize(){
    const checked = document.querySelector('input[name="stat11TeamSize"]:checked');
    return checked ? Number(checked.value) : 0;
  }

  function updateMemberVisibility(){
    const size = currentSize();
    for(let i=1;i<=3;i++){
      const wrap = $(`stat11TeamMember${i}`);
      const input = $(`stat11TeamEmail${i}`);
      const active = i === 1 || i <= size;
      wrap?.classList.toggle('hidden', !active);
      if(input){
        input.required = active;
        if(!active && i>1) input.value = '';
      }
    }
  }

  function returnToHub(){
    const page = location.pathname.split('/').pop() || 'workshop.html';
    const returnTo = `${page}?topic=${encodeURIComponent(topicSlug)}`;
    location.replace(`./?returnTo=${encodeURIComponent(returnTo)}`);
  }

  function buildGate(session,ownerEmail){
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
        <p class="stat11-team-lead"><strong>${esc(topicTitle())}</strong><br>Register every participant with the institutional email that identifies their Statistics 11 progress.</p>
        <div class="stat11-team-lab-note">
          <div>🖥️</div>
          <div><strong>9-computer laboratory</strong>Each workstation can be used by 1, 2 or 3 students. Validated workshop progress is synchronized to every institutional account registered here.</div>
        </div>
        <form id="stat11TeamForm" novalidate>
          <span class="stat11-team-size-label">How many students are participating?</span>
          <div class="stat11-team-size-options" role="radiogroup" aria-label="Number of participating students">
            <label class="stat11-team-size-option"><input type="radio" name="stat11TeamSize" value="1"><span>1 student</span></label>
            <label class="stat11-team-size-option"><input type="radio" name="stat11TeamSize" value="2"><span>2 students</span></label>
            <label class="stat11-team-size-option"><input type="radio" name="stat11TeamSize" value="3"><span>3 students</span></label>
          </div>
          <div class="stat11-team-members">
            <div class="stat11-team-member" id="stat11TeamMember1">
              <label for="stat11TeamEmail1">Student 1 · institutional email</label>
              <input id="stat11TeamEmail1" type="email" autocomplete="email" required readonly value="${esc(ownerEmail)}" aria-describedby="stat11TeamOwnerNote">
              <small id="stat11TeamOwnerNote">Verified Learning Hub account currently using this computer.</small>
            </div>
            <div class="stat11-team-member hidden" id="stat11TeamMember2">
              <label for="stat11TeamEmail2">Student 2 · institutional email</label>
              <input id="stat11TeamEmail2" type="email" autocomplete="off" placeholder="student@ijr.edu.co">
            </div>
            <div class="stat11-team-member hidden" id="stat11TeamMember3">
              <label for="stat11TeamEmail3">Student 3 · institutional email</label>
              <input id="stat11TeamEmail3" type="email" autocomplete="off" placeholder="student@ijr.edu.co">
            </div>
          </div>
          <div class="stat11-team-foot">
            <div id="stat11TeamStatus" class="stat11-team-status">Choose 1, 2 or 3 students, then use only @ijr.edu.co institutional emails.</div>
            <button id="stat11TeamStart" class="stat11-team-start" type="submit">Start workshop</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(gate);
    document.documentElement.classList.add('stat11-team-gate-open');
    gate.querySelectorAll('input[name="stat11TeamSize"]').forEach(input => input.addEventListener('change', () => {
      updateMemberVisibility();
      const size=currentSize();
      if(size>=2) setTimeout(()=>$('stat11TeamEmail2')?.focus(),0);
    }));
    updateMemberVisibility();
    return gate;
  }

  function emailsFromForm(){
    const size = currentSize();
    if(size < 1 || size > 3) return [];
    return Array.from({length:size},(_,index)=>normalizeEmail($(`stat11TeamEmail${index+1}`)?.value));
  }

  function validateEmails(emails,ownerEmail){
    if(emails.length<1 || emails.length>3) return 'Select exactly how many students are participating: 1, 2 or 3.';
    if(emails[0]!==ownerEmail) return 'Student 1 must be the institutional account currently signed in.';
    if(emails.some(email => !validInstitutionalEmail(email))) return 'Every participant must use a valid @ijr.edu.co institutional email.';
    if(new Set(emails).size !== emails.length) return 'Do not repeat the same institutional email in this team.';
    return '';
  }

  async function postRpc(cfg,name,args){
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try{
      const response = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`,{
        method:'POST',
        headers:{
          apikey:cfg.supabasePublishableKey,
          'Content-Type':'application/json',
          Accept:'application/json'
        },
        body:JSON.stringify(args || {}),
        cache:'no-store',
        signal:controller.signal
      });
      const raw = await response.text();
      let payload = null;
      try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw || null; }
      if(!response.ok){
        throw new Error(payload?.message || payload?.details || `Workshop registration failed (${response.status}).`);
      }
      return payload;
    }catch(error){
      if(error?.name === 'AbortError') throw new Error('Workshop registration timed out. Check the connection and try again.');
      throw error;
    }finally{
      clearTimeout(timeout);
    }
  }

  async function startTeam(cfg,session,emails){
    if(!session?.registrationId || !session?.accessToken) throw new Error('Your Statistics 11 learning session is missing. Return to the Learning Hub and sign in again.');
    return postRpc(cfg,'python_hub_start_workshop_team_v3',{
      p_registration_id:session.registrationId,
      p_access_token:session.accessToken,
      p_topic_slug:topicSlug,
      p_student_emails:emails,
      p_session_id:crypto.randomUUID(),
      p_user_agent:navigator.userAgent
    });
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
    const members = Array.isArray(data.members) ? data.members.map(member => member.institutional_email || member.display_name).filter(Boolean) : [];
    const label = members.length ? members.join(' · ') : data.team_label;
    chip.textContent = `${data.team_size} student${Number(data.team_size)===1?'':'s'} · ${label}`;
    chip.title = 'Validated progress from this workstation is synchronized to these institutional accounts.';
  }

  async function init(){
    const cfg = window.IJR_PYTHON_HUB_CONFIG;
    if(!cfg) return;

    const session = readJson(cfg.sessionStorageKey);
    if(!session?.registrationId || !session?.accessToken){
      returnToHub();
      return;
    }

    const ownerEmail = normalizeEmail(session?.emails?.[0]);
    if(!validInstitutionalEmail(ownerEmail)){
      returnToHub();
      return;
    }

    sessionStorage.removeItem(ACTIVE_TEAM_KEY);
    const gate = buildGate(session,ownerEmail);
    const form = $('stat11TeamForm');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const status = $('stat11TeamStatus');
      const button = $('stat11TeamStart');
      const emails = emailsFromForm();
      const issue = validateEmails(emails,ownerEmail);
      if(issue){
        status.textContent = issue;
        status.className = 'stat11-team-status error';
        return;
      }

      button.disabled = true;
      status.textContent = 'Registering institutional accounts and loading workshop progress…';
      status.className = 'stat11-team-status';
      try{
        const data = await startTeam(cfg,session,emails);
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

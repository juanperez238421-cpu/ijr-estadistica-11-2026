(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function setNetworkState() {
    const badge = $('networkBadge');
    if (!badge) return;
    const online = navigator.onLine !== false;
    badge.textContent = online ? 'Online' : 'Offline';
    badge.classList.toggle('attention', !online);
    badge.title = online
      ? 'Internet connection detected. Backend validations can sync.'
      : 'No internet connection detected. Python already loaded may keep running locally, but grading cannot sync until the connection returns.';
  }

  function configureInstitutionalEmailRegistration() {
    const inputs = [$('studentName1'), $('studentName2'), $('studentName3')].filter(Boolean);
    inputs.forEach((input,index) => {
      input.type = 'email';
      input.inputMode = 'email';
      input.autocomplete = 'email';
      input.placeholder = `student${index + 1}@ijr.edu.co`;
      input.pattern = '[A-Za-z0-9.!#$%&*+/=?^_`{|}~-]+@ijr\\.edu\\.co';
      input.title = 'Use the institutional email ending in @ijr.edu.co';
      const label = input.closest('label');
      if (label && label.firstChild?.nodeType === Node.TEXT_NODE) {
        label.firstChild.nodeValue = `Student ${index + 1} institutional email `;
      }
    });
    const legend = document.querySelector('.team-fieldset legend');
    if (legend) legend.innerHTML = 'Institutional emails <small>· Correos institucionales</small>';
    const before = document.querySelector('.registration-actions div span');
    if (before) before.textContent = 'enter the @ijr.edu.co email of each student working at this computer. A student may register again later if a new session is needed.';
    const privacy = document.querySelector('.privacy-note');
    if (privacy) privacy.innerHTML = 'Only <strong>@ijr.edu.co</strong> institutional emails are accepted. A new registration creates a new session; network retries reuse the same session safely. <small>Se permite un nuevo registro si es necesario.</small>';
  }

  window.addEventListener('online', setNetworkState);
  window.addEventListener('offline', setNetworkState);
  setNetworkState();
  configureInstitutionalEmailRegistration();

  if (window.supabase?.createClient) {
    const nativeCreateClient = window.supabase.createClient.bind(window.supabase);
    const networkError = error => /fetch|network|failed|timeout|connection|abort|load/i.test(String(error?.message||error||''));
    const cpOf = (snapshot,key) => Array.from(snapshot?.checkpoints||[]).find(cp=>cp.key===key)||null;

    window.supabase.createClient = (...args) => {
      const client = nativeCreateClient(...args);
      const nativeRpc = client.rpc.bind(client);
      async function raw(name,params={}) { return await nativeRpc(name,params); }
      async function resume(params,attempts=3) {
        let last;
        for(let i=0;i<attempts;i++){
          last=await raw('student_learning_activity_resume',{p_attempt_id:params.p_attempt_id,p_attempt_token:params.p_attempt_token});
          if(!last?.error)return last;
          if(!networkError(last.error))return last;
          await sleep(250+350*i);
        }
        return last;
      }

      client.rpc = async (name,params={}) => {
        if(name==='student_learning_activity_resume') return resume(params,3);
        if(name==='student_learning_activity_start_team' || name==='student_learning_activity_start_team_email') {
          const startParams={...params};
          if(name==='student_learning_activity_start_team_email' && Object.prototype.hasOwnProperty.call(startParams,'p_student_names')) {
            startParams.p_student_emails=startParams.p_student_names;
            delete startParams.p_student_names;
          }
          let result=await raw(name,startParams);
          if(result?.error&&networkError(result.error)){
            await sleep(450);
            result=await raw(name,startParams);
          }
          return result;
        }

        const recoverable=new Set(['student_learning_activity_submit','student_learning_activity_use_help','student_learning_activity_reveal_solution','student_learning_activity_skip_stage']);
        if(!recoverable.has(name)) return raw(name,params);

        const beforeResult=await resume(params,2);
        const before=beforeResult?.data?.snapshot||null;
        const result=await raw(name,params);
        if(!result?.error||!networkError(result.error))return result;
        if(!before)return result;

        await sleep(350);
        const afterResult=await resume(params,3);
        const after=afterResult?.data?.snapshot||null;
        if(!after)return result;

        const key=params.p_checkpoint_key;
        const prev=cpOf(before,key),next=cpOf(after,key);
        if(!next)return result;

        if(name==='student_learning_activity_submit'){
          const committed=(!prev?.completed&&next.completed)||Number(next.wrong_attempts||0)>Number(prev?.wrong_attempts||0);
          if(committed)return {data:{correct:!!next.correct,awarded_points:Number(next.awarded_points||0),wrong_attempts:Number(next.wrong_attempts||0),stage_potential:Number(next.stage_potential??next.awarded_points??0),snapshot:after,recovered_after_network_error:true},error:null};
        }
        if(name==='student_learning_activity_use_help'){
          const beforeUsed=Number(before?.help_tokens_used||0),afterUsed=Number(after?.help_tokens_used||0);
          if(afterUsed>beforeUsed)return {data:{help_level:Number(next.help_count||1),help_tokens_used:afterUsed,help_tokens_remaining:Number(after.help_tokens_remaining||0),stage_potential:Number(next.stage_potential??0),snapshot:after,recovered_after_network_error:true},error:null};
        }
        if(name==='student_learning_activity_reveal_solution'&&next.completed&&next.completion_mode==='revealed'){
          return {data:{expected_answer:next.expected_answer??next.latest_answer??'',awarded_points:Number(next.awarded_points||0),snapshot:after,recovered_after_network_error:true},error:null};
        }
        if(name==='student_learning_activity_skip_stage'&&next.completed&&next.completion_mode==='skipped'){
          return {data:{snapshot:after,recovered_after_network_error:true},error:null};
        }
        return result;
      };
      return client;
    };
  }

  if (typeof window.loadPyodide === 'function') {
    const nativeLoadPyodide = window.loadPyodide;
    let slot = Number(sessionStorage.getItem('ijr-colab-runtime-slot-v7'));
    if (!Number.isInteger(slot) || slot < 0 || slot > 8) {
      slot = Math.floor(Math.random() * 9);
      sessionStorage.setItem('ijr-colab-runtime-slot-v7', String(slot));
    }
    let firstLoad = true;
    window.loadPyodide = async options => {
      if (firstLoad) { firstLoad = false; await sleep(slot * 110); }
      return nativeLoadPyodide(options);
    };
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw-v7.js', {scope:'./'}).catch(err => console.warn('Classroom service worker unavailable', err));
    });
  }
})();

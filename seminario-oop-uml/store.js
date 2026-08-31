function uuid(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16);});}
function cleanName(v){return String(v||'').trim().replace(/\s+/g,' ');}
function teamLabel(names){return names.map(cleanName).filter(Boolean).join(' · ');}

export class OopUmlStore{
  constructor(config){
    this.cfg=config;this.sb=null;this.attempt=null;
    if(globalThis.supabase){
      this.sb=globalThis.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    }
  }
  async rpc(name,args={}){if(!this.sb)throw new Error('Supabase client unavailable');const {data,error}=await this.sb.rpc(name,args);if(error)throw new Error(error.message||'Backend RPC error');return data;}
  save(a){this.attempt=a;localStorage.setItem(this.cfg.localKey,JSON.stringify(a));return a;}
  load(){try{return JSON.parse(localStorage.getItem(this.cfg.localKey)||'null');}catch{return null;}}
  current(){return this.attempt;}
  fromCourse(snapshot,token,previous={}){
    const names=(snapshot.participants||[]).map(x=>x.display_name).filter(Boolean);
    return {id:snapshot.attempt_id,token,backend:'supabase',language:snapshot.language||previous.language||'python',group:snapshot.group_code||previous.group||'',names:names.length?names:(previous.names||[]),label:snapshot.team_label||snapshot.student_label||teamLabel(names.length?names:(previous.names||[])),sessions:previous.sessions||{},startedAt:snapshot.started_at||previous.startedAt||new Date().toISOString()};
  }
  mergeUml(a,snapshot){
    const sessions={};for(const s of snapshot?.sessions||[])sessions[s.session_key]={status:s.status||'completed',evidence:s.evidence||{},completedAt:s.completed_at||null,updatedAt:s.updated_at||null};
    return {...a,language:snapshot?.language||a.language,group:snapshot?.group_code||a.group,sessions};
  }
  async restore(){
    const local=this.load();
    const raw=sessionStorage.getItem(this.cfg.sessionKey);
    if(raw&&this.sb){
      try{
        const key=JSON.parse(raw);
        const course=await this.rpc(this.cfg.rpc.resume,{p_attempt_id:key.attemptId,p_attempt_token:key.token});
        let a=this.fromCourse(course.snapshot||course,key.token,local||{});
        const uml=await this.rpc(this.cfg.rpc.umlSnapshot,{p_attempt_id:a.id,p_attempt_token:a.token});
        a=this.mergeUml(a,uml);return this.save(a);
      }catch(err){console.warn('OOP UML backend resume failed; local recovery copy used.',err);}
    }
    if(local){this.attempt=local;return local;}return null;
  }
  async start({language,group,names}){
    names=names.map(cleanName).filter(Boolean);
    if(!['python','java'].includes(language))throw new Error('Select Python or Java.');
    if(!/^11-[ABC]$/.test(group))throw new Error('Select group 11-A, 11-B or 11-C.');
    if(names.length<1||names.length>3)throw new Error('Register between 1 and 3 students.');
    if(new Set(names.map(n=>n.toLocaleLowerCase('es'))).size!==names.length)throw new Error('Do not repeat the same student in a team.');
    if(this.sb){
      const data=await this.rpc(this.cfg.rpc.start,{p_course_slug:this.cfg.courseSlug,p_language:language,p_student_names:names,p_group_code:group,p_session_id:uuid(),p_user_agent:navigator.userAgent});
      sessionStorage.setItem(this.cfg.sessionKey,JSON.stringify({attemptId:data.attempt_id,token:data.attempt_token}));
      let a=this.fromCourse(data.snapshot,data.attempt_token,{language,group,names,label:teamLabel(names),sessions:{}});
      const uml=await this.rpc(this.cfg.rpc.umlSnapshot,{p_attempt_id:a.id,p_attempt_token:a.token});
      a=this.mergeUml(a,uml);return this.save(a);
    }
    return this.save({id:uuid(),token:null,backend:'local',language,group,names,label:teamLabel(names),sessions:{},startedAt:new Date().toISOString()});
  }
  async refresh(){
    if(!this.attempt)return null;
    if(this.attempt.backend==='supabase'&&this.attempt.token){
      try{const uml=await this.rpc(this.cfg.rpc.umlSnapshot,{p_attempt_id:this.attempt.id,p_attempt_token:this.attempt.token});return this.save(this.mergeUml(this.attempt,uml));}catch(err){console.warn('Progress refresh failed.',err);}
    }
    return this.attempt;
  }
  async recordSession(sessionKey,evidence){
    if(!this.attempt)throw new Error('Register before recording evidence.');
    const complete=['model','code','test','explain'].every(k=>evidence?.[k]===true);
    if(!complete)throw new Error('Complete model, code, test and explanation evidence first.');
    if(this.attempt.backend==='supabase'&&this.attempt.token){
      const snap=await this.rpc(this.cfg.rpc.recordSession,{p_attempt_id:this.attempt.id,p_attempt_token:this.attempt.token,p_session_key:sessionKey,p_evidence:{...evidence,source:'statistics-pages-oop-uml-v1'}});
      return this.save(this.mergeUml(this.attempt,snap));
    }
    this.attempt.sessions=this.attempt.sessions||{};this.attempt.sessions[sessionKey]={status:'completed',evidence,completedAt:new Date().toISOString()};return this.save(this.attempt);
  }
  reset(){sessionStorage.removeItem(this.cfg.sessionKey);localStorage.removeItem(this.cfg.localKey);this.attempt=null;}
}

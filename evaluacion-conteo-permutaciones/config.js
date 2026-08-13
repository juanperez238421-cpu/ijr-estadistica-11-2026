const IJR_IOS_MOBILE = /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

window.IJR_ASSESSMENT_CONFIG = Object.freeze({
  assessmentSlug: 'statistics11-counting-permutations-2026',
  supabaseUrl: 'https://rlfxnjbqxbozjdzkbwlz.supabase.co',
  supabaseAnonKey: 'sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87',
  durationMinutes: 40,
  questionsPerAttempt: 18,
  maxRawPoints: 15,
  gradeMin: 3.0,
  gradeMax: 5.0,
  passingGrade: 3.0,
  tabStrikeLimit: 3,
  hiddenGraceMs: IJR_IOS_MOBILE ? 2500 : 1000,
  integrityDebounceMs: IJR_IOS_MOBILE ? 2200 : 1600,
  heartbeatMs: 10000,
  requireFullscreen: !IJR_IOS_MOBILE,
  fullscreenPolicy: 'pause',
  fullscreenExitCountsAsStrike: !IJR_IOS_MOBILE,
  screenshotKeyCountsAsStrike: true,
  duplicateTabCountsAsStrike: true,
  blockCopyPaste: true,
  blockContextMenu: true,
  watermarkEnabled: true,
  requireStudentEmail: true,
  globallyDisjointQuestions: true,
  studentSessionStorageKey: 'ijr-stat11-counting-permutations-active-v2',
  reportEmail: 'juanperez238421@gmail.com',
  rpc: {
    start: 'student_start_attempt_v2',
    resume: 'student_resume_attempt',
    submit: 'student_submit_answer',
    event: 'student_log_event',
    finish: 'student_finish_attempt'
  },
  teacherRpc: {
    login: 'teacher_code_login',
    logout: 'teacher_code_logout',
    snapshot: 'teacher_dashboard_snapshot',
    detail: 'teacher_attempt_detail',
    action: 'teacher_code_action',
    startTest: 'teacher_start_smoke_test',
    setEmail: 'teacher_set_report_email'
  }
});

(() => {
  'use strict';

  window.IJR_PYTHON_HUB_CONFIG = Object.freeze({
    supabaseUrl: 'https://rlfxnjbqxbozjdzkbwlz.supabase.co',
    supabasePublishableKey: 'sb_publishable_rmVOQ3Orx49KpW_4uMqYew_c2HpcA87',
    institutionalEmailDomain: 'ijr.edu.co',
    driveSpreadsheetId: '1ecOV9hTbOxZbj2SN__8vzBWuVedG-1d5HpRxdTYoT2U',
    // Paste the deployed Google Apps Script Web App /exec URL here before production cutover.
    driveApiUrl: '__SET_AFTER_APPS_SCRIPT_DEPLOY__',
    browserStateKey: 'ijr-stat11-python-hub-drive-v4',
    allowedBridgeOrigins: Object.freeze([
      'https://script.google.com',
      'https://script.googleusercontent.com'
    ])
  });
})();

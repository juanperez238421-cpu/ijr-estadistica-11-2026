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

  window.addEventListener('online', setNetworkState);
  window.addEventListener('offline', setNetworkState);
  setNetworkState();

  // Avoid a 9-computer burst hitting the heavy Pyodide bootstrap at the exact same millisecond.
  // Every browser keeps one stable slot for the session; maximum added delay is < 1 second.
  if (typeof window.loadPyodide === 'function') {
    const nativeLoadPyodide = window.loadPyodide;
    let slot = Number(sessionStorage.getItem('ijr-colab-runtime-slot-v7'));
    if (!Number.isInteger(slot) || slot < 0 || slot > 8) {
      slot = Math.floor(Math.random() * 9);
      sessionStorage.setItem('ijr-colab-runtime-slot-v7', String(slot));
    }
    let firstLoad = true;
    window.loadPyodide = async options => {
      if (firstLoad) {
        firstLoad = false;
        await sleep(slot * 110);
      }
      return nativeLoadPyodide(options);
    };
  }

  // Cache the classroom shell and large CDN runtime files after first use.
  // This materially improves reload/recovery on the same workstation if Wi-Fi becomes unstable.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw-v7.js', {scope:'./'}).catch(err => {
        console.warn('Classroom service worker unavailable', err);
      });
    });
  }
})();

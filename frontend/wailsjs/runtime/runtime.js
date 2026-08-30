/*
 * Isomorphic Wails Runtime for Antigravity Writer
 * Supports both Desktop Wails runtime and in-browser fallback.
 */

export function LogPrint(message) {
  if (typeof window !== 'undefined' && window.runtime?.LogPrint) return window.runtime.LogPrint(message);
  console.log('[WailsLog]', message);
}

export function LogTrace(message) {
  if (typeof window !== 'undefined' && window.runtime?.LogTrace) return window.runtime.LogTrace(message);
  console.trace('[WailsTrace]', message);
}

export function LogDebug(message) {
  if (typeof window !== 'undefined' && window.runtime?.LogDebug) return window.runtime.LogDebug(message);
  console.debug('[WailsDebug]', message);
}

export function LogInfo(message) {
  if (typeof window !== 'undefined' && window.runtime?.LogInfo) return window.runtime.LogInfo(message);
  console.info('[WailsInfo]', message);
}

export function LogWarning(message) {
  if (typeof window !== 'undefined' && window.runtime?.LogWarning) return window.runtime.LogWarning(message);
  console.warn('[WailsWarning]', message);
}

export function LogError(message) {
  if (typeof window !== 'undefined' && window.runtime?.LogError) return window.runtime.LogError(message);
  console.error('[WailsError]', message);
}

export function LogFatal(message) {
  if (typeof window !== 'undefined' && window.runtime?.LogFatal) return window.runtime.LogFatal(message);
  console.error('[WailsFatal]', message);
}

export function EventsOn(eventName, callback) {
  if (typeof window !== 'undefined' && window.runtime?.EventsOn) {
    return window.runtime.EventsOn(eventName, callback);
  }
  const handler = (e) => callback(e.detail);
  window.addEventListener(`wails:${eventName}`, handler);
  return () => window.removeEventListener(`wails:${eventName}`, handler);
}

export function EventsOff(eventName, ...additionalEventNames) {
  if (typeof window !== 'undefined' && window.runtime?.EventsOff) {
    return window.runtime.EventsOff(eventName, ...additionalEventNames);
  }
}

export function EventsOffAll() {
  if (typeof window !== 'undefined' && window.runtime?.EventsOffAll) {
    return window.runtime.EventsOffAll();
  }
}

export function EventsOnce(eventName, callback) {
  if (typeof window !== 'undefined' && window.runtime?.EventsOnce) {
    return window.runtime.EventsOnce(eventName, callback);
  }
  const handler = (e) => {
    window.removeEventListener(`wails:${eventName}`, handler);
    callback(e.detail);
  };
  window.addEventListener(`wails:${eventName}`, handler);
}

export function EventsEmit(eventName, ...args) {
  if (typeof window !== 'undefined' && window.runtime?.EventsEmit) {
    return window.runtime.EventsEmit(eventName, ...args);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`wails:${eventName}`, { detail: args[0] }));
  }
}

export function BrowserOpenURL(url) {
  if (typeof window !== 'undefined' && window.runtime?.BrowserOpenURL) {
    return window.runtime.BrowserOpenURL(url);
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function ClipboardGetText() {
  if (typeof window !== 'undefined' && window.runtime?.ClipboardGetText) {
    return window.runtime.ClipboardGetText();
  }
  if (navigator?.clipboard?.readText) {
    return navigator.clipboard.readText();
  }
  return Promise.resolve('');
}

export function ClipboardSetText(text) {
  if (typeof window !== 'undefined' && window.runtime?.ClipboardSetText) {
    return window.runtime.ClipboardSetText(text);
  }
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.resolve();
}

export function WindowReload() {
  if (typeof window !== 'undefined' && window.runtime?.WindowReload) {
    return window.runtime.WindowReload();
  }
  window.location.reload();
}

export function WindowSetTitle(title) {
  if (typeof window !== 'undefined' && window.runtime?.WindowSetTitle) {
    return window.runtime.WindowSetTitle(title);
  }
  document.title = title;
}
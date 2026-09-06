// Bilingual copy. Data modules build values with L(en, pt); renderers resolve with t().
export const state = { lang: 'en' };

export function L(en, pt) {
  return { en, pt };
}

export function t(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[state.lang] ?? v.en ?? '';
}

const KEY = 'pb_lang';

export function loadLang() {
  let saved = null;
  try { saved = globalThis.localStorage?.getItem(KEY); } catch (_) { /* private mode */ }
  state.lang = saved === 'pt' ? 'pt' : 'en';
  return state.lang;
}

export function setLang(lang) {
  state.lang = lang === 'pt' ? 'pt' : 'en';
  try { globalThis.localStorage?.setItem(KEY, state.lang); } catch (_) { /* ignore */ }
  if (globalThis.document) document.documentElement.setAttribute('lang', state.lang);
  return state.lang;
}

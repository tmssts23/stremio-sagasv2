const LANGS = ['pt', 'en'];
const DEFAULT_LANG = 'en';

const STRINGS = {
  en: {
    addonName: 'Sagas & Marathons',
    addonDescription: 'Movie sagas and marathons in the right order. Pick a saga in Discover or search for it.',
    mainCatalog: 'Sagas & Marathons',
  },
  pt: {
    addonName: 'Sagas e Maratonas',
    addonDescription: 'Sagas e maratonas de filmes pela ordem certa. Escolhe uma saga no Explorar ou pesquisa-a.',
    mainCatalog: 'Sagas e Maratonas',
  },
};

function strings(lang) {
  return STRINGS[lang] || STRINGS[DEFAULT_LANG];
}

function sagaName(saga, lang) {
  return lang === 'pt' && saga.namePt ? saga.namePt : saga.name;
}

// Picks pt or en from an Accept-Language header ("pt-PT,pt;q=0.9,en;q=0.8"), honouring q order.
function langFromHeader(header) {
  const match = String(header || '')
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      return { lang: tag.trim().toLowerCase().split('-')[0], q: q ? parseFloat(q.slice(2)) || 0 : 1, index };
    })
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .find((entry) => LANGS.includes(entry.lang));
  return match ? match.lang : null;
}

// "auto" follows the app's Accept-Language; apps that send none get the fallback chosen at install time.
function resolveLang(config, acceptLanguage) {
  if (LANGS.includes(config.lang)) return config.lang;
  return langFromHeader(acceptLanguage) || (LANGS.includes(config.fallback) ? config.fallback : DEFAULT_LANG);
}

module.exports = { LANGS, strings, sagaName, resolveLang };

const http = require('http');

const SAGAS = require('./data/sagas.json');
const { renderConfigurePage } = require('./lib/configure-page');
const { strings, sagaName, resolveLang } = require('./lib/i18n');

const PORT = Number(process.env.PORT) || 7000;
const HOST = '0.0.0.0';
const VERSION = '2.1.0';
const PAGE_SIZE = 100;
const MAIN_CATALOG_ID = 'sagas';
const SEARCH_CATALOG_ID = 'sagas_search';
const SAGA_CATALOG_PREFIX = 'saga_';
const POSTER_URL = 'https://images.metahub.space/poster/medium/{id}/img';
const LOGO_URL = 'https://www.figarocorso.info/static/images/stremio_sagas.jpg';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const SAGA_BY_SLUG = new Map(SAGAS.map((saga) => [saga.slug, saga]));
const SAGA_BY_NAME = new Map(
  SAGAS.flatMap((saga) => [[normalize(saga.name), saga], [normalize(saga.namePt), saga]]),
);

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function safeDecode(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function toMeta(film) {
  return {
    id: film.id,
    type: 'movie',
    name: film.name,
    poster: POSTER_URL.replace('{id}', film.id),
    posterShape: 'poster',
    ...(film.year ? { releaseInfo: String(film.year) } : {}),
  };
}

function uniqueFilms(films) {
  const seen = new Set();
  return films.filter((film) => {
    if (seen.has(film.id)) return false;
    seen.add(film.id);
    return true;
  });
}

function parseRows(value) {
  const rows = value.trim().toLowerCase();
  if (rows === 'all') return SAGAS.map((saga) => saga.slug);
  if (!rows || rows === 'none') return [];
  return rows
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => SAGA_BY_SLUG.has(slug));
}

// Config path segment, e.g. "lang=auto|fallback=pt|rows=star-wars,harry-potter".
// lang: pt | en | auto (default). fallback: language "auto" uses when the app sends no Accept-Language.
// home: 1 (default) | 0 hides the main catalog from the home screen (it stays in Discover).
// rows: none (default) | all | saga slugs that also get their own catalog row.
// A segment without "=" is the old format: just a list of saga slugs.
function parseConfig(raw) {
  const config = { lang: 'auto', fallback: null, home: true, rows: [] };
  if (!raw) return config;
  const value = safeDecode(raw);
  if (!value.includes('=')) {
    config.rows = parseRows(value);
    return config;
  }
  for (const pair of value.split('|')) {
    const [key, ...rest] = pair.split('=');
    const val = rest.join('=').trim().toLowerCase();
    if (key === 'lang') config.lang = val;
    else if (key === 'fallback') config.fallback = val;
    else if (key === 'home') config.home = !['0', 'false', 'off', 'no'].includes(val);
    else if (key === 'rows') config.rows = parseRows(val);
  }
  return config;
}

function sortedByName(sagas, lang) {
  return [...sagas].sort((a, b) => sagaName(a, lang).localeCompare(sagaName(b, lang), lang));
}

function getManifest(config, lang) {
  const text = strings(lang);
  const sagaNames = sortedByName(SAGAS, lang).map((saga) => sagaName(saga, lang));
  const rowSagas = sortedByName(config.rows.map((slug) => SAGA_BY_SLUG.get(slug)), lang);

  // Apps only put catalogs without required extras on the home screen. To hide the main catalog
  // from home, its saga filter becomes required; search then moves to a search-only catalog,
  // because a search request can't satisfy the required saga filter.
  const mainCatalog = config.home
    ? {
        type: 'movie',
        id: MAIN_CATALOG_ID,
        name: text.mainCatalog,
        genres: sagaNames,
        extra: [
          { name: 'genre', options: sagaNames, isRequired: false },
          { name: 'search', isRequired: false },
          { name: 'skip', isRequired: false },
        ],
        extraSupported: ['genre', 'search', 'skip'],
      }
    : {
        type: 'movie',
        id: MAIN_CATALOG_ID,
        name: text.mainCatalog,
        genres: sagaNames,
        extra: [
          { name: 'genre', options: sagaNames, isRequired: true },
          { name: 'skip', isRequired: false },
        ],
        extraSupported: ['genre', 'skip'],
        extraRequired: ['genre'],
      };
  const searchCatalogs = config.home
    ? []
    : [
        {
          type: 'movie',
          id: SEARCH_CATALOG_ID,
          name: text.mainCatalog,
          extra: [{ name: 'search', isRequired: true }],
          extraSupported: ['search'],
          extraRequired: ['search'],
        },
      ];

  return {
    id: 'org.stremio.marathons',
    version: VERSION,
    name: text.addonName,
    description: text.addonDescription,
    logo: LOGO_URL,
    resources: ['catalog'],
    types: ['movie'],
    idPrefixes: ['tt'],
    catalogs: [
      mainCatalog,
      ...searchCatalogs,
      ...rowSagas.map((saga) => ({
        type: 'movie',
        id: `${SAGA_CATALOG_PREFIX}${saga.slug}`,
        name: sagaName(saga, lang),
      })),
    ],
    behaviorHints: {
      configurable: true,
      configurationRequired: false,
    },
  };
}

function searchFilms(query) {
  const needle = normalize(query);
  if (!needle) return [];
  const results = [];
  for (const saga of SAGAS) {
    const sagaTerms = [saga.name, saga.namePt, ...(saga.aliases || [])].map(normalize);
    if (sagaTerms.some((term) => term.includes(needle))) {
      results.push(...saga.films);
      continue;
    }
    results.push(...saga.films.filter((film) => normalize(film.name).includes(needle)));
  }
  return uniqueFilms(results);
}

function getCatalogFilms(catalogId, extra) {
  if (catalogId.startsWith(SAGA_CATALOG_PREFIX)) {
    const saga = SAGA_BY_SLUG.get(catalogId.slice(SAGA_CATALOG_PREFIX.length));
    return saga ? saga.films : null;
  }
  if (catalogId === SEARCH_CATALOG_ID) return extra.search ? searchFilms(extra.search) : [];
  if (catalogId !== MAIN_CATALOG_ID) return null;

  if (extra.search) return searchFilms(extra.search);
  if (extra.genre) {
    const saga = SAGA_BY_NAME.get(normalize(extra.genre)) || SAGA_BY_SLUG.get(extra.genre);
    return saga ? saga.films : [];
  }
  return uniqueFilms(SAGAS.flatMap((saga) => saga.films));
}

// Extra args arrive URL-encoded as a single path segment: "genre=Fast%20%26%20Furious&skip=100".
function parseExtra(rawSegment) {
  const extra = {};
  if (!rawSegment) return extra;
  for (const [key, value] of new URLSearchParams(rawSegment)) extra[key] = value;
  return extra;
}

function send(res, status, body, contentType, cacheSeconds, extraHeaders = {}) {
  res.writeHead(status, {
    ...CORS,
    'Content-Type': contentType,
    'Cache-Control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-cache',
    ...extraHeaders,
  });
  res.end(body);
}

function sendJson(res, data, cacheSeconds = 6 * 60 * 60, extraHeaders = {}) {
  send(res, 200, JSON.stringify(data), 'application/json; charset=utf-8', cacheSeconds, extraHeaders);
}

function notFound(res) {
  send(res, 404, JSON.stringify({ err: 'Not found' }), 'application/json; charset=utf-8', 0);
}

function originFromRequest(req) {
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' ? 'https' : 'http';
  return `${proto}://${host}`;
}

function requestHandler(req, res) {
  if (!process.env.VERCEL) {
    console.log(
      `[Sagas] ${req.method} ${req.url} | accept-language: ${req.headers['accept-language'] || '-'} | user-agent: ${req.headers['user-agent'] || '-'}`,
    );
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return notFound(res);

  const rawPath = (req.url || '/').split('?')[0];
  let segments = rawPath.split('/').filter(Boolean);

  // Optional leading config segment: /<config>/manifest.json, /<config>/catalog/...
  let rawConfig = null;
  if (segments.length && !['manifest.json', 'catalog', 'configure'].includes(segments[0])) {
    rawConfig = segments[0];
    segments = segments.slice(1);
  }
  const config = parseConfig(rawConfig);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'configure')) {
    const html = renderConfigurePage({ origin: originFromRequest(req), sagas: SAGAS, config });
    return send(res, 200, html, 'text/html; charset=utf-8', 0);
  }

  if (segments.length === 1 && segments[0] === 'manifest.json') {
    const lang = resolveLang(config, req.headers['accept-language']);
    return sendJson(res, getManifest(config, lang), 60 * 60, { Vary: 'Accept-Language' });
  }

  // /catalog/movie/<id>.json or /catalog/movie/<id>/<extra>.json
  if (segments[0] === 'catalog' && (segments.length === 3 || segments.length === 4)) {
    const type = segments[1];
    const last = segments[segments.length - 1];
    if (type !== 'movie' || !last.endsWith('.json')) return notFound(res);

    const catalogId = safeDecode(segments.length === 3 ? last.slice(0, -5) : segments[2]);
    const extra = segments.length === 4 ? parseExtra(last.slice(0, -5)) : {};
    const films = getCatalogFilms(catalogId, extra);
    if (!films) return notFound(res);

    const skip = Math.max(0, parseInt(extra.skip, 10) || 0);
    const metas = films.slice(skip, skip + PAGE_SIZE).map(toMeta);
    return sendJson(res, { metas });
  }

  return notFound(res);
}

module.exports = { requestHandler, getManifest, getCatalogFilms, parseConfig };

if (require.main === module) {
  http.createServer(requestHandler).listen(PORT, HOST, () => {
    console.log(`[Sagas] A correr em http://127.0.0.1:${PORT}/manifest.json`);
    console.log(`[Sagas] Configurar em http://127.0.0.1:${PORT}/configure`);
  });
}

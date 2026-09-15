// Kept as a JS module (not a static file) so Vercel bundles it without extra config.
// The page renders client-side so its language can be switched without reloading.
function renderConfigurePage({ origin, sagas, config }) {
  const data = {
    origin,
    config,
    sagas: sagas.map((saga) => ({ slug: saga.slug, name: saga.name, namePt: saga.namePt, films: saga.films.length })),
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sagas e Maratonas</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #111318; color: #e8e8ec; }
  main { max-width: 760px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
  h1 { margin: 0; font-size: 1.6rem; }
  h2 { margin: 0 0 8px; font-size: 1.05rem; }
  p, .note { color: #a4a7b3; line-height: 1.5; }
  .note { font-size: .9rem; margin: 8px 0 0; }
  section { margin-top: 20px; padding: 16px; background: #171a21; border: 1px solid #262a35; border-radius: 10px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; }
  button, a.btn, select { border: 1px solid #343846; background: #1c1f27; color: inherit; padding: 10px 14px; border-radius: 8px; font: inherit; cursor: pointer; text-decoration: none; }
  select { width: 100%; }
  .primary { background: #7b5bf5 !important; border-color: #7b5bf5 !important; color: #fff !important; }
  .switch { display: inline-flex; border: 1px solid #343846; border-radius: 8px; overflow: hidden; }
  .switch button { border: 0; border-radius: 0; padding: 8px 12px; }
  .switch button.active { background: #7b5bf5; color: #fff; }
  .toggle { display: flex; gap: 10px; align-items: center; cursor: pointer; }
  .toggle input { width: 18px; height: 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; margin-top: 12px; }
  .saga { display: flex; gap: 10px; align-items: center; padding: 10px 12px; background: #1c1f27; border: 1px solid #2c303c; border-radius: 8px; cursor: pointer; }
  .saga small { display: block; color: #8b8fa0; font-size: .8rem; }
  .url { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #343846; background: #0c0d11; color: #e8e8ec; font-family: ui-monospace, Consolas, monospace; font-size: .85rem; }
</style>
</head>
<body>
<main>
  <header>
    <h1 data-t="title"></h1>
    <div class="switch" role="group" aria-label="Language">
      <button type="button" data-page-lang="pt">PT</button>
      <button type="button" data-page-lang="en">EN</button>
    </div>
  </header>
  <p data-t="intro"></p>

  <section>
    <h2 data-t="langTitle"></h2>
    <select id="lang">
      <option value="auto" data-t="langAuto"></option>
      <option value="pt">Português</option>
      <option value="en">English</option>
    </select>
    <p class="note" id="langNote"></p>
  </section>

  <section>
    <h2 data-t="rowsTitle"></h2>
    <label class="toggle"><input type="checkbox" id="homeOn"><span data-t="homeToggle"></span></label>
    <p class="note" data-t="homeNote"></p>
    <hr style="border: 0; border-top: 1px solid #262a35; margin: 14px 0;">
    <label class="toggle"><input type="checkbox" id="rowsOn"><span data-t="rowsToggle"></span></label>
    <p class="note" data-t="rowsNote"></p>
    <div id="rowsPicker" hidden>
      <div class="toolbar">
        <button type="button" id="all" data-t="selectAll"></button>
        <button type="button" id="none" data-t="selectNone"></button>
      </div>
      <div class="grid" id="sagas"></div>
    </div>
  </section>

  <section>
    <h2 data-t="urlTitle"></h2>
    <input class="url" id="url" readonly>
    <p class="note" data-t="urlNote"></p>
    <div class="toolbar">
      <button type="button" class="primary" id="copy" data-t="copy"></button>
      <a class="btn primary" id="stremio" href="#" data-t="installStremio"></a>
      <a class="btn" id="web" href="#" target="_blank" rel="noopener">Stremio Web</a>
    </div>
  </section>
</main>
<script>
  const DATA = ${json};
  const TEXT = {
    pt: {
      title: 'Sagas e Maratonas',
      intro: 'Configura o addon e instala-o no Stremio ou no Nuvio.',
      langTitle: 'Idioma do addon',
      langAuto: 'Automático (idioma da app)',
      langAutoNote: 'Usa o idioma que a app indicar ao addon. Se a app não o indicar, fica em {lang}.',
      langFixedNote: 'O addon fica sempre neste idioma.',
      langNames: { pt: 'português', en: 'inglês' },
      rowsTitle: 'Ecrã inicial',
      homeToggle: 'Mostrar o catálogo "Sagas e Maratonas" no ecrã inicial',
      homeNote: 'Desligado: o catálogo deixa de aparecer no ecrã inicial, mas continua no Explorar e na pesquisa.',
      rowsToggle: 'Mostrar sagas como filas próprias',
      rowsNote: 'Desligado: no Explorar só aparece "Sagas e Maratonas" e as sagas surgem quando o escolhes. Ligado: as sagas escolhidas aparecem também como filas no ecrã inicial (e ficam como catálogos separados no Explorar).',
      selectAll: 'Selecionar todas',
      selectNone: 'Nenhuma',
      films: 'filmes',
      urlTitle: 'Link do addon',
      urlNote: 'Nuvio: Definições → Addons → colar o link. Stremio: botão abaixo ou colar o link na pesquisa de addons.',
      copy: 'Copiar link',
      copied: 'Copiado!',
      installStremio: 'Instalar no Stremio',
    },
    en: {
      title: 'Sagas & Marathons',
      intro: 'Configure the addon and install it in Stremio or Nuvio.',
      langTitle: 'Addon language',
      langAuto: 'Automatic (app language)',
      langAutoNote: 'Uses the language the app reports to the addon. If the app reports none, it falls back to {lang}.',
      langFixedNote: 'The addon always uses this language.',
      langNames: { pt: 'Portuguese', en: 'English' },
      rowsTitle: 'Home screen',
      homeToggle: 'Show the "Sagas & Marathons" catalog on the home screen',
      homeNote: 'Off: the catalog no longer appears on the home screen, but stays in Discover and search.',
      rowsToggle: 'Show sagas as their own rows',
      rowsNote: 'Off: Discover only lists "Sagas & Marathons" and the sagas show up once you pick it. On: the selected sagas also appear as rows on the home screen (and as separate catalogs in Discover).',
      selectAll: 'Select all',
      selectNone: 'None',
      films: 'movies',
      urlTitle: 'Addon link',
      urlNote: 'Nuvio: Settings → Addons → paste the link. Stremio: use the button below or paste the link in the addon search.',
      copy: 'Copy link',
      copied: 'Copied!',
      installStremio: 'Install in Stremio',
    },
  };

  const cfg = DATA.config;
  let pageLang = ['pt', 'en'].includes(cfg.lang) ? cfg.lang
    : ['pt', 'en'].includes(cfg.fallback) ? cfg.fallback
    : (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';

  const $ = (id) => document.getElementById(id);
  const langSelect = $('lang');
  const rowsOn = $('rowsOn');
  const homeOn = $('homeOn');
  langSelect.value = ['pt', 'en'].includes(cfg.lang) ? cfg.lang : 'auto';
  homeOn.checked = cfg.home !== false;
  rowsOn.checked = cfg.rows.length > 0;
  const chosenRows = new Set(cfg.rows.length ? cfg.rows : DATA.sagas.map((s) => s.slug));

  function renderSagas() {
    const t = TEXT[pageLang];
    const sorted = [...DATA.sagas].sort((a, b) => label(a).localeCompare(label(b), pageLang));
    $('sagas').innerHTML = '';
    for (const saga of sorted) {
      const item = document.createElement('label');
      item.className = 'saga';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = chosenRows.has(saga.slug);
      box.onchange = () => { box.checked ? chosenRows.add(saga.slug) : chosenRows.delete(saga.slug); update(); };
      const span = document.createElement('span');
      span.textContent = label(saga);
      const small = document.createElement('small');
      small.textContent = saga.films + ' ' + t.films;
      span.appendChild(small);
      item.append(box, span);
      $('sagas').appendChild(item);
    }
  }

  function label(saga) {
    return pageLang === 'pt' ? saga.namePt : saga.name;
  }

  function manifestUrl() {
    const lang = langSelect.value;
    const parts = ['lang=' + lang];
    if (lang === 'auto') parts.push('fallback=' + pageLang);
    if (!homeOn.checked) parts.push('home=0');
    if (rowsOn.checked && chosenRows.size) {
      parts.push('rows=' + (chosenRows.size === DATA.sagas.length ? 'all' : [...chosenRows].join(',')));
    }
    return DATA.origin + '/' + parts.join('%7C') + '/manifest.json';
  }

  function update() {
    const t = TEXT[pageLang];
    $('langNote').textContent = langSelect.value === 'auto'
      ? t.langAutoNote.replace('{lang}', t.langNames[pageLang])
      : t.langFixedNote;
    $('rowsPicker').hidden = !rowsOn.checked;
    const url = manifestUrl();
    $('url').value = url;
    $('stremio').href = url.replace(/^https?:\\/\\//, 'stremio://');
    $('web').href = 'https://web.stremio.com/#/addons?addon=' + encodeURIComponent(url);
  }

  function applyPageLang(lang) {
    pageLang = lang;
    const t = TEXT[lang];
    document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
    document.title = t.title;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t[el.dataset.t]; });
    document.querySelectorAll('[data-page-lang]').forEach((btn) => btn.classList.toggle('active', btn.dataset.pageLang === lang));
    renderSagas();
    update();
  }

  document.querySelectorAll('[data-page-lang]').forEach((btn) => { btn.onclick = () => applyPageLang(btn.dataset.pageLang); });
  langSelect.onchange = update;
  rowsOn.onchange = update;
  homeOn.onchange = update;
  $('all').onclick = () => { DATA.sagas.forEach((s) => chosenRows.add(s.slug)); renderSagas(); update(); };
  $('none').onclick = () => { chosenRows.clear(); renderSagas(); update(); };
  $('copy').onclick = async () => {
    const field = $('url');
    try { await navigator.clipboard.writeText(field.value); } catch (e) { field.select(); document.execCommand('copy'); }
    $('copy').textContent = TEXT[pageLang].copied;
    setTimeout(() => ($('copy').textContent = TEXT[pageLang].copy), 1500);
  };

  applyPageLang(pageLang);
</script>
</body>
</html>`;
}

module.exports = { renderConfigurePage };

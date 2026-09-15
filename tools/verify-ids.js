// Checks every IMDb id in data/sagas.json against Cinemeta and reports ids that
// don't exist or whose title differs from the one stored (usually a wrong id).
const SAGAS = require('../data/sagas.json');

const CINEMETA = 'https://v3-cinemeta.strem.io/meta/movie/{id}.json';
const CONCURRENCY = 8;

async function main() {
  const films = SAGAS.flatMap((saga) => saga.films.map((film) => ({ saga: saga.name, ...film })));
  const problems = [];
  let next = 0;

  for (const saga of SAGAS) {
    const ids = saga.films.map((film) => film.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) problems.push(`${saga.name}: ids repetidos ${dupes.join(', ')}`);
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < films.length) {
        const film = films[next++];
        try {
          const res = await fetch(CINEMETA.replace('{id}', film.id));
          const meta = res.ok ? (await res.json()).meta : null;
          if (!meta || !meta.name) problems.push(`${film.saga}: ${film.id} (${film.name}) nao existe no Cinemeta`);
          else if (meta.name !== film.name) problems.push(`${film.saga}: ${film.id} guardado como "${film.name}" mas o Cinemeta diz "${meta.name}"`);
        } catch (err) {
          problems.push(`${film.saga}: ${film.id} erro ao consultar (${err.message})`);
        }
      }
    }),
  );

  console.log(`${films.length} filmes verificados em ${SAGAS.length} sagas.`);
  if (problems.length) {
    console.log(problems.join('\n'));
    process.exit(1);
  }
  console.log('Tudo certo.');
}

main();

# Sagas e Maratonas

Addon de catálogo para **Stremio** e **Nuvio** que agrupa filmes em sagas e maratonas, pela ordem certa.

## O que inclui

- Catálogo "Sagas e Maratonas": no Explorar escolhes o catálogo e depois a saga no filtro
- Pesquisa por nome da saga ou do filme, também em PT-PT ("Senhor dos Anéis", "Velocidade Furiosa", "O Padrinho"…)
- Português ou inglês, ou automático (segue o `Accept-Language` enviado pela app; se a app não enviar, usa o idioma de reserva escolhido na configuração)
- Opcional: sagas como filas próprias no ecrã inicial (escolhidas na página de configuração)

O addon só fornece catálogos. As fichas dos filmes vêm do Cinemeta/TMDB (IDs IMDb `tt...`) e os streams vêm dos outros addons que tiveres instalados.

## Como correr

Não precisa de `npm install` (não tem dependências).

```
npm start
```

- Configurar: `http://127.0.0.1:7000/configure`
- Manifest: `http://127.0.0.1:7000/manifest.json`

Para instalar no telemóvel ou na TV, usa o IP do PC na rede (ex.: `http://192.168.1.50:7000/manifest.json`) ou, melhor, publica na Vercel.

## Publicar na Vercel

1. Envia esta pasta para um repositório no GitHub e importa-o na Vercel (ou corre `vercel` na pasta).
2. Abre `https://<o-teu-projeto>.vercel.app/configure`, escolhe as sagas e copia o link.
3. **Nuvio:** Definições → Addons → colar o link.
   **Stremio:** botão "Instalar no Stremio" ou colar o link na pesquisa de addons.

## Adicionar ou editar sagas

Edita `data/sagas.json`. Cada filme precisa do ID IMDb (`tt...`), que está no endereço da página do filme no IMDb. Depois confirma que os IDs estão certos:

```
npm run verify
```

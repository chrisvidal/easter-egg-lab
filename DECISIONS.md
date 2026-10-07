# Décisions

Chaque décision ouverte a été tranchée vers l'option la plus simple et la plus réversible.

## Architecture

- **Pas de Tailwind.** Le CDN Tailwind (play CDN) affiche un avertissement en console (« should not be used in production ») et compile le CSS dans le navigateur. Une seule feuille `assets/css/site.css`, écrite à la main, est plus légère et respecte « pas d'erreur console ». Réversible : ajouter la balise `<script>` du CDN.
- **Fichiers ajoutés au plan :**
  - `core/egg.js` : orchestration commune (reset, debug, layout, events, statut, unlock, reveal), pour éviter de dupliquer ce code dans 5 fichiers ;
  - `core/globe.js` : globe partagé par longpress et coordinate ;
  - `core/typo.js` : espaces insécables français ;
  - `eggs/coordinate-math.js` et `eggs/overscroll-logic.js` : fonctions pures testables sous Node ;
  - `assets/js/lab.js` : script de la landing.
- **`package.json`** (`"type": "module"`, sans dépendance) : nécessaire pour que Node 20 charge les ES modules dans les tests.
- **`tests/index.js`** : depuis Node 22, `node --test tests/` résout le dossier comme un module (`tests/index.js`) au lieu de le parcourir. Ce fichier importe chaque `*.test.js`. Sous Node 20, le dossier est parcouru et `index.js` n'est pas pris pour un test. Vérifié sous Node 23.
- **CDN par import dynamique ESM** (`cdn.jsdelivr.net/npm/d3-geo@3/+esm`, `topojson-client@3/+esm`, `world-atlas@2/land-110m.json`). Si le CDN échoue, le globe reste une sphère nue et les deux mécaniques fonctionnent toujours. La coordonnée sous le réticule est calculée sans d3.
- **Google Fonts** (Cormorant Garamond) pour les titres, comme le demande la DA. Corps en police système.
- **`<meta name="robots" content="noindex">`** sur toutes les pages : c'est un prototype de recherche. À retirer pour un indexage.

## API et events

- **Events en `fetch` keepalive par défaut, et non en `sendBeacon`.** Constat le 2026-10-07 : la production répond au preflight par `Access-Control-Allow-Origin: *` sans `Allow-Credentials`. Or `sendBeacon` envoie toujours avec credentials. Le navigateur bloque donc chaque event, avec une erreur CORS en console. Vérifié dans Chrome headless contre un mock reproduisant ces en-têtes. `fetch` avec `credentials: 'omit'` passe. Le code `sendBeacon` (Blob `application/json`, repli fetch) est conservé : passer `EVENT_TRANSPORT = 'beacon'` dans `config.js` dès que l'API renvoie l'origine exacte et `Access-Control-Allow-Credentials: true`.
- **`post()` ne lève jamais.** Il renvoie un résultat normalisé (`ok`, `rejected`, `rate_limited`, `timeout`, `network`, `error`). Un 200 sans `ok: true` est traité comme une erreur.
- **Échec 422 sans hint : rien n'est affiché** (« échec discret »). Timeout, réseau ou 5xx : « Le monde ne répond pas. Réessaie dans un instant. »
- **`?api=` et `?debug=` sont mémorisés en `sessionStorage`** (valables pour l'onglet). `?api=` vide revient au défaut, `?debug=0` coupe le panneau.
- **`?reset=1` efface toutes les clés `ombres.*` du `localStorage`** : progression, reveals et `session_id`. Les surcharges `?api=` et `?debug=` sont conservées, ce qui est pratique pour enchaîner des tests.
- **Reveal** : seuls `title`, `paragraphs` (chaînes) et `cta` (URL http/https uniquement) sont gardés. Tout est rendu par `textContent`. Le CTA s'ouvre dans un nouvel onglet (`noopener`).

## Mécaniques

- **letters** : un glyphe déjà allumé ne compte pas deux fois. En cas d'échec, l'extinction se fait 700 ms après la réponse. En cas de succès, les lettres restent allumées. Les glyphes portent `role="button"`, `tabindex="0"` et `aria-pressed`. Limite connue : un lecteur d'écran annonce ces lettres comme des boutons au milieu des mots, c'est inhérent à la mécanique demandée.
- **longpress** : le POST part dès 5 s, sans attendre le relâchement, avec la durée réellement mesurée (environ 5000 à 5020 ms). Le globe est un `role="button"` focalisable. Le menu contextuel, la sélection et le geste tactile natif sont bloqués sur le globe seulement. En mouvement réduit, il n'y a ni rotation ni descente, mais l'anneau de progression et l'assombrissement restent (c'est de l'information).
- **coordinate** : coordonnées arrondies à 4 décimales. Flèches ±4° (Maj : ±1°). Le champ accepte `lat, lng`, `lat lng` ou `lat ; lng` avec décimales à virgule, et recentre le globe avant l'envoi. La coordonnée courante s'affiche sous le globe : c'est utile au repérage et ne révèle rien.
- **console** : `atlas.lift()` renvoie `undefined` et répond dans la console par `console.log`, jamais `console.error`. La note mobile est affichée en CSS (`hover: none` et `pointer: coarse`). `window.atlas` reste exposé partout.
- **overscroll** : une « poussée » est une rafale de deltas. Une pause de plus de 320 ms, ou un relâchement tactile, en ouvre une nouvelle. Le clavier compte aussi en bas de page (↓ 60 px, Page↓/Fin/Espace 320 px). `overscroll-behavior-y: none` est posé sur `html.no-bounce`, seulement sur cette page. La phrase s'affiche 1,4 s avant le POST. En mouvement réduit, il n'y a pas d'étirement ; la phrase et le POST restent.

## Contenu et typographie

- Le texte A est injecté par `layout.js`. Les espaces insécables (U+00A0 avant `: ; ? !` et à l'intérieur des guillemets) sont ajoutés à l'affichage par `fr()`. Le texte source reste mot pour mot.
- Les titres et lignes d'ambiance des cartes (`config.js`, `index.html`) ne donnent jamais la solution.
- Pas de favicon fichier : favicon SVG en data URI (évite un 404 en console).

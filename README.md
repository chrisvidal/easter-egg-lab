# •OMBRES · Easter Egg Lab

Prototype de recherche. Le site vitrine de •OMBRES (partie A) existe en cinq variantes. Chacune cache un easter egg. Quand le visiteur en résout un, la partie cachée (partie B) se révèle.

Le site est 100 % statique (GitHub Pages) : HTML, CSS et JavaScript vanilla en ES modules, sans build ni dépendance npm. **Toute la validation se fait côté serveur**, via l'API Atlas (Laravel Cloud). Le front n'envoie que des preuves. Il ne contient aucune réponse ni aucune cible.

```
index.html               landing du labo (5 cartes)
p/NN.html                une page par mécanique (03, 04, 05, 06, 10)
assets/css/site.css
assets/js/config.js      API_BASE, transport des events, textes des indices, CDN
assets/js/core/          api, session, reveal, unlocked, debug, layout, egg (orchestration), globe, typo
assets/js/m/             une mécanique par fichier (NN.js) + fonctions pures (05b.js, 10b.js)
tests/                   node --test, aucune dépendance
```

## Lancement local

```sh
php -S localhost:8765 -t .
# puis http://localhost:8765/
```

Le port **8765** est celui autorisé côté API pour le développement. N'importe quel serveur statique fait l'affaire (`python3 -m http.server 8765`). Les ES modules ne fonctionnent pas en `file://`.

Tests (Node 20+, aucune installation) :

```sh
node --test tests/
```

## Paramètres d'URL

| Paramètre | Effet | Portée |
|---|---|---|
| `?api=http://projet-atlas.test` | Envoie les appels à une autre API, par exemple Laravel en local. `?api=` (vide) revient à la production. | `sessionStorage`, valable pour l'onglet |
| `?debug=1` | Ouvre un panneau flottant qui liste chaque appel API (requête et réponse). `?debug=0` le ferme. | `sessionStorage`, valable pour l'onglet |
| `?reset=1` | Efface la progression (énigmes résolues, reveals mémorisés) et le `session_id`. Le paramètre est ensuite retiré de l'URL. | `localStorage` |

Les paramètres se combinent : `http://localhost:8765/p/03.html?api=http://projet-atlas.test&debug=1&reset=1`

### Tester contre l'API Laravel locale

1. Côté Laravel, ajouter `http://localhost:8765` à `EASTER_EGG_ALLOWED_ORIGINS`.
2. Lancer le site : `php -S localhost:8765 -t .`
3. Ouvrir `http://localhost:8765/?api=http://projet-atlas.test&debug=1`, puis naviguer : la surcharge suit l'onglet.

## Mécaniques et supports

| # | Page | Mécanique | Desktop | Mobile | Clavier seul |
|---|---|---|---|---|---|
| 03 | `p/03.html` | Les lettres endormies : cliquer 5 lettres dans l'ordre | ✅ | ✅ (tap) | ✅ Tab + Entrée/Espace |
| 04 | `p/04.html` | Le poids du monde : appui long de 46 s sur le globe | ✅ souris | ✅ doigt | ✅ Espace maintenu (globe focalisé) |
| 05 | `p/05.html` | Là où le Titan fut changé en pierre : orienter le globe, puis « Ici. » | ✅ glisser | ✅ glisser | ✅ flèches (Maj = pas fin) ou champ « lat, lng » |
| 06 | `p/06.html` | L'envers : `atlas.lift('…')` dans la console | ✅ | ❌ la page le dit en une phrase | ✅ (DevTools) |
| 10 | `p/10.html` | Le bord du monde : continuer de pousser en bas de page | ✅ molette / trackpad | ✅ glisser vers le haut | ✅ ↓, Page↓, Fin, Espace en bas de page |

Chaque page envoie `page_view`, puis `hint_seen` (l'indice entre dans le viewport) et `attempt_started` (premier geste lié à la mécanique). Une mécanique déjà résolue affiche directement son reveal, que l'on peut refermer.

<details>
<summary><strong>Spoilers : solutions</strong></summary>

| Mécanique | Solution | Preuve envoyée |
|---|---|---|
| letters | Réveiller **A-T-L-A-S** : le « a » de *agiles*, le « t » de *toujours*, le « L » de *Libres*, le « a » de *activons*, le « S » de *Samsung* | `{"sequence":["g3","g7","g1","g9","g4"]}` |
| longpress | Maintenir le globe au moins 46 s sans relâcher | `{"duration_ms": 46000+}` |
| coordinate | Atlas changé en pierre par Persée et la Méduse : le **Haut Atlas**, Toubkal (≈ 31.06° N, 7.92° O). Saisie directe : `31.06, -7.92` | `{"lat": 31.06, "lng": -7.92}` (± tolérance serveur) |
| console | `atlas.lift('lumière')` : « Toute ombre naît d'une lumière » | `{"answer": "lumière"}` |
| overscroll | En bas de page, pousser au moins 3 fois, pour 800 px cumulés | `{"pushes": 3+, "distance_px": 800+}` |

</details>

## Configuration serveur

Noms neutres : les pages (`p/03.html`…), les scripts (`assets/js/m/03.js`…) et les identifiants JS/CSS sont volontairement peu parlants (voir `DECISIONS.md`). Correspondance : 03 letters, 04 longpress, 05 coordinate, 06 console, 10 overscroll.

Correspondance des glyphes de `letters` (documentée uniquement ici, jamais dans le code) :

| Glyphe | Lettre | Mot | Rôle |
|---|---|---|---|
| g1 | L | **L**ibres (§3) | ATLAS, 3e |
| g2 | a | **a**rtistiques (§1) | leurre |
| g3 | a | **a**giles (§2) | ATLAS, 1re |
| g4 | S | **S**amsung (§5) | ATLAS, 5e |
| g5 | s | **s**tratégie (§1) | leurre |
| g6 | l | é**l**aborons (§4) | leurre |
| g7 | t | **t**oujours (§2) | ATLAS, 2e |
| g8 | r | **r**ayonner (§4) | leurre |
| g9 | a | **a**ctivons (§4) | ATLAS, 4e |
| g10 | t | **t**errain (§5) | leurre |

Séquence attendue par le serveur : `g3,g7,g1,g9,g4`.

Autres seuils à régler côté serveur : `longpress` : seuil serveur à aligner sur `T` dans `assets/js/m/04.js` (46000 ms actuellement ; le front envoie la durée mesurée, environ `T` à `T` + 50 ms) ; `overscroll` ≥ 3 poussées et ≥ 800 px ; `coordinate`, tolérance de distance autour de la cible.

### CORS et origines

À ajouter dans `EASTER_EGG_ALLOWED_ORIGINS` (Laravel) :

```
http://localhost:8765,https://chrisvidal.github.io
```

Une origine n'a **pas** de chemin : pour `https://chrisvidal.github.io/easter-egg-lab/`, l'origine est `https://chrisvidal.github.io`.

Les events partent par défaut en `fetch` keepalive sans credentials, ce qui fonctionne avec la configuration CORS actuelle (`Access-Control-Allow-Origin: *`). Pour passer à `navigator.sendBeacon` (`EVENT_TRANSPORT = 'beacon'` dans `config.js`), l'API doit répondre avec l'origine exacte **et** `Access-Control-Allow-Credentials: true` (`supports_credentials => true` dans `config/cors.php`). Sinon, chaque event échoue en CORS et laisse une erreur en console. Voir `DECISIONS.md`.

## Mise en ligne sur GitHub Pages

Dépôt : https://github.com/chrisvidal/easter-egg-lab (branche `main`, déjà poussée).

1. Dans le dépôt : **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`.
2. Attendre le déploiement, puis ouvrir `https://chrisvidal.github.io/easter-egg-lab/`.
3. Côté Laravel, ajouter `https://chrisvidal.github.io` à `EASTER_EGG_ALLOWED_ORIGINS`, puis redéployer ou vider le cache de config.
4. Vérifier avec `?debug=1` que `page_view` et `unlock` répondent bien.

Le fichier `.nojekyll` désactive Jekyll. Tous les chemins sont relatifs : le site fonctionne depuis un sous-chemin.

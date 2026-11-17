# STATUS

## Resoconto per Claude (dopo T2, 16 novembre 2026)

**Stato.** T0, T1 e T2 chiusi, uno per commit, tutti pubblicati su `main` (verificato: `HEAD` = `origin/main`). Esecuzione ferma prima di T3, come chiesto. Repo `lucata76-beep/Nay-app`, visibilità **public** (verificato con l'elenco dei repo di GitHub).

**Ambiente (verificato).** Node v22.23.4; Python 3.13.18 (`python3` funziona: i comandi `python3` del piano non hanno richiesto modifiche); Pillow 12.3.0; Chromium senza interfaccia con Playwright disponibile (usato per T2). Sul PC Windows di Luca `python3` potrebbe non esistere (`python` o `py -3`): **[Da provare]**, qui non verificabile.

**Commit (tutti su `main`):**

| Hash | Messaggio |
|---|---|
| `2760b99` | chore: sposta i file di partenza |
| `e677681` | chore: repo di partenza (T0) |
| `62991fa` | feat: icone dal logo (T1) |
| `fecf011` | feat: prototipo di prova sul Samsung (T2) |
| ultimo su `main` | docs: resoconto per Claude dopo T2 (questo blocco; il suo hash è in `git log -1`) |

**Output di `npm test`** (eseguito dopo il commit di T2, 6 test):

```
> nay-app@0.1.0 test
> node --test "tests/*.test.js"

TAP version 13
# Subtest: icon sizes
ok 1 - icon sizes
  ---
  duration_ms: 1.603968
  type: 'test'
  ...
# Subtest: required files exist
ok 2 - required files exist
  ---
  duration_ms: 1.385073
  type: 'test'
  ...
# Subtest: APP_VERSION is semver
ok 3 - APP_VERSION is semver
  ---
  duration_ms: 0.79083
  type: 'test'
  ...
# Subtest: formatResults formats one line per result
ok 4 - formatResults formats one line per result
  ---
  duration_ms: 1.001972
  type: 'test'
  ...
# Subtest: formatResults handles missing ms
ok 5 - formatResults handles missing ms
  ---
  duration_ms: 0.169829
  type: 'test'
  ...
# Subtest: formatResults keeps one line per result when details contain newlines
ok 6 - formatResults keeps one line per result when details contain newlines
  ---
  duration_ms: 0.137967
  type: 'test'
  ...
1..6
# tests 6
# suites 0
# pass 6
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 70.71949
```

**Output di `python3 tools/check_icons.py`** (exit 0):

```
icon-maskable-512.png: pixel piu' lontano dal centro = 184.3 px (36.0% della larghezza); limite 204.8 px (40%) -> OK
```

Rosso prima del verde (visto): in T0 il primo rosso era per il motivo sbagliato (il comando `node --test tests/` del piano non parte su Node 22); corretto lo script, il test ha fallito per il motivo giusto (file e modulo mancanti) prima dell'implementazione. In T1 e T2 il rosso era per il motivo giusto fin dall'inizio (icone e modulo `spike/format.js` mancanti). `check_icons.py` è stato provato anche in negativo: logo intero ridotto a 512 → 42,3% → KO, exit 1 (conferma il numero 42,3% della spec); icona mancante → KO, exit 1.

**File creati** (oltre ai 4 spostati con `git mv` nel primo commit, e a `README.md` aggiornato senza perdere la riga esistente):

- T0: `package.json`, `package-lock.json` (generato da `npm install`, non nell'elenco del piano), `.gitignore`, `CLAUDE.md`, `STATUS.md`, `index.html`, `js/version.js` (`APP_VERSION = '0.1.0'`), `tests/repo.test.js`.
- T1: `tools/make_icons.py`, `tools/check_icons.py`, `assets/icons/icon-192.png`, `assets/icons/icon-512.png`, `assets/icons/icon-maskable-512.png`, `tests/icons.test.js`.
- T2: `spike/index.html`, `spike/spike.js`, `spike/format.js`, `spike/sw.js`, `spike/manifest.webmanifest`, `spike/snowball/_stemmer.js`, `spike/snowball/spanish_stemmer.js`, `spike/snowball/snowball-stem.LICENSE.txt`, `vendor/fflate.js` (copia identica, verificata con `cmp`), `vendor/fflate.LICENSE.txt`, `docs/test-samsung-results.md`, `tests/spike-format.test.js`.

**Scostamenti dal piano** (dettaglio nella sezione «Scostamenti dal piano e scelte fatte» più sotto):

1. `npm test` usa `node --test "tests/*.test.js"`: il comando del piano `node --test tests/` **non funziona su Node 22** (provato).
2. Per il controllo `similarity` ho copiato lo stemmer spagnolo (non modificato) in `spike/snowball/`, perché i file `vendor/snowball-*.js` sono del task T7 e non andavano anticipati.
3. File in più: i due testi di licenza delle librerie copiate; riga `device` nei risultati copiati; un test in più su `formatResults` (a-capo).
4. Sfondo del logo misurato `#fbf6ef`, non `#fdf6ef` come in spec e piano.
5. Un commit in più dopo T2 (questo resoconto).
6. Lavoro diretto su `main`, senza worktree; nessun reviewer indipendente (nessun sub-agente avviato): solo una rilettura mia.

**Cosa NON ho verificato.**

- **Tutto ciò che richiede il Samsung** (nessun telefono Android qui): selettore galleria e selezione multipla, condivisione reale verso ChatGPT e Gemini (in Chromium ho solo **simulato** `navigator.share`: ho provato la logica dei tre pulsanti, non Android), versione di Android dallo user agent, installazione dalla schermata Home, icona maskable come la disegna Android, offline in modalità standalone, `persist()` con l'app installata, tempi reali di PBKDF2 a 600.000 ripetizioni, di AES-GCM e dello ZIP su video grandi, memoria.
- **I numeri che ho misurato qui non valgono per il telefono:** sono di Chromium 153 senza interfaccia su un computer (PBKDF2 600.000 ripetizioni ≈ 99-106 ms; AES-GCM su 20 MB ≈ 37 ms per cifrare e 31 ms per leggere; ZIP a flusso di 20 MB ≈ 91 ms; somiglianza su 1000 testi inventati ≈ 22,6 ms). Non vanno usati come stima del Samsung.
- **GitHub Pages:** non so se sia già attivo. L'indirizzo `https://lucata76-beep.github.io/Nay-app/` è ricavato dal nome del repo; dal mio ambiente `github.io` non è raggiungibile (proxy 403). HTTPS di GitHub Pages: non verificato **[Da provare]**.
- **PRF/impronta:** il prototipo vede solo che `PublicKeyCredential` esista; la prova vera non esiste ancora.
- **Qualità della somiglianza sui 50 post veri:** misurata solo la velocità, su testi inventati in spagnolo.
- **Menu ⋮ dell'app:** non esiste ancora (task T11).
- **Installabilità:** non verificato che Chrome su Android offra «Installa app» (o solo «Aggiungi a schermata Home») per `spike/manifest.webmanifest`.
- Cosa ho verificato in Chromium senza interfaccia (su `http://localhost` e su HTTPS locale con certificato autofirmato): la pagina `/spike/` si apre e crea i 9 controlli; `install`, `gallery`, `storage`, `crypto`, `zip`, `similarity`, `prf`, `icon`, `share` restituiscono un esito; con 2 file scelti `zip` e `crypto` lavorano su dati veri; «Copia risultati» scrive negli appunti righe `id | OK/KO/? | ms | dettagli`; ricaricando con la rete spenta la pagina si apre dal service worker; nessun errore in console. Su HTTPS `install` dà OK, su `http://localhost` dà KO (https=no).

**Come abilitare GitHub Pages (Luca, ramo `main`, cartella radice).**

1. Aprire `https://github.com/lucata76-beep/Nay-app` → **Settings** → **Pages** (menu a sinistra).
2. In «Build and deployment» → **Source**: «Deploy from a branch».
3. **Branch**: `main`, cartella `/ (root)` → **Save**.
4. Attendere la prima pubblicazione (il tempo non è stato verificato); lo stato si vede nella scheda **Actions** («pages build and deployment») e in cima alla pagina Pages compare l'indirizzo del sito.
5. Verifica G1: aprire `https://lucata76-beep.github.io/Nay-app/` in HTTPS: deve mostrare «NAY-App» e `v0.1.0`.

**Indirizzo della prova da aprire dal Samsung (G2):** `https://lucata76-beep.github.io/Nay-app/spike/` **[Da provare: ricavato dal nome del repo; non aperto]**. Poi: menu ⋮ di Chrome → «Installa app» o «Aggiungi a schermata Home», aprire dall'icona, scegliere foto e video, «Esegui tutti», i tre pulsanti di condivisione con ChatGPT e Gemini, «Copia risultati» e incollare in chat. Istruzioni complete: `docs/test-samsung-results.md`.

---

Ultimo aggiornamento: 16 novembre 2026

## Dove siamo

- **Fase:** 2 — Logica (T3-T10), in corso. La fase 1 è completa lato codice; il gate G2 (prova sul Samsung) è stato eseguito da Luca (vedi «Fatti comunicati da Luca» più sotto).
- **Ultimo task chiuso:** T8 (esportazione)
- **Prossimo task:** T9 (backup cifrato)

## Gate aperti

- **G1** (Luca): abilitare GitHub Pages dalle impostazioni del repo (ramo `main`, cartella radice) e verificare che `https://lucata76-beep.github.io/Nay-app/` si apra in HTTPS e mostri «NAY-App» e `v0.1.0`. **[Da provare]**: non è stato aperto da questa sessione.
- **G2** (Luca, non blocca le fasi 2-3): aprire `https://lucata76-beep.github.io/Nay-app/spike/` sul Samsung in Chrome, aggiungere alla schermata Home, eseguire i controlli e incollare i risultati in chat. Istruzioni e tabella da compilare: `docs/test-samsung-results.md`. **[Da provare]**: l'indirizzo è ricavato dal nome del repo.

## Scostamenti dal piano e scelte fatte

- **T0, `package.json`:** lo script `test` è `node --test "tests/*.test.js"` invece di `node --test tests/`. Con Node 22.23.4 il comando del piano non trova la cartella (errore `Cannot find module '.../tests'`, provato).
- **Prima di T0:** i 4 file di partenza sono stati spostati con `git mv` nel commit `chore: sposta i file di partenza`, per istruzione di Luca; per questo T0 non li crea.
- **Metodo di lavoro:** direttamente sul ramo `main` (come chiesto da Luca), senza worktree separato; `STATUS.md` fa da registro (non sono stati usati gli script `.superpowers/` della skill di esecuzione).
- **T1:** il pixel (20,20) del logo misura `#fbf6ef` (251,246,239), non `#fdf6ef` come scritto in spec e piano (2/255 sul rosso). Il piano chiede la tela maskable `#fdf6ef` e così è stato fatto; `icon-512.png` e `icon-192.png` (logo intero ridotto) hanno lo sfondo originale del logo. Differenza non visibile a occhio.
- **T1:** `check_icons.py` accetta un percorso facoltativo (default: `assets/icons/icon-maskable-512.png`); serve a provare che dia KO su un'icona fuori area (provato: logo intero ridotto a 512 → 42,3%, KO).
- **T2, radice delle parole:** il controllo `similarity` del piano chiede la radice delle parole, ma i file `vendor/snowball-*.js` sono del task T7. Scelta: copia **non modificata** di `_stemmer.js` e `spanish_stemmer.js` di snowball-stem 1.1.1 in `spike/snowball/` (con il testo della licenza BSD-3-Clause), solo per il prototipo usa e getta. T7 crea i suoi file in `vendor/` a modo suo. Costo se sbagliata: due file in più da cancellare insieme alla spike.
- **T2, file in più rispetto al piano:** `vendor/fflate.LICENSE.txt` e `spike/snowball/snowball-stem.LICENSE.txt` (testi delle licenze MIT e BSD-3-Clause delle librerie copiate; non sono il `LICENSE` del repo, che non esiste).
- **T2, `formatResults`:** `ms` mancante diventa `-` (il piano non lo specifica); `ms` arrotondato a un decimo; gli a-capo nei dettagli diventano spazi (test aggiunto, rosso poi verde) così resta una riga per esito.
- **T2, riga `device`:** il testo copiato da «Copia risultati» ha una riga `device` in più (user agent, schermo, UA-CH se disponibile) per riconoscere modello e Android del telefono. Non è uno dei 9 controlli.
- **T2, esiti:** `prf` dà `?` (non OK) anche se `PublicKeyCredential` esiste, perché la domanda (PRF) qui non ha risposta; `install` dà KO se l'indirizzo non è HTTPS (provato in locale: KO su http://localhost, OK su https).
- **T2, testi della spike in italiano** dentro `spike/`: la spike non è l'app, la regola «stringhe solo in `js/i18n/`» vale per l'app.
- **T2, script di verifica in Chromium:** non è nel repo (Playwright non è una dipendenza del progetto); è stato eseguito dallo scratchpad della sessione.
- **Dopo T2:** un commit in più (`docs: resoconto per Claude dopo T2`) solo per il blocco «Resoconto per Claude», perché l'hash del commit di T2 non può stare dentro il commit stesso.
- **T2, `.nojekyll`:** su GitHub Pages la spike non partiva perché Jekyll non pubblica i file che iniziano con `_` (`spike/snowball/_stemmer.js`, importato da `spanish_stemmer.js`), quindi `spike.js` non girava. Il test locale con `python3 -m http.server` non vede il Jekyll di Pages (serve tutti i file), per questo il problema non è emerso. Aggiunto `.nojekyll` vuoto nella radice, con il test `nojekyll exists` (rosso poi verde). Che con `.nojekyll` la spike parta davvero su Pages è **[Da provare]**: non verificabile dal mio ambiente.

## Fase 2 (T3-T10): fatti, scelte e scostamenti

**Fatti comunicati da Luca dal test sul Samsung del 16 novembre 2026** (riportati come da lui, **non verificati da me**; Samsung SM-S936B, Android 17, Chrome 157):
- Lo ZIP non si condivide: `canShare` dice sì ma `share` lancia `NotAllowedError` («Permission denied»).
- ZIP di 3 video (159,4 MB) fatto in 0,59 s con tutto l'output in memoria (heap circa come lo ZIP).
- PBKDF2 a 600.000 ripetizioni: 78 ms. AES-GCM su un video da 42 MB: cifra 60 ms, legge 48 ms. Si tengono 600.000 ripetizioni.
- GitHub Pages usa Jekyll: `.nojekyll` resta nella radice; nei file nuovi si evita il trattino basso iniziale.
- Non si importa da `snowball-stem/esm/…` (`ERR_PACKAGE_PATH_NOT_EXPORTED`).

**T3 — lingue**
- `setLang` con una lingua non supportata lancia `RangeError` e non scrive nulla (il piano non lo dice); un valore sconosciuto già salvato in `nay.lang` vale `es`.
- I dizionari sono oggetti piatti con chiavi a punti (`export const es`, `export const it`). Oltre alle chiavi che il piano nomina ci sono quelle di navigazione, titoli, schermata di sblocco e `error.passwordTooShort`/`error.passwordMismatch`: le altre chiavi arrivano con i task che le usano.
- Test in più rispetto al piano: stessi segnaposto in es e it, nessun messaggio vuoto, chiavi obbligatorie presenti, ripiego su `es`, lingua non supportata, evento `langchange`, funzionamento senza `dispatchEvent`, `t` segue la lingua corrente.
- I testi in spagnolo e in italiano sono scritti da Claude e **non ancora rivisti** (spagnolo: da lei; italiano: da Luca) — revisione in T19.

**T4 — cifratura e vault**
- **Revisione indipendente** (sub-agente su modello Opus, in sola lettura, prima del commit): nessun problema Critical. Applicati con test rosso→verde: busta cifrata malformata (IV non di 12 byte, testo cifrato più corto del tag da 16 byte, base64 non valido, versione diversa) ora dà `TypeError`/`InvalidCharacterError` e non `WrongSecretError`; `unlockWithPassword`/`unlockWithRecoveryCode` sono `async` (errori sempre come promessa rifiutata); `normalizeRecoveryCode` rifiuta i non-stringa; test aggiunti per NFD nel cambio password, lunghezza minima dopo NFC, trattini tipografici e caratteri a larghezza piena nel codice di recupero.
- **Non applicato:** rifiutare `changePassword` su un vault non confermato. Cambierebbe il comportamento del piano (il test del piano usa il vault appena creato); costo se sbagliato: se T11 salvasse il record sbagliato dopo un cambio password, `setupComplete` resterebbe `false`. Resta una **regola per T11** (sotto).
- **Forma del record del vault** (il piano non la fissa): `{id: 'vault', v: 1, kdf: {name: 'PBKDF2-SHA256', iterations}, password: {salt, key: Envelope}, recovery: {salt, key: Envelope}, check: Envelope, setupComplete}`. `id: 'vault'` c'è così il record si salva direttamente nell'archivio `meta`. `check` è una costante cifrata con la chiave dei dati: `changePassword` la usa per rifiutare la sessione di un altro vault (`VaultMismatchError`), che altrimenti renderebbe illeggibili i dati.
- Scelte: password e codice di recupero usano le stesse ripetizioni PBKDF2 (nel record); la lunghezza della password si conta in caratteri dopo NFC (`PasswordTooShortError` con `minLength`); in `passwordStrength` «simbolo» è ogni carattere che non è lettera né cifra (spazio compreso); il codice di recupero in ingresso passa da NFKC, perde spazi, `-` e trattini tipografici, diventa maiuscolo; la chiave dei dati della sessione è estraibile (serve a ricustodirla al cambio password) e `exportSessionKey` è esportata da `crypto.js`: «solo per vault.js» è una convenzione, non è imposta.
- Test in più rispetto al piano: busta alterata, byte, IV diverso a ogni cifratura, forma del codice di recupero, codice sbagliato, `changePassword` (codice di recupero e stato conservati, password corta, sessione di un altro vault, NFD), accenti/ñ/¿/¡ con NFC e NFD, vault mai confermato dopo il riavvio, record JSON, due vault diversi, input non validi. Controllati con mutazioni temporanee (NFC disattivata, controllo di appartenenza tolto, `isSetupComplete` sempre vero): i test falliscono come devono.
- **Regole per T11** (dalla revisione): (1) salvare sempre il record restituito da `confirmRecoveryCode`, non quello di `createVault`; (2) una nuova creazione non deve mai sovrascrivere un vault se esistono già dati cifrati; (3) la schermata di sblocco non deve togliere gli spazi (`trim`) dalla password: gli spazi fanno parte della password.
- **Limite [Da provare sul telefono]:** la busta cifrata è in base64 (come da piano). Misurato in Node dal revisore, non sul Samsung: cifrare un file da 50 MB ≈ 2,5 s e ≈ 530 MB di memoria, 150 MB ≈ 6,5 s e ≈ 1,46 GB; oltre circa 380 MB di file la stringa base64 supera il limite di lunghezza di V8 (`RangeError`). I video molto grandi potrebbero quindi non salvarsi: da misurare sul telefono (il test di Luca, con 42 MB, è andato bene).

**T5 — archivio cifrato**
- Nel database restano in chiaro solo `id` e `updatedAt`: il record è `{id, updatedAt, enc}`; per i blob `{id, updatedAt, enc, info}` dove `info` è una busta cifrata con `{id, type, size}` (anche il tipo MIME è cifrato). Test: `stored value does not contain the plaintext` e, in più, `stored blob does not contain the plaintext bytes or the mime type`.
- Scelte (il piano non le fissa): `Db.get` restituisce `null` se il record manca; `STORES`, `DB_NAME` e `NEAR_FULL_RATIO` sono esportati da `db.js`; `save` rifiuta un `id` non stringa; ogni record decifrato deve avere lo stesso `id` della chiave con cui è salvato (un record copiato sotto un altro id viene rifiutato: test per record e per blob); `all` è rigoroso: se un solo record è illeggibile l'intera lista fallisce, invece di ometterlo in silenzio; `loadBlob` di un id mancante lancia un errore; senza API di spazio `storageStatus` restituisce zeri e `nearFull: false`.
- **Review Focus 4 (memoria piena):** test `QuotaExceededError becomes StorageFullError and leaves the previous record intact` (nome del piano) più `... while saving a blob ... writes nothing`, più due test sul percorso di IndexedDB (errore lanciato dentro la richiesta e transazione annullata con l'errore in `tx.error`, come fa il browser). Una mutazione temporanea ha mostrato una lacuna nel secondo percorso: il test è stato aggiunto prima del commit. **[Da provare]** sul telefono: la quota esaurita vera è solo simulata (fake-indexeddb).
- **Per T12:** il salvataggio di una foto o di un video fa più scritture (blob, `media`, idea) e T5 non le rende atomiche insieme: se `StorageFullError` arriva dopo `saveBlob`, T12 deve cancellare il blob rimasto con `store.remove('blobs', id)` per non lasciare record a metà.
- Test in più rispetto al piano: `openDb` crea tutti gli archivi, `load`/`remove`, record illeggibili con un'altra sessione, `loadBlob` mancante, altri errori di scrittura non diventano `StorageFullError`, `storageStatus` senza API.

**T6 — idee, template, prompt, bozze**
- Test del piano presenti con i nomi del piano; il test `draft roundtrip and clear` sta in `tests/ideas.test.js` (il piano non elenca un file di test per le bozze). Test in più: idea con solo testo/solo media, lingua non supportata, ricerca con NFC/NFD e query vuota, segnaposto noti, `formatHistory` (più recenti, tetto `max`, ripetizioni, riga singola, input non modificato), `buildPrompt` (lingue, storico vuoto, valori che non scavalcano idea/storico/lingua), bozze cifrate. Cinque mutazioni temporanee sul codice (valori vuoti, ripiego sull'idea del modulo, ordine degli `similarIds`, stato «pubblicata», ricerca senza accenti) sono state intercettate dai test.
- Scelte (il piano non le fissa): `Idea` ha in più il campo facoltativo `publicationId`, perché `linkToPublication(idea, publicationId)` lo riceve e non c'è altro modo di usarlo; `createIdea` toglie gli spazi ai bordi del testo, rifiuta lingue non supportate e `mediaIds` che non sia un elenco (`EmptyIdeaError` se mancano testo e media); `markInDevelopment` non fa tornare indietro un'idea già «pubblicata»; `searchIdeas` richiede tutte le parole cercate, senza badare a maiuscole, accenti e tilde (anche «ñ» vale «n»: «año» trova «ano»); le bozze stanno cifrate nell'archivio `meta` con id `draft:<formId>`.
- `renderTemplate` sostituisce in un solo passaggio e con valori letterali; un valore vuoto o di soli spazi conta come non riempito (il segnaposto resta nel testo) e `findUnfilled` segnala anche i segnaposto sconosciuti. `duplicateTemplate` tiene lo stesso nome (nessun suffisso «copia», per non mettere testo di interfaccia fuori da `js/i18n/`): lo cambierà l'editor di T13.
- `buildPrompt`: `idea`, `storico` e `lingua` vengono sempre dall'idea e dallo storico (il testo del modulo vale solo se l'idea non ha testo, per le idee con soli media); `{tipo_media}` parte dal tipo di template; la lingua del post è scritta nella lingua del template (template italiano + post in spagnolo → «spagnolo»); senza storico c'è una riga neutra al posto di `{storico}`; i segnaposto del modulo rimasti vuoti restano visibili. `formatHistory` non filtra per lingua: chi chiama passa i post già filtrati.
- **Testi dei template (8 corpi, 4 tipi × 2 lingue):** scritti da Claude e **non rivisti**; richiedono HOOK e CAPTION come due risposte separate; 5 varianti di hook e 3 di caption sono una scelta provvisoria da tarare con lei **[Da provare]** (la spec lascia il numero al test).
- **Per T13:** se non c'è una guida di stile salvata, `{stile}` resta vuoto e quindi visibile e segnalato da `findUnfilled`: l'interfaccia deve decidere se avvisare o riempirlo.

**T7 — somiglianza e registro delle ripetizioni**
- **Esempio del piano e misura di somiglianza.** Il piano dice che «Ánimo valiente» trova «animo y valentía», ma con lo stemmer vero «valiente» → `valient` e «valentía» → `valent` sono radici diverse (provato). Il piano non fissa la formula di `similarity`: ho scelto il **coefficiente di Dice** sulle radici (2·in comune / somma degli insiemi). Con Dice quell'esempio vale esattamente 0,5 e passa a soglia 0,5 (con la Jaccard varrebbe 0,33 e non passerebbe); è un caso al limite, quindi la soglia 0,5 va davvero calibrata sui 50 post veri **[Da provare]**. Un test nomina i limiti noti: «amar»/«amando» (come in spec) e «valiente»/«valentía» restano parole diverse.
- **Accenti e NFC/NFD (Review Focus 1).** Il testo passa da NFC, si divide in parole (lettere Unicode), e le parole si confrontano **senza accenti** (anche «ñ» vale «n») prima di calcolare la radice. Motivo: senza questo passaggio «valentía» → `valent` ma «valentia» → `valenti` (provato) e l'italiano dà radici con accento (`ànim`). Test: `accented and unaccented words match` (nome del piano), `the same text typed as NFC or NFD matches`, più i casi «corazón/corazones», «sueños/suenos», «perché/perche», «felicità/felicita». Costo: «año» e «ano» si confondono.
- `sharedWords` sono le parole del testo controllato, minuscole e con gli accenti come scritte (non le radici), così si possono evidenziare; `findSimilar` confronta titolo + descrizione, esclude i post di un'altra lingua e i punteggi 0, ordina per punteggio e, a parità, per post più recente; senza `limit` non ha tetto.
- Elenchi di parole vuote (spagnolo e italiano) scritti a mano da me, non da una fonte: da affinare sui testi veri **[Da provare]**.
- **`vendor/snowball-es.js` e `vendor/snowball-it.js`:** un solo file ciascuno (classe base + stemmer), senza trattino basso iniziale per Jekyll, licenza BSD-3-Clause in testa, algoritmo non modificato (tolto solo `export` alla classe base e la riga di import). Costruiti con uno script di unione eseguito dallo scratchpad (non nel repo); un test confronta le radici con `snowball-stem` 1.1.1 su 27 parole. La spike usa ancora la sua copia in `spike/snowball/` (non toccata).
- **File in più rispetto al piano:** `js/features/text.js` (`foldText`, usato da `ideas.js`, `similarity.js`, `repetitions.js`; `ideas.js` è stato aggiornato per usarlo, test di T6 ancora verdi).
- Registro: `pairKey` è un array JSON (nessuna ambiguità tra i pezzi) e per due pubblicazioni l'ordine non conta; gli `id` delle voci sono casuali (non derivati dalla coppia, perché gli id restano in chiaro nel database); `registerMatches` legge e decifra tutte le voci a ogni chiamata (va bene per centinaia di voci, non misurato oltre) **[Da provare]**; `setStatus` rifiuta stati non validi e id mancanti.
- **`searchRepetitions` filtra le date sul controllo (`checkedAt`), non sulla pubblicazione trovata.** La spec chiede anche la data della pubblicazione trovata, ma il tipo `Repetition` del piano non la contiene e la firma `searchRepetitions(reps, q)` non riceve le pubblicazioni: **per T14** serve unire le pubblicazioni (o estendere il tipo). Una data «solo giorno» in `to` vale per tutto il giorno in UTC.
- Test in più rispetto al piano: ordine e parità dei risultati, tetto `limit`, input non modificato, stato dei post senza titolo, voci cifrate, `checkNewPublication` (stessa lingua, non contro sé stesso, coppia vista dall'altro lato), `setStatus`, date come `Date` o con orario. Sei mutazioni temporanee (accenti, Jaccard, lingua, radice con accenti, coppie note, ordine della coppia) sono state intercettate.

**T8 — esportazione**
- **Fatto del Samsung applicato** (comunicato da Luca, non verificato da me): lo ZIP non si condivide. `shareContent` restituisce `'unsupported'` anche su `NotAllowedError` (test `shareContent returns unsupported on NotAllowedError`, simulato con un finto `navigator`); `canShareFiles` e `shareContent` rifiutano **qualsiasi ZIP** (tipo MIME dello ZIP o nome `.zip`, anche mescolato ad altri file) **senza nemmeno chiamare `canShare`**: lo ZIP si salva solo con `saveToDevice`. Test: `shareContent never shares a ZIP, even when canShare says yes`.
- Scelte (il piano non le fissa): `shareContent` con `canShare` assente dà `'unsupported'` (anche per solo testo, che usa `canShare({text})`); senza testo né file lancia `TypeError`; altri errori di `share` (per esempio `TypeError`) vengono rilanciati; `copyText` lancia `ClipboardUnavailableError` se gli appunti non ci sono e non ha il ripiego con `execCommand` della spike; `saveToDevice(blob, filename, env)` ha un terzo parametro facoltativo `env` (documento, `URL`, `setTimeout`) solo per poterlo provare senza browser, e libera l'indirizzo temporaneo dopo 30 s **[Da provare]** sul telefono.
- `makeZip`: `prompt.txt` compresso (`ZipDeflate`), i file passati senza compressione (`ZipPassThrough`); nomi ripuliti (separatori di percorso e caratteri vietati diventano `_`, nome vuoto → `file`); nomi doppi con suffisso `-2`, `-3` prima dell'estensione, senza scontri con altri nomi, con `prompt.txt` (un file chiamato `prompt.txt` diventa `prompt-2.txt`) né a meno delle maiuscole; nomi con accenti e ñ conservati.
- **Limite di memoria di `makeZip` con file grandi [Da provare sul telefono].** `makeZip` restituisce `Promise<Blob>` come da piano e tiene tutti i pezzi dello ZIP in memoria finché non crea il Blob. Dalla prova di Luca sul Samsung (comunicata, non verificata da me): 3 video, 159,4 MB, 0,59 s, heap circa pari allo ZIP. **Misurato in Node qui** (indicativo, non vale per il telefono): 3 file da 53 MB (159 MB) → 0,7 s e +322 MB di memoria del processo a fine lavoro; 3 file da 200 MB (600 MB) → 2,8 s e +1,2 GB. Con file più grandi sul telefono il limite sarà la memoria e non so a che dimensione l'app si blocca: se serve, T13 potrà avvisare sopra una soglia o si dovrà passare a una scrittura a flusso su file.
- Test in più rispetto al piano: nomi sicuri e senza scontri, nomi unicode, ZIP vuoto/prompt vuoto/file grande in molti pezzi, compressione di prompt e media, `shareContent` (senza `share`, condiviso con testo e file, solo testo, errori rilanciati, niente da condividere), `canShareFiles`, `copyText` che fallisce, `saveToDevice` (link, pulizia del nome). Sei mutazioni temporanee (ZIP ammesso, `NotAllowedError`, soglia dei file, maiuscole, nomi non ripuliti, prompt non compresso) sono state intercettate.

## Da verificare

- Tutto ciò che richiede il Samsung (gate G2): vedi `docs/test-samsung-results.md`.
- GitHub Pages in HTTPS (gate G1).

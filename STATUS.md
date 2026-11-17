# STATUS

## Resoconto per Claude (dopo T10, 17 novembre 2026)

**Riassunto.**
1. PASSO 0 (correzione della spec, hash verificato) e T3-T10 sono fatti in ordine, ognuno con i test visti rossi e poi verdi e un commit pubblicato su `main`; la suite ha 203 test, tutti verdi (Node 22.23.4). T11 non è iniziato.
2. T4 (vault) e T9 (backup) sono stati rivisti prima del commit da un revisore indipendente (sub-agente su modello Opus, sola lettura): nessun Critical; in T9 un problema Important (intestazione del backup non autenticata), corretto con test.
3. Non verificato: tutto ciò che richiede il Samsung o un browser vero (IndexedDB e quota reali, condivisione, memoria con file grandi), la qualità della somiglianza sui 50 post veri, la revisione dei testi in spagnolo e in italiano.

**Stato.** Fase 2 (logica, T3-T10) completa; la fase 3 (interfaccia, T11-T16) non è iniziata. Nessun file dell'interfaccia esiste ancora: i moduli sono provati solo con i test in Node, quindi la verifica manuale del Review Focus 2 (primo avvio interrotto, T11) e il Review Focus 5 (cache e versione, T11) restano da fare. `spike/` non è stato toccato. Nessun `LICENSE`, nessuna CDN, nessun segreto nel codice.

**Ambiente (verificato).** Node v22.23.4; `fake-indexeddb` 6.2.8, `fflate` 0.8.3, `snowball-stem` 1.1.1 (`npm ls`); WebCrypto, `Blob`, `File`, `Intl` di Node. Nessun browser è stato usato in questa fase.

**Commit (tutti su `main`, tutti pubblicati):**

| Hash | Messaggio |
|---|---|
| `806426c` | docs: correzioni alla spec (telefono, Android, sfondo logo) — `sha256sum` = `6b69efebff601db61c4dfd44ef1c7c06dc4aeee16911526e311983d4dc5ed940`, come atteso; ognuna delle 5 sostituzioni ha trovato una sola corrispondenza |
| `648ced2` | feat: lingue es/it (T3) |
| `0f6dc00` | feat: vault cifrato (T4) |
| `97b0e76` | feat: archivio cifrato (T5) |
| `a1c5d34` | feat: idee, template, prompt (T6) |
| `6b56a99` | feat: somiglianza e registro (T7) |
| `1aeebb2` | feat: esportazione (T8) |
| `77c2a45` | feat: backup cifrato (T9) |
| `db9b050` | feat: statistiche (T10) |
| ultimo su `main` | docs: resoconto per Claude dopo T10 (questo blocco; il suo hash è in `git log -1`) |

**Output di `npm test`** (203 test, dopo il commit di T10). Qui sotto c'è la versione compatta: ho tolto di ogni test le righe `# Subtest`, `---`, `duration_ms`, `type` e `...`. L'output **integrale** (1232 righe) è in `docs/npm-test-dopo-T10.txt`.

```
> nay-app@0.1.0 test
> node --test "tests/*.test.js"
TAP version 13
ok 1 - roundtrip into an empty db restores all stores
ok 2 - the backup keeps the records encrypted
ok 3 - import replaces the existing data and the vault
ok 4 - wrong secret throws WrongSecretError and leaves the db unchanged
ok 5 - truncated file throws BackupFormatError and leaves the db unchanged
ok 6 - a file with extra bytes at the end throws BackupFormatError
ok 7 - a corrupted record throws BackupFormatError and leaves the db unchanged
ok 8 - a record moved under another id throws BackupFormatError
ok 9 - future version throws BackupVersionError
ok 10 - files that are not backups throw BackupFormatError
ok 11 - errors carry clear names and are Error instances
ok 12 - recovery code opens a backup
ok 13 - estimateBackupSize is at least the sum of the stored blob sizes
ok 14 - exporting an app with only the vault gives a backup that imports
ok 15 - the backup does not list the vault twice and its counts match the records
ok 16 - import is all-or-nothing when the storage fills up while writing
ok 17 - import is all-or-nothing when the browser aborts the write transaction
ok 18 - a rebuilt file without defects imports (so the cases below fail only for their own defect)
ok 19 - every single flipped bit in the header area is rejected, never imported
ok 20 - a header altered but with a matching digest is still checked field by field
ok 21 - PBKDF2 iterations above the cap are refused at once
ok 22 - the declared counts must match the records in the file
ok 23 - duplicate ids, an out-of-range store index, and a vault record among the meta records are refused
ok 24 - records that are not valid records are refused
ok 25 - a blob whose info belongs to another blob is refused
ok 26 - the version field is checked on its own: 0 is invalid, 2 is a future version
ok 27 - a file whose records come from another vault is refused
ok 28 - exportBackup refuses a vault whose recovery code was never confirmed
ok 29 - exportBackup rejects a vault that is not a vault record
ok 30 - zip contains prompt.txt and the files
ok 31 - duplicate names get a suffix
ok 32 - a suffix never collides with another name, nor with prompt.txt, nor by case
ok 33 - file names cannot point outside the archive
ok 34 - file names with accents and ñ survive in the zip
ok 35 - zip works with no files, with an empty prompt and with a large file in many chunks
ok 36 - zip stores media as they are and deflates the text
ok 37 - fileCountWarning is false at 10 and true at 11
ok 38 - shareContent returns unsupported without canShare
ok 39 - shareContent returns unsupported without navigator.share
ok 40 - shareContent returns cancelled on AbortError
ok 41 - shareContent returns unsupported on NotAllowedError
ok 42 - shareContent returns shared and gives text and files to navigator.share
ok 43 - shareContent shares plain text when there are no files
ok 44 - shareContent never shares a ZIP, even when canShare says yes
ok 45 - shareContent rethrows other errors
ok 46 - shareContent rejects when there is nothing to share
ok 47 - canShareFiles asks navigator.canShare and is false without it
ok 48 - copyText calls clipboard.writeText
ok 49 - copyText rejects when the clipboard is unavailable or refuses
ok 50 - saveToDevice clicks a download link for the blob and releases the URL later
ok 51 - saveToDevice cleans the file name
ok 52 - es and it have the same keys
ok 53 - es and it use the same placeholders in every key
ok 54 - no message is empty
ok 55 - required keys exist
ok 56 - default language is es
ok 57 - setLang persists and getLang reads it back
ok 58 - getLang falls back to es when the stored value is unknown
ok 59 - setLang rejects an unsupported language
ok 60 - setLang emits langchange on globalThis when it exists
ok 61 - setLang works when globalThis has no dispatchEvent
ok 62 - t uses the current language
ok 63 - t interpolates {n}
ok 64 - t returns the key when missing
ok 65 - icon sizes
ok 66 - createIdea rejects an idea with no text and no media
ok 67 - createIdea accepts text only, media only, or both
ok 68 - default lang is es
ok 69 - createIdea rejects an unsupported lang
ok 70 - createIdea fills id, status, dates and copies mediaIds
ok 71 - status changes follow the rules
ok 72 - searchIdeas finds words ignoring case and accents
ok 73 - searchIdeas matches the same word typed as NFC or NFD
ok 74 - searchIdeas returns everything for an empty query and keeps the order
ok 75 - draft roundtrip and clear
ok 76 - drafts are stored encrypted
ok 77 - MIN_PASSWORD_LENGTH is 10
ok 78 - passwordStrength is debole under 10 chars
ok 79 - passwordStrength is buona with 14+ chars and three kinds
ok 80 - passwordStrength is media from 10 chars or with fewer than three kinds
ok 81 - passwordStrength counts characters after NFC normalization
ok 82 - PasswordTooShortError carries the minimum length
ok 83 - formatHistory keeps similarIds first and respects max
ok 84 - formatHistory takes the most recent posts first when there are no similar ones
ok 85 - formatHistory never exceeds max, even with more similar posts than max
ok 86 - formatHistory returns an empty string without posts or with max 0
ok 87 - formatHistory skips unknown similarIds and does not repeat a post
ok 88 - formatHistory writes each post on a single line
ok 89 - formatHistory does not change the posts it receives
ok 90 - buildPrompt fills idea, history and language
ok 91 - buildPrompt writes the language name in the template language
ok 92 - buildPrompt uses a neutral line when there is no history
ok 93 - buildPrompt: the idea, history and language come from the idea, not from values
ok 94 - buildPrompt leaves unfilled form placeholders visible so they can be flagged
ok 95 - buildPrompt uses the idea text from the form only when the idea has no text
ok 96 - pairKey is stable, distinguishes its parts and ignores the order of a publication pair
ok 97 - registerMatches creates one entry per match with status da_valutare
ok 98 - registerMatches with no matches does nothing
ok 99 - registerMatches is idempotent per pair
ok 100 - falso_allarme is not signalled again
ok 101 - setStatus changes and returns the entry, and rejects unknown statuses and ids
ok 102 - registry entries are stored encrypted
ok 103 - searchRepetitions filters by date and by word
ok 104 - searchRepetitions accepts Date objects and full timestamps, and does not change its input
ok 105 - checkNewPublication compares a new post with the existing ones, in its own language only
ok 106 - checkNewPublication does not repeat a pair already seen from the other side
ok 107 - required files exist
ok 108 - nojekyll exists
ok 109 - APP_VERSION is semver
ok 110 - openDb creates every store and Db works on each
ok 111 - stored value does not contain the plaintext
ok 112 - stored blob does not contain the plaintext bytes or the mime type
ok 113 - save sets id and updatedAt
ok 114 - save keeps an explicit id, overwrites that record and refreshes updatedAt
ok 115 - all returns decrypted records
ok 116 - load returns null for a missing record and remove deletes a record
ok 117 - records are unreadable with another session
ok 118 - a record copied under another id is rejected
ok 119 - blob roundtrip keeps bytes
ok 120 - a blob record copied under another id is rejected
ok 121 - loadBlob rejects for a missing id
ok 122 - QuotaExceededError becomes StorageFullError and leaves the previous record intact
ok 123 - QuotaExceededError while saving a blob becomes StorageFullError and writes nothing
ok 124 - other write errors are not turned into StorageFullError
ok 125 - a quota error raised inside the IndexedDB request writes nothing and reaches the caller
ok 126 - a quota error that aborts the IndexedDB transaction writes nothing and becomes StorageFullError
ok 127 - replaceAll replaces every store in one transaction
ok 128 - replaceAll rolls everything back when a write fails
ok 129 - replaceAll rolls everything back when the browser aborts the transaction
ok 130 - replaceAll rejects unknown store names without touching the data
ok 131 - storageStatus flags nearFull at 80% usage
ok 132 - storageStatus does not fail when the browser has no storage API
ok 133 - SIMILARITY_THRESHOLD is 0.5 (to be calibrated on the real posts)
ok 134 - identical texts score 1 and disjoint texts score 0
ok 135 - similarity is symmetric, ignores repeated words and stays between 0 and 1
ok 136 - accented and unaccented words match
ok 137 - the same text typed as NFC or NFD matches
ok 138 - cuore and cuori share a stem
ok 139 - tokenize lowercases, splits on punctuation and drops stopwords and short words
ok 140 - known limits of the stemmer: amar and amando, valiente and valentía are different words
ok 141 - tokenize rejects an unsupported language
ok 142 - texts in different languages are never compared
ok 143 - findSimilar respects the threshold and the limit
ok 144 - findSimilar sorts by score and breaks ties with the most recent post
ok 145 - findSimilar compares title and description and reports the shared words
ok 146 - findSimilar does not change its input
ok 147 - findSimilar handles posts without title or description
ok 148 - vendor stemmers give the same stems as snowball-stem 1.1.1
ok 149 - formatResults formats one line per result
ok 150 - formatResults handles missing ms
ok 151 - formatResults keeps one line per result when details contain newlines
ok 152 - zero posts gives zeros and empty arrays
ok 153 - posts without views are ignored in view aggregates
ok 154 - posts without comments are ignored in comment aggregates
ok 155 - bestHours averages by publication hour
ok 156 - bestHours breaks ties by the earlier hour
ok 157 - byType counts all posts
ok 158 - viewsOverTime adds up the views of each day and is sorted by date
ok 159 - commentsPerPost is in publication order
ok 160 - days and hours follow the time zone
ok 161 - invalid dates are counted in the totals but left out of the time charts
ok 162 - only finite non-negative numbers count as views and comments
ok 163 - computeStats does not change its input and ignores unknown types in byType
ok 164 - PLACEHOLDERS lists the placeholders of the spec
ok 165 - there are 4 kinds in 2 languages, all builtin, with unique ids
ok 166 - every default template contains {lingua} and {idea}
ok 167 - every default template asks for hook and caption separately
ok 168 - default templates use only known placeholders and the history/style ones
ok 169 - video templates ask for the video length and photo templates do not
ok 170 - renderTemplate replaces all placeholders
ok 171 - renderTemplate treats values literally
ok 172 - renderTemplate leaves placeholders without a value untouched
ok 173 - findUnfilled lists missing placeholders
ok 174 - duplicateTemplate makes an editable copy
ok 175 - renderTemplate leaves placeholders with an empty value untouched
ok 176 - json roundtrip
ok 177 - bytes roundtrip keeps every byte
ok 178 - encrypting the same value twice gives different ciphertexts
ok 179 - tampered ciphertext is rejected
ok 180 - wrong password throws WrongSecretError
ok 181 - correct password opens the vault and reads the same data
ok 182 - recovery code has 32 base32 characters in groups of 4
ok 183 - recovery code opens the vault (lowercase and spaces)
ok 184 - wrong recovery code throws WrongSecretError
ok 185 - changePassword keeps old data readable and rejects the old password
ok 186 - changePassword keeps the recovery code and the setup state
ok 187 - changePassword rejects a password shorter than MIN_PASSWORD_LENGTH
ok 188 - changePassword rejects a session from another vault
ok 189 - password is normalized to NFC
ok 190 - password with accents, ñ, ¿ and ¡ opens with any normalization
ok 191 - isSetupComplete is false until confirmRecoveryCode
ok 192 - a vault never confirmed is still incomplete after a restart
ok 193 - vault record survives a JSON roundtrip and can be stored as a meta record
ok 194 - default iterations constant is 600000
ok 195 - createVault rejects a password shorter than MIN_PASSWORD_LENGTH
ok 196 - createVault rejects a non-string password and invalid iterations
ok 197 - two vaults get different recovery codes and wrapped keys
ok 198 - changePassword accepts a new password typed as NFD and unlocks with NFC
ok 199 - createVault counts the minimum length after NFC
ok 200 - recovery code accepts typographic dashes and full-width characters
ok 201 - a corrupt vault record is not reported as a wrong password
ok 202 - a vault whose wrapped key was altered looks like a wrong password
ok 203 - unlock functions always return a promise, even for invalid input
1..203
# tests 203
# suites 0
# pass 203
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2326.659788
```

**Test del piano, task per task** (confronto automatico dei nomi nei file con i nomi scritti nel piano; i test dei punti 1, 3 e 4 del Review Focus sono tra questi):

| Task | Nomi del piano trovati | Test nei file del task | Note |
|---|---|---|---|
| T3 | 5 su 5 | `i18n.test.js` 13 | |
| T4 | 11 su 11 | `vault.test.js` 28, `password.test.js` 6 | punto 1: `password is normalized to NFC`; punto 2: `isSetupComplete is false until confirmRecoveryCode` |
| T5 | 6 su 6 | `secure-store.test.js` 23 (4 sono di `replaceAll`, aggiunti in T9) | punto 4: `QuotaExceededError becomes StorageFullError and leaves the previous record intact` |
| T6 | 9 su 9 | `ideas.test.js` 11 (compreso `draft roundtrip and clear`), `templates.test.js` 12, `prompts.test.js` 13 | |
| T7 | 8 su 8 | `similarity.test.js` 16, `repetitions.test.js` 11 | punto 1: `accented and unaccented words match` (contiene l'esempio del piano, che passa solo con Dice a soglia 0,5: vedi scostamento 1) |
| T8 | 7 su 7 (6 del piano + `shareContent returns unsupported on NotAllowedError` chiesto da Luca) | `export.test.js` 22 | |
| T9 | 6 su 6 | `backup.test.js` 29 | punto 3: `truncated file throws BackupFormatError and leaves the db unchanged`, `future version throws BackupVersionError`, `wrong secret throws WrongSecretError and leaves the db unchanged` |
| T10 | 4 su 4 | `stats.test.js` 12 | |

Su ogni task ho fatto mutazioni temporanee del codice (e poi ripristinato): i test falliscono come devono. Dove una mutazione non veniva intercettata ho aggiunto il test prima del commit (T5: percorso asincrono della quota; T9: annullamento asincrono di `replaceAll`, record `vault` tra i `meta`).

**File creati.**
- Spec: `docs/superpowers/specs/2026-11-16-nay-app-design-v1.md` (modificata, 5 sostituzioni).
- T3: `js/i18n/index.js`, `es.js`, `it.js`; `tests/i18n.test.js`.
- T4: `js/core/crypto.js`, `vault.js`, `password.js`; `tests/vault.test.js`, `password.test.js`.
- T5: `js/core/db.js`, `secure-store.js`; `tests/secure-store.test.js`.
- T6: `js/features/ideas.js`, `templates.js`, `prompts.js`, `drafts.js`; `tests/ideas.test.js`, `templates.test.js`, `prompts.test.js`.
- T7: `js/features/similarity.js`, `repetitions.js`, **`text.js`** (non nel piano); `vendor/snowball-es.js`, `vendor/snowball-it.js`; `tests/similarity.test.js`, `repetitions.test.js`; `ideas.js` modificato per usare `text.js`.
- T8: `js/features/export.js`; `tests/export.test.js`.
- T9: `js/core/backup.js`; `tests/backup.test.js`; modificati `db.js` (aggiunto `replaceAll`), `vault.js` (esportato `sessionMatchesVault`), `tests/secure-store.test.js`.
- T10: `js/features/stats.js`; `tests/stats.test.js`.
- Questo resoconto: `docs/npm-test-dopo-T10.txt` (output integrale di `npm test`).
- `STATUS.md` aggiornato a ogni task.

**Scostamenti dal piano** (motivi e costi nella sezione «Fase 2 (T3-T10): fatti, scelte e scostamenti» più sotto):
1. **T7, misura di somiglianza:** il piano non fissa la formula; ho usato il coefficiente di **Dice** perché l'esempio del piano («Ánimo valiente» ↔ «animo y valentía») con lo stemmer vero ha radici `valient` ≠ `valent` e con la Jaccard darebbe 0,33 (sotto soglia); con Dice vale 0,5, esattamente la soglia. Caso al limite: soglia da calibrare **[Da provare]**. Gli accenti (anche «ñ») si tolgono prima della radice.
2. **T9, `Db.replaceAll`:** metodo in più in `db.js` (il piano dà a `Db` solo `put/get/list/remove`) per rendere atomica la sostituzione dei dati; il formato del file ha in più un SHA-256 dell'intestazione.
3. **T7, `searchRepetitions`:** filtra le date sul controllo (`checkedAt`), non sulla pubblicazione trovata, perché il tipo `Repetition` del piano non ha quella data: da risolvere in T14.
4. **T10, T8:** parametri facoltativi in più (`computeStats(pubs, {timeZone})`, `saveToDevice(blob, name, env)`), solo per poterli provare.
5. **T6:** `Idea` ha il campo facoltativo `publicationId`; il test `draft roundtrip and clear` sta in `tests/ideas.test.js`.
6. **T4/T5:** forma del record del vault e dei record cifrati (`id` e `updatedAt` in chiaro, id controllato nel contenuto cifrato, `check` nel vault); non rifiutato `changePassword` su un vault non confermato (resta una regola per T11).
7. **Metodo:** lavoro direttamente su `main`; `STATUS.md` fa da registro. Durante l'attesa della revisione di T9 un hook di fine turno mi ha chiesto di committare le modifiche non salvate: ho rinviato il commit perché Luca vuole la revisione indipendente prima del commit di T9; la revisione è arrivata poco dopo e il commit è stato fatto subito dopo averne applicato l'esito.

**Cosa NON ho verificato.**
- **Il Samsung e i fatti che mi hai dato:** (ZIP non condivisibile, PBKDF2 78 ms, AES-GCM su 42 MB, ZIP di 159,4 MB in 0,59 s) li ho solo riportati e usati, non misurati.
- **Browser e IndexedDB veri:** i test usano `fake-indexeddb`; la quota esaurita, l'annullamento della transazione e le dimensioni massime sono **simulati**. Comportamento di `navigator.share`, `clipboard` e del download con `<a download>`: provato solo con oggetti finti.
- **Memoria e tempi con file grandi sul telefono:** misure indicative solo in Node (cifratura base64 di file da 50 e 150 MB; `makeZip` da 159 e 600 MB). La busta in base64 passa il limite di lunghezza delle stringhe di V8 oltre circa 380 MB di file (misura del revisore in Node). Import ed export del backup tengono tutto in memoria.
- **Somiglianza:** qualità sui 50 post veri, soglia 0,5, elenchi delle parole vuote (scritti da me), formula Dice: tutto **[Da provare]**. Radici testate con `snowball-stem` 1.1.1, non su testi veri.
- **Testi:** i corpi degli 8 template e i testi di interfaccia in spagnolo e italiano sono scritti da me e non rivisti (lei per lo spagnolo, Luca per l'italiano, T19); il numero di varianti (5 hook, 3 caption) è provvisorio.
- **Fusi orari:** `computeStats` provato con i fusi UTC e Europa/Madrid nel Node di qui; sul telefono vale il suo fuso.
- **Revisione indipendente:** solo per T4 e T9 (come chiesto); T3, T5-T8 e T10 non hanno avuto un secondo revisore, solo le mie mutazioni di controllo.
- **Interfaccia:** nessuna; nulla di T11 in avanti, né il gate G1 (GitHub Pages) né G3.

**Stato git.** Prima di scrivere questo blocco: working tree pulito e `HEAD` = `origin/main` = `db9b050` (verificato con `git fetch`). La stessa verifica dopo il commit di questo resoconto è nella risposta.

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

- **Fase:** 2 — Logica (T3-T10) completata. La fase 3 (T11-T16, interfaccia) **non è iniziata**: l'esecuzione si è fermata dopo T10 per istruzione di Luca. Il gate G2 (prova sul Samsung) è stato eseguito da Luca (vedi «Fatti comunicati da Luca» più sotto).
- **Ultimo task chiuso:** T10 (statistiche)
- **Prossimo task:** T11 (guscio dell'app, accesso, barre) — non iniziato

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

**T9 — backup cifrato**
- **Revisione indipendente** (sub-agente su modello Opus, in sola lettura, prima del commit). Nessun problema Critical; uno **Important**, accettato e corretto: l'intestazione del file (che contiene il vault) non era autenticata, e con un fuzz a un bit alla volta circa l'8% dei file corrotti veniva importato (per esempio un bit del codice di recupero, o del nome `setupComplete`: il vault importato risultava «setup non finito» e T11 avrebbe fatto ripartire la creazione, sovrascrivendo il vault). Correzioni, con test rosso→verde: **SHA-256 dell'intestazione** nel file (32 byte prima dell'intestazione: rileva la corruzione accidentale, non un file costruito apposta, perché `exportBackup` non ha la sessione per autenticarlo); intestazione controllata campo per campo (`v` = 1, `kdf.name`, `setupComplete` = true, slot, `check`, iterazioni PBKDF2 tra 1 e 10 milioni); dopo lo sblocco `vault.check` deve decifrarsi (`sessionMatchesVault`, ora esportata da `vault.js`); `exportBackup` rifiuta un vault il cui codice di recupero non è stato confermato.
- Altri punti della revisione: (Minor) test che restavano verdi togliendo un controllo → ora c'è un test mirato per ciascuno, con un file ricostruito che ha un solo difetto (id doppi, record `vault` tra i `meta`, tetto delle iterazioni, conteggi, versione 0, indice di archivio, `info` di un altro blob, slot di recupero, file di un altro vault, bit invertiti in tutta l'area dell'intestazione); le mutazioni sui singoli controlli sono intercettate, tranne due mutanti **equivalenti** (iterazioni non intere e slot della password malformato danno lo stesso errore passando da un altro controllo). (Minor) memoria e tempi: vedi sotto.
- **Scostamento dal piano:** `Db` ha un metodo in più, `replaceAll(data)` (una sola transazione su tutti gli archivi: svuota e riscrive; se qualcosa fallisce non cambia nulla). Il piano dà a `Db` solo `put/get/list/remove`, ma con quelli la sostituzione dei dati non sarebbe atomica: a memoria finita a metà restavano dati misti. Costo se sbagliato: un metodo in più in `db.js` da togliere. Testato anche con l'annullamento asincrono della transazione (come fa il browser). `vault.js` esporta in più `sessionMatchesVault`.
- Formato (il piano dice solo «byte `NAYBK1`, versione, intestazione JSON, poi i record»): `NAYBK1` (6 byte), versione (2 byte, big-endian), lunghezza dell'intestazione (4 byte), SHA-256 (32 byte), intestazione JSON `{format, createdAt, vault, stores: [{name, count}]}`, poi i record in cornici `[indice archivio 1 byte][lunghezza 4 byte][JSON]`. I record restano cifrati; il vault sta nell'intestazione e non tra i record `meta`; la password non compare nel file.
- Comportamento: `importBackup` legge tutto il file senza toccare il database, controlla intestazione e conteggi, prova `secret` come password e poi come codice di recupero (`WrongSecretError` se nessuno dei due), decifra ogni record (e controlla che l'id dentro coincida con quello in chiaro), e solo allora scrive con `replaceAll`; memoria piena → `StorageFullError`. `imported` conta i record, non il vault. Un file troncato, in più, alterato o non di NAY-App → `BackupFormatError`; versione maggiore → `BackupVersionError` (controllata subito dopo i primi 8 byte, anche se il resto non si legge); versione 0 → formato non valido. Test del piano presenti con i nomi del piano; troncamento provato in ogni punto dell'intestazione e ai confini dei record.
- **Limiti [Da provare] sul Samsung:** in importazione tutti i record restano in memoria (stringhe base64) e ogni blob viene decifrato una volta per la verifica prima della scrittura: picco circa 2-3 volte la dimensione del backup; in esportazione `db.list` carica ogni archivio per intero. Con centinaia di MB la scheda può chiudersi per mancanza di memoria (i dati attuali restano intatti, perché la transazione non conclusa viene annullata). Con un'intestazione manomessa (iterazioni fino a 10 milioni) lo sblocco può richiedere decine di secondi (prima la password, poi il codice), senza bloccare l'interfaccia.
- **Per T16 (menu e impostazioni):** (1) dopo `importBackup` la sessione in memoria è quella del vault vecchio: bloccare subito l'app e chiedere di nuovo la password, altrimenti si scriverebbero record non decifrabili; (2) a `exportBackup(db, vault)` passare sempre il vault aggiornato (dopo `changePassword` salvare il nuovo record e usare quello), perché il backup contiene il vault passato, non quello letto dal database.

**T10 — statistiche**
- Test del piano presenti con i nomi del piano (`zero posts gives zeros and empty arrays`, `posts without views are ignored in view aggregates`, `bestHours averages by publication hour`, `byType counts all posts`) più altri: commenti ignorati se mancano, parità tra orari, somma per giorno e ordine per data, ordine dei commenti, fuso orario, date non valide, valori non numerici o negativi, input non modificato. Cinque mutazioni temporanee (zero visualizzazioni per i post senza dato, orari non ordinati, conteggio dei tipi, fuso ignorato, zero non contato come dato) sono state intercettate.
- **Scostamento (compatibile):** `computeStats(pubs, { timeZone }?)` ha un secondo parametro facoltativo; senza, giorno e ora seguono il fuso del telefono. Serve a provare giorno e ora in modo deterministico (le date salvate sono istanti ISO in UTC, e un post delle 23:30 UTC è già il giorno dopo a Madrid).
- Scelte (il piano non le fissa): `viewsOverTime` somma le visualizzazioni per giorno, in ordine di data; `commentsPerPost` è in ordine di pubblicazione (i post con data non valida in fondo); `bestHours` va dalla fascia con più visualizzazioni medie, a parità l'ora più presto (il grafico di T15 può riordinarla per ora); le date non valide contano nei totali ma restano fuori dai grafici nel tempo; contano come dati solo i numeri finiti e non negativi (lo zero è un dato vero); i tipi sconosciuti non compaiono in `byType` ma contano in `totalPosts`; `totalPosts` conta tutti i post.
- **Per T15:** con 200-260 post all'anno il grafico dei commenti per post va limitato (per esempio agli ultimi N); `computeStats` restituisce tutti i dati.

## Da verificare

- Tutto ciò che richiede il Samsung (gate G2): vedi `docs/test-samsung-results.md`.
- GitHub Pages in HTTPS (gate G1).

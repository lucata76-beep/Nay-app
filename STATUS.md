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

- **Fase:** 3 — Interfaccia (T11-T16) in corso, sul ramo `claude/fase-3-interfaccia-ck0hog` (non su `main`: vedi «Fase 3»). Ultimo aggiornamento: 17 novembre 2026.
- **Ultimo task chiuso:** T16 (Menu ⋮, Impostazioni, backup) — `APP_VERSION` 0.7.0. È l'ultimo task di fase 3: **T17-T19 non si toccano** (servono Luca e il telefono).
- **Prossimo task:** T17 (applicare i risultati di G2) — **non iniziato**, aspetta `docs/test-samsung-results.md` compilato da Luca.

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

**Correzioni a moduli di fase 2 trovate in fase 3**
- **T5, `Db.add(store, record)` (commit `fix:` prima di T11).** Il revisore di T11 ha trovato che la creazione del vault controllava (`creationStatus`) e poi scriveva (`db.put`) in due transazioni separate: con due schede ferme sulla schermata del codice di recupero, entrambe potevano scrivere e l'ultima vinceva, lasciando la prima con una sessione che cifra con una chiave diversa dal vault salvato (dati illeggibili). Correzione: `add` fallisce con `ConstraintError` se l'id esiste già (controllo e scrittura nella stessa transazione), usato da `js/ui/screens/lock.js`. Test: `Db.add writes a new record and refuses to overwrite an existing one (ConstraintError)`, visto rosso (`db.add is not a function`) poi verde. Costo se sbagliata: un metodo in più in `db.js`.

## Fase 3 (T11-T16): regole, scelte e scostamenti

Via libera di Luca del 17 novembre 2026. La fase 2 è stata verificata da Claude (chat del Project) su un clone pulito a `ea64f38`: 203/203, nomi dei test di T3-T10 presenti, spec e piano invariati, `spike/` intatta.

**Regole di fase 3 (dalle note di fase 2 e dalla verifica)** — ciascuna è ripresa nel task che la applica:
- T11: salvare il record di `confirmRecoveryCode`; mai una nuova creazione sopra dati cifrati; sblocco senza trim; dopo `changePassword` salvare il record nuovo; `persist()` subito dopo la conferma; blocco automatico dopo `AUTO_LOCK_MS` con la bozza già salvata.
- Tutte le schermate: `store.all()` fallisce per intero se un record è illeggibile → messaggio chiaro (chiave i18n), mai pagina vuota (gestito in `js/main.js`, vale per ogni pagina).
- T12: se `StorageFullError` arriva dopo `saveBlob`, si cancella il blob rimasto. T13: «Condividi tutto» = testo + file, mai lo ZIP. T14: unire le pubblicazioni alle voci del registro. T15: grafico dei commenti limitato agli ultimi N. T16: dopo `importBackup` bloccare e richiedere la password; a `exportBackup` passare sempre il vault aggiornato.

**Scelte e scostamenti comuni a tutta la fase 3** (motivo; costo se sbagliata):
1. **Ramo di lavoro: `claude/fase-3-interfaccia-ck0hog`, non `main`.** `CLAUDE.md` dice «ramo `main`, push dopo ogni commit», ma l'ambiente di questa sessione consente di pubblicare solo su quel ramo senza un permesso esplicito. Conseguenza: GitHub Pages serve `main`, quindi **fino a quando Luca non unisce il ramo a `main` l'indirizzo pubblico non mostra l'interfaccia** (G1/G3 restano **[Da provare]**: da qui Pages non è raggiungibile). Costo se sbagliata: un `git merge --ff-only` (la storia è lineare: un commit per task) su `main`.
2. **Numero di versione ad ogni commit di task che cambia file serviti** (0.2.0 con T11 … 0.7.0 con T16; 1.0.0 è di T19) e `precache.json` rigenerato con `node tools/build_precache.mjs`. Un test (`precache.json was built for the current version and file contents`) fallisce se `precache.json` non è aggiornato rispetto ai file o alla versione: è il promemoria per non dimenticare di alzare `APP_VERSION` e rigenerare (non può sapere se la versione è stata alzata rispetto al commit precedente: quello resta una regola da seguire). Provato in Chromium che senza alzare `APP_VERSION` il telefono non installa niente (vedi T11).
3. **File in più rispetto alla lista del piano** (piccoli, per poter provare la logica con i test o evitare ripetizioni): `js/cache.js` (nome della cache e regola per cancellare le vecchie, importato da `sw.js`), `js/ui/dom.js` (costruzione del DOM senza `innerHTML` e traduzione sul posto), `js/ui/icons.js` (icone a tratto). Costo se sbagliata: tre file da fondere negli altri.
4. **Nessuno `skipWaiting`**: un service worker nuovo aspetta che l'app sia chiusa e poi si attiva, così una pagina aperta non mescola file vecchi e nuovi. Costo: il numero di versione cambia solo dopo aver chiuso del tutto l'app (come chiede il piano: «al riavvio»).
5. **Test dei file serviti** (in `tests/shell.test.js`): nessun percorso assoluto, ogni modulo importato da `js/main.js` e da `sw.js` e ogni file citato da `index.html`, manifest, CSS e stringhe `assets/…` è in `precache.json`; `precache.json` senza `spike/`, `tests/`, `docs/`, `tools/`, `node_modules/`; nessun file con «_» iniziale fuori da `spike/`; `.nojekyll` presente. Controllato con 15 mutazioni temporanee (tutte intercettate).
6. **Script di verifica in Chromium fuori dal repo** (scratchpad della sessione): `package.json` non cambia e non c'è `tools/smoke.mjs`. Telefono emulato: viewport 384×832, `deviceScaleFactor` 2,8125, touch. L'app è servita da una cartella temporanea con un collegamento `Nay-app` al repo, server avviato dalla cartella sopra (`python3 -m http.server`), quindi sotto `/Nay-app/` e mai dalla radice.

### T11 — guscio dell'app, accesso, barre (v0.2.0)

**Test del piano presenti con i nomi del piano (4 su 4):** `precache list files all exist`, `cacheName changes with the version`, `route maps each hash`, `text color on every background token has contrast >= 4.5`. Visti rossi (file e moduli mancanti), poi verdi. Suite: **238 test, tutti verdi** (203 di fase 2 + 1 di `Db.add` + 34 nuovi: `tests/shell.test.js` 22, `tests/contrast.test.js` 6, `tests/lock.test.js` 6).

**Revisione indipendente** (sub-agente su modello Opus, sola lettura, prima del commit; non ha potuto eseguire i test): nessun Critical, 8 Important, 7 Minor. Esito:
- **Corretti con test rosso→verde o con la prova in Chromium:** (1) lo sblocco che finisce con l'app già in secondo piano non partiva mai col blocco automatico → ora si controlla lo stato all'avvio; (2) due schede potevano sovrascrivere il vault → `Db.add` (commit `fix:` a parte, vedi «Correzioni a moduli di fase 2»), più confronto tra vault salvato e vault creato; (3) cambiare lingua dentro l'app ricostruiva la pagina (avrebbe perso ciò che si digita da T12 in poi) → ora si riscrivono i testi sul posto (`applyI18n`, più `ctx.onLangChange` per i testi calcolati); (4) il blocco aspettava senza limite il salvataggio delle bozze → tetto di 3 s; (5) `aria-busy` restava su `#app`; (7) la versione non alzata non era protetta → vedi scelta 8 sotto; (9)-(11), (15) test rinforzati (proprietà `src:`/`href:` di `h()`, `location.href`, una bandierina per ogni lingua, nomi di colore CSS, token non esadecimali, `creationStatus`/`hasEncryptedData` ora provati); (12) doppio Invio creava due vault; (13) etichetta di robustezza su campo vuoto; (14) tolto `user-select: all` dal codice di recupero (la cronologia degli appunti della tastiera lo conserverebbe).
- **Mitigato, non corretto del tutto:** (6) `precache.json` vecchio servito da una rete di distribuzione → ogni richiesta del precache porta `?v=<versione>` (precauzione: il comportamento della rete di Pages **non l'ho verificato** [Da provare]).
- **Non applicato, decide Luca:** (8) **`spike/sw.js` (riga 30) cancella tutte le cache diverse dalla sua** all'attivazione (verificato leggendo il file): aprire `/Nay-app/spike/` su un profilo nuovo cancellerebbe `nay-<versione>` e, essendo l'origine `github.io` condivisa, le cache di altri progetti dello stesso utente. Correzione proposta di una riga: `names.filter((n) => n.startsWith('nay-spike-') && n !== CACHE)`. Non l'ho fatta perché hai chiesto `spike/` intatta; costo se non si fa: l'app si ripara da sola online (vedi sotto) ma perde l'offline finché non c'è rete. Alternativa: togliere `spike/` dal sito pubblicato dopo G2.

**Scelte e scostamenti di T11** (motivo; costo se sbagliata):
1. **Nel database non si scrive nulla prima della conferma del codice di recupero** (il piano dice solo «la creazione riparte da capo»): `createVault` vive in memoria, si salva solo `confirmRecoveryCode(vault)` con `Db.add`. Così un primo avvio interrotto non lascia mai un vault a metà. Un vault non confermato già presente (non può nascere da questa app) viene tolto solo se non ci sono dati.
2. **Vault mancante o non confermato ma con dati cifrati presenti → nessuna creazione**, messaggio `lock.orphanData` e basta. Il piano non dice cosa fare; non c'è una via d'uscita nell'interfaccia (l'importazione del backup sta dietro lo sblocco). Costo se sbagliata: in quello stato (che l'app non produce: serve aver tolto a mano il vault) l'utente non può andare avanti; la scelta sicura è non perdere i dati. **Decisione da prendere con Luca:** offrire «Importa backup» già dalla schermata di accesso (serve anche a chi cambia telefono).
3. **`hasEncryptedData` non legge l'archivio `blobs`:** ogni blob ha un record in `media` che lo cita, e leggerlo caricherebbe in memoria i video. Costo: un blob orfano senza altri dati non conta come dato.
4. **Menu ⋮ con la sola voce «Blocca ora»:** le altre quattro (Esporta, Importa, Impostazioni, Informazioni) sono di T16. Le cinque pagine sono segnaposto col solo titolo fino ai task che le realizzano.
5. **CSP in `<meta>`** (`default-src 'self'`, `connect-src 'self'`, `img-src 'self' blob:`, nessuno stile inline): impedisce davvero «nessuna richiesta di rete a runtime». Provato in Chromium: nessuna violazione. Costo se sbagliata: una riga di `index.html`. Vincolo per i task successivi: niente `style="…"` né script inline (stili solo da CSS o da CSSOM).
6. **`navigator.serviceWorker.register('./sw.js', { type: 'module', updateViaCache: 'none' })`.** `updateViaCache: 'none'` **serve davvero**: prova di controllo in Chromium con un server che manda `Cache-Control: max-age=600` come Pages — senza quell'opzione, cambiando solo `js/version.js`, il service worker nuovo **non viene rilevato** nemmeno dopo `registration.update()`; con l'opzione viene installato in circa 2 s.
7. **Cache: `nay-<versione>`; all'attivazione si cancellano solo le cache con nome `nay-X.Y.Z` di un'altra versione** (il piano dice «con nome diverso»): su `github.io` l'origine è condivisa con gli altri progetti dello stesso utente e una cache con un altro nome non è nostra. Test: `only caches named like ours and of another version are deleted`.
8. **Protezione contro «file cambiati ma versione no»:** `precache.json` contiene `version` e `hash` (SHA-256 dei file in cache **e di `sw.js`**); `node tools/build_precache.mjs` si rifiuta di rigenerare se, rispetto al `precache.json` dell'ultimo commit, la versione è la stessa e l'hash è cambiato; un test fa lo stesso confronto con `git show HEAD:precache.json` (`APP_VERSION was raised if the served files changed since the last commit`; salta se manca git o il file nell'ultimo commit). Costo: dopo il commit di T11 ogni modifica ai file serviti richiede subito di alzare `APP_VERSION`, altrimenti `npm test` è rosso (è voluto).
9. **Il service worker si ripara da solo:** se arriva una navigazione e la pagina principale non è nella cache (cancellata da fuori, vedi sopra), rifà il precache in background. Provato in Chromium: dopo `caches.delete('nay-0.2.0')` e un ricaricamento online la cache torna a 42 voci. Non è nel piano; costo se sbagliata: una funzione in `sw.js`.
10. **Nessun `skipWaiting`** (vedi sopra): provato che la pagina aperta resta sulla versione vecchia finché non si chiude e riapre.
11. **Tessera del logo:** uso `assets/icons/icon-192.png` (il logo intero, già su fondo crema) e non il PNG originale da 4,4 MB; il test `files referenced by index.html…` controlla che sia in precache. **Bandierine:** disegni semplici in SVG (spagnola senza stemma, tre bande verticali per l'italiana), non copie di file ufficiali.
12. **Testi:** 15 chiavi nuove in `es.js` e `it.js` (accesso, errori, navigazione), scritte da me e non riviste (T19).
13. **Password manager del browser:** i campi non sono in un `<form>` e hanno `autocomplete="off"`, ma Chrome può comunque proporre di salvare la password nel gestore di Google: **[Da provare sul Samsung]**.

**«Verifica a mano» del piano per T11, in Chromium con script** (viewport 384×832, `deviceScaleFactor` 2,8125, touch; app servita sotto `/Nay-app/`; 73 controlli dello script principale + 12 delle due versioni, tutti passati, ripetuti 3 volte senza instabilità):

| Punto | Esito |
|---|---|
| Nuovo profilo → creare la password | **fatto in Chromium** (profilo persistente nuovo) |
| Chiudere l'app alla schermata del codice → riaprire: la creazione riparte da capo (Review Focus 2) | **fatto in Chromium:** chiuso il browser alla schermata del codice, riaperto lo stesso profilo: schermata «Crea tu contraseña», database con 0 record in tutti gli archivi (nessun vault a metà); il secondo tentativo mostra un codice diverso |
| Completare, bloccare, sbloccare con la password | **fatto in Chromium** (password sbagliata, spazio in più, password con spazio finale, NFD che apre un vault creato in NFC) |
| Sbloccare con il codice | **fatto in Chromium** (minuscole e spazi al posto dei trattini; codice sbagliato → `error.wrongSecret`) |
| Cambiare lingua dalla bandierina: tutti i testi cambiano | **fatto in Chromium:** sullo sblocco tutti gli elementi con chiave i18n coincidono col dizionario italiano e il testo digitato resta; dentro l'app la vista non viene ricostruita; la lingua resta dopo il ricaricamento |
| Dopo un push con versione nuova il numero accanto al logo cambia al riavvio (Review Focus 5) | **fatto in Chromium con due versioni servite una dopo l'altra** da un server che imita Pages (`max-age=600`): cambia SOLO `js/version.js` → il browser installa il service worker nuovo da solo (≈2 s), la pagina aperta resta v0.2.0, alla riapertura mostra v0.2.1 e resta solo `nay-0.2.1` con 42/42 voci; **cambia solo un CSS senza alzare la versione → non si installa nulla** (conferma il rischio). Non è un push vero su GitHub Pages |
| Blocco automatico dopo `AUTO_LOCK_MS` | **fatto in Chromium con orologio simulato:** a 59 s no, a 61 s sì; con i timer fermi basta l'orologio al ritorno; tornando dopo 30 s non blocca più tardi; sblocco finito con l'app già in secondo piano → si blocca lo stesso |
| `persist()` subito dopo la conferma | **fatto in Chromium:** 0 chiamate prima, 1 dopo (se il browser la conceda **[Da provare sul Samsung]**) |
| Offline | **fatto in Chromium:** rete spenta, ricarico: sblocco, app e tutte le pagine senza richieste fallite |
| Percorsi sotto `/Nay-app/` | **fatto in Chromium:** nessuna richiesta dalla radice, nessun 404, nessuna richiesta verso altri siti, nessun errore in console |
| Due schede che confermano insieme | **fatto in Chromium:** una entra, l'altra torna allo sblocco; un solo vault confermato |

**Non provato [Da provare sul Samsung]:** installazione e avvio standalone, tastiera di Android (campi nascosti dalla tastiera, correttore), proposta di salvataggio password, `visibilitychange` e blocco dopo il blocco schermo vero, aggiornamento del service worker all'avvio dell'app installata, esito di `persist()`, HTTPS di Pages (G1). Il salvataggio delle bozze prima del blocco e prima di cambiare pagina e il tetto di 3 s (punti 3-4 della revisione) sono stati provati in Chromium con le bozze vere di T12 (vedi sotto).

### T12 — Ideare (v0.3.0)

**Test.** Il piano non elenca test per T12 (interfaccia), ma la regola «se `StorageFullError` arriva dopo `saveBlob`, cancella il blob rimasto» e il «finto errore nei test» chiesti da Luca richiedono logica provabile: l'ho messa in `js/features/idea-save.js` (modulo in più rispetto al piano) con `tests/idea-save.test.js` (**21 test**, nomi miei): note senza file, idea con media (record Media, blob cifrati, nome e tipo non leggibili), file non supportati rifiutati prima di scrivere, **`StorageFullError` sul secondo blob / su un record Media / sull'idea → nessun blob, media o idea rimasti**, un errore qualunque annulla lo stesso e una pulizia che fallisce non nasconde l'errore vero, modifica (testo, lingua, stato, file aggiunti e tolti **solo dopo** il salvataggio dell'idea, descrizioni ripristinate se il salvataggio fallisce), idea lasciata senza testo né media rifiutata, eliminazione (idea, media, blob, prompt e voci del registro di quell'idea, niente altro), controllo di somiglianza (voce nel registro una volta sola, mai tra lingue diverse). Visti rossi (modulo mancante), poi verdi; **12 mutazioni temporanee** del codice intercettate (due non lo erano: ho rinforzato i test). Suite: **259 test, tutti verdi**.

**Cosa fa la pagina** (`js/ui/screens/ideas.js`, `js/ui/cards.js`, `js/ui/dialog.js`): elenco con anteprima, ricerca per parola (accenti ignorati), [+] con Nota/Foto/Video (Foto e Video aprono subito il selettore file, `image/*` o `video/*`; nel modulo il campo è `image/*,video/*` con `multiple`), modulo con testo, lingua dell'idea (spagnolo predefinito), stato (solo in modifica, correggibile a mano), file con anteprima, **descrizione scritta da lei per ogni file** (campo `Media.description`, servirà a `{descrizione_media}` in T13), conferma prima di eliminare, ⋮ su ogni scheda (Modifica, Elimina), avviso di somiglianza dopo il salvataggio con titolo, data e parole in comune del post trovato.

**Bozze:** testo, lingua e stato si salvano cifrati dopo 400 ms di pausa e **subito** quando l'app va in secondo piano, prima di cambiare pagina e prima del blocco (tetto di 3 s: un salvataggio appeso non lascia i testi sullo schermo). Uscire senza salvare non cancella la bozza; «Scarta la bozza» sì.

**Scelte e scostamenti di T12** (motivo; costo se sbagliata):
1. **Modulo in più `js/features/idea-save.js`** (e `dialog.js`): vedi sopra; costo: due file da fondere nella pagina.
2. **`renderCard` esteso** rispetto alla firma del piano: oltre a `{title, subtitle?, thumb?, menu}` accetta `thumbLoader`, `badges`, `placeholder`, `onOpen` e restituisce `{element, dispose}` (libera gli indirizzi temporanei delle anteprime).
3. **Anteprime:** le foto si decifrano solo quando la scheda si avvicina allo schermo e **due alla volta** (ogni foto va decifrata per intero); i **video non hanno anteprima nell'elenco** (icona, tipo, durata), per non decifrare video da decine di MB solo per mostrare l'elenco. Costo: elenco meno ricco; sul Samsung con molti file grandi **[Da provare]**.
4. **Le bozze non contengono i file scelti** (non si possono rimettere in un modulo): se si esce dal modulo i file vanno scelti di nuovo; il testo no.
5. **Eliminare un'idea toglie anche i suoi prompt e le voci del registro che la riguardano** (il piano non lo dice); la finestra di conferma lo avvisa. Costo se sbagliata: una riga in `deleteIdea`.
6. **Pulizia best-effort dopo il salvataggio:** se la cancellazione dei media tolti o dell'idea eliminata si interrompe, restano al massimo dati senza padrone (spazio occupato), mai un'idea con file mancanti. Non c'è ancora una pulizia degli orfani all'avvio.
7. **Il controllo di somiglianza parte dopo il salvataggio** e non può far perdere l'idea: se fallisce compare `ideas.checkFailed`.
8. 41 chiavi nuove in `es.js` e `it.js` (scritte da me, non riviste, T19); `color-scheme: dark` in `css/base.css` per i controlli nativi (select).

**«Verifica a mano» del piano per T12, in Chromium con script** (51 controlli dello script principale + 8 della prova di quota, tutti passati; il selettore file è intercettato da Playwright):

| Punto | Esito |
|---|---|
| Salvare una nota | **fatto in Chromium** (record cifrato: il testo non è leggibile nel database) |
| Scrivere un testo e uscire senza salvare, riaprire: il testo c'è | **fatto in Chromium**, anche cambiando pagina subito dopo aver digitato (senza attendere i 400 ms) e con app in secondo piano + blocco automatico + sblocco: la bozza è già salvata; con il salvataggio appeso (cifratura che non risponde) il blocco arriva lo stesso e il testo sparisce dallo schermo |
| Aggiungere 2 foto e un video dalla galleria | **fatto in Chromium con file veri** (due PNG del repo e un WebM registrato da Chromium) scelti dal selettore file intercettato: anteprime, durata del video, 3 media e 3 blob nel database. **Il selettore/galleria di Android (selezione multipla, fotocamera) è [Da provare sul Samsung]** |
| `QuotaExceededError` simulato: compare `error.storageFull` e nulla resta a metà | **fatto in Chromium** (errore lanciato alla seconda scrittura di un record Media): nessuna idea, media né blob in più; il modulo resta com'era e il salvataggio riprovato riesce |
| **Memoria piena con quota vera ridotta** (CDP `Storage.overrideQuotaForOrigin`) | **fatto in Chromium**, vedi sotto |
| Ricerca, modifica, eliminazione con conferma, somiglianza | **fatti in Chromium** (ricerca «animo» trova «Ánimo»; togliere un file lo toglie dal database solo al salvataggio; avviso con parole in comune e voce nel registro) |
| Record illeggibile | **fatto in Chromium:** un'idea con il testo cifrato alterato → messaggio `error.dataUnreadable` con «Reintentar», non una pagina vuota |
| Cambio lingua con il modulo aperto | **fatto in Chromium:** il testo digitato resta, titoli e pulsanti passano all'italiano |
| Blocco con una finestra di conferma aperta | **fatto in Chromium:** la finestra sparisce |
| Indirizzi temporanei delle anteprime | **fatto in Chromium:** creati = liberati lasciando la pagina |

**Quota vera in Chromium — metodo e cosa ho scoperto** (`Storage.overrideQuotaForOrigin` sull'origine locale, quota = spazio usato + 3 MB):
- Con la quota ridotta, salvare **un file da 12 MB** e **due file (1 MB che entra, 8 MB che no)** dà un vero `QuotaExceededError` del browser → `StorageFullError` → messaggio `error.storageFull`. Dopo l'errore: nessun record `ideas`/`media`/`blobs` in più (il primo blob del caso a due file è stato tolto), il modulo resta com'era; alzata la quota la stessa idea si salva.
- **Il metodo ha una trappola:** l'override va applicato **prima di qualunque scrittura della sessione del browser**. Applicato dopo che l'app ha già scritto (per esempio dopo aver creato la password), `getUsageAndQuota` dice `overrideActive: true` ma le scritture da 12 MB passano senza errore (provato con contesto persistente e non persistente, anche riaprendo il database). Nel contesto persistente, anche con l'override attivo fin dall'inizio non l'ho riprovato: lo script usa un contesto non persistente.
- Dopo i fallimenti `getUsageAndQuota` continua a dichiarare uno «spazio usato» alto (17,5 MB con quota di 3,2 MB) pur senza record: è la contabilità del browser, non un residuo trovato nell'archivio (i conteggi dei record sono zero). Cosa succede davvero sul Samsung con spazio vero finito **[Da provare sul Samsung]**.

### T13 — Sviluppare (v0.4.0)

**Test.** Come per T12 il piano non elenca test per l'interfaccia; la logica nuova sta in `js/features/develop.js` (modulo in più) con `tests/develop.test.js` (**21 test**, nomi miei): tipo suggerito dai media, template per tipo e lingua, campi del modulo che il template usa davvero, valori di partenza da descrizioni e durate dei media, **prompt con storico solo della lingua dell'idea, i post più simili per primi, segnaposto non riempiti elencati (le graffe nel testo dell'idea non contano)**, salvataggio del prompt con l'idea «in sviluppo» (un'idea pubblicata non torna indietro) e **prompt tolto di nuovo se l'idea non si può salvare**, controllo di somiglianza che non annulla nulla se fallisce, file decifrati come `File`, nome dello ZIP, inserimento dei segnaposto nell'editor, validazione dei template, template e guida di stile cifrati nell'archivio `meta`. Visti rossi (modulo mancante, poi un errore vero: `deleteTemplate` non era `async`), poi verdi; **14 mutazioni temporanee** su 14 intercettate tranne una equivalente (una scrittura in più, stesso stato). Suite: **280 test, tutti verdi**.

**Cosa fa la pagina** (`js/ui/screens/develop.js`, `js/ui/form-draft.js`): passi idea → tipo → template → dati → prompt (indicatore dei passi); tipo suggerito dai media dell'idea; template pronto del tipo e della lingua dell'idea più i propri (Modifica, Duplica, Elimina); modulo con **solo i campi che il template usa** (tono, obiettivo, lunghezza, hashtag, descrizione e durata presi dai media, testo dell'idea se ha solo file, numero di post dello storico) e ultimi valori ricordati; anteprima con i segnaposto non riempiti evidenziati; **barra di azioni fissa sopra la barra in basso: Copia, Condividi, Condividi tutto, Crea ZIP**; elenco dei prompt salvati (Abrir, Copiar, Compartir, Eliminar); editor dei template con i tasti dei segnaposto che inseriscono nel punto del cursore e bozza cifrata. Da Ideare, ⋮ → «Desarrollar» apre Sviluppare con l'idea già scelta.

**Scelte e scostamenti di T13** (motivo; costo se sbagliata):
1. **Guida di stile (`{stile}`) — come avviso.** Il piano chiedeva di decidere: la guida si incolla e si salva **dentro il modulo** (campo con «Guardar guía de estilo», cifrata in `meta`, riusata in tutti i prompt); se non c'è, il modulo mostra un avviso arancione che dice che `{stile}` resterà da riempire; si può generare lo stesso, e nell'anteprima `{stile}` resta nel testo **evidenziato** con un avviso. Costo se sbagliata: oggi il prompt può uscire con `{stile}` letterale se lei lo ignora; alternativa: bloccare la generazione.
2. **Il controllo di somiglianza usa il testo dell'idea, non quello del prompt** (il piano dice «il testo dell'idea»; la spec dice anche «un nuovo prompt»): il prompt generato contiene lo storico con i titoli dei post e somiglierebbe sempre a quei post, producendo solo falsi allarmi. Quindi non si creano voci del registro con origine `prompt`. Costo se sbagliata: mancano le voci con `sourceType: 'prompt'` (il tipo e `registerMatches` le prevedono già).
3. **Storico nel prompt: 30 post** (`DEFAULT_HISTORY_MAX`), modificabili nel modulo e ricordati; i 10 più simili all'idea vanno per primi. Il 30 è una scelta mia provvisoria **[Da provare]**: la spec dice che la lunghezza massima del messaggio non è verificata.
4. **«Modifica» su un template pronto lavora su una copia** («… (copia)», con la nota che i pronti non si modificano); i pronti non si eliminano. Costo se sbagliata: una riga in `editTemplate`.
5. **File per condividere e per lo ZIP: si decifrano quando si apre l'anteprima** e restano in memoria, così «Condividi tutto» parte da un solo tocco (la condivisione richiede un tocco recente: decifrare dopo il tocco rischierebbe di perderlo). Si possono togliere file con le caselle. **Non propongo nessuna soglia di dimensione dei file**: i limiti veri si misurano sul Samsung (G4); resta solo l'avviso sui più di 10 file previsto dalla spec. Costo: con molti video grandi la memoria del telefono è il limite **[Da provare sul Samsung]**.
6. **Il prompt in anteprima non è modificabile a mano** (si cambia il template o i dati e si rigenera; ogni generazione è un record salvato). L'elenco dei prompt salvati mostra gli ultimi 20.
7. **Toccare la voce già attiva della barra in basso riporta la pagina al primo passo** (vale per tutte le pagine): senza questo, in Sviluppare non c'era modo di ricominciare con un tocco. Trovato dallo script di verifica. Il lavoro in corso nei moduli si salva come bozza prima di ripartire.
8. **`js/ui/form-draft.js`:** la gestione delle bozze (salva dopo una pausa, subito in secondo piano o prima di cambiare pagina, ripresa all'apertura) è stata tolta da `ideas.js` e messa in un aiuto usato anche dall'editor dei template; `ideas.js` è stato riprovato con lo script di T12 (51/51 dopo la modifica).
9. 84 chiavi nuove in `es.js` e `it.js` (testi non rivisti, T19); nei testi dei passi uso «plantilla» in spagnolo e «template» in italiano.
10. **Trovato e corretto durante la verifica:** nella schermata iniziale mancava l'area dei messaggi (la copia di un prompt salvato non dava nessun esito).

**«Verifica a mano» del piano per T13, in Chromium con script** (73 controlli, tutti passati; telefono emulato; dati inventati: 4 idee, 3 post, file di prova):

| Punto | Esito |
|---|---|
| Generare un prompt in spagnolo e uno in italiano | **fatto in Chromium** (idea in spagnolo con foto e video; idea in italiano con template italiano, guida di stile, storico di 1 solo post italiano) |
| Copiarlo | **fatto in Chromium** con gli appunti veri (permesso concesso al sito): il contenuto è il prompt intero. Su Android/Samsung **[Da provare]** |
| Condividere testo + foto | **provato in Chromium con `navigator.share` simulato** (registra ciò che riceve): Condividi = solo testo; Condividi tutto = testo + i 2 file con nome e tipo giusti, mai uno ZIP; annullamento senza messaggio; «Permission denied» → messaggio che suggerisce copia o ZIP. **La condivisione vera verso ChatGPT/Gemini è [Da provare sul Samsung]** |
| Creare lo ZIP e trovarlo nel telefono | **fatto in Chromium:** il download parte davvero (evento `download`), il file si apre con `fflate` e contiene `prompt.txt` uguale al prompt e i file dell'idea con i byte originali; un'idea senza file dà uno ZIP col solo `prompt.txt`; lo ZIP non passa mai da `navigator.share`. **Dove finisce il file sul Samsung e come si comporta il download da app installata: [Da provare sul Samsung]** |
| Con 11 file compare l'avviso | **fatto in Chromium:** 11 file → avviso; togliendone uno sparisce |
| L'idea cambia stato | **fatto in Chromium:** prompt salvato (record in più), idea «in sviluppo», voce nel registro per l'idea simile a «Ánimo valiente» |
| Memoria piena mentre si genera | **fatto in Chromium** (errore alla scrittura dell'idea): `error.storageFull`, nessun prompt rimasto, si resta nel modulo e si può riprovare |
| Editor dei template, bozza, eliminazione, prompt salvati, scorciatoia da Ideare, cambio lingua a metà flusso, blocco con l'anteprima aperta, record illeggibile | **fatti in Chromium** |

### T14 — Pubblicazioni salvate e registro (v0.5.0)

**Test.** Come per T12 e T13 la logica nuova sta in un modulo con i suoi test: `js/features/publications.js` (modulo in più rispetto al piano) con `tests/publications.test.js` (**25 test**, nomi miei): campi obbligatori e valori predefiniti, visualizzazioni e commenti facoltativi (lo 0 è un dato; negativi e decimali rifiutati), solo immagini come screenshot, **salvataggio tutto o niente** (blob → Media → pubblicazione → idea collegata: memoria piena a ogni passo, nessun residuo; nessuna scrittura se l'idea o lo screenshot mancano), idea collegata che passa a «pubblicata», voci del registro create da sole confrontando con le pubblicazioni precedenti (mai tra lingue diverse; un confronto che fallisce non annulla il salvataggio), modifica (screenshot sostituito, il vecchio tolto solo dopo il salvataggio; collegamenti alle idee rimessi com'erano se la pubblicazione non si salva; riconfronto solo se cambia il testo, senza duplicare le coppie), eliminazione (pubblicazione, screenshot, voci del registro che la riguardano, collegamento dell'idea), filtri per giorno e tipo, unione delle voci del registro con pubblicazioni e testi controllati, filtri del registro, evidenziazione delle parole in comune, date. Visti rossi (modulo mancante), poi verdi; **19 mutazioni temporanee**: tre non erano intercettate (0 numerico trattato come assente, screenshot non immagine, ripristino delle idee) e ho aggiunto i test, poi tutte intercettate. `idea-save.js` (T12) è stato generalizzato per riusare lo stesso meccanismo di annullamento (esporta `withRollback`, `saveMedia`, `removeMedia`; ripristina i record modificati). Suite: **305 test, tutti verdi**.

**Cosa fa la pagina** (`js/ui/screens/publications.js`): due schede, «Publicaciones» e «Registro». **Elenco:** anteprima dello screenshot, titolo, «data · tipo · lingua», visualizzazioni e commenti, filtri per data e tipo (con etichetta «Filtros (activos)» e «Quitar los filtros» che seguono i filtri), [+], ⋮ Modifica / Elimina con conferma. **Modulo:** screenshot, titolo e descrizione obbligatori; tipo `foto`, lingua `es`, data e ora «adesso» modificabili; visualizzazioni, commenti, nota e idea collegata facoltativi; «Guardar y añadir otra» (tiene tipo, lingua e data, per caricare lo storico); bozza cifrata. **Registro:** per ogni voce la pubblicazione trovata (titolo, data, **screenshot che si apre a tutto schermo toccandolo**), il testo controllato (idea, prompt o post) e il testo trovato **con le parole in comune evidenziate** (anche in forme diverse della stessa parola: «cuori» per «cuore»), le parole in comune, il grado di somiglianza **orientativo**, la data del controllo e i tre stati con un tocco; ricerca per parola e filtri per stato, data della pubblicazione trovata e data del controllo.

**Scelte e scostamenti di T14** (motivo; costo se sbagliata):
1. **Date della pubblicazione trovata nel registro: unisco le pubblicazioni alle voci** (`enrichRepetitions`) invece di estendere `Repetition` (come chiedeva la nota di T7). `filterRegistry` filtra sia la data del controllo sia quella della pubblicazione trovata. `searchRepetitions` (T7) resta com'è, con i suoi test, ma **l'interfaccia non la usa**: filtra solo `checkedAt` e in UTC. Costo se sbagliata: una funzione da sostituire con `searchRepetitions` + un filtro.
2. **I giorni dei campi data sono giorni del telefono (locali), non UTC:** `dayRange` converte «2026-03-10» in inizio e fine di quel giorno locale. Nel contenitore il fuso è UTC, quindi **non ho potuto mostrare in Chromium la differenza tra giorno locale e UTC**: la copre un test unitario con date locali. **[Da provare sul Samsung]** (fuso di Madrid).
3. **La ricerca nel registro cerca tra parole in comune, testo controllato e titolo e descrizione della pubblicazione trovata** (servono tutte le parole, senza accenti né maiuscole), non solo tra le parole in comune. Costo se sbagliata: restringere a `sharedWords`.
4. **«Falso allarme» e «ricaricare un post uguale».** Il piano chiede che dopo «falso allarme» ricaricare un post uguale non faccia riapparire la voce. Provato: **rifare il controllo della stessa pubblicazione** (modifica del testo) **non riapre né duplica** la voce segnata «falso allarme»; invece **un post uguale caricato come nuova pubblicazione è una coppia nuova** e crea voci nuove (con l'originale e con l'altro post simile): è il comportamento di T7 (`pairKey` per coppia). Costo se sbagliata: se si intendeva «mai più segnalare quel testo» serve un'altra regola.
5. **Eliminare una pubblicazione** toglie lo screenshot, le voci del registro che la riguardano (come fonte o come trovata) e il riferimento `publicationId` nell'idea collegata, **ma non cambia lo stato dell'idea** («pubblicata»): si corregge a mano in Ideare. Spostare il collegamento a un'altra idea toglie il riferimento alla vecchia (stato invariato) e porta la nuova a «pubblicata».
6. **Lo screenshot è un solo file immagine** (`image/*`); nessun OCR (rimandato dal piano, T18).
7. **La scheda scelta resta nell'indirizzo** (`#/pubblicazioni?tab=registro|lista`, senza nuova voce nella cronologia): dopo un blocco si torna alla stessa scheda. La Dashboard (T15) aprirà `#/pubblicazioni?tab=registro&status=da_valutare`, già provato. **Toccare di nuovo la voce attiva della barra in basso toglie ora anche i parametri dell'indirizzo** (scheda, idea scelta in Sviluppare) prima di ripartire (`main.js`).
8. **Condivisi con T12/T13:** `lazyThumb` esportato da `cards.js` (anteprime pigre, due alla volta) e `showImage` in `dialog.js` (si chiude con Esc, tocco fuori o pulsante; il blocco dell'app la chiude).
9. **Trovati e corretti durante la verifica in Chromium:** il pannello dei filtri non aggiornava l'etichetta né mostrava «Togli i filtri» se i filtri si attivavano dopo l'apertura; l'avviso di somiglianza restava visibile cambiando scheda; dopo un blocco la scheda tornava a quella dell'indirizzo anche se se n'era scelta un'altra.
10. 70 chiavi nuove in `es.js` e `it.js` (testi non rivisti, T19).

**«Verifica a mano» del piano per T14, in Chromium con script** (56 controlli, tutti passati; telefono emulato; dati inventati; screenshot = icone del repo):

| Punto | Esito |
|---|---|
| Salvataggio veloce con screenshot, titolo e descrizione obbligatori | **fatto in Chromium** (messaggio per ciascun campo mancante, nulla scritto; valori predefiniti: foto, spagnolo, adesso) |
| «Aggiungi un altro» per caricare lo storico | **fatto in Chromium** (5 post caricati di seguito: titolo e descrizione vuoti, data, tipo e lingua di prima) |
| Caricare 5 post di prova di cui due con parole in comune: il registro ha una voce «da valutare» con le parole evidenziate | **fatto in Chromium:** avviso al quinto post, 1 voce senza altri tocchi, parole evidenziate nei due testi, elenco delle parole, grado orientativo e data del controllo |
| Segnarla «falso allarme» e ricaricare un post uguale: non riappare | **fatto in Chromium con l'interpretazione del punto 4** |
| Screenshot che si apre toccando | **fatto in Chromium** (si apre a tutto schermo, Esc lo chiude) |
| Elenco con filtri per data e tipo; modifica ed eliminazione | **fatti in Chromium** (giorni interi, compreso un post delle 23:30; modifica con nuovo screenshot e idea collegata; eliminazione con conferma) |
| Registro: ricerca per parola e per date, stato per voce | **fatti in Chromium** (stato, parola senza accenti, data della pubblicazione trovata, data del controllo) |
| Memoria piena, bozza, blocco con il modulo aperto, cambio lingua, record illeggibile | **fatti in Chromium** (errore simulato alla scrittura della pubblicazione: nessun blob né media rimasto, riprovando riesce; record del registro illeggibile → `error.dataUnreadable` con «Reintentar») |

**Non provato [Da provare sul Samsung]:** il selettore delle immagini di Android per lo screenshot; l'aspetto del campo «data e ora» sul telefono (qui è quello di Chromium); l'elenco e il registro con 200-260 post l'anno (`registerMatches` rilegge tutte le voci a ogni confronto, già annotato in T7: non misurato oltre qualche decina).

### T15 — Dashboard e grafici (v0.6.0)

**Test del piano presenti con i nomi del piano (3 su 3):** `barChartSvg draws one rect per datum`, `donutChartSvg draws one path per non-zero slice`, `charts return a placeholder svg for empty data` (in `tests/charts.test.js`, 15 test in tutto). Gli altri 12 sono miei: ad area (un punto per dato, area e linea; un solo valore → solo il punto; etichette primo-centro-ultimo), barre proporzionali e mai negative, nessun `NaN`/`Infinity` nel markup, **etichette protette (un titolo con markup non crea elementi)**, nessuno stile o evento inline (la CSP li bloccherebbe), **nessun colore negli SVG** (solo classi e sfumature: i colori stanno in `css/tokens.css`), valori sopra le barre solo se poche, etichette non sovrapposte, nome accessibile, id delle sfumature unici, `lastN`. Visti rossi (modulo mancante), poi verdi; **14 mutazioni temporanee**, una non intercettata (etichette dell'asse) → test aggiunto → intercettata. Due test in più dopo aver guardato lo screenshot (vedi punto 8). Suite: **320 test, tutti verdi**.

**Cosa fa la pagina** (`js/ui/charts.js`, `js/ui/screens/dashboard.js`): tre pulsanti grandi (IDEAR, DESARROLLAR, PUBLICACIONES GUARDADAS); numeri chiave (post, visualizzazioni totali, commenti totali); **scheda delle ripetizioni da valutare** con il tasto che apre il registro già filtrato (`#/pubblicazioni?tab=registro&status=da_valutare`); grafico ad area delle visualizzazioni nel tempo; barre dei commenti per post; barre degli orari migliori; ciambella dei post per tipo con legenda (numeri e percentuali). I grafici sono SVG scritti a mano, inseriti con `DOMParser` (non `innerHTML`).

**Scelte e scostamenti di T15** (motivo; costo se sbagliata):
1. **Commenti per post: ultimi 12** (`COMMENTS_LAST_N`), tra i post con i commenti annotati, in ordine di pubblicazione; la nota sotto il titolo dice quanti sono mostrati. 12 è una scelta mia: 12 barre con il valore sopra stanno in 384 px. Con 200-260 post l'anno tutti insieme non si leggerebbero. Costo se sbagliata: una costante.
2. **Sull'asse del grafico dei commenti non ci sono etichette** (i titoli dei post, troncati a 6 caratteri, non direbbero niente): il titolo e il valore stanno nel suggerimento di ogni barra (tenendo premuto). Costo: per riconoscere un post bisogna toccare la barra.
3. **Zero pubblicazioni:** messaggio che invita a inserire il primo post con il tasto per andare a Pubblicazioni; niente numeri né grafici vuoti (restano i tre pulsanti grandi). **Post senza visualizzazioni o commenti:** i grafici mostrano un segnaposto tratteggiato e una frase che spiega che contano solo i post che hanno quei dati.
4. **Orari migliori: barre in ordine di ora** (`computeStats` restituisce `bestHours` dalla fascia con più visualizzazioni; per l'asse serve l'ordine delle ore) con la media di visualizzazioni arrotondata.
5. **Le date sull'asse delle visualizzazioni sono scritte nella lingua dell'app** («12 mar»): la prima versione usava «03-12», che uno spagnolo o un italiano legge come 3 dicembre (trovato rileggendo, corretto e provato). Giorno e ora delle statistiche seguono il fuso del telefono: in Chromium qui è UTC, quindi **[Da provare sul Samsung]** con il fuso di Madrid.
6. **I punti del grafico ad area si disegnano fino a 60 giorni di dati**; oltre, resta solo l'area con la linea (con 200-260 post all'anno i punti sarebbero centinaia). Costo: sopra i 60 giorni non si vedono i punti singoli.
7. **Colori solo da `css/tokens.css`:** provato in Chromium che `stop-color`, fetta e linea risolvono a `--cyan` (`#26a4c5`). Le fette usano sei classi a rotazione (ciano, viola, magenta, blu-viola, azzurro, magenta chiaro) dalla palette del poster.
8. **Trovato guardando gli screenshot e corretto con test:** nel grafico degli orari il valore sopra la barra più alta si sovrapponeva all'etichetta del massimo (ora sono distanziate: `the max-value label never overlaps…`); le etichette troncate dei commenti (punto 2).
9. 24 chiavi nuove in `es.js` e `it.js` (266 → 290; testi non rivisti, T19). *(Nel primo testo di questa riga avevo scritto 25: era un errore di conteggio, corretto contando le chiavi nei due commit.)*

**«Verifica a mano» del piano per T15** (il piano non ne elenca; eseguita come per gli altri task, in Chromium con script, 35 controlli passati; dati inventati: 31 post su 12 giorni, 3 voci del registro, un post con un titolo che cerca di infilare codice nei grafici):

| Punto | Esito |
|---|---|
| Dashboard vuota | **fatto in Chromium:** tre pulsanti, messaggio per il primo post, nessun grafico; ogni pulsante porta alla sua pagina, il logo riporta qui |
| Numeri chiave | **fatto in Chromium:** post, visualizzazioni e commenti coincidono con i totali calcolati a parte nello script (i post senza dato non contano) |
| Grafici | **fatto in Chromium:** punti = giorni con dati; 12 barre dei commenti e sono proprio gli ultimi 12 per data (stesso ordine); una barra per ogni ora con dati; fette = tipi presenti; legenda e totale al centro giusti |
| Scheda delle ripetizioni | **fatto in Chromium:** 2 da valutare (la confermata non conta); il tasto apre il registro già sulla scheda e sullo stato giusti, con 2 voci |
| Cambio lingua | **fatto in Chromium:** pulsanti, titoli, legenda, etichette delle ore e delle date passano all'italiano |
| Titolo con markup, colori dai token, nessuno scorrimento orizzontale, record illeggibile, nessuna richiesta esterna | **fatti in Chromium** |

Rilanciati anche gli script di T11-T14 dopo le modifiche condivise (T11 73/73, T13 73/73, T14 56/56; **T12 51/51 ripetuto 6 volte**: aveva un'intermittenza dello script, non dell'app — la bozza «texto a medias» ripresa mentre Playwright scriveva —, ora lo script aspetta la ripresa).

**Non provato [Da provare sul Samsung]:** resa e nitidezza degli SVG sul telefono vero (qui sono a 2,8125 pixel per pixel), grafici con 200-260 post.

### T16 — Menu ⋮, Impostazioni, backup (v0.7.0)

**Test.** Il piano non elenca test per T16 (interfaccia). La logica sta in `js/features/account.js` (modulo in più) con `tests/account.test.js` (**23 test**, nomi miei): cambio password (apre con la nuova, non con la vecchia, il codice di recupero resta lo stesso, i dati restano leggibili; password attuale sbagliata, password corta o sessione di un altro vault → nulla cambia; se il vault salvato non si apre il vecchio torna com'era), ripristino con il codice (codice sbagliato → nulla cambia; minuscole e spazi accettati), esportazione col vault **riletto dal database** (dopo un cambio di password il backup si apre con la password nuova, non con la vecchia; si apre anche col codice), nome del file, mappa degli errori sui messaggi, e — dopo la revisione — **sblocco con il vault del database** (`unlockCurrentVault`) e rifiuto di scrivere sopra un vault sostituito. Visti rossi (modulo mancante; poi, per le guardie sul vault sostituito, 3 test rossi con la funzione già scritta ma senza la guardia), poi verdi. **17 mutazioni temporanee** del codice (10 sul primo gruppo, 7 sulle guardie): tutte intercettate. Suite: **343 test, tutti verdi** (334 prima della revisione + 9).

**Cosa fa** (`js/ui/screens/settings.js`, `js/ui/fields.js`, `js/ui/dialog.js`, `js/main.js`): **menu ⋮** con cinque voci (Bloquear ahora, Exportar copia, Importar copia, Ajustes, Información) che partono da qualsiasi pagina. **Impostazioni:** cambia la password (chiede quella attuale; nuova due volte con l'indicatore di robustezza); ripristina con il codice di recupero; copia di sicurezza (Esporta / Importa); spazio usato (`storageStatus`: «Usado: … de …», barra, avviso se `nearFull`, pulsante per chiedere lo spazio persistente se non lo è); Información (versione, fflate MIT, snowball-stem BSD-3-Clause, «la licenza del progetto non è ancora scelta»). **Esporta:** prima la dimensione (`estimateBackupSize`) e la conferma, poi il vault riletto dal database, poi il download del file `nay-backup-AAAA-MM-GG-HHmm.naybk`. **Importa:** si sceglie il file, avviso rosso che **sostituisce TUTTI i dati** (con nome e dimensione), si salvano le bozze, si chiede la password del backup **o il suo codice di recupero**; errori chiari dentro la finestra (`error.wrongSecret`, `error.backupCorrupt`, `error.backupVersion`, `error.storageFull`, `error.backupMemory`); a importazione riuscita **l'app si blocca subito** e la schermata di accesso dice «Copia importada».

**Revisione indipendente** (sub-agente su modello Opus, sola lettura, prima del commit; non ha potuto eseguire i test): 1 grave, 3 medi, 4 bassi. Ho **riletto nel codice ogni punto prima di agire**; tutti e otto erano reali. Esito:
1. **Grave — blocco automatico durante l'importazione.** La schermata di accesso leggeva il vault una volta sola; se l'app si bloccava mentre un'importazione lunga era in corso (o dopo il selettore file, che su Android manda l'app in secondo piano), l'importazione finiva comunque e poi si poteva sbloccare con la password vecchia: sessione col vault vecchio sopra dati nuovi → ogni pagina illeggibile, scritture con la chiave sbagliata. **Corretto:** (a) `unlockCurrentVault` rilegge il vault a ogni tentativo e lo riconfronta dopo la derivazione della chiave (se è cambiato, riprova; massimo 3 volte, poi riparte l'accesso); (b) un blocco che arriva durante l'importazione **aspetta la fine** (nel frattempo lo schermo è vuoto con «Cargando…») e poi mostra l'accesso col vault nuovo e l'avviso; (c) se l'app è già bloccata, la scelta del file non apre nulla sopra l'accesso. Test: 6 unitari + prove in Chromium S1, S2, S4.
2. **Medio — bozze cifrate con la chiave vecchia dopo l'importazione.** `flush` riscrive la bozza a ogni chiamata; una scrittura arrivata dopo la sostituzione avrebbe lasciato nel database un record non decifrabile e **ogni backup successivo sarebbe stato rifiutato**. **Corretto:** mentre l'importazione lavora la sessione non scrive nulla (`frozen`); se fallisce si riprende a scrivere. Prova in Chromium (S2 con la cifratura in sospeso rilasciata dopo la sostituzione: nessuna bozza nel database; S8: dopo un'importazione fallita il blocco salva ancora la bozza).
3. **Medio — due schede.** La scheda che non importa restava sbloccata con la chiave vecchia. **Corretto:** a importazione riuscita un messaggio su `BroadcastChannel('nay-vault')` blocca le altre schede (senza salvare). Prova in Chromium con due schede (S3). Se il browser non ha `BroadcastChannel` non succede nulla (nessun errore).
4. **Medio — cambio password su un vault sostituito.** `changeVaultPassword` poteva scrivere il vault vecchio sopra uno appena importato, e il ripristino dopo un guasto anche. **Corretto:** prima di scrivere (e prima di rimettere il vecchio) si controlla che il vault nel database sia ancora quello di partenza; altrimenti `VaultChangedError`. 3 test.
5. **Basso — avviso dopo il blocco.** L'avviso di esito dell'esportazione non compare più se l'app si è bloccata nel frattempo. **[Non provato in Chromium: è una condizione di una riga]**.
6. **Basso — «salvato nel telefono» dopo un download che il codice non può verificare.** Il browser non dice se il file è arrivato. **Corretto:** i messaggi dicono ora «Descarga de la copia iniciada: … Comprueba que está en las descargas del teléfono» (stesso per il backup in italiano, e anche per lo ZIP di T13, che aveva lo stesso difetto: `develop.zipSaved` riscritto; lo script di T13 ripassa 73/73).
7. **Basso — Tab usciva dalle finestre con campo e da «Información».** **Corretto** (stesso giro del focus di `confirmDialog`); provato in Chromium (S6).
8. **Basso — il selettore file annullato restava nella pagina.** **Corretto:** evento `cancel` e rimozione al blocco; provato in Chromium (S5, evento `cancel` simulato). Se Samsung Internet/Chrome per Android lo emettano davvero **[Da provare sul Samsung]**: in quel caso il campo resta fino al prossimo tocco o al blocco, senza dati dentro.
- **Non applicato:** disabilitare «Importa»/«Esporta» durante un cambio password (la guardia del punto 4 copre il caso).
- **Mutazioni delle correzioni nell'interfaccia** (9, sullo script di Chromium): senza `frozen`, senza attesa del blocco, senza canale tra schede, senza ripristino dopo un fallimento, senza rimozione del selettore al blocco, senza il controllo «app bloccata», senza `cancel`, senza Tab nelle finestre, sblocco con la copia vecchia del vault: **tutte intercettate** (una, «senza ripristino dopo un fallimento», non lo era con la prima versione della prova: ho rinforzato S8).

**Scelte e scostamenti di T16** (motivo; costo se sbagliata):
1. **Modulo in più `js/features/account.js`** e `js/ui/fields.js` (campi, indicatore di robustezza e messaggi d'errore, tolti da `lock.js` per riusarli nelle impostazioni). Costo: due file da fondere.
2. **Il cambio password chiede la password attuale** (il piano non lo dice): chi trova il telefono sbloccato non può cambiarla. Costo se sbagliata: un campo e una riga.
3. **«Ripristina con il codice di recupero» è una scheda delle impostazioni** (il piano lo elenca; il comportamento è mio): codice + nuova password due volte; non cambia il codice.
4. **Estensione `.naybk` e nome `nay-backup-AAAA-MM-GG-HHmm.naybk`** (il piano non li fissa; il file comincia con `NAYBK1`). Il selettore file non filtra per tipo: **[Da provare sul Samsung]** come il selettore di Android mostra un file con estensione sconosciuta.
5. **`promptDialog`, `infoDialog` e `showToast`** aggiunti a `dialog.js`; «Información» è una finestra e non una pagina. Gli avvisi di esito (esporta, errori) sono un'etichetta breve sopra la barra in basso, perché le voci del menu partono da qualsiasi pagina.
6. **Dopo l'importazione si blocca subito, senza salvare le bozze** (`lock({noFlush})`), come chiede il piano; le bozze si salvano **prima** di chiedere la password del backup.
7. **`lock.js` sblocca sempre con il vault riletto dal database** (`unlockCurrentVault`), non con quello letto all'apertura della schermata: modifica a un comportamento di T11, motivata dal punto 1 della revisione.
8. **Un blocco durante un'importazione aspetta la fine** (schermata di sola attesa): se l'importazione si blocca senza finire, l'accesso non compare. Costo: nessun limite di tempo sull'attesa; alternativa: un tetto di tempo, ma interromperebbe una scrittura che poi non si può annullare.
9. **Messaggi «Descarga … iniciada»** invece di «guardado nel telefono» (punto 6 della revisione), anche per lo ZIP di T13. 40 chiavi nuove in `es.js` e `it.js` (290 → 330; testi non rivisti, T19) e 4 chiavi esistenti riscritte (`backup.export.confirm`, `backup.export.done`, `settings.backup.hint`, `develop.zipSaved`).
10. **Impronta digitale: non implementata** (il piano: «solo se T17 dice che funziona»). Dimensioni e soglie: nessun limite di dimensione del backup è proposto (si legge in memoria: un file troppo grande dà `error.backupMemory`, i limiti veri si misurano sul Samsung, G4).
11. **Un telefono nuovo deve prima creare una password per poter importare** (l'importazione sta dietro lo sblocco): il piano dice «cancellare i dati del sito, importare con la password»; con i dati del sito cancellati l'app mostra la creazione della password, e solo dopo si può importare (la password creata viene sostituita da quella del backup). **Decisione da prendere con Luca:** offrire «Importa backup» già nella schermata di accesso/creazione (vedi anche la nota di T11 sul caso «dati senza vault»). Costo se sbagliata: oggi un utente con un backup in mano deve creare una password che subito sparisce.

**«Verifica a mano» del piano per T16, in Chromium con script** (47 controlli dello script principale + 29 della prova sui punti della revisione, tutti passati, ripetuti 3 volte senza instabilità; telefono emulato; dati inventati; una seconda scheda e più profili come «telefoni» diversi):

| Punto | Esito |
|---|---|
| Esportare | **fatto in Chromium:** conferma con la dimensione («unos … KB», nel telefono, non si comparte) → «Cancelar» non produce nessun file → il download parte davvero (evento `download`), il nome è `nay-backup-…naybk`, il file comincia con `NAYBK1` e **non contiene** i testi né la password in chiaro; la dimensione mostrata coincide con quella del file entro 4 KB; stesso flusso dal menu e dalla pagina Ajustes |
| Cancellare i dati del sito | **fatto in Chromium come telefono nuovo** (profilo nuovo con una password creata al momento): **non** ho cancellato i «dati del sito» da Chrome sullo stesso profilo (vedi punto 11) |
| Importare con la password | **fatto in Chromium:** password sbagliata → errore dentro la finestra, che resta aperta, dati e vault intatti; password giusta → l'app si blocca subito con «Copia importada», la password del telefono nuovo non apre più, quella del backup sì, e i dati sono quelli del backup (idee, foto decifrata, pubblicazione con screenshot); **la password che il backup aveva prima di un cambio non lo apre** (il file contiene il vault aggiornato) |
| Importare con il codice | **fatto in Chromium** (S9): il codice di recupero come segreto, scritto in minuscole e con spazi; e il codice di recupero apre il telefono dopo l'importazione |
| File troncato: errore chiaro e dati intatti | **fatto in Chromium:** file troncato a metà → `error.backupCorrupt`; versione futura (byte della versione a 2) → `error.backupVersion`; un file che non è un backup → `error.backupCorrupt`; **memoria piena simulata durante la scrittura** (`QuotaExceededError` alla prima scrittura) → `error.storageFull`; in tutti i casi idee e vault del telefono invariati |
| Cambio password | **fatto in Chromium:** attuale sbagliata → `error.wrongSecret`, nulla cambia; corta → messaggio col minimo; diverse → messaggio; indicatore di robustezza; riuscito → campi svuotati, nel record del vault cambia la parte della password e quella del codice di recupero resta identica; dopo il blocco la vecchia non apre e la nuova sì |
| Ripristino con il codice | **fatto in Chromium:** codice sbagliato → errore; codice giusto (minuscole e spazi) → password cambiata, la precedente non apre più |
| Spazio usato | **fatto in Chromium:** «Usado: … de …» con barra; con `navigator.storage.estimate` simulato al 92 % compare l'avviso. I numeri veri del Samsung: **[Da provare sul Samsung]** |
| Información | **fatto in Chromium:** versione, fflate (MIT), snowball-stem (BSD-3-Clause), nessuna licenza del progetto; in italiano; Esc la chiude |
| Blocco, lingua, aspetto | **fatto in Chromium:** finestre e avvisi spariscono al blocco; cambio lingua dentro Impostazioni; nessuno scorrimento orizzontale; nessuna richiesta verso altri siti; nessun errore di console imprevisto |
| Punti della revisione | **fatti in Chromium** (S1-S9): vault sostituito dietro la schermata di accesso; blocco durante un'importazione tenuta in sospeso (PBKDF2 e cifratura rallentati da uno script); due schede; selettore annullato o app bloccata col selettore aperto; file scelto dopo il blocco; Tab nelle finestre; sessione che riprende a scrivere dopo un fallimento; importazione con il codice |

Rilanciati anche gli script di T11-T15 dopo le modifiche a `main.js`, `lock.js`, `dialog.js` e alle stringhe: **T11 73/73, versioni 12/12, T12 51/51, quota 8/8, T13 73/73, T14 56/56, T15 35/35**.

**Non provato [Da provare sul Samsung]:** dove finisce il file scaricato e come si comporta `<a download>` dall'app installata (tra il tocco su «Exportar» e il download passano la lettura di tutto il database e la costruzione del file: l'attivazione dell'utente potrebbe essere scaduta); il selettore file di Android con un file `.naybk`; backup grandi (foto e video: l'esportazione costruisce il file e l'importazione lo legge tutto in memoria; tempi della derivazione a 600.000 ripetizioni); i numeri di `navigator.storage.estimate` e l'esito di `persist()`; l'evento `cancel` del selettore su Chrome per Android; l'app installata e una scheda del browser aperte insieme (il messaggio tra schede); `visibilitychange` e blocco automatico reali durante un'importazione.

## Da verificare

- Tutto ciò che richiede il Samsung (gate G2): vedi `docs/test-samsung-results.md`.
- GitHub Pages in HTTPS (gate G1).

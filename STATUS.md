# STATUS

Ultimo aggiornamento: 16 novembre 2026

## Dove siamo

- **Fase:** 1 — Icone e test sul Samsung (completa lato codice; resta il gate G2)
- **Ultimo task chiuso:** T2 (prototipo di prova sul Samsung)
- **Prossimo task:** T3 (lingue) — non iniziato: l'esecuzione si è fermata dopo T2 per istruzione di Luca.

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

## Da verificare

- Tutto ciò che richiede il Samsung (gate G2): vedi `docs/test-samsung-results.md`.
- GitHub Pages in HTTPS (gate G1).

# STATUS

Ultimo aggiornamento: 16 novembre 2026

## Dove siamo

- **Fase:** 1 — Icone e test sul Samsung
- **Ultimo task chiuso:** T1 (icone dal logo)
- **Prossimo task:** T2 (prototipo di prova sul Samsung)

## Gate aperti

- **G1** (Luca): abilitare GitHub Pages dalle impostazioni del repo (ramo `main`, cartella radice) e verificare che `https://lucata76-beep.github.io/Nay-app/` si apra in HTTPS e mostri «NAY-App» e `v0.1.0`. **[Da provare]**: non è stato aperto da questa sessione.

## Scostamenti dal piano

- T0, `package.json`: lo script `test` è `node --test "tests/*.test.js"` invece di `node --test tests/`. Con Node 22.23.4 il comando del piano non trova la cartella (errore `Cannot find module '.../tests'`, provato).
- I 4 file di partenza sono stati spostati con `git mv` nel commit `chore: sposta i file di partenza` (prima di T0), per istruzione di Luca; per questo T0 non li crea.
- T1: il pixel (20,20) del logo misura `#fbf6ef` (251,246,239), non `#fdf6ef` come scritto in spec e piano (2/255 sul rosso). Il piano chiede la tela maskable `#fdf6ef` e così è stato fatto; `icon-512.png` e `icon-192.png` (logo intero ridotto) hanno lo sfondo originale del logo. Differenza non visibile a occhio.
- T1: `check_icons.py` accetta un percorso facoltativo (default: `assets/icons/icon-maskable-512.png`); serve a provare che dia KO su un'icona fuori area (provato: logo intero ridotto a 512 → 42,3%, KO).
- Il lavoro è stato fatto direttamente sul ramo `main` (come chiesto da Luca), senza worktree separato.

## Da verificare

- Tutto ciò che richiede il Samsung (T2, gate G2).

# STATUS

Ultimo aggiornamento: 16 novembre 2026

## Dove siamo

- **Fase:** 0 — Repo
- **Ultimo task chiuso:** T0 (repo di partenza)
- **Prossimo task:** T1 (icone dal logo)

## Gate aperti

- **G1** (Luca): abilitare GitHub Pages dalle impostazioni del repo (ramo `main`, cartella radice) e verificare che `https://lucata76-beep.github.io/Nay-app/` si apra in HTTPS e mostri «NAY-App» e `v0.1.0`. **[Da provare]**: non è stato aperto da questa sessione.

## Scostamenti dal piano

- T0, `package.json`: lo script `test` è `node --test "tests/*.test.js"` invece di `node --test tests/`. Con Node 22.23.4 il comando del piano non trova la cartella (errore `Cannot find module '.../tests'`, provato).
- I 4 file di partenza sono stati spostati con `git mv` nel commit `chore: sposta i file di partenza` (prima di T0), per istruzione di Luca; per questo T0 non li crea.
- Il lavoro è stato fatto direttamente sul ramo `main` (come chiesto da Luca), senza worktree separato.

## Da verificare

- Tutto ciò che richiede il Samsung (T2, gate G2).

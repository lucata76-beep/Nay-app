# CLAUDE.md — regole per chi lavora su NAY-App

Progetto: web app offline per Android (PWA a file statici, JavaScript puro, nessuna build).

## Da leggere prima di iniziare

1. `STATUS.md` (fase, ultimo task chiuso, gate aperti, scostamenti dal piano).
2. Il piano: `docs/superpowers/plans/2026-11-16-nay-app-v1.md`.
3. La spec: `docs/superpowers/specs/2026-11-16-nay-app-design-v1.md` (è l'autorità: il piano ne discende).

## Regole

- Eseguire i task in ordine, **test prima** (rosso poi verde, guardando davvero il rosso).
- **Un commit per task.** Ramo `main`, push dopo ogni commit.
- Aggiornare `STATUS.md` a ogni task chiuso.
- Fermarsi **solo ai gate** del piano (richiedono Luca o il telefono).
- **Non inventare.** Ciò che non è provato si scrive **[Da provare]**; ciò che non si è potuto verificare nell'ambiente di lavoro si dice, non si finge.
- **Nessuna CDN.** Ogni libreria sta in `vendor/`.
- **Stringhe di interfaccia solo in `js/i18n/`.**
- **Nessun file `LICENSE`** finché Luca non sceglie la licenza (dopo il test sul Samsung).
- Nessun segreto nel codice (repo pubblico).
- Non anticipare i task successivi a quello in corso.
- Al riavvio di una sessione: leggere `STATUS.md` e ripartire dal **primo task non chiuso**.

## Comandi

- Test: `npm test` (Node 22; esegue `node --test "tests/*.test.js"`).
- Icone: `python3 tools/make_icons.py` e `python3 tools/check_icons.py`.
- Server locale: `python3 -m http.server 8080`.

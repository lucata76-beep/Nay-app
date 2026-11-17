# Risultati del test sul Samsung (gate G2)

Stato: **compilato il 17 novembre 2026 (task T17).** I dati sono **riferiti da Luca** (test del 16-17 novembre 2026) e **riportati da Claude** (il Project), non misurati da chi ha scritto il codice: l'ambiente di sviluppo non ha un telefono Android e nessun esito qui sotto è stato verificato da lì. **Il testo grezzo di «Copia risultati» non è nel repo**: questa tabella è la trascrizione di ciò che è stato riferito, non l'originale.

Il test è il prototipo usa e getta in `spike/` (sezione 9 della spec). Non blocca le fasi 2-3 del piano.

## Come si esegue (Luca, sul Samsung, in Chrome)

Le istruzioni date a Luca, lasciate qui per rifare il test.

1. Il repo deve avere GitHub Pages abilitato (ramo `main`, cartella radice): vedi `STATUS.md`.
2. Aprire `https://lucata76-beep.github.io/Nay-app/spike/`. Il test del 16-17 novembre è stato fatto all'indirizzo `/spike/` di Pages (riferito); la radice di Pages sul Samsung non è stata aperta da nessuno **[Da provare]** (gate G1).
3. Menu ⋮ di Chrome → «Installa app» o «Aggiungi a schermata Home». Aprire la prova dall'icona sulla Home.
4. Nella pagina: scegliere dalla galleria alcune foto e alcuni video (anche grandi), poi «Esegui tutti».
5. Controllo 3: premere i tre pulsanti di condivisione e scegliere prima ChatGPT, poi Gemini; annotare nel campo nota cosa è arrivato (testo? file? tutti i file? lo ZIP?) e quanti file accettano.
6. Controllo 1, parte offline: modalità aereo, riaprire la prova dalla Home; annotare nel campo nota se si apre.
7. Controllo 9: guardare l'icona installata (logo non tagliato?) e annotare.
8. «Copia risultati» e incollare tutto in chat. Il testo copiato ha una riga per esito: `id | OK/KO/? | ms | dettagli` (`OK` riuscito, `KO` non riuscito, `?` da guardare a mano).

## Telefono

- Modello: **Samsung SM-S936B** (Galaxy S25+, Europa/Internazionale)
- Versione di Android: **17** (da UA-CH; l'«Android 10» dello user agent è un valore fisso di Chrome)
- Versione di Chrome: **157.0.8103.51**
- Schermo: 384×832 a 2,8125
- App installata e aperta in modalità standalone.

## Risultati

Nella colonna «Esito» sta ciò che è stato riferito. Dove non è stato riferito un `OK`/`KO`/`?` per il controllo, c'è scritto «non riferito» e i fatti sono nei dettagli. I tempi sono nell'unità in cui sono stati riferiti.

| Controllo | Punto della spec (sez. 9) | Esito | Tempo (ms) | Dettagli |
|---|---|---|---|---|
| `install` | 1 Installazione e offline | OK | | Service worker attivo; 11 file in cache. Offline reale (modalità aereo): **non provato**. |
| `gallery` | 2 Selettore galleria | OK | | Selezione multipla di 3 file (il log dice video mp4). |
| `share` | 3 Condivisione verso ChatGPT e Gemini | non riferito | | `canShare` sì per testo+immagine e per ZIP. Condivisioni reali di testo+immagine e di 3 file+testo: risolte. ZIP: `NotAllowedError`, «Permission denied». ChatGPT e Gemini hanno entrambe caricato i 3 file selezionati. Se il testo «Prova NAY» sia arrivato insieme ai file: non detto. Il numero massimo di file per messaggio non è nei dati. Allegare a mano uno ZIP salvato: **non provato**. |
| `zip` | 4 ZIP con video reali | OK | 0,59 s (riferito in secondi) | 3 video, 159,4 MB. La prova teneva tutto in memoria (heap circa 169 MB). |
| `storage` | 5 Spazio dati e storage persistente | OK | | Quota 10 GB; `persisted()` già true prima di `persist()`. |
| `crypto` | 6 Cifratura (600.000 ripetizioni; video) | OK | 78 | PBKDF2 a 600.000 ripetizioni: 78 ms. AES-GCM su un video da 42 MB: cifra 60 ms, legge 48 ms, contenuto identico. |
| `prf` | 7 Impronta o volto (PRF) | non riferito | | `PublicKeyCredential` presente; autenticatore di piattaforma sì. PRF: **non provato**. |
| `similarity` | 8 Somiglianza (velocità) | OK (testi inventati) | 74 | 1000 testi, 499.500 coppie, 74 ms. Il dato riferito non dice a quale dei tempi misurati dalla prova si riferisca: per 1000 testi la prova ne misura tre (una query contro tutti, solo il confronto, ogni testo contro i precedenti). Qualità sui 50 post veri: **non misurata**. |
| `icon` | 9 Icona installata | OK (parere di Luca) | | Luca dice che il logo va bene (non tagliato). |

## Non provato (resta da fare)

- **Offline reale** (modalità aereo, riaprire dalla Home): non provato.
- **Radice di Pages sul telefono** (l'app vera, non `/spike/`): non aperta da nessuno sul Samsung (gate G1).
- **ZIP**: allegare a mano uno ZIP salvato in ChatGPT o Gemini non è stato provato; la condivisione diretta dello ZIP è rifiutata (`NotAllowedError`).
- **Testo insieme ai file**: se «Prova NAY» sia arrivato insieme ai 3 file in ChatGPT e in Gemini non è stato detto; il numero massimo di file per messaggio non risulta dai dati.
- **PRF** (sblocco con impronta): non provato.
- **Qualità della somiglianza** sui 50 post veri: non misurata; la soglia 0,5 resta da calibrare.
- **File molto grandi sul telefono**: da provare alla prova finale (G4) con il video più pesante; qui il più grande cifrato è un video da 42 MB e lo ZIP provato è di 3 video (159,4 MB).

## Cosa questo prototipo NON misura

Resta fuori e sarà da provare in altro modo **[Da provare]**:

- punto 6: dimensione e tempo di un backup completo (il backup è il task T9);
- punto 7: lo sblocco con impronta (PRF) vero e proprio: il prototipo vede solo che `PublicKeyCredential` esista;
- punto 8: la qualità degli avvisi sui 50 post veri (la sessione di sviluppo non li ha), il controllo per significato, l'OCR e il vocabolario di sinonimi (T18); la velocità è misurata solo su testi inventati in spagnolo;
- punto 9: il menu ⋮ dell'app (non esiste nel prototipo; l'app lo ha, ma sul Samsung non è stata provata).

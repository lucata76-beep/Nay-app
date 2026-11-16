# Risultati del test sul Samsung (gate G2)

Stato: **da compilare.** Nessun risultato è ancora stato raccolto: ogni voce sotto è **[Da provare]**.

Il test è il prototipo usa e getta in `spike/` (sezione 9 della spec). Non blocca le fasi 2-3 del piano.

## Come si esegue (Luca, sul Samsung, in Chrome)

1. Il repo deve avere GitHub Pages abilitato (ramo `main`, cartella radice): vedi `STATUS.md`.
2. Aprire `https://lucata76-beep.github.io/Nay-app/spike/` **[Da provare]**: l'indirizzo è ricavato dal nome del repo, non è stato aperto da chi ha scritto il codice.
3. Menu ⋮ di Chrome → «Installa app» o «Aggiungi a schermata Home». Aprire la prova dall'icona sulla Home.
4. Nella pagina: scegliere dalla galleria alcune foto e alcuni video (anche grandi), poi «Esegui tutti».
5. Controllo 3: premere i tre pulsanti di condivisione e scegliere prima ChatGPT, poi Gemini; annotare nel campo nota cosa è arrivato (testo? file? tutti i file? lo ZIP?) e quanti file accettano.
6. Controllo 1, parte offline: modalità aereo, riaprire la prova dalla Home; annotare nel campo nota se si apre.
7. Controllo 9: guardare l'icona installata (logo non tagliato?) e annotare.
8. «Copia risultati» e incollare tutto in chat. Il testo copiato ha una riga per esito: `id | OK/KO/? | ms | dettagli` (`OK` riuscito, `KO` non riuscito, `?` da guardare a mano).

## Telefono

- Modello: **[Da compilare]**
- Versione di Android: **[Da compilare]** (la riga `device` dei risultati la riporta se Chrome la fornisce)
- Versione di Chrome: **[Da compilare]**

## Risultati

| Controllo | Punto della spec (sez. 9) | Esito | Tempo (ms) | Dettagli |
|---|---|---|---|---|
| `install` | 1 Installazione e offline | [Da provare] | | |
| `gallery` | 2 Selettore galleria | [Da provare] | | |
| `share` | 3 Condivisione verso ChatGPT e Gemini | [Da provare] | | |
| `zip` | 4 ZIP con video reali | [Da provare] | | |
| `storage` | 5 Spazio dati e storage persistente | [Da provare] | | |
| `crypto` | 6 Cifratura (600.000 ripetizioni; video) | [Da provare] | | |
| `prf` | 7 Impronta o volto (PRF) | [Da provare] | | |
| `similarity` | 8 Somiglianza (velocità) | [Da provare] | | |
| `icon` | 9 Icona installata | [Da provare] | | |

## Cosa questo prototipo NON misura

Resta fuori e sarà da provare in altro modo **[Da provare]**:

- punto 6: dimensione e tempo di un backup completo (il backup è il task T9);
- punto 7: lo sblocco con impronta (PRF) vero e proprio: il prototipo vede solo che `PublicKeyCredential` esista;
- punto 8: la qualità degli avvisi sui 50 post veri, il controllo per significato, l'OCR e il vocabolario di sinonimi (T17-T18); la velocità è misurata solo su testi inventati in spagnolo;
- punto 9: il menu ⋮ dell'app (non esiste ancora in questo prototipo; si guarda con le bozze del task T11).

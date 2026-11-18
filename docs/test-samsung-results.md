# Risultati del test sul Samsung (gate G2)

Stato: **compilato il 17 novembre 2026 (task T17) e corretto sul testo grezzo il 17 novembre 2026 (task T17-bis).**

Il test è il prototipo usa e getta in `spike/` (sezione 9 della spec). Non blocca le fasi 2-3 del piano.

## Da dove vengono i dati

- **Testo grezzo.** Le 10 righe di «Copia risultati» che Luca ha incollato in chat il 16 novembre 2026 sono in [`docs/test-samsung-raw.txt`](test-samsung-raw.txt), copiate senza modifiche dal messaggio che le conteneva (file aggiunto per scelta di Claude, il Project). **La tabella qui sotto è la trascrizione di quel file:** ogni cifra viene da una sua riga.
- **Frasi di Luca dalla chat, che NON sono nel testo grezzo** (riferite da Luca e riportate da Claude; nella tabella sono marcate «(chat)»): ChatGPT e Gemini hanno entrambe caricato i 3 file selezionati; il logo va bene (non tagliato).
- **Nessuna verifica indipendente.** La sessione di sviluppo non ha un telefono Android: di questi esiti ho controllato solo, nel codice di `spike/spike.js`, che cosa significano i campi (indicato dove serve).
- **«MB» nella spike** vuol dire 1.048.576 byte (`mb()`, riga 10 di `spike/spike.js`): 167.172.900 byte sono 159,4 MB.

## Come si esegue (Luca, sul Samsung, in Chrome)

Le istruzioni date a Luca, lasciate qui per rifare il test.

1. Il repo deve avere GitHub Pages abilitato (ramo `main`, cartella radice): vedi `STATUS.md`.
2. Aprire `https://lucata76-beep.github.io/Nay-app/spike/`. Il test del 16 novembre è stato fatto a questo indirizzo (riga `device` del testo grezzo, campo `indirizzo=`). Nessun dato riguarda la radice di Pages sul telefono **[Da provare]** (gate G1).
3. Menu ⋮ di Chrome → «Installa app» o «Aggiungi a schermata Home». Aprire la prova dall'icona sulla Home.
4. Nella pagina: scegliere dalla galleria alcune foto e alcuni video (anche grandi), poi «Esegui tutti».
5. Controllo 3: premere i tre pulsanti di condivisione e scegliere prima ChatGPT, poi Gemini; annotare nel campo nota cosa è arrivato (testo? file? tutti i file? lo ZIP?) e quanti file accettano.
6. Controllo 1, parte offline: modalità aereo, riaprire la prova dalla Home; annotare nel campo nota se si apre.
7. Controllo 9: guardare l'icona installata (logo non tagliato?) e annotare.
8. «Copia risultati» e incollare tutto in chat. Il testo copiato ha una riga per esito: `id | OK/KO/? | ms | dettagli` (`OK` riuscito, `KO` non riuscito, `?` da guardare a mano).

## Telefono

- Modello: **SM-S936B** (riga `device`: `modello=SM-S936B`). Il nome commerciale (Galaxy S25+, Europa/Internazionale) è l'abbinamento riferito da Claude: **non è nel testo grezzo e non è verificato**.
- Versione di Android: **17** (UA-CH: `versione=17.0.0`). Lo user agent dice «Android 10; K» (e `Android da user agent=10` nella riga `gallery`): che sia un valore fisso di Chrome è la spiegazione riferita da Claude, non verificata qui.
- Versione di Chrome: **157.0.8103.51** (UA-CH; lo user agent dice 157.0.0.0).
- Schermo: 384×832 a 2,8125 (`schermo=384x832 @2.8125`).
- Contesto sicuro: sì. App in modalità standalone: sì (riga `install`).

## Risultati

Esito e tempo sono quelli dell'intestazione di ogni riga del testo grezzo (`id | esito | ms | dettagli`); `-` vuol dire che la spike non ha dato un tempo. I numeri hanno la virgola decimale e, quando sono grandi, il punto delle migliaia (il testo grezzo ha il punto decimale e nessun separatore delle migliaia); fanno eccezione i conteggi di coppie nella tabella dei tre tempi di `similarity`, scritti come nel testo grezzo.

| Controllo | Punto della spec (sez. 9) | Esito | Tempo (ms) | Dettagli |
|---|---|---|---|---|
| `device` | (riga in più, non è uno dei 9 controlli) | ? | - | User agent: `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36`; schermo 384x832 @2.8125; contesto sicuro=sì; indirizzo `https://lucata76-beep.github.io/Nay-app/spike/`; UA-CH: piattaforma Android, versione 17.0.0, modello SM-S936B, Chrome 157.0.8103.51. |
| `install` | 1 Installazione e offline | OK | 35 | https=sì; contesto sicuro=sì; service worker attivo; pagina controllata dal service worker=sì; file in cache=11; modalità standalone=sì; online ora=sì. Offline reale (modalità aereo): **non provato** (il testo grezzo dice «da provare a mano»). |
| `gallery` | 2 Selettore galleria | OK | - | Campo file: multiple=sì, accept=image/\*,video/\*; file scelti=3 (foto 0, video 3, altri 0); tipi=video/mp4. |
| `share` | 3 Condivisione verso ChatGPT e Gemini | OK | 13,8 | navigator.share=sì; canShare=sì; canShare testo+immagine=sì; canShare ZIP=sì. Le 7 condivisioni vere, il loro significato e ciò che non è verificato sono nella sezione «Le 7 condivisioni vere di `share`». ZIP: errore `NotAllowedError`, «Permission denied». (chat) ChatGPT e Gemini hanno entrambe caricato i 3 file selezionati; il testo grezzo dice solo «da annotare a mano». |
| `zip` | 4 ZIP con video reali | OK | 592,6 | 3 file in ZIP a flusso (ZipPassThrough): ingresso 159,4 MB (167.172.900 byte), ZIP 159,4 MB (167.173.282 byte); heap JS 168,8 MB. |
| `storage` | 5 Spazio dati e storage persistente | OK | 8,7 | Usato 0,5 MB su 10.240,5 MB (0,01%); `persisted()` prima=true; `persist()` ha risposto=true; `persisted()` dopo=true. |
| `crypto` | 6 Cifratura (600.000 ripetizioni; video) | OK | 77,7 | PBKDF2 SHA-256 600.000 ripetizioni: 78 ms (il tempo in colonna, 77,7, è questa derivazione: `kdfMs` in `checkCrypto`); AES-GCM su `1000711448.mp4` (42,0 MB): cifra 60 ms, legge 48 ms, contenuto identico=sì; heap JS 168,8 MB. |
| `prf` | 7 Impronta o volto (PRF) | ? | - | `PublicKeyCredential` presente; autenticatore di piattaforma disponibile=sì. Il testo grezzo: questo controllo vede solo che la funzione esista; lo sblocco con impronta (PRF) **non è provato**. |
| `similarity` | 8 Somiglianza (velocità) | OK | 6,7 | Testi inventati in spagnolo, con radice delle parole (snowball-stem), non i 50 post veri. I tre tempi per 50, 300 e 1000 testi e che cosa misura ciascuno sono nella sezione «I tre tempi di `similarity`». Qualità sui 50 post veri: **non misurata**. |
| `icon` | 9 Icona installata | ? | - | Promemoria a mano (logo non tagliato? forma scelta dal telefono?); nota nel campo nota: «Nay prova». Il menu ⋮ dell'app non esiste in questo prototipo. (chat) Luca dice che il logo va bene (non tagliato): nel testo grezzo l'esito resta `?`. |

Note sul codice della spike (`spike/spike.js`), verificate:

- Il tempo di `zip` (592,6 ms) è il tempo dell'intero controllo: lettura dei 3 file e costruzione dello ZIP (`checkZip`, riga 164). I pezzi dello ZIP restano in un array in memoria fino alla fine (`chunks`, poi `Blob(chunks)`).
- `heap JS` è `performance.memory.usedJSHeapSize` letto alla fine del controllo (`heapNote()`, riga 17): la spike lo definisce «indicativa». Lo stesso valore, 168,8 MB, compare nelle righe `zip` e `crypto`.
- «usato … su …» in `storage` sono `usage` e `quota` di `navigator.storage.estimate()` (`checkStorage`, riga 217): 10.240,5 MB è la quota.
- `OK` in `similarity` vuol dire solo che il controllo è girato: nel codice l'esito è `sink >= 0` (riga 406), sempre vero. Non dice nulla sulla qualità degli avvisi.
- `OK` in `install` richiede `https` e service worker attivo e file in cache (riga 67).

## Le 7 condivisioni vere di `share`

Nell'ordine del testo grezzo:

1. testo+immagine: annullato
2. testo+immagine: condiviso (o chiuso dopo la scelta dell'app)
3. testo+immagine: condiviso (o chiuso dopo la scelta dell'app)
4. testo+immagine: condiviso (o chiuso dopo la scelta dell'app)
5. ZIP: errore NotAllowedError Permission denied
6. 3 file scelti+testo: condiviso (o chiuso dopo la scelta dell'app)
7. 3 file scelti+testo: condiviso (o chiuso dopo la scelta dell'app)

**Significato** (verificato in `realShare`, `spike/spike.js` righe 129-137):

- «condiviso (o chiuso dopo la scelta dell'app)» vuol dire **solo che la promessa di `navigator.share` si è risolta**. Non prova che l'app di destinazione abbia ricevuto il contenuto.
- «annullato» è un `AbortError`; ogni altro errore compare come «errore» con il nome.
- Il testo condiviso nelle condivisioni 1-4 e 6-7 è «Prova NAY» (righe 142 e 148 della spike).

**Non verificato:** quale delle due condivisioni «3 file scelti+testo» sia andata a ChatGPT e quale a Gemini (il testo grezzo non indica l'app di destinazione). Se «Prova NAY» sia arrivato insieme ai file: non detto. Il numero massimo di file per messaggio non è nei dati.

## I tre tempi di `similarity`

Etichette esatte del testo grezzo. Testi inventati in spagnolo (`makeCorpus`: 10-18 parole ciascuno), non i 50 post veri.

| Testi | tokenizza+confronta | solo confronto | ogni testo contro i precedenti |
|---|---|---|---|
| 50 | 0,5 ms | 0,00 ms | (1225 coppie) 0 ms |
| 300 | 2,2 ms | 0,10 ms | (44850 coppie) 8 ms |
| 1000 | 6,7 ms | 0,60 ms | (499500 coppie) 74 ms |

Che cosa misura ciascuno (verificato in `checkSimilarity`, `spike/spike.js` righe 374-408):

- **tokenizza+confronta:** il tempo per trasformare in parole (minuscole, parole di almeno 3 lettere, senza stopword, con la radice dello stemmer spagnolo) un testo nuovo **e tutti gli n testi**, e per confrontare il testo nuovo con ciascuno (Jaccard). È il caso «un testo nuovo contro lo storico, partendo dai testi grezzi». Il valore per 1000 testi (6,7 ms) è anche il tempo in colonna della riga `similarity`.
- **solo confronto:** lo stesso confronto del testo nuovo con gli n testi, ma sui testi già trasformati in parole: niente tokenizzazione.
- **ogni testo contro i precedenti:** tutte le coppie tra gli n testi già trasformati in parole (niente tokenizzazione); le coppie sono n(n−1)/2 (1225, 44850, 499500). È la parte che cresce col quadrato dei testi. Il «74 ms» della riga è questo tempo per 1000 testi.

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

# NAY-App — Documento di progetto (v1 Android)

Data: 16 novembre 2026 (aggiornato con accesso, cifratura, storico dei post, lingue, logo e menu) · Stato: **APPROVATO da Luca il 16 novembre 2026** · Autori: Luca e Claude

Legenda: **[Luca]** = deciso da Luca · **[Verificato]** = controllato su fonte (elenco in fondo) · **[Mia scelta]** = scelta di Claude, da confermare · **[Da provare]** = si decide col test sul Samsung.

---

## Riepilogo

**Cos'è.** NAY-App è una web app per la pagina Facebook di una creatrice di contenuti motivazionali. Quattro pagine: Dashboard (3 pulsanti e grafici), Ideare (archivio di appunti, foto e video), Sviluppare (prompt da template, esportabili), Pubblicazioni salvate (storico e nuovi post, con screenshot, titolo e descrizione scritti a mano).

**Deciso da Luca**
- v1 solo Android (Samsung), tutto offline. iPhone e desktop dopo.
- Web app installata da Chrome (PWA) su GitHub Pages. Capacitor (APK) solo di ripiego, dopo il test sul Samsung.
- Niente API ChatGPT in v1: il prompt si copia o si condivide.
- 3 template pronti (foto, video, solo testo), modificabili, duplicabili, e se ne possono creare altri.
- Condivisione singola e raggruppata (gruppo di file o ZIP).
- Foto e video dalla galleria. Pubblicazioni inserite a mano.
- **Accesso con password, solo per sicurezza e privacy:** blocco locale, dati cifrati nel telefono, codice di recupero mostrato una sola volta, backup cifrato. Niente email, niente mail di conferma, niente account cloud. Se password e codice si perdono senza backup, i dati sono persi: accettato.
- Design: il poster della Dashboard (confermato come riferimento).
- **Storico dei post già pubblicati:** lei lo vuole caricare, per evitare contenuti simili, costruire uno stile e aiutare i prompt a non ripetersi. Metodo veloce: screenshot, titolo e descrizione scritti a mano. Oggi sono circa 50 post, e crescono di 4-5 a settimana.
- **Registro delle ripetizioni:** una casella che elenca le ripetizioni trovate e in quale pubblicazione si trovano, con ricerca per data. Si riempie in automatico (Luca: «in automatico è meglio»). Piace a Luca anche l'avviso sui post con parole simili.
- **Lingue:** lei è spagnola, di lingua madre spagnola: pubblica in spagnolo e anche in italiano, e continua con lo spagnolo. Ogni post è in una sola lingua: non pubblica lo stesso contenuto tradotto. L'app è bilingue (spagnolo e italiano) come struttura: interfaccia, menu, template. Parte in spagnolo e ha due pulsanti a bandierina, spagnolo e italiano, per cambiare lingua.
- **Guida in spagnolo dentro l'app [Luca, 18 novembre 2026]:** una guida completa su come usare l'app, scritta in spagnolo, che si apre dall'app e si legge senza rete. Luca la preferisce dentro l'app perché è più veloce che aprire un lettore PDF. Si scrive alla fine, quando le funzioni sono definitive (sezione 5, «Guida in spagnolo, dentro l'app»).
- **Idea di Luca, non ancora decisa:** un vocabolario di sinonimi e contrari, perché ogni parola si possa confrontare con le altre (sezione 5, pagina 3).
- **Come lavora oggi:** tutto a mano, in due direzioni: parte da una foto o un video e crea la frase (motivazionale o di stile di vita), oppure ha già la frase e le abbina una foto o un video.
- **App di IA:** ChatGPT (suggerita da Luca) e Gemini. Oggi lei usa ChatGPT gratuito e vuole passare a un piano a pagamento base: secondo Luca costa «il minimo 22 euro al mese» (cifra detta da Luca, non verificata da me).
- **Dove perde tempo oggi:** a modificare le foto e a scrivere la caption o l'hook. Per questo Sviluppare è il pulsante da curare di più; la modifica delle foto non è coperta dalla v1 (sezione 12).
- **Telefono:** Samsung SM-S936B (Galaxy S25+, codice Europa/Internazionale) con Android 17, letto da Chrome 157 nel test del 16 novembre 2026 **[Verificato]**.
- **Repo pubblico.** Si usa una licenza open source: anche i dati del vocabolario devono averne una. Quale licenza per il repo è ancora da scegliere (sezione 11).
- **Logo:** il file «cuffia_03_oro.png» va in alto a sinistra nell'app, con accanto il numero di versione dell'app **[Luca]**, e come icona dell'app (sezione 8). Le bandierine delle lingue vanno in alto a destra **[Luca]**.
- **Le 26 scelte di Claude della sezione 10: confermate da Luca** («vanno bene»).
- **Barra di navigazione in basso con 4 icone: sì [Luca: «3- si»].** Licenza open source del repo: si sceglie dopo il test sul Samsung **[Luca: «4- ok»]**.
- **Foto:** lei mette hook o caption sopra la foto, modificandola con un editor di foto o con un'IA **[Luca]**. La v1 non modifica le foto (sezione 12).
- **Documento approvato da Luca il 16 novembre 2026** («APPROVATO»), comprese le scelte 27-32 della sezione 10.
- **Piano esecutivo:** `docs/superpowers/plans/2026-11-16-nay-app-v1.md` (nel Project: `docs/2026-11-16-nay-app-plan-v1.md`).

**Scelte di Claude:** sezione 10 (tutte approvate). **Da provare sul Samsung:** sezione 9.

**Ancora aperto (sezione 11):** quale licenza open source per il repo (si decide dopo il test); limiti del piano a pagamento di ChatGPT (non verificati). Nessuno blocca il piano.

**Da sapere sulla sicurezza:** la cifratura protegge i dati dentro l'app. Le foto e i video originali restano in chiaro nella galleria, e tutto ciò che lei condivide o esporta (prompt, file, ZIP) esce in chiaro.

---

## 1. Scopo e perché

**Cosa.** Una web app per una creatrice di contenuti Facebook (motivazione, stile di vita, consigli femminili). Serve a tre cose: (1) raccogliere idee in qualsiasi momento, con appunti, foto e video; (2) trasformare un'idea in un prompt da portare in un'IA; (3) tenere l'archivio dei post pubblicati, con statistiche.

**Per chi.** Per lei, sul suo smartphone Samsung (Android). Lei è spagnola, di lingua madre spagnola, e pubblica in spagnolo e anche in italiano. Luca la costruisce e la mantiene, e lavora in italiano.

**Perché.** Parole di Luca: l'idea può nascere in qualsiasi momento e deve finire in uno spazio unico; impacchettare testo, foto e video e portarli a un'IA deve essere "più utile e veloce". Oggi lei lavora tutto a mano, in due direzioni: parte da una foto o un video e crea la frase (motivazionale o di stile di vita), oppure ha già la frase e le abbina una foto o un video. Lo storico dei post già pubblicati le serve per verificare che i contenuti non si ripetano, per costruire uno stile e per aiutare i prompt a non ripetersi. Dove perde tempo: a modificare le foto per mettere sopra hook o caption, con un editor di foto o con un'IA, e a scrivere la caption o l'hook **[Luca]**; gli altri punti vanno raccolti durante la prima prova.

**Successo [Mia scelta].** Lei salva un'idea in pochi tocchi, genera un prompt e lo porta nell'IA senza ricopiare nulla, e vede in dashboard come vanno i post.

## 2. Obiettivi, non-obiettivi, anti-obiettivi

**Obiettivi v1 [Luca]**
- Gira su Android (Samsung). Funziona del tutto offline.
- Quattro pagine: 0 Dashboard, 1 Ideare, 2 Sviluppare, 3 Pubblicazioni salvate.
- Foto e video si caricano dalla galleria.
- Template di prompt: 3 pronti (foto, video, solo testo), modificabili e duplicabili, e se ne possono creare altri.
- Invio e condivisione sia singoli sia raggruppati (gruppo di file o ZIP).
- Pubblicazioni inserite a mano.
- Storico dei post già pubblicati, caricato col metodo veloce (screenshot, titolo, descrizione) e usato per evitare contenuti simili e per dare uno stile ai prompt.
- Avviso sui post con parole simili e registro delle ripetizioni: elenco di dove si trovano e in quale pubblicazione, con ricerca per data. Il registro si riempie in automatico.
- Accesso con password, solo per sicurezza e privacy: blocco locale, dati cifrati, codice di recupero, backup cifrato (sezione 7).
- App bilingue, spagnolo e italiano, come struttura: interfaccia, menu, template (sezione 5). Parte in spagnolo, con due pulsanti a bandierina per cambiare lingua. Ogni post è in una sola lingua.
- Look dell'immagine di riferimento (sezione 8).
- Logo NAY in alto a sinistra e come icona dell'app (sezione 8).
- Barra in alto, menu e barra in basso come da «Menu e navigazione» (sezione 5) **[approvati da Luca]**.
- Guida completa in spagnolo dentro l'app, scritta alla fine (sezione 5).

**Non-obiettivi v1 [Luca]**
- Versioni iPhone e desktop (verranno dopo).
- Connessione API a ChatGPT: il prompt si copia o si condivide.
- Importazione automatica da Facebook e pubblicazione su Facebook.
- Registrazione con email, mail di conferma, account cloud e recupero password via mail: scartati, perché il login serve solo per sicurezza e privacy.

**Non-obiettivi v1 [Mia scelta]**
- Sincronizzazione tra dispositivi: con un solo telefono non serve (se servirà con iPhone e desktop, vedi sezione 12).

**Anti-obiettivi (la v1 fallisce anche se "funziona" se…)**
- Un'idea, una foto o un video salvati spariscono.
- Salvare un'idea richiede più di pochi tocchi, o serve la rete.
- Nel codice sul repo finisce un segreto (in v1 non ce ne sono).
- Il codice di recupero viene saltato: l'app deve rendere difficile andare avanti senza averlo salvato **[Mia scelta]**.
- Testi, template, prompt o pubblicazioni risultano leggibili senza la password **[Mia scelta]**. Per foto e video vedi sezione 7.

## 3. Vincoli e fatti verificati

- **Condivisione di sistema [Verificato].** Dal browser si condividono link, testo e file. I file ammessi sono audio, immagini, PDF, video e testo: lo **ZIP non è ammesso**. Serve HTTPS e parte solo da un tocco dell'utente. Un tipo non ammesso viene rifiutato ("Permission denied").
- **Copia negli appunti [Verificato].** `writeText` funziona solo in contesto sicuro (HTTPS) e da un tocco dell'utente.
- **Selettore galleria [Verificato].** Un campo file con filtro immagini/video su Android Chrome offre la scelta tra fotocamera e file esistenti. Il comportamento è cambiato con Android 14 e 15. Provato sul Samsung SM-S936B (Android 17, Chrome 157; riferito da Luca; testo grezzo incollato il 16 novembre 2026): la selezione multipla di 3 file è riuscita (il log dice video mp4). Non provato: Android 14 e 15 (il telefono ha Android 17); se il selettore offra anche la fotocamera non è stato riferito.
- **Dati offline [Verificato].** IndexedDB salva dati strutturati e blob (file). Chrome consente a ogni sito fino al 60% del disco. Con l'app installata il browser può concedere storage persistente, ma non è garantito.
- **Cifratura nel browser [Verificato].** PBKDF2 è pensato per ricavare chiavi da input deboli come le password. La funzione `deriveKey` è disponibile su tutti i browser dal gennaio 2020 e solo in contesto sicuro (HTTPS); AES-GCM è tra gli algoritmi supportati. Per PBKDF2 con SHA-256, OWASP indica 600.000 ripetizioni (dato riportato da Wikipedia).
- **Sblocco con impronta [Verificato in parte].** Chrome su Android e le web app installate usano WebAuthn con impronta, volto o blocco schermo. Di solito però l'ID del passkey viene salvato nel database di un server: l'uso solo locale non è verificato. Per ricavare una chiave di cifratura serve l'estensione PRF: i passkey di Google Password Manager su Android la includono, ma alcuni provider su Android 14 potrebbero non supportarla, e un co-editor della specifica WebAuthn ne sconsiglia l'uso per cifrare dati. Per questo l'impronta è solo un extra **[Da provare]**.
- **App di IA [Verificato].** Gemini: fino a 10 file per messaggio, 100 MB ciascuno (video 2 GB), secondo la pagina di aiuto Google; uno ZIP fino a 10 file è riportato solo da una copia universitaria di quella pagina **[Da provare]**. ChatGPT: la pagina di aiuto OpenAI indica 80 file ogni 3 ore e **3 file al giorno con il piano gratuito**; i file di testo sono ammessi (tetto di 2 milioni di token per file). Il limite di 10 file per messaggio su ChatGPT è riportato solo da un sito terzo: non confermato. Quale delle due app sia più performante non è stato verificato.
- **Lettura del testo da uno screenshot, OCR [Verificato in parte].** Tesseract.js può funzionare offline ospitando in locale programma e dati della lingua (il codice per l'italiano esiste); i dati della lingua vengono messi in cache in IndexedDB. La resa su screenshot di Facebook non è verificata **[Da provare]**.
- **Somiglianza di significato nel browser [Verificato in parte].** Transformers.js scarica un modello una volta, lo mette in cache ed esegue tutto sul dispositivo. Il modello multilingual-e5-small (100 lingue, 384 dimensioni) gira nel browser; le fonti danno dimensioni diverse (circa 50 MB, oppure 113-118 MB nella versione compressa). L'italiano e lo spagnolo sui suoi testi e la velocità sul Samsung non sono verificati **[Da provare]**.
- **Vocabolari di sinonimi e contrari [Verificato in parte].** Italiano: il thesaurus di LibreOffice (pacchetto Debian da circa 881 KB) è software libero con licenza copyleft: GPL secondo il README e il pacchetto Gentoo, AGPL secondo il file di copyright di una versione del 2008. Il README parla solo di sinonimi: i contrari non risultano **[Da provare]**. Spagnolo: il thesaurus di OpenOffice ha licenza LGPL 2.1 secondo FreshPorts (versione del 2014, archivio da circa 830 KB); esiste anche un pacchetto «mythes-es» per LibreOffice (circa 580 KB), di cui non ho verificato né licenza né origine; i contrari non sono verificati. Alternative: WordNet aperti per italiano (MultiWordNet) e spagnolo (Multilingual Central Repository), con licenza CC BY secondo un articolo del 2013 da riverificare; dati estratti da Wiktionary (kaikki.org), con campi per sinonimi e contrari, che secondo due raccolte su Hugging Face hanno licenza CC BY-SA 4.0. Dimensioni dei dati completi e qualità sui testi di lei non sono verificate. GPL e AGPL pongono condizioni a chi ridistribuisce: Claude non è un avvocato, va chiarito prima di includerli in un'app pubblicata **[Da verificare]**. Luca ha deciso che si usa una licenza open source **[Luca]**: i dati devono averne una, e il repo pubblico andrà sotto una licenza compatibile con quella dei dati scelti (sezione 11).
- **Radici delle parole (stemmer) [Verificato in parte].** Snowball ha algoritmi per italiano e spagnolo, e ne esistono versioni già compilate in JavaScript (per esempio il pacchetto npm snowball-stem, da Snowball 2.2.0). Un algoritmo di radice riduce molte forme della stessa parola a una radice comune; non è perfetto, e la resa sui testi di lei in spagnolo e italiano va misurata **[Da provare]**. Provato in questa sessione con snowball-stem 1.1.1 (licenza BSD 3-Clause, ha SpanishStemmer e ItalianStemmer): «animo» e «ánimo» danno la stessa radice «anim», «corazón» e «corazones» danno «corazon», «cuore» e «cuori» danno «cuor»; «amar» e «amando» invece restano diverse («amar», «amand») **[Verificato]**.
- **Hosting.** Condivisione, appunti e cifratura richiedono HTTPS. Provato sul Samsung (riferito da Luca; testo grezzo incollato il 16 novembre 2026): la prova all'indirizzo `/spike/` di GitHub Pages si è installata ed è stata aperta come app (modalità standalone); il suo controllo `install` dà OK solo se l'indirizzo è `https:`, se il service worker è attivo e se ci sono file in cache, e ha dato OK (11 file in cache). Non provato: la radice di Pages (l'app vera) non è stata aperta sul telefono **[Da provare]** (gate G1 in `STATUS.md`).
- **Strumenti di sviluppo [Verificato in questa sessione].** Node 22.23.4 con test runner integrato (`node:test`) e WebCrypto; fflate 0.8.3 (licenza MIT) con ZIP a flusso (`Zip`, `ZipPassThrough`, `ZipDeflate`); fake-indexeddb 6.2.8 (Apache-2.0) per provare il salvataggio fuori dal browser; Pillow 12.3.0 per ricavare le icone dal logo. L'ambiente di Claude non ha un telefono Android: la prova sul Samsung resta a Luca.

## 4. Approcci considerati

| | Come | Pro | Contro |
|---|---|---|---|
| **A. Web app installata da Chrome (PWA)** — **scelta [Luca]** | File statici su GitHub Pages, aggiunta alla schermata Home, dati nel telefono | È lo stack di Luca; aggiornamenti con un push; lo stesso codice servirà per iPhone e desktop; nessuno strumento Android | Lo ZIP non si condivide direttamente: si salva nel telefono e si allega a mano |
| **B. Stessa web app impacchettata con Capacitor (APK)** — ripiego | Stesso codice in un guscio Android | Il plugin Share accetta un elenco di file e potrebbe passare lo ZIP (da provare) | Servono Node, Android Studio e Java; build e firma; installazione da origini sconosciute; nuova installazione a ogni modifica |
| **C. App nativa (Kotlin) o Flutter** — scartata | Riscrittura da zero | Massimo controllo | Si riscrive tutto per iPhone e desktop; fuori dallo stack di Luca |

Il codice va impostato in modo da poter passare da A a B senza riscriverlo. Il punto di decisione è il test della sezione 9.

## 5. Le pagine

Navigazione e menu **[Mia scelta]**: vedi «Menu e navigazione» in fondo a questa sezione. Interfaccia bilingue, spagnolo e italiano (vedi «Lingue» in fondo a questa sezione).

### Pagina 0 — Dashboard [Luca]
- Tre pulsanti grandi: IDEARE, SVILUPPARE, PUBBLICAZIONI SALVATE.
- Sotto, statistiche con grafici calcolati sulle pubblicazioni della pagina 3. Proposta **[Mia scelta]**:
  - numeri chiave: post, visualizzazioni totali, commenti totali;
  - visualizzazioni nel tempo (grafico ad area);
  - commenti per post (barre);
  - orari migliori: media delle visualizzazioni per fascia oraria di pubblicazione (barre);
  - post per tipo foto/video/testo (ciambella).
- Con zero pubblicazioni: messaggio che invita a inserire il primo post.

### Pagina 1 — Ideare [Luca, dettagli Mia scelta]
- Apre l'archivio di tutto ciò che lei ha raccolto: appunti, pensieri, foto, video. Un'idea può avere solo testo, solo foto o video, oppure entrambi **[Mia scelta]**: serve ai due modi di lavorare di lei (dal media alla frase, o dalla frase al media).
- Il tasto **[+]** resta sempre in vista e offre Nota, Foto, Video. Foto e video si prendono dalla galleria (selezione di più file da provare).
- Elenco con anteprime, ricerca per parola, modifica ed eliminazione.
- Ogni idea ha uno stato: nuova, in sviluppo, pubblicata **[Mia scelta]**. Lo stato cambia da solo ("in sviluppo" quando si genera un prompt, "pubblicata" quando l'idea viene collegata a una pubblicazione) e si può correggere a mano.

### Pagina 2 — Sviluppare [Luca, dettagli Mia scelta]
Flusso: scegli un'idea → scegli il tipo (foto, video, solo testo) → scegli un template → anteprima del prompt → Copia / Condividi / ZIP.
- **Template.** 3 predefiniti, modificabili e duplicabili; se ne possono creare altri. Per creare o modificare un template si scrive il testo e si inseriscono i segnaposto con dei tasti. Segnaposto proposti: `{idea}`, `{tipo_media}`, `{descrizione_media}`, `{durata_video}`, `{tono}`, `{obiettivo}`, `{lunghezza}`, `{hashtag}`, `{storico}`, `{stile}`, `{lingua}`.
- **Come entrano foto e video nel prompt.** L'app non "vede" il contenuto. Nel prompt vanno il tipo, la durata del video e una **descrizione scritta da lei** ("cosa si vede"). Il file vero si allega nell'IA.
- **Valori di tono, obiettivo, lunghezza:** piccolo modulo prima dell'anteprima, con gli ultimi valori ricordati.
- Ogni prompt generato resta salvato e collegato all'idea.
- **Quattro template pronti invece di tre [Mia scelta, confermata da Luca]:** foto → frase, video → frase, solo testo, e frase → idee per foto o video (il caso in cui lei ha già la frase). I tre indicati da Luca restano; il quarto copre la direzione opposta.
- **Template in due lingue [Mia scelta]:** ogni template pronto esiste in spagnolo e in italiano; l'idea o il post ha una lingua, e il prompt chiede all'IA di rispondere in quella lingua (segnaposto `{lingua}`). I testi dei template in spagnolo li scrive Claude e li rivede lei, che è madrelingua.
- **Storico nel prompt [Mia scelta]:** `{storico}` inserisce titoli e descrizioni dei post già pubblicati (gli ultimi, più quelli più simili all'idea) con l'istruzione di non ripetere e di mantenere lo stile. Con circa 50 post oggi si può includere quasi tutto lo storico, ma cresce di 4-5 a settimana: quanti post includere è un parametro da tarare nel test, perché la lunghezza massima del messaggio non è verificata **[Da provare]**. È testo nel prompt e non un file, così non conta come caricamento (ChatGPT gratuito ne ammette 3 al giorno).
- **Guida di stile [Mia scelta]:** ChatGPT o Gemini scrivono una guida di stile a partire dallo storico; lei la salva nell'app e `{stile}` la inserisce in ogni prompt. L'app da sola non impara lo stile.
- **Avviso sui file [Mia scelta]:** se i file da condividere sono più di 10, l'app avvisa (limite di Gemini; per ChatGPT da provare).
- **Hook e caption [Luca: è dove perde tempo; dettagli Mia scelta].** I template pronti chiedono all'IA due risposte separate, l'hook e la caption, ciascuna con più varianti tra cui scegliere, così lei sceglie e copia ciò che le serve. Quante varianti, da tarare con lei nel test. Lei poi mette hook o caption sulla foto con un editor di foto o con un'IA **[Luca]**: per questo il template chiede un hook breve, adatto a stare sopra una foto **[Mia scelta]**.

### Pagina 3 — Pubblicazioni salvate [Luca: inserimento a mano; campi Mia scelta]
- **Salvataggio veloce [Luca]:** screenshot del post + titolo + descrizione (frase motivazionale o altro), scritti a mano. Esempio di Luca: titolo «post sugli alberi del parco», descrizione, screenshot. Lo screenshot si prende dalla galleria come le foto e resta salvato (cifrato) nell'app.
- Campi **[Mia scelta]**: screenshot, titolo, descrizione, tipo (foto, video, testo; con valore predefinito), lingua (spagnolo o italiano; predefinito spagnolo), data e ora (predefinita: adesso, modificabile: per lo storico va corretta), visualizzazioni, commenti, nota libera, idea collegata. Visualizzazioni e commenti sono **facoltativi**: i grafici della Dashboard contano solo i post che li hanno.
- **Storico:** lo stesso metodo vale per i post pubblicati prima dell'app. Sono circa 50 e crescono di 4-5 a settimana, cioè circa 200-260 all'anno (calcolo di Claude) **[Luca]**.
- Elenco con filtri per data e tipo; modifica ed eliminazione.
- **Avviso di somiglianza [Luca: approvato; dettagli Mia scelta]:** quando lei scrive una nuova idea o un nuovo prompt, l'app mostra i post già pubblicati con parole simili (offline). Il confronto è per parole: trova parole e frasi uguali, non lo stesso significato detto con altre parole. Per le forme diverse della stessa parola (cuore, cuori) si usa la radice delle parole (sezione 3), che però non unisce tutte le forme (amar, amando), e per i sinonimi c'è l'idea del vocabolario (qui sotto). Si tara sui suoi 50 post nel test **[Da provare]**. Il confronto avviene tra testi della stessa lingua **[Luca: ogni post è in una sola lingua]**. Il controllo per significato, con un modello nel browser, resta un'aggiunta da decidere dopo il test **[Da provare]**.
- **Registro delle ripetizioni [Luca: casella con le ripetizioni, dove si trovano, in quale pubblicazione, ricerca per data; dettagli Mia scelta]:** una scheda dentro Pubblicazioni salvate. Ogni voce riporta: il testo controllato (idea, prompt o post); la pubblicazione trovata (titolo, data, screenshot che si apre toccando); le parole o frasi in comune, evidenziate; un grado di somiglianza orientativo; la data del controllo. Ogni voce ha uno stato che lei imposta: da valutare, ripetizione confermata, falso allarme (un falso allarme non viene più segnalato). Ricerca e filtro per data (della pubblicazione trovata e del controllo) e per parola.
- **Come si riempie il registro [Luca: «in automatico è meglio»; dettagli Mia scelta]:** da solo. Quando lei salva un'idea, un prompt o un post e l'avviso di somiglianza trova una pubblicazione simile, la voce entra nel registro con stato «da valutare», senza altri tocchi; la stessa coppia di testi non crea due voci. Lo storico iniziale si controlla da solo mentre lei lo carica: ogni post caricato viene confrontato con quelli già presenti. Interpreto «in automatico» come nessun tasto «Salva nel registro», e tolgo dalla v1 «Controlla tutto lo storico» **[Mia scelta, confermata da Luca]**.
- **Dashboard [Mia scelta]:** una piccola scheda con il numero di ripetizioni da valutare.
- **Vocabolario di sinonimi e contrari [Luca: idea; valutazione Claude; si decide col test].** L'idea di Luca: far confrontare ogni parola con i suoi sinonimi e contrari, così l'avviso trova anche lo stesso concetto detto con altre parole. Si può fare: esistono vocabolari liberi per spagnolo e italiano (sezione 3); i pacchetti compressi dei thesauri di LibreOffice pesano circa 580 KB (spagnolo) e 880 KB (italiano), secondo i pacchetti Ubuntu e Debian di qualche anno fa. Girano offline e permettono di mostrare perché due testi sono simili («X e Y sono sinonimi»). Limiti, ragionamento di Claude da misurare nel test **[Da provare]**: una parola ha spesso più significati e l'app non capisce quale sia usato, quindi può segnalare somiglianze sbagliate; le frasi motivazionali usano spesso immagini e metafore che un vocabolario non lega; un contrario da solo indica il significato opposto, quindi serve solo se l'app gestisce anche la negazione («non essere triste» e «sii felice» dicono la stessa cosa). Proposta **[Mia scelta]**: nella v1 si provano i sinonimi, prima in spagnolo e poi in italiano, insieme alla radice delle parole; i contrari si decidono dopo il test, perché la loro presenza nei dati non è verificata. Alternativa o aggiunta: il controllo per significato con un modello nel browser, che pesa di più (sezione 3) **[Da provare]**.
- **Lettura automatica dello screenshot (OCR):** opzionale, per precompilare la descrizione; si decide dopo il test **[Da provare]**.
- È la sola fonte dei grafici della Dashboard.

### Lingue: spagnolo e italiano [Luca: app bilingue; dettagli Mia scelta]
- **Chi scrive in che lingua [Luca].** Lei è spagnola, di lingua madre spagnola; pubblica in spagnolo e anche in italiano, e continua con lo spagnolo. Ogni post è in una sola lingua: non pubblica lo stesso contenuto tradotto («posta solo in una lingua»).
- **Interfaccia [Luca: bilingue come struttura; si parte dallo spagnolo; pulsanti a bandierina].** Tutti i testi (menu, pulsanti, messaggi, template pronti) stanno in due elenchi, spagnolo e italiano, così si cambia lingua senza ricostruire l'app. Due pulsanti a bandierina, spagnolo e italiano, cambiano la lingua, con quella attiva evidenziata **[Luca]**. Dettagli **[Mia scelta]**: le bandierine stanno nella barra in alto di ogni pagina e nella schermata di sblocco; sono immagini incluse nell'app (non emoji, così appaiono uguali su ogni dispositivo) con accanto la sigla ES e IT; la lingua scelta si ricorda nel telefono e si salva in chiaro, perché la schermata di sblocco compare prima della password e la lingua non è un dato sensibile.
- **Pubblicazioni [Luca: ogni post è in una sola lingua].** Ogni idea, prompt e post ha un campo «lingua» (spagnolo o italiano, predefinito spagnolo) **[Mia scelta]**. L'avviso di somiglianza e il registro confrontano testi della stessa lingua. Non servono collegamenti tra un post e una sua traduzione, né confronti tra le due lingue, perché lei non traduce lo stesso contenuto. La bandierina cambia solo l'interfaccia, e la lingua dell'idea o del post si sceglie a parte **[Luca: «1-ok»]**.
- **Traduzioni [Mia scelta].** I testi dell'interfaccia e dei template in spagnolo li scrive Claude e li rivede lei, che è madrelingua; quelli in italiano li rivede Luca.
- **Radice delle parole e vocabolario [Mia scelta].** Servono in due versioni, una per lingua (sezione 3).

### Menu e navigazione [Luca: domanda sui menu a tendina (salvare, aprire, caricare, chiudi); proposta Mia scelta, approvata]
- **Risposta breve.** Una barra a tendina come nei programmi per computer (File, Modifica) non è la convenzione su telefono: lì i comandi stanno dove servono, in un menu ⋮ e nelle schede. La barra a tendina classica è per la futura versione desktop (sezione 12). Linee guida Material **[Verificato]**: la barra di navigazione in basso ospita 3-5 destinazioni principali di pari importanza, solo su telefono o tablet, e non serve per le impostazioni; i menu non si usano come navigazione principale e i sottomenu, idealmente, si fermano a un livello; il pulsante flottante è per l'azione più importante.
- **I quattro comandi di Luca:**

| Comando | Nell'app |
|---|---|
| Salvare | Tasto «Salva» in ogni modulo (idea, post, template); il testo scritto non va perso se lei esce prima di salvare **[Mia scelta]**. Backup: ⋮ → Esporta backup. |
| Aprire | Toccare una scheda apre l'idea, il prompt o il post. Un backup: ⋮ → Importa backup. |
| Caricare | Tasto [+] in Ideare (Nota, Foto, Video dalla galleria) e in Pubblicazioni salvate (screenshot). Per riportare i dati: Importa backup. |
| Chiudere | Freccia indietro nelle schermate di dettaglio; «Blocca ora» nel menu ⋮, che richiede di nuovo la password. Un «Chiudi app» non lo propongo: non ho verificato che una web app installata possa chiudersi da sola. |

- **Barra in alto, in ogni pagina [Luca: numero di versione accanto al logo; bandierine in alto a destra]:** a sinistra il logo NAY (tocco = Dashboard) con accanto il numero di versione dell'app; al centro il titolo della pagina; a destra le bandierine ES e IT e il menu ⋮.
- **Menu ⋮ della barra (una tendina, un solo livello):** Blocca ora · Esporta backup · Importa backup · Impostazioni (password, codice di recupero, spazio usato, impronta se possibile) · Guida (aggiunta il 18 novembre 2026, vedi «Guida in spagnolo, dentro l'app») · Informazioni (versione, licenze).
- **Menu ⋮ su ogni scheda:** Modifica, Duplica, Elimina; sui prompt anche Copia e Condividi.
- **Pulsante [+]:** azione principale in Ideare e in Pubblicazioni salvate. In Sviluppare le azioni stanno in una riga fissa in fondo: Copia, Condividi, Crea ZIP.
- **Barra di navigazione in basso con 4 icone (Dashboard, Ideare, Sviluppare, Pubblicazioni) [Luca: «3- si»].** Pro: 4 sono dentro il limite 3-5 e le pagine hanno peso simile; si passa da una pagina all'altra con un tocco, senza tornare alla Dashboard. Contro: Material la vuole su ogni schermata, quindi anche sulla Dashboard, dove ripete i tre grandi pulsanti; occupa spazio in basso, dove in Sviluppare servono Copia, Condividi e ZIP. Deciso: sì, con le azioni di Sviluppare sopra la barra. Il tocco sul logo porta comunque alla Dashboard.

```
┌────────────────────────────────────┐
│ [NAY] v1.0  Ideare   [ES][IT]  ⋮   │  ← barra in alto
├────────────────────────────────────┤
│  schede delle idee, ricerca        │
│  (⋮ su ogni scheda)           [+]  │
├────────────────────────────────────┤
│ Home   Ideare  Sviluppare  Pubbl.  │  ← barra in basso
└────────────────────────────────────┘
```

### Accesso e impostazioni [Luca: password, codice di recupero, backup cifrato; schermate Mia scelta]
- **Primo avvio.** Crea la password (scritta due volte) → l'app mostra il **codice di recupero** una sola volta e chiede di confermare che l'ha salvato → entra. Nessun nome utente e nessuna email: una sola persona, una sola password.
- **Avvii successivi.** Schermata di sblocco con la password. L'app si blocca da sola quando va in secondo piano **[Mia scelta]**.
- **Impostazioni** (dal menu ⋮ della barra in alto, vedi «Menu e navigazione») **[Mia scelta]**: cambia password; ripristina l'accesso con il codice di recupero; esporta e importa il backup cifrato; spazio usato; sblocco con impronta, se il test sul Samsung lo permette **[Da provare]**.
- **Testo accanto al codice [Mia scelta]:** invitare a scriverlo su carta e non a farne uno screenshot, che finirebbe in chiaro nella galleria.

### Guida in spagnolo, dentro l'app [Luca: guida completa, in spagnolo, dentro l'app, alla fine; dettagli Mia scelta]
- **Che cos'è [Luca].** Una pagina dell'app con la guida completa su come usarla, in spagnolo. Si legge senza rete. Non è un PDF.
- **Quando [Luca: «alla fine»; posizione Mia scelta, da confermare].** Si scrive quando le funzioni sono definitive: dopo T18 e dopo le correzioni dalle note di lei, e prima della prova finale sul Samsung (G4) e della 1.0.0, così la 1.0.0 la contiene.
- **Come si apre [Mia scelta].** Voce «Guida» nel menu ⋮, tra Impostazioni e Informazioni (sempre un solo livello); porta a una pagina `guida`. La barra in basso resta a 4 icone. Non compare nel primo avvio, per non interrompere la creazione della password e il codice di recupero.
- **Com'è fatta [Mia scelta].** Sommario e sezioni che si aprono e si chiudono, solo testo, senza immagini nella prima versione (le schermate si possono aggiungere dopo, se Luca le vuole). Sezioni proposte: installare l'app; primo avvio (password e codice di recupero); blocco e sblocco; lingua; Dashboard; Ideare; Sviluppare (template, storico e guida di stile, hook e caption, copiare, condividere e ZIP); Pubblicazioni salvate (salvataggio veloce, storico, avviso di somiglianza, registro delle ripetizioni); backup; Impostazioni; sicurezza e privacy (che cosa è cifrato e che cosa no, sezione 7); problemi frequenti. L'elenco definitivo segue le funzioni finali.
- **Lingua [Luca: spagnolo].** Il testo della guida è solo in spagnolo; una versione italiana non è richiesta **[Da decidere con Luca]**. Con l'interfaccia in italiano la guida resta in spagnolo. Il testo sta in un file a parte di `js/i18n/`, fuori da `es.js` e `it.js`, perché il test «es and it have the same keys» (`tests/i18n.test.js`) chiede le stesse chiavi nei due elenchi. Il titolo della pagina e la voce di menu stanno invece in `es.js` e `it.js`, come tutti i testi dell'interfaccia.
- **Testo sempre vero [Mia scelta].** Ogni frase descrive l'app com'è, non come sarà. Le etichette dell'app che la guida cita (bottoni, voci di menu) non si riscrivono a mano: si prendono da `es.js` e un test controlla che esistano. Per ciò che sta fuori dall'app (le voci di Chrome per installarla, il selettore della galleria, la condivisione di sistema) si scrive solo ciò che la sezione 9 ha provato; le frasi da controllare sul telefono si elencano in `STATUS.md` per la prova finale (G4) **[Da provare]**.
- **Revisione [Mia scelta].** La scrive Claude, come gli altri testi in spagnolo; la rivede lei, madrelingua, con un elenco dei testi della guida come `docs/i18n-review-es.md` (file `docs/guia-review-es.md`). Luca controlla le istruzioni sul telefono in G4.

## 6. Esportazione e condivisione [Luca: singola e raggruppata]

| Cosa | Come |
|---|---|
| Solo testo del prompt | **Copia** negli appunti, oppure **Condividi** testo |
| Un singolo file (foto, video, testo) | **Condividi** con la condivisione di sistema |
| Più file insieme ("cartella") | **Condividi tutto**: prompt + foto/video in un'unica condivisione. Se l'app di IA riceve testo e file insieme: dopo la condivisione di 3 file con testo, in ChatGPT e in Gemini sono arrivati i 3 file (riferito da Luca in chat, non nel testo grezzo); se il testo sia arrivato insieme ai file non è detto **[Da provare]** |
| ZIP | **Crea ZIP**: cartella con `prompt.txt` e i media, salvata nel telefono; poi si allega a mano nell'app di IA |

Note:
- "Cartella" è interpretato come **gruppo di file** condivisi insieme; la condivisione di sistema lavora con un elenco di file. **[Mia scelta, confermata da Luca]**
- Foto e video sono già in formati compressi: lo ZIP serve a impacchettare. Spazio misurato sul Samsung con `ZipPassThrough` (dati senza compressione) su 3 video: ingresso 167.172.900 byte, ZIP 167.173.282 byte, cioè 382 byte in più (circa 0,0002%; differenza calcolata dai due valori del testo grezzo): per questi 3 video lo ZIP non ha fatto risparmiare spazio. Non misurato: lo spazio con foto o con compressione (`ZipDeflate`) **[Da provare]**. Con video lunghi la creazione dello ZIP deve reggere sul telefono (creazione a flusso). Provato sul Samsung (testo grezzo `docs/test-samsung-raw.txt`): 3 video (159,4 MB in ingresso; «MB» = MiB, vedi la nota nell'introduzione del blocco «Esiti», sezione 9) in uno ZIP a flusso (`ZipPassThrough`) in 592,6 ms, con heap JS 168,8 MB. Video più lunghi non provati **[Da provare]**.
- Nessuna app di IA è confermata per gli ZIP: per ChatGPT le fonti sono discordanti; l'elenco ufficiale dei documenti di Claude non li include **[Verificato]**.
- Destinazione del prompt **[Luca]**: ChatGPT (la suggerisce Luca perché più performante; non verificato) e Gemini, che lei usa entrambe. La v1 funziona con tutte e due, con copia, condivisione o ZIP.
- Tutto ciò che esce dall'app (testo copiato, file condivisi, ZIP salvato nel telefono) esce **in chiaro**: la cifratura protegge i dati dentro l'app, non le copie che lei decide di portare fuori.

## 7. Dati, offline e sicurezza

- **Archivio:** tutto nel telefono, in IndexedDB (testi e file). Service worker per l'uso offline. Nessun server e nessun account cloud: l'accesso è un blocco locale (qui sotto).
- **Entità [Mia scelta]:** Idea, Media, Template, PromptGenerato, Pubblicazione, Ripetizione. Ogni record ha un identificativo univoco e data di modifica, così una futura sincronizzazione non richiede di rifare i dati.
- **Storage persistente:** richiederlo all'installazione e mostrare lo spazio usato, avvisando quando è quasi pieno **[Mia scelta]**.
- **Sicurezza e privacy [Luca: scopo e principio; schema Mia scelta].**
  - **Scopo:** solo sicurezza e privacy. Niente email, niente mail di conferma, niente account cloud.
  - **Password:** una sola, senza nome utente. Dalla password si ricava (PBKDF2) la chiave che cifra i dati (AES-GCM). Ripetizioni: almeno 600.000 con SHA-256, come indica OWASP; la derivazione della chiave a 600.000 ripetizioni è stata misurata sul Samsung SM-S936B: 78 ms (testo grezzo `docs/test-samsung-raw.txt`).
  - **Schema suggerito [Mia scelta]:** una chiave dei dati casuale, custodita due volte, una cifrata con la password e una con il codice di recupero. Così password e codice aprono entrambi i dati, e cambiare password non obbliga a ricifrare tutto. Il costruttore può scegliere uno schema equivalente.
  - **Codice di recupero [Luca]:** mostrato una sola volta alla creazione.
  - **Password dimenticata e codice perso, senza backup: i dati sono persi [Luca: accettato].** Il recupero via mail non è compatibile con la cifratura (ragionamento di Claude).
  - **Cosa si cifra:** testi, template, prompt e pubblicazioni, sicuramente. Foto e video: l'intenzione è cifrare anche quelli. Misurato sul Samsung SM-S936B: AES-GCM su un video da 42,0 MB, cifra 60 ms, legge 48 ms, contenuto identico (la prova cifra i byte in memoria, senza la busta in base64 dell'app). Non provati: i video più grandi e il percorso dell'app con la busta in base64 (prova finale G4) **[Da provare]**. Se è troppo pesante, decide Luca (per esempio cifrare solo i file sotto una certa dimensione, dichiarandolo).
  - **Cosa NON è protetto:** le foto e i video originali nella galleria del telefono; tutto ciò che lei condivide o esporta (sezione 6); una password debole (l'app deve mostrare quanto è robusta).
  - **Impronta o volto:** solo come comodità opzionale; la password resta la chiave principale **[Da provare]**.
  - La sicurezza si regge sulla password, non sul segreto del codice: un repo pubblico non è un problema.
- **Backup cifrato [Luca: cifrato; formato Mia scelta, importante]:** i dati vivono solo nel telefono, quindi servono **Esporta backup** e **Importa backup**. Il file è cifrato e si apre con la password o con il codice di recupero; serve anche per passare a un nuovo telefono. Viene salvato nel telefono e non condiviso, perché la condivisione di sistema non ammette JSON né ZIP. Il backup include anche foto e video, con avviso sulla dimensione **[Mia scelta, da misurare]**.
- **Segreti:** nessuna chiave nel codice. In v1 non servono.
- **Repo e hosting [Mia scelta]:** Luca crea il repo quando il piano è pronto; questo documento va committato in `docs/superpowers/specs/`. Repo **pubblico [Luca]**: in v1 il codice non contiene nulla di sensibile e i dati di lei restano cifrati nel suo telefono. Licenza del repo: open source, da scegliere (sezione 11) **[Luca]**.

## 8. Design [Luca: immagine di riferimento]

**Riferimento.** Il poster "Dashboard Visualization" (IMG_5675.jpeg), confermato da Luca il 16 novembre 2026 come unico riferimento.

**Chi lo cura.** Claude **[Luca: «Ti occupi tu?»]**. Dopo l'approvazione del documento, dentro il piano: sistema di stile (colori, caratteri, schede, grafici), bozze delle pagine 0-3 e delle schermate di accesso, controllo di contrasto e accessibilità, testi dell'interfaccia in spagnolo e in italiano (nelle bozze i pulsanti devono reggere testi di lunghezza diversa). Strumenti: le competenze di design disponibili in questa sessione; Figma e Canva risultano collegati ma non sono stati provati; Stitch non è disponibile in questa sessione **[Da provare]**.

Colori **misurati** sull'immagine (medie dei pixel, da affinare):
- **Sfondo:** `#000104`, `#02061a`, `#080921`, `#081937` (blu notte quasi nero).
- **Ciano-azzurro:** `#26a4c5`, `#2381ac`.
- **Magenta-viola:** `#b458bc`, `#ad429e`.
- **Blu-viola:** `#495ec6`, `#613bab`.
- **A occhio, non misurati:** arancio/oro, rosso corallo, verde (schede piccole).

Stile: schede di vetro scuro con bordo neon sottile e angoli arrotondati; titoli grandi in bianco con parola in sfumatura viola; titoli di sezione in ciano; grafici ad area e a barre con sfumature ciano→viola→rosa; ciambelle e indicatori circolari.

**Logo [Luca: file «cuffia_03_oro.png»; in alto a sinistra e come icona dell'app].** Misurato sul file: PNG 2048×2048, senza trasparenza, sfondo crema non uniforme (pixel in 20,20 `#fbf6ef`, angolo in 0,0 `#fef8ef`; la tela delle icone usa `#fdf6ef`); oro `#e9c16a`-`#f0c770`; nero `#141313`; pallino rosa `#ea9cad`; pallino verde `#1f6447`. Margini del disegno: sinistra 23,7%, alto 7,8%, destra 23,8%, basso 15,5%.
- **Sul fondo scuro del poster.** Il nero del logo ha un rapporto di contrasto di 1,06-1,13 con i quattro fondi del poster (calcolo WCAG su valori misurati): sparisce. L'oro (10-12) e il crema (16-19) si leggono. Proposta **[Mia scelta]**: il logo sta su una tessera crema con angoli arrotondati nella barra in alto, senza toccare il disegno; la variante per fondo scuro la decide Luca, perché il logo è suo.
- **Icona dell'app [Verificato in parte].** web.dev (Google) indica 512×512 come dimensione da scegliere se se ne sceglie una sola e consiglia anche 192×192; che Chrome richieda 192×192 e 512×512 per l'installazione è riportato da siti terzi, da confermare nel test. Per l'icona «maskable» (`"purpose": "any maskable"`) web.dev indica il disegno dentro un cerchio centrale di raggio pari al 40% della larghezza.
- **Il file com'è non entra nel cerchio [misurato].** Il punto più lontano dal centro è al 42,3% della larghezza (in alto il disegno è troppo vicino al bordo). Se il disegno è centrato sul proprio riquadro scende al 39,7%, cioè appena dentro: proposta **[Mia scelta]** di spostarlo verso il basso e ridurlo a circa il 90% per avere margine. Lo sfondo crema pieno riempie tutto il quadrato. Le tre icone (192, 512, maskable 512) si ricavano dal file nel piano; per ora non è stato creato nessun file.
- **«Insieme alle versioni» [Luca: numero di versione dell'app].** Il numero di versione sta accanto al logo, in alto a sinistra; le bandierine delle lingue stanno in alto a destra **[Luca]**. Il numero cambia a ogni rilascio e serve anche a riconoscere quale versione è installata.

Note:
- L'immagine è un poster 1200×1800, non una schermata da telefono: l'adattamento a **una colonna** è una **[Mia scelta]**.
- Verificare il contrasto del testo chiaro sullo sfondo scuro **[Mia scelta]**.
- Le due bandierine (spagnolo, italiano) vanno disegnate nello stile del poster, nella barra in alto, con la lingua attiva evidenziata **[Mia scelta]**.
- Libreria dei grafici e libreria ZIP incluse nel codice, senza CDN, perché l'app è offline.

## 9. Test iniziale sul Samsung (primo passo del piano)

Un mini-prototipo usa-e-getta per decidere tra A e B con dati alla mano:
1. Installazione dell'app dalla schermata Home e avvio senza rete.
2. Selettore galleria: foto e video, selezione di più file, versione di Android.
3. Condivisione di più file e testo verso ChatGPT e Gemini, le app usate davvero: arrivano insieme? Quanti file accettano per messaggio? Lo ZIP viene accettato?
4. Creazione di uno ZIP con video reali: tempo, memoria, dimensione finale.
5. Spazio dati: quanto si può salvare e se lo storage persistente viene concesso.
6. Cifratura: tempo dello sblocco con 600.000 ripetizioni PBKDF2; cifratura e lettura di un video grande (tempo, memoria); dimensione e tempo di un backup completo.
7. Impronta o volto: se lo sblocco con PRF funziona sul Samsung.
8. Somiglianza: velocità del controllo per parole di un nuovo testo contro tutto lo storico e del caricamento dello storico iniziale, dove ogni post viene confrontato con i precedenti (i confronti crescono col quadrato dei post: 1.225 in tutto con 50 post, 44.850 con 300), su qualche centinaio di post; qualità degli avvisi sui suoi 50 post veri; se si vuole il controllo per significato, tempo di caricamento e velocità del modello sul Samsung e resa sui suoi testi in spagnolo e in italiano. OCR: resa su uno screenshot vero. Vocabolario: caricamento e velocità dei thesauri (spagnolo e italiano) e quanti avvisi giusti e sbagliati producono sui suoi post, con e senza radice delle parole; se i dati contengono i contrari.
9. Icona e barra in alto: l'icona installata (con la forma scelta dal telefono, con il logo non tagliato) e il menu ⋮ si vedono e si toccano bene sul Samsung **[Mia scelta]**.

**Esiti del test (testo grezzo incollato il 16 novembre 2026).** I dati vengono dal testo grezzo di «Copia risultati» che Luca ha incollato il 16 novembre 2026, salvato in `docs/test-samsung-raw.txt`; fanno eccezione due frasi di Luca dalla chat, che nel testo grezzo non ci sono: ChatGPT e Gemini hanno caricato entrambe i 3 file scelti (punto 3, marcata «(chat)»); il logo va bene, non tagliato (punto 9). Nessun esito è stato verificato dalla sessione di sviluppo, che non ha un telefono Android. Telefono: Samsung SM-S936B (il nome Galaxy S25+, Europa/Internazionale è l'abbinamento riferito da Claude, non è nel testo grezzo), Android 17 (da UA-CH; lo user agent dice «Android 10»), Chrome 157.0.8103.51, schermo 384×832 a 2,8125; app installata e aperta in modalità standalone. Le cifre in «MB» del testo grezzo e dei punti 4, 5 e 6 sono MiB (1 MiB = 1.048.576 byte; `mb()`, riga 10 di `spike/spike.js`; lo scrive già `docs/test-samsung-results.md`, riga 12): per esempio 167.172.900 byte sono 159,4 MB, non 167,2 MB. Tabella e dettagli: `docs/test-samsung-results.md`.
1. **Installazione e offline.** Installazione OK, service worker attivo, 11 file in cache. Avvio senza rete (modalità aereo): non provato.
2. **Selettore galleria.** OK: selezione multipla di 3 file (il log dice video mp4), su Android 17.
3. **Condivisione.** `canShare` dice sì per testo con immagine e per uno ZIP. Le 7 condivisioni vere, nell'ordine del testo grezzo: (1) testo+immagine: annullato; (2-4) testo+immagine: condiviso (o chiuso dopo la scelta dell'app); (5) ZIP: errore `NotAllowedError`, «Permission denied»; (6-7) 3 file scelti+testo: condiviso (o chiuso dopo la scelta dell'app). «Condiviso (o chiuso dopo la scelta dell'app)» vuol dire solo che la promessa di `navigator.share` si è risolta: non prova che l'app di destinazione abbia ricevuto il contenuto. (chat) ChatGPT e Gemini hanno caricato entrambe i 3 file scelti; quale condivisione sia andata a quale app non è verificato. Se il testo «Prova NAY» sia arrivato insieme ai file: non detto. Il numero massimo di file per messaggio non è nei dati. Allegare a mano uno ZIP salvato: non provato.
4. **ZIP con video reali.** OK: 3 file (i video scelti) in ZIP a flusso (`ZipPassThrough`): ingresso 159,4 MB (167.172.900 byte), ZIP 159,4 MB (167.173.282 byte), in 592,6 ms; heap JS 168,8 MB (valore indicativo di `performance.memory`). «MB» della prova = 1.048.576 byte. La prova teneva tutto in memoria.
5. **Spazio dati.** OK: usati 0,5 MB su 10.240,5 MB (0,01%); `persisted()` prima=true, `persist()` ha risposto=true, `persisted()` dopo=true.
6. **Cifratura.** OK: PBKDF2 a 600.000 ripetizioni in 78 ms; AES-GCM su un video da 42 MB: cifra in 60 ms, legge in 48 ms, contenuto identico. Memoria: la riga `crypto` del testo grezzo riporta heap JS 168,8 MB (valore indicativo di `performance.memory`), identico a quello della riga `zip`; non è noto se misuri la sola cifratura. Il picco di memoria della cifratura non è stato misurato. Dimensione e tempo di un backup completo: la prova non li misura.
7. **Impronta o volto.** `PublicKeyCredential` presente, autenticatore di piattaforma disponibile. PRF: non provato, quindi lo sblocco con impronta resta fuori.
8. **Somiglianza.** OK su testi inventati in spagnolo, con radice delle parole, non sui 50 post veri; «OK» vuol dire solo che il controllo è girato. Tre tempi per 50, 300 e 1000 testi. «tokenizza+confronta» (trasformare in parole un testo nuovo e tutti i testi e confrontare il nuovo con ciascuno): 0,5 ms, 2,2 ms, 6,7 ms. «solo confronto» (lo stesso confronto sui testi già trasformati in parole): 0,00 ms, 0,10 ms, 0,60 ms. «ogni testo contro i precedenti» (tutte le coppie tra testi già trasformati in parole: 1225, 44850 e 499500 coppie): 0 ms, 8 ms, 74 ms. Qualità degli avvisi sui 50 post veri: non misurata. Controllo per significato, OCR e vocabolario: non fanno parte della prova, non provati.
9. **Icona e barra in alto.** (chat) Luca dice che il logo va bene (non tagliato). Il menu ⋮ non fa parte della prova: non provato.

Se i punti 3 e 4 non danno un flusso accettabile, si valuta B (Capacitor). Se il punto 6 mostra che cifrare i video è troppo pesante, decide Luca (sezione 7).

## 10. Scelte mie (riepilogo)

Le prime 26 sono **confermate da Luca** («vanno bene»). Le 27-32 sono approvate con il documento («APPROVATO»); la 30 (barra in basso) è confermata anche da «3- si».

1. Idea → prompt → post collegati, con stato dell'idea.
2. Campi della pubblicazione: screenshot, titolo, descrizione, tipo, lingua, data/ora, visualizzazioni e commenti (facoltativi), nota, idea collegata.
3. Statistiche della Dashboard come in sezione 5.
4. "Cartella" = gruppo di file condivisi insieme.
5. Backup: esporta e importa, cifrato, con foto e video.
6. Segnaposto dei template e modulo tono/obiettivo/lunghezza.
7. Interfaccia a una colonna, tasto Dashboard in ogni pagina.
8. Codice in JavaScript puro, file statici, senza passaggio di build (semplice per Claude Code e GitHub Pages).
9. Una sola password, senza nome utente.
10. Schema delle chiavi: chiave dei dati custodita con password e con codice di recupero.
11. Blocco automatico quando l'app va in secondo piano.
12. Schermata Impostazioni (cambia password, ripristino con codice, backup, spazio usato).
13. Testo che invita a scrivere il codice su carta.
14. Un'idea può avere testo, media o entrambi.
15. Quarto template pronto: frase → idee per foto o video.
16. `{storico}` e `{stile}` nei prompt; guida di stile scritta dall'IA e salvata nell'app.
17. Salvataggio veloce dei post: screenshot, titolo, descrizione; numeri facoltativi.
18. Controllo di somiglianza per parole nella v1, con radice delle parole; sinonimi, significato e OCR si decidono dopo il test.
19. Registro delle ripetizioni come scheda in Pubblicazioni salvate, con stato per voce (da valutare, confermata, falso allarme) e ricerca per date.
20. Il registro si riempie da solo quando lei salva un'idea, un prompt o un post (nessun tasto «Salva nel registro»); «Controlla tutto lo storico» è tolto dalla v1.
21. Scheda in Dashboard con le ripetizioni da valutare.
22. Ogni idea, prompt e post ha una lingua (spagnolo o italiano, predefinito spagnolo); l'avviso confronta testi della stessa lingua.
23. Template pronti in spagnolo e in italiano, con `{lingua}` nel prompt.
24. Testi in spagnolo scritti da Claude e rivisti da lei; testi in italiano rivisti da Luca.
25. Vocabolario di sinonimi: prova nel test, prima in spagnolo; i contrari dopo il test.
26. Bandierine come immagini nella barra in alto e nella schermata di sblocco, con sigla ES e IT; la lingua si salva in chiaro nel telefono.
27. Menu: i comandi stanno dove servono; tasto «Salva» in ogni modulo; niente «Chiudi app», c'è «Blocca ora».
28. Barra in alto in ogni pagina: logo con il numero di versione accanto (tocco = Dashboard), titolo, a destra bandierine ES e IT e menu ⋮ con Blocca ora, Esporta backup, Importa backup, Impostazioni, Informazioni (un solo livello).
29. Menu ⋮ su ogni scheda (Modifica, Duplica, Elimina; sui prompt anche Copia e Condividi); [+] come azione principale; in Sviluppare, riga fissa con Copia, Condividi, Crea ZIP.
30. Barra di navigazione in basso con 4 icone (Dashboard, Ideare, Sviluppare, Pubblicazioni): confermata da Luca.
31. Template pronti con hook e caption come due risposte separate, ciascuna con più varianti (è dove lei perde tempo).
32. Logo su tessera crema nella barra in alto; icone 192, 512 e maskable ricavate dal file, con il disegno centrato e ridotto a circa il 90%.
33. Voce «Guida» nel menu ⋮, tra Impostazioni e Informazioni; la pagina non compare nel primo avvio; barra in basso invariata. **[Mia scelta, da confermare]**
34. Guida solo in spagnolo, in un file a parte di `js/i18n/`; con l'interfaccia in italiano resta in spagnolo. **[Mia scelta, da confermare]**
35. Guida solo testo, a sezioni che si aprono e si chiudono, senza immagini nella prima versione. **[Mia scelta, da confermare]**
36. Guida scritta dopo che le funzioni sono definitive e prima di G4 e della 1.0.0; etichette citate prese da `es.js`. **[Mia scelta, da confermare]**

Le 33-36 sono nuove (18 novembre 2026) e da confermare da Luca.

## 11. Aperto e lasciato al costruttore

**Aperto (serve Luca)**
1. **Licenza del repo:** si sceglie dopo il test **[Luca: «4- ok»]**. Dipende dai dati del vocabolario inclusi: GPL e AGPL pongono condizioni a chi ridistribuisce; per i dati da Wiktionary (indicati CC BY-SA 4.0) va riverificato. Claude non è un avvocato **[Da verificare]**.
2. **Piano ChatGPT a pagamento:** i limiti di caricamento dei file di quel piano non sono verificati; da controllare quando lei sceglie il piano. La cifra di 22 euro al mese è detta da Luca e non verificata.
3. **Guida in spagnolo:** (a) serve anche una versione italiana? (b) solo testo o anche schermate? (c) la guida si apre dal menu ⋮, che si vede solo dopo lo sblocco (le voci del menu e il montaggio della barra in alto stanno in `js/main.js`, in `menuItems()` e `renderChrome()`; `renderTopbar` e `openMenu` sono definiti in `js/ui/topbar.js` e `js/ui/menu.js`; la schermata di accesso, `js/ui/screens/lock.js`, usa solo le bandierine, `renderLangFlags` di `js/ui/topbar.js`): chi ha dimenticato la password non può aprirla dalla schermata di accesso, ma solo dopo lo sblocco (per esempio con il codice di recupero). Serve un rimando anche nella schermata di accesso? **[Da decidere con Luca]**

**Risolto (risposte di Luca):**
- Lo storico conta circa 50 post e cresce di 4-5 a settimana; per questo il prompt prende gli ultimi più i più simili e il numero è un parametro.
- Ogni post è in una sola lingua: niente collegamenti tra traduzioni e niente confronti tra spagnolo e italiano («posta solo in una lingua»).
- La bandierina cambia solo l'interfaccia; la lingua dell'idea o del post si sceglie a parte, con spagnolo predefinito («1-ok»).
- I circa 50 post già pubblicati sono in spagnolo.
- Si usa una licenza open source: i dati del vocabolario devono averne una («usiamo una licenza open source»).
- ChatGPT oggi è gratuito; lei vuole un upgrade base (22 euro al mese, cifra di Luca).
- Perde tempo a modificare le foto e a inserire caption o hook.
- Telefono per il test: Samsung SM-S936B (Galaxy S25+, codice Europa/Internazionale), Android 17, letto da Chrome 157 e prova eseguita da Luca il 16 novembre 2026.
- Repo pubblico.
- NAY è un logo, file «cuffia_03_oro.png»: in alto a sinistra e come icona dell'app.
- Le 26 scelte della sezione 10: confermate («vanno bene»).
- Il numero di versione dell'app sta accanto al logo; le bandierine stanno in alto a destra («1- numero versione app»).
- Le modifiche alle foto servono a pubblicare: lei mette hook o caption sulla foto con un editor di foto o con un'IA; la v1 non le copre.
- Barra di navigazione in basso: sì («3- si»).
- Licenza del repo: dopo il test («4- ok»).
- Documento approvato («APPROVATO», 16 novembre 2026).
- Guida: in spagnolo, dentro l'app, alla fine («Completa»; «preferisco una guida all'interno dell'app»).

**Lasciato al costruttore:** testo iniziale dei 3 template (da far approvare nel test), icone, scelta delle librerie (grafici, ZIP, cifratura, radice delle parole), formato dei dati del vocabolario, nomi dei file, formato del file di backup, lunghezza minima della password e indicatore di robustezza, attesa del blocco automatico, testi delle schermate di accesso, animazioni, affinamento della palette.

## 12. Dopo la v1 (fuori ambito, per orientarsi)

- **iPhone:** una web app aggiunta alla Home di Safari su iPhone ha un contenitore dati separato da Safari e, raggiunta la quota, sembra non esserci modo di chiedere altro spazio **[Verificato]**.
- **Desktop:** stessa web app; serve la sincronizzazione con il telefono.
- **Account cloud (solo se servirà la sincronizzazione):** Firebase Authentication invia l'email di verifica con `sendEmailVerification` e controlla `emailVerified`; la sessione resta in IndexedDB; il piano gratuito non richiede metodo di pagamento. Supabase, con il servizio mail incluso, invia solo 2 email all'ora per l'intero progetto **[Verificato]**. Idea: i dati dovrebbero partire già cifrati dal telefono **[Mia scelta, da valutare]**.
- **Importazione da Facebook:** serve un'app Meta e un token. Dal 15 novembre 2025 la metrica "impressions" non esiste più e al suo posto c'è "Views" **[Verificato]**.
- **API OpenAI:** accetta immagini PNG, JPEG, WEBP e GIF non animate; per i video non c'è conferma ufficiale **[Verificato]**.
- **Hook e caption sopra la foto, dentro l'app [Luca: oggi lei lo fa con un editor di foto o con un'IA].** Fuori dalla v1. Si valuta dopo la v1 se serve un editor semplice nell'app; fattibilità e resa non verificate **[Da verificare]**.

## Fonti

- [Web Share API (web.dev)](https://web.dev/articles/web-share) · [Capabilities (web.dev)](https://web.dev/web-share)
- [Permission denied su tipo non ammesso](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/70243790/web-share-api-permission-denied-on-certain-file-type)
- [Clipboard.writeText](https://docs.w3cub.com/dom/clipboard/writetext)
- [Capturing an image from the user (web.dev)](https://web.dev/capturing-images) · [Android 14 e 15 (Addpipe)](https://blog.addpipe.com/html-file-input-accept-video-camera-option-is-missing-android-14-15/)
- [Offline data (web.dev)](https://web.dev/learn/pwa/offline-data) · [Storage for the web (web.dev)](https://web.dev/storage-for-the-web)
- [Upload files to Claude](https://support.claude.com/en/articles/8241126-upload-files-to-claude.md) · [ChatGPT e zip (OpenAI community)](https://community.openai.com/t/i-can-not-upload-any-zip-files-to-my-chatgpt4/1026855)
- [Capacitor Share](https://npmjs.com/package/@capacitor/share) · [Capacitor docs](https://capacitorjs.com/docs)
- [Page Insights API Updates (Meta)](https://developers.facebook.com/blog/post/2025/08/15/page-insights-api-updates/)
- [Images and vision (OpenAI)](https://developers.openai.com/api/docs/guides/images-vision.md)
- [MDN: SubtleCrypto.deriveKey](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/deriveKey) · [MDN (copia): contesto sicuro](https://msdn.microsoft.com/library/dn302327(v=vs.85))
- [PBKDF2 e indicazioni OWASP (Wikipedia)](https://www.Wikipedia.com/wiki/PBKDF2)
- [Passkey in una web app installata (Progressier)](https://progressier.com/pwa-capabilities/biometric-authentication-with-passkeys) · [Passkey su Android e Chrome](https://android-developers.googleblog.com/2022/10/bringing-passkeys-to-android-and-chrome.html?hl=tr)
- [Passkey PRF (Corbado)](https://www.corbado.com/blog/passkeys-prf-webauthn) · [Chromium blink-dev: PRF](https://groups.google.com/a/chromium.org/g/blink-dev/c/iTNOgLwD2bI/m/Oz1C7oEYAgAJ) · [Avviso sulla PRF per cifrare dati](https://lilting.ch/en/articles/passkeys-prf-extension-encryption-risk)
- [Firebase: verifica email](https://www.rapidevelopers.com/md/firebase-tutorial/how-to-enable-email-verification-in-firebase) · [Firebase: persistenza](https://www.rapidevelopers.com/md/firebase-tutorial/how-to-fix-firebase-auth-session-persistence-issue) · [Firebase: prezzi](https://firebase.google.com/pricing/?hl=fr)
- [Supabase: test dei flussi di autenticazione](https://supabase.com/docs/guides/auth/testing-auth-flows.md)
- [Transformers.js nel browser](https://starlog.pages.dev/articles/developer-tools/huggingface-transformers-js) · [multilingual-e5-small (Hugging Face)](https://huggingface.co/Xenova/multilingual-e5-small) · [Modelli multilingue per Transformers.js](https://glama.ai/mcp/servers/@okets/folder-mcp/blob/d01bb52143b8721e59eae8d588a80c2dd8391cc9/docs/features/embedding-models-research.md) · [Dimensioni dei modelli](https://www.pkgstats.com/pkg:@delali/narsil-embeddings-transformers) · [Versione compressa di e5-small](https://huggingface.co/memo-team/e5-small-koenhanja-fp16)
- [Tesseract.js: installazione locale](https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/docs/local-installation.md) · [Tesseract.js: cache dei dati](https://docsearch.algolia.com/mcp/docs/repo/naptha/tesseract.js) · [Guida OCR offline](https://github-users.yhajoa.workers.dev/Rayyan9477/ocr-app/blob/recovered-changes/OCR_SETUP_GUIDE.md)
- [OpenAI: caricamento file](https://help.openai.com/sr-rs/articles/8555545-file-uploads-faq) · [OpenAI: limiti di file e immagini](https://help.openai.com/en/articles/8555545-file-uploads-faq-for-chatgpt) · [Gemini: caricare file (Google)](https://support.google.com/gemini/answer/14903178) · [Gemini: copia universitaria](https://services.newschool.edu/TDClient/32/Portal/KB/ArticleDet?ID=1366) · [Limite file ChatGPT (sito terzo)](https://fast.io/resources/gemini-attachment-limit/)
- [Thesaurus italiano di LibreOffice](https://extensions.libreoffice.org/extensions/italian-dictionary-thesaurus-hyphenation-patterns) · [README del thesaurus italiano](https://sunsite.icm.edu.pl/Linux/OpenOffice/official/contrib/dictionaries/README_th_it_IT.txt) · [File di copyright del thesaurus italiano](https://git.stg.centos.org/source-git/mythes-it/blob/3418fd707fedee1dbffb092d0b1e7caa9fef3f08/f/th_it_IT_copyright_licenza.txt) · [Pacchetto Gentoo (licenza)](https://gpo.zugaina.org/AJAX/Ebuild/53830851) · [Pacchetto Debian mythes-it (dimensione)](https://www.apt-browse.org/browse/debian/stretch/main/all/mythes-it)
- [Thesaurus spagnolo (FreshPorts)](https://www.freshports.org/textproc/es-mythes) · [Pacchetto Ubuntu mythes-es (dimensione)](https://blueprints.launchpad.net/ubuntu/cosmic/i386/mythes-es/1:6.0.3-3)
- [Open Multilingual Wordnet e licenze (Bond e Foster, 2013)](https://preview.aclanthology.org/fix_video/P13-1133.pdf) · [Wiktextract (dati da Wiktionary)](https://www.github.com/tatuylonen/wiktextract) · [Dizionario italiano da Wiktionary, CC BY-SA 4.0](https://huggingface.co/datasets/mik3ml/italian-dictionary/blob/main/README.md) · [Wiktionary spagnolo, CC BY-SA 4.0](https://huggingface.co/datasets/carloscapote/es.wiktionary.org/blob/main/README.md?code=true)
- [Snowball in JavaScript (npm snowball-stem)](https://npmjs.com/package/snowball-stem) · [Snowball per Deno: elenco delle lingue](https://deno.land/x/snowball)
- [Material: bottom navigation](https://material.io/components/bottom-navigation) · [Android: layout e schemi di navigazione](https://developer.android.google.cn/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns?hl=en)
- [Material: menu (copia delle linee guida)](https://www.mdui.org/en/design/1/components/menus.html) · [Material: top app bar](https://material.io/components/app-bars-top)
- [web.dev: web app manifest e icone](https://web.dev/learn/pwa/web-app-manifest) · [Requisiti di installabilità e area sicura (frontendchecklist)](https://frontendchecklist.io/rules/html/pwa-installability) · [Checklist icone PWA (DEV)](https://dev.to/roboticela/pwa-icons-the-web-developers-definitive-checklist-15nn)

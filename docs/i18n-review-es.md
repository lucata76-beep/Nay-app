# Revisione dei testi in spagnolo

*Task T19, passo 1. Copia fedele di `js/i18n/es.js` e di `js/features/templates.js` come stanno su `main` al commit `790b6cf`. Nessun testo è stato corretto, tradotto o «migliorato»: la revisione è di lei. Le correzioni arriveranno in un task a parte, a partire dalle sue note.*

## Come leggere questo elenco

Questo file elenca ogni testo in spagnolo che l'app mostra sullo schermo o prepara per l'IA, così che lei, madrelingua, possa rivederlo. Non serve conoscere il codice.

- **Chiave:** il nome interno del testo (per esempio `lock.title`). Serve solo a ritrovarlo: non va cambiata né tradotta.
- **Testo in spagnolo:** il testo com'è oggi.
- **Nota di lei:** lo spazio per le sue note. È vuoto.
- **Le parti tra graffe**, come `{n}` o `{lang}`, sono dati che l'app inserisce da sola (un numero, un nome, una data...). Si lasciano come sono; si può correggere il testo intorno.
- Lo stesso testo compare a volte in più voci (per esempio «Foto»): sono voci diverse perché stanno in posti diversi dell'app. L'appendice in fondo le elenca, per correggerle in modo coerente.
- Alcune etichette non si vedono sullo schermo: servono ai lettori di schermo (per esempio per il bottone ⋮). Sono indicate nella riga «Dove compaiono» del loro gruppo.

Il file ha tre parti e un'appendice:

1. **Testi dell'interfaccia:** 330 voci, raggruppate per la prima parte della chiave (`lock`, `menu`, `ideas`...). Ogni gruppo ha una riga su dove compare.
2. **Template pronti (prompt per l'IA):** 15 testi. Non sono testi dell'interfaccia: sono i prompt che l'app prepara e che poi si incollano o si condividono in un'app di IA. Stanno in un altro file del codice (`js/features/templates.js`, non in `js/i18n/`) e per questo sono in una parte a sé.
3. **Altro che lei vede sullo schermo** e che non sta in nessuno dei due elenchi: date, numeri, etichette dei grafici, sigle.
4. **Appendice:** testi uguali in più voci.

## Parte 1 — Testi dell'interfaccia (330 voci)

Fonte: `js/i18n/es.js`. I gruppi seguono la prima parte della chiave; dentro ogni gruppo le voci sono nell'ordine del file.

### `app` (1 voce)

**Dove compaiono.** Il nome dell'app: titolo grande nella schermata di accesso (`js/ui/screens/lock.js`) e riga nella finestra delle informazioni (`js/ui/screens/settings.js`).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `app.name` | NAY-App |  |

### `lock` (26 voci)

**Dove compaiono.** Schermata di accesso (`js/ui/screens/lock.js`): sblocco con la password o con il codice di recupero, creazione della prima password, schermata che mostra il codice di recupero.

- `lock.strength.*` sono le tre parole (debole, media, buona) sotto il campo password, nell'accesso e nella pagina delle impostazioni quando si cambia la password (`js/ui/fields.js`). Nella pagina delle impostazioni compare anche `lock.passwordHint`.
- `lock.loading` si vede anche in `js/main.js`, come schermata d'attesa quando il blocco arriva mentre un'importazione è ancora in corso.
- `lock.showPassword` e `lock.hidePassword` sono etichette del bottone con l'occhio, per i lettori di schermo: non si vedono.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `lock.title` | Introduce tu contraseña |  |
| `lock.passwordLabel` | Contraseña |  |
| `lock.unlock` | Desbloquear |  |
| `lock.useRecovery` | Usar el código de recuperación |  |
| `lock.recoveryLabel` | Código de recuperación |  |
| `lock.createTitle` | Crea tu contraseña |  |
| `lock.passwordConfirmLabel` | Repite la contraseña |  |
| `lock.create` | Crear |  |
| `lock.strength.debole` | Débil |  |
| `lock.strength.media` | Media |  |
| `lock.strength.buona` | Buena |  |
| `lock.recoveryTitle` | Tu código de recuperación |  |
| `lock.recoveryHint` | Escríbelo en papel y guárdalo en un lugar seguro. No hagas una captura de pantalla: quedaría sin protección en la galería. No se volverá a mostrar. |  |
| `lock.recoveryConfirm` | He guardado el código |  |
| `lock.continue` | Continuar |  |
| `lock.createIntro` | Primera vez: crea una contraseña para proteger tus datos. Se guardan cifrados en este teléfono. Si pierdes la contraseña y el código de recuperación, y no tienes una copia de seguridad, no se pueden recuperar. |  |
| `lock.passwordHint` | Mínimo {n} caracteres. |  |
| `lock.unlocking` | Desbloqueando… |  |
| `lock.creating` | Creando… |  |
| `lock.saving` | Guardando… |  |
| `lock.showPassword` | Mostrar contraseña |  |
| `lock.hidePassword` | Ocultar contraseña |  |
| `lock.backToPassword` | Usar la contraseña |  |
| `lock.recoveryUnlockHint` | Escribe el código de recuperación de 32 caracteres. Se admiten minúsculas y espacios. |  |
| `lock.orphanData` | Hay datos cifrados en este teléfono pero falta la configuración de acceso. No se crea una contraseña nueva para no perder esos datos. |  |
| `lock.loading` | Cargando… |  |

### `topbar` (4 voci)

**Dove compaiono.** Barra in alto (`js/ui/topbar.js`).

- `topbar.home`, `topbar.menu` e `topbar.language` sono etichette per i lettori di schermo (logo, bottone ⋮, bandierine): non si vedono.
- `topbar.version` compare solo nella finestra delle informazioni (`js/ui/screens/settings.js`).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `topbar.home` | Ir al inicio |  |
| `topbar.menu` | Menú |  |
| `topbar.version` | Versión {v} |  |
| `topbar.language` | Idioma |  |

### `lang` (2 voci)

**Dove compaiono.** Nomi delle due lingue: nelle tendine della lingua dell'idea, della pubblicazione e del template (`js/ui/screens/ideas.js`, `publications.js`, `develop.js`), nella frase di `develop.template.langHint` (`develop.js`) e come etichetta per i lettori di schermo delle due bandierine in alto (`js/ui/topbar.js`).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `lang.es` | Español |  |
| `lang.it` | Italiano |  |

### `menu` (5 voci)

**Dove compaiono.** Menu ⋮ in alto a destra (`js/main.js`), con cinque voci: blocca ora, esporta copia, importa copia, impostazioni, informazioni.

- `menu.exportBackup`, `menu.importBackup` e `menu.about` compaiono anche come bottoni nella pagina delle impostazioni (`js/ui/screens/settings.js`).
- `menu.about` è anche il titolo della finestra delle informazioni.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `menu.lockNow` | Bloquear ahora |  |
| `menu.exportBackup` | Exportar copia de seguridad |  |
| `menu.importBackup` | Importar copia de seguridad |  |
| `menu.settings` | Ajustes |  |
| `menu.about` | Información |  |

### `nav` (5 voci)

**Dove compaiono.** Barra in basso (`js/ui/bottombar.js`): quattro voci, una per pagina (la pagina delle impostazioni non c'è: si apre dal menu ⋮). `nav.label` è l'etichetta della barra per i lettori di schermo: non si vede.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `nav.dashboard` | Inicio |  |
| `nav.ideare` | Idear |  |
| `nav.sviluppare` | Desarrollar |  |
| `nav.pubblicazioni` | Publicaciones |  |
| `nav.label` | Navegación principal |  |

### `title` (5 voci)

**Dove compaiono.** Titolo della pagina, scritto nella barra in alto (`js/main.js`): uno per ciascuna delle cinque pagine, compresa quella delle impostazioni.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `title.dashboard` | Dashboard |  |
| `title.ideare` | Idear |  |
| `title.sviluppare` | Desarrollar |  |
| `title.pubblicazioni` | Publicaciones guardadas |  |
| `title.impostazioni` | Ajustes |  |

### `common` (14 voci)

**Dove compaiono.** Bottoni e parole comuni a più schermate: finestre di conferma e avvisi (`js/ui/dialog.js`), liste ed editor di Idear, Desarrollar e Publicaciones (`js/ui/screens/ideas.js`, `develop.js`, `publications.js`), pulsante per riprovare all'avvio e nell'accesso (`js/main.js`, `js/ui/screens/lock.js`).

- `common.close` è anche l'etichetta, per i lettori di schermo, del bottone che chiude gli avvisi.
- **Quattro voci non risultano usate in nessun punto del codice attuale:** `common.copy`, `common.share`, `common.add`, `common.search`. Le ho cercate sia come testo esatto sia come chiavi costruite al volo. Finché il codice non le usa, lei non le vede sullo schermo.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `common.save` | Guardar |  |
| `common.cancel` | Cancelar |  |
| `common.delete` | Eliminar |  |
| `common.edit` | Editar |  |
| `common.duplicate` | Duplicar |  |
| `common.copy` | Copiar |  |
| `common.share` | Compartir |  |
| `common.close` | Cerrar |  |
| `common.back` | Volver |  |
| `common.add` | Añadir |  |
| `common.search` | Buscar |  |
| `common.confirm` | Confirmar |  |
| `common.retry` | Reintentar |  |
| `common.saving` | Guardando… |  |

### `error` (10 voci)

**Dove compaiono.** Avvisi di errore, nella schermata in cui succede il problema.

- `error.storageFull`: manca spazio nel telefono (salvataggi in Idear, Desarrollar e Publicaciones, creazione della password, copie di sicurezza, o una pagina che non riesce a leggere i dati).
- `error.wrongSecret`: password o codice di recupero sbagliati (accesso e copie di sicurezza).
- `error.backupCorrupt`, `error.backupVersion`, `error.backupMemory`: problemi con il file della copia di sicurezza (pagina delle impostazioni e importazione dal menu ⋮).
- `error.passwordTooShort`, `error.passwordMismatch`: creazione e cambio della password.
- `error.unexpected`: errore generico, in varie schermate. `error.dataUnreadable`: dati salvati non leggibili (Idear, Desarrollar, Publicaciones, o una pagina che non riesce a leggere i dati). `error.dbUnavailable`: archivio del telefono non apribile (all'avvio e nell'accesso).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `error.storageFull` | No hay espacio suficiente en el teléfono. No se ha guardado nada. |  |
| `error.wrongSecret` | La contraseña o el código no son correctos. |  |
| `error.backupCorrupt` | El archivo de la copia de seguridad está dañado o incompleto. Tus datos actuales no se han modificado. |  |
| `error.backupVersion` | Este archivo de copia de seguridad es de una versión más reciente de la app. Tus datos actuales no se han modificado. |  |
| `error.passwordTooShort` | La contraseña debe tener al menos {n} caracteres. |  |
| `error.passwordMismatch` | Las contraseñas no coinciden. |  |
| `error.unexpected` | Ha ocurrido un error inesperado. Inténtalo de nuevo. |  |
| `error.dataUnreadable` | No se han podido leer los datos guardados (puede que un registro esté dañado). No se ha borrado nada. |  |
| `error.dbUnavailable` | No se puede abrir el almacenamiento del teléfono. Cierra las demás pestañas de la app o reinicia el navegador. |  |
| `error.backupMemory` | El archivo es demasiado grande para la memoria del teléfono. Tus datos actuales no se han modificado. |  |

### `card` (1 voce)

**Dove compaiono.** Etichetta, per i lettori di schermo, del bottone ⋮ di ogni scheda delle liste (`js/ui/cards.js`): non si vede.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `card.menu` | Acciones |  |

### `unit` (3 voci)

**Dove compaiono.** Unità di misura accanto alle dimensioni dei file (`formatBytes` in `js/ui/screens/ideas.js`). La stessa funzione è usata in Desarrollar (elenco dei file) e nella pagina delle impostazioni (dimensione della copia di sicurezza, spazio usato).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `unit.kb` | KB |  |
| `unit.mb` | MB |  |
| `unit.gb` | GB |  |

### `ideas` (38 voci)

**Dove compaiono.** Pagina Idear (`js/ui/screens/ideas.js`): elenco e ricerca delle idee, bottone + con le scelte nota, foto e vídeo, editor di un'idea nuova o esistente (testo, lingua, stato, file allegati), finestra di eliminazione, avvisi di somiglianza.

- `ideas.add` (il bottone +) e `ideas.removeMedia` (il bottone che toglie un file) sono etichette per i lettori di schermo: non si vedono.
- `ideas.develop` è la voce che manda l'idea a Desarrollar, nel menu ⋮ della scheda.
- `ideas.status.*` e `ideas.photos` / `ideas.videos` compaiono anche in Desarrollar.
- `ideas.draftRestored`, `ideas.discardDraft`, `ideas.noText`, `ideas.similarTitle`, `ideas.similarItem`, `ideas.similarHint` e `ideas.checkFailed` compaiono anche in Desarrollar e in Publicaciones.
- **Una voce non risulta usata in nessun punto del codice attuale:** `ideas.mediaUnavailable` (cercata come testo esatto e come chiave costruita al volo).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `ideas.searchLabel` | Buscar en las ideas |  |
| `ideas.searchPlaceholder` | Buscar por palabra… |  |
| `ideas.empty` | Todavía no hay ideas. Toca + para añadir una nota, una foto o un vídeo. |  |
| `ideas.noResults` | Ninguna idea contiene esas palabras. |  |
| `ideas.add` | Añadir idea |  |
| `ideas.addNote` | Nota |  |
| `ideas.addPhoto` | Foto |  |
| `ideas.addVideo` | Vídeo |  |
| `ideas.newTitle` | Nueva idea |  |
| `ideas.editTitle` | Editar idea |  |
| `ideas.textLabel` | Texto |  |
| `ideas.textPlaceholder` | Escribe la idea, una frase, un pensamiento… |  |
| `ideas.langLabel` | Idioma de la idea |  |
| `ideas.statusLabel` | Estado |  |
| `ideas.status.nuova` | Nueva |  |
| `ideas.status.in_sviluppo` | En desarrollo |  |
| `ideas.status.pubblicata` | Publicada |  |
| `ideas.attach` | Adjuntar fotos o vídeos |  |
| `ideas.attachedTitle` | Fotos y vídeos |  |
| `ideas.mediaDescription` | Descripción (qué se ve) |  |
| `ideas.removeMedia` | Quitar este archivo |  |
| `ideas.kind.foto` | Foto |  |
| `ideas.kind.video` | Vídeo |  |
| `ideas.draftRestored` | Se ha recuperado un borrador sin guardar. |  |
| `ideas.discardDraft` | Descartar borrador |  |
| `ideas.noText` | (sin texto) |  |
| `ideas.photos` | Fotos: {n} |  |
| `ideas.videos` | Vídeos: {n} |  |
| `ideas.deleteTitle` | ¿Eliminar la idea? |  |
| `ideas.deleteMessage` | Se eliminarán también sus fotos, vídeos y prompts. No se puede deshacer. |  |
| `ideas.unsupportedFile` | Este archivo no es una foto ni un vídeo: {names} |  |
| `ideas.emptyIdea` | Escribe un texto o adjunta una foto o un vídeo. |  |
| `ideas.similarTitle` | Se parece a publicaciones ya publicadas |  |
| `ideas.similarItem` | «{title}» ({date}). Palabras en común: {words} |  |
| `ideas.similarHint` | Queda en el registro de repeticiones, por valorar. |  |
| `ideas.checkFailed` | La idea se ha guardado, pero no se ha podido comprobar si se parece a otras publicaciones. |  |
| `ideas.mediaUnavailable` | No se puede mostrar este archivo. |  |
| `ideas.develop` | Desarrollar |  |

### `develop` (83 voci)

**Dove compaiono.** Pagina Desarrollar (`js/ui/screens/develop.js`), che porta dall'idea al prompt in cinque passi.

- `develop.step.*`: i cinque passi in cima alla pagina. `develop.step.label` è l'etichetta della fila dei passi per i lettori di schermo.
- `develop.pick.title`, `develop.noIdeas`, `develop.goIdeas` e `develop.saved.*`: scelta dell'idea e lista dei prompt già generati.
- `develop.kind.*`: scelta del tipo di pubblicazione, con la riga di spiegazione (`.hint`) e l'indicazione del tipo suggerito.
- `develop.template.*`: scelta del template (lista, predefinito o proprio, finestra di eliminazione).
- `develop.editor.*`: editor di un template (nuovo, modifica, copia). `develop.editor.insertOne` è l'etichetta, per i lettori di schermo, dei bottoni che inseriscono un dato.
- `develop.form.*`: modulo con i dati del prompt e la guida di stile.
- `develop.preview.*`, `develop.actions.*`, `develop.copied`, `develop.copyFailed`, `develop.shared`, `develop.shareUnsupported`, `develop.zip*`: prompt pronto, file dell'idea e bottoni per copiare, condividere e creare lo ZIP. `develop.actions.label` è l'etichetta di quella fila di bottoni per i lettori di schermo.
- `develop.template.copySuffix` comincia con uno spazio, che qui non si vede: l'app lo attacca al nome del template quando si fa una copia. Lo spazio iniziale deve restare.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `develop.step.label` | Pasos |  |
| `develop.step.idea` | Idea |  |
| `develop.step.kind` | Tipo |  |
| `develop.step.template` | Plantilla |  |
| `develop.step.form` | Datos |  |
| `develop.step.preview` | Prompt |  |
| `develop.pick.title` | Elige una idea |  |
| `develop.noIdeas` | Todavía no hay ideas. Crea una en Idear para desarrollarla aquí. |  |
| `develop.goIdeas` | Ir a Idear |  |
| `develop.kind.title` | Elige el tipo de publicación |  |
| `develop.kind.foto` | Foto |  |
| `develop.kind.video` | Vídeo |  |
| `develop.kind.testo` | Solo texto |  |
| `develop.kind.frase` | Frase |  |
| `develop.kind.foto.hint` | Parto de una foto y creo la frase |  |
| `develop.kind.video.hint` | Parto de un vídeo y creo la frase |  |
| `develop.kind.testo.hint` | Publicación solo de texto |  |
| `develop.kind.frase.hint` | Ya tengo la frase, busco foto o vídeo |  |
| `develop.kind.suggested` | Sugerido |  |
| `develop.template.title` | Elige la plantilla |  |
| `develop.template.langHint` | Se muestran las plantillas del idioma de la idea: {lang}. |  |
| `develop.template.new` | Nueva plantilla |  |
| `develop.template.builtin` | Predefinida |  |
| `develop.template.custom` | Propia |  |
| `develop.template.copySuffix` | ` (copia)` |  |
| `develop.template.deleteTitle` | ¿Eliminar la plantilla? |  |
| `develop.template.deleteMessage` | Solo se elimina esta plantilla. Los prompts ya generados no cambian. |  |
| `develop.editor.newTitle` | Nueva plantilla |  |
| `develop.editor.editTitle` | Editar plantilla |  |
| `develop.editor.name` | Nombre |  |
| `develop.editor.kind` | Tipo |  |
| `develop.editor.lang` | Idioma |  |
| `develop.editor.body` | Texto de la plantilla |  |
| `develop.editor.insert` | Insertar un dato |  |
| `develop.editor.insertOne` | Insertar {name} |  |
| `develop.editor.copyNote` | Las plantillas predefinidas no se modifican: aquí editas una copia. |  |
| `develop.editor.nameRequired` | Escribe un nombre para la plantilla. |  |
| `develop.editor.bodyRequired` | Escribe el texto de la plantilla. |  |
| `develop.form.title` | Datos del prompt |  |
| `develop.form.remembered` | Se recuerdan los últimos valores que has usado. |  |
| `develop.form.tono` | Tono |  |
| `develop.form.obiettivo` | Objetivo |  |
| `develop.form.lunghezza` | Longitud de la caption |  |
| `develop.form.hashtag` | Hashtags |  |
| `develop.form.descrizione_media` | Qué se ve en la foto o el vídeo |  |
| `develop.form.durata_video` | Duración del vídeo |  |
| `develop.form.idea` | Idea (texto) |  |
| `develop.form.historyMax` | Publicaciones del historial que se incluyen |  |
| `develop.form.style` | Guía de estilo |  |
| `develop.form.styleHint` | Pégala aquí una vez (ChatGPT o Gemini la escriben a partir de tu historial). Se guarda y se usa en todos los prompts. |  |
| `develop.form.styleMissing` | Todavía no has guardado una guía de estilo: {stile} quedará sin rellenar en el prompt (se verá marcado). |  |
| `develop.form.styleSave` | Guardar guía de estilo |  |
| `develop.form.styleSaved` | Guía de estilo guardada. |  |
| `develop.form.generate` | Generar prompt |  |
| `develop.form.generating` | Generando… |  |
| `develop.preview.title` | Prompt listo |  |
| `develop.preview.unfilled` | Hay datos sin rellenar: {names}. Se ven marcados en el texto. |  |
| `develop.preview.history` | Historial incluido: {n} publicaciones. |  |
| `develop.preview.savedNote` | El prompt se ha guardado y la idea está «en desarrollo». |  |
| `develop.preview.files` | Archivos de la idea |  |
| `develop.preview.noFiles` | Esta idea no tiene fotos ni vídeos. |  |
| `develop.preview.preparing` | Preparando los archivos… |  |
| `develop.preview.filesFailed` | No se han podido preparar algunos archivos. |  |
| `develop.preview.tooMany` | Hay más de 10 archivos: Gemini admite como máximo 10 por mensaje. |  |
| `develop.preview.selected` | Seleccionados: {n} |  |
| `develop.actions.label` | Acciones del prompt |  |
| `develop.actions.copy` | Copiar |  |
| `develop.actions.share` | Compartir |  |
| `develop.actions.shareAll` | Compartir todo |  |
| `develop.actions.zip` | Crear ZIP |  |
| `develop.copied` | Prompt copiado. |  |
| `develop.copyFailed` | No se ha podido copiar. Selecciona el texto y cópialo a mano. |  |
| `develop.shared` | Compartido. |  |
| `develop.shareUnsupported` | Este teléfono no permite compartir esto desde la app. Copia el texto, o crea el ZIP y adjúntalo a mano. |  |
| `develop.zipBuilding` | Creando el ZIP… |  |
| `develop.zipSaved` | Descarga del ZIP iniciada: {name}. Comprueba que está en las descargas del teléfono y adjúntalo a mano en la app de IA. |  |
| `develop.zipFailed` | No se ha podido crear el ZIP (con archivos muy grandes puede faltar memoria). |  |
| `develop.saved.title` | Prompts guardados |  |
| `develop.saved.empty` | Todavía no has generado ningún prompt. |  |
| `develop.saved.open` | Abrir |  |
| `develop.saved.ideaGone` | (idea eliminada) |  |
| `develop.saved.deleteTitle` | ¿Eliminar el prompt? |  |
| `develop.saved.deleteMessage` | Se elimina solo este prompt guardado. La idea no cambia. |  |

### `pubs` (46 voci)

**Dove compaiono.** Pagina Publicaciones guardadas (`js/ui/screens/publications.js`).

- `pubs.tab.*` e `pubs.tabs.label`: le due schede (l'elenco e il registro). `pubs.tabs.label` è l'etichetta per i lettori di schermo.
- `pubs.filters*` e `pubs.filter.*`: filtri dell'elenco.
- `pubs.empty`, `pubs.noResults`, `pubs.card.*`: elenco e schede.
- `pubs.add` (il bottone +): etichetta per i lettori di schermo, non si vede. `pubs.newTitle`, `pubs.editTitle`, `pubs.screenshot*`, `pubs.field.*`, `pubs.idea.none`, `pubs.saveAndAdd`, `pubs.savedAddMore`: modulo di una pubblicazione nuova o da modificare.
- `pubs.error.*`: avvisi sotto il modulo quando un campo non è valido.
- `pubs.deleteTitle`, `pubs.deleteMessage`: finestra di eliminazione.
- `pubs.type.*` compaiono anche nella legenda del grafico per tipo della Dashboard (`js/ui/screens/dashboard.js`).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `pubs.tabs.label` | Secciones |  |
| `pubs.tab.list` | Publicaciones |  |
| `pubs.tab.registry` | Registro |  |
| `pubs.filters` | Filtros |  |
| `pubs.filters.active` | Filtros (activos) |  |
| `pubs.filter.from` | Desde |  |
| `pubs.filter.to` | Hasta |  |
| `pubs.filter.type` | Tipo |  |
| `pubs.filter.allTypes` | Todos |  |
| `pubs.filter.clear` | Quitar los filtros |  |
| `pubs.type.foto` | Foto |  |
| `pubs.type.video` | Vídeo |  |
| `pubs.type.testo` | Solo texto |  |
| `pubs.empty` | Todavía no hay publicaciones. Toca + para guardar la primera: captura, título y descripción. |  |
| `pubs.noResults` | Ninguna publicación coincide con los filtros. |  |
| `pubs.add` | Añadir publicación |  |
| `pubs.newTitle` | Nueva publicación |  |
| `pubs.editTitle` | Editar publicación |  |
| `pubs.screenshot` | Captura de pantalla del post |  |
| `pubs.screenshot.choose` | Elegir captura |  |
| `pubs.screenshot.change` | Cambiar captura |  |
| `pubs.field.title` | Título |  |
| `pubs.field.description` | Descripción (la frase o el texto) |  |
| `pubs.field.type` | Tipo |  |
| `pubs.field.lang` | Idioma de la publicación |  |
| `pubs.field.date` | Fecha y hora de publicación |  |
| `pubs.field.views` | Visualizaciones (opcional) |  |
| `pubs.field.comments` | Comentarios (opcional) |  |
| `pubs.field.note` | Nota (opcional) |  |
| `pubs.field.idea` | Idea relacionada (opcional) |  |
| `pubs.idea.none` | — Ninguna — |  |
| `pubs.error.screenshot` | Elige la captura del post (una imagen). |  |
| `pubs.error.title` | Escribe un título. |  |
| `pubs.error.description` | Escribe la descripción. |  |
| `pubs.error.type` | El tipo no es válido. |  |
| `pubs.error.lang` | El idioma no es válido. |  |
| `pubs.error.publishedAt` | La fecha no es válida. |  |
| `pubs.error.views` | Las visualizaciones deben ser un número entero, 0 o más. |  |
| `pubs.error.comments` | Los comentarios deben ser un número entero, 0 o más. |  |
| `pubs.error.ideaId` | La idea elegida ya no existe. |  |
| `pubs.saveAndAdd` | Guardar y añadir otra |  |
| `pubs.savedAddMore` | Publicación guardada. Puedes añadir otra. |  |
| `pubs.deleteTitle` | ¿Eliminar la publicación? |  |
| `pubs.deleteMessage` | Se eliminarán también su captura y sus avisos en el registro. No se puede deshacer. |  |
| `pubs.card.views` | Visualizaciones: {n} |  |
| `pubs.card.comments` | Comentarios: {n} |  |

### `reg` (24 voci)

**Dove compaiono.** Scheda del registro delle ripetizioni dentro Publicaciones guardadas (`js/ui/screens/publications.js`): elenco, filtri (`reg.filter.*`, `reg.status*`, ricerca), stato di ogni voce (`reg.status.*`), provenienza del testo (`reg.source.*`), pubblicazione trovata (`reg.found*`, `reg.shared`, `reg.score`, `reg.checked`) e riepilogo (`reg.summary`).

- `reg.openShot` è l'etichetta, per i lettori di schermo, del bottone con la miniatura della cattura: non si vede.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `reg.empty` | El registro está vacío. Las repeticiones entran solas cuando guardas una idea o una publicación parecida a otra ya publicada. |  |
| `reg.noResults` | Ninguna entrada coincide con los filtros. |  |
| `reg.searchLabel` | Buscar por palabra |  |
| `reg.searchPlaceholder` | Buscar por palabra… |  |
| `reg.status` | Estado |  |
| `reg.status.all` | Todos |  |
| `reg.status.da_valutare` | Por valorar |  |
| `reg.status.confermata` | Repetición confirmada |  |
| `reg.status.falso_allarme` | Falsa alarma |  |
| `reg.filter.pubFrom` | Publicación encontrada: desde |  |
| `reg.filter.pubTo` | Publicación encontrada: hasta |  |
| `reg.filter.checkFrom` | Control: desde |  |
| `reg.filter.checkTo` | Control: hasta |  |
| `reg.source.idea` | Idea comprobada |  |
| `reg.source.prompt` | Prompt comprobado |  |
| `reg.source.publication` | Publicación comprobada |  |
| `reg.source.gone` | (el texto ya no está disponible) |  |
| `reg.found` | Publicación encontrada |  |
| `reg.found.gone` | (publicación eliminada) |  |
| `reg.shared` | Palabras en común |  |
| `reg.score` | Parecido orientativo: {n} % |  |
| `reg.checked` | Control: {date} |  |
| `reg.openShot` | Abrir la captura |  |
| `reg.summary` | {n} entradas, {review} por valorar |  |

### `dashboard` (24 voci)

**Dove compaiono.** Pagina Dashboard (`js/ui/screens/dashboard.js`): i tre bottoni grandi con la riga di spiegazione (`dashboard.btn.*`), il messaggio a pagina vuota (`dashboard.empty*`), le tre cifre (`dashboard.stat.*`), il riquadro delle ripetizioni da valutare (`dashboard.review.*`), i titoli e le note dei quattro grafici (`dashboard.chart.*`, `dashboard.noViews`, `dashboard.noComments`), l'ora nelle etichette del grafico delle ore (`dashboard.hour`) e la legenda del grafico per tipo (`dashboard.legend`).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `dashboard.btn.ideare` | IDEAR |  |
| `dashboard.btn.ideare.hint` | Notas, fotos y vídeos |  |
| `dashboard.btn.sviluppare` | DESARROLLAR |  |
| `dashboard.btn.sviluppare.hint` | De la idea al prompt |  |
| `dashboard.btn.pubblicazioni` | PUBLICACIONES GUARDADAS |  |
| `dashboard.btn.pubblicazioni.hint` | Historial y registro de repeticiones |  |
| `dashboard.empty` | Todavía no hay publicaciones. Guarda la primera y aquí verás tus estadísticas. |  |
| `dashboard.empty.cta` | Guardar la primera publicación |  |
| `dashboard.stat.posts` | Publicaciones |  |
| `dashboard.stat.views` | Visualizaciones |  |
| `dashboard.stat.comments` | Comentarios |  |
| `dashboard.review.title` | Repeticiones por valorar |  |
| `dashboard.review.open` | Abrir el registro |  |
| `dashboard.review.none` | No hay repeticiones por valorar. |  |
| `dashboard.chart.views` | Visualizaciones en el tiempo |  |
| `dashboard.chart.comments` | Comentarios por publicación |  |
| `dashboard.chart.hours` | Mejores horas de publicación |  |
| `dashboard.chart.types` | Publicaciones por tipo |  |
| `dashboard.chart.commentsNote` | Últimas {n} publicaciones con comentarios anotados. |  |
| `dashboard.chart.hoursNote` | Media de visualizaciones según la hora de publicación. |  |
| `dashboard.noViews` | Aún no has anotado visualizaciones: los gráficos solo cuentan las publicaciones que las tienen. |  |
| `dashboard.noComments` | Aún no has anotado comentarios. |  |
| `dashboard.hour` | {h} h |  |
| `dashboard.legend` | {type}: {n} ({pct} %) |  |

### `settings` (21 voci)

**Dove compaiono.** Pagina delle impostazioni (`js/ui/screens/settings.js`): cambio della password (`settings.password.*`), ripristino con il codice di recupero (`settings.recovery.*`), copia di sicurezza (`settings.backup.*`), spazio usato (`settings.storage.*`) e riquadro con il bottone delle informazioni (`settings.about.title`).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `settings.password.title` | Cambiar la contraseña |  |
| `settings.password.current` | Contraseña actual |  |
| `settings.password.new` | Contraseña nueva |  |
| `settings.password.confirm` | Repite la contraseña nueva |  |
| `settings.password.change` | Cambiar contraseña |  |
| `settings.password.changed` | Contraseña cambiada. Desde ahora se usa la nueva. |  |
| `settings.password.backupNote` | Las copias de seguridad hechas antes se abren con la contraseña que había entonces o con el código de recuperación. |  |
| `settings.recovery.title` | Restablecer con el código de recuperación |  |
| `settings.recovery.hint` | Si has olvidado la contraseña pero tienes el código de recuperación, elige una contraseña nueva. |  |
| `settings.recovery.code` | Código de recuperación |  |
| `settings.recovery.reset` | Restablecer contraseña |  |
| `settings.backup.title` | Copia de seguridad |  |
| `settings.backup.hint` | Se descarga como archivo en el teléfono (no se comparte) y va cifrada: se abre con tu contraseña o con el código de recuperación. Incluye fotos y vídeos. |  |
| `settings.storage.title` | Espacio |  |
| `settings.storage.used` | Usado: {used} de {quota} |  |
| `settings.storage.unknown` | El navegador no informa del espacio disponible. |  |
| `settings.storage.nearFull` | El espacio está casi lleno. Exporta una copia de seguridad y borra lo que no necesites. |  |
| `settings.storage.persisted` | Almacenamiento persistente: sí. |  |
| `settings.storage.notPersisted` | Almacenamiento persistente: no (si falta espacio, el navegador podría borrar los datos). |  |
| `settings.storage.persist` | Pedir almacenamiento persistente |  |
| `settings.about.title` | Información |  |

### `backup` (12 voci)

**Dove compaiono.** Finestre e messaggi per esportare e importare la copia di sicurezza (`js/ui/screens/settings.js`), aperti dal menu ⋮ o dalla pagina delle impostazioni. `backup.import.done` si vede anche nella schermata di accesso dopo un'importazione (`js/main.js`).

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `backup.export.title` | Exportar copia de seguridad |  |
| `backup.export.confirm` | La copia ocupará unos {size} (fotos y vídeos incluidos, cifrados). Se descargará como archivo en el teléfono; no se comparte. ¿Continuar? |  |
| `backup.export.go` | Exportar |  |
| `backup.export.building` | Creando la copia… |  |
| `backup.export.done` | Descarga de la copia iniciada: {name} ({size}). Comprueba que está en las descargas del teléfono. |  |
| `backup.import.title` | Importar copia de seguridad |  |
| `backup.import.warning` | Importar «{name}» ({size}) sustituye TODOS los datos de este teléfono, contraseña incluida. Los datos actuales se pierden. ¿Continuar? |  |
| `backup.import.go` | Importar |  |
| `backup.import.secretTitle` | Abrir la copia |  |
| `backup.import.secretMessage` | Escribe la contraseña que tenía la app cuando hiciste la copia, o su código de recuperación. |  |
| `backup.import.secretLabel` | Contraseña o código de recuperación de la copia |  |
| `backup.import.done` | Copia importada. Desbloquea con la contraseña de esa copia (o con su código de recuperación). |  |

### `about` (6 voci)

**Dove compaiono.** Finestra delle informazioni (`showAbout` in `js/ui/screens/settings.js`), aperta dal menu ⋮ o dalla pagina delle impostazioni: descrizione dell'app, librerie incluse, licenze.

| Chiave | Testo in spagnolo | Nota di lei |
|---|---|---|
| `about.text` | App sin conexión para ideas, prompts y publicaciones. Los datos se guardan cifrados en este teléfono y no se envían a internet. |  |
| `about.libs` | Librerías incluidas |  |
| `about.lib.fflate` | fflate (ZIP): licencia MIT |  |
| `about.lib.snowball` | snowball-stem (raíces de las palabras): licencia BSD-3-Clause |  |
| `about.licensesNote` | Los textos de las licencias están en la carpeta vendor del repositorio. |  |
| `about.noLicense` | La licencia del proyecto todavía no se ha elegido. |  |

## Parte 2 — Template pronti (15 testi)

**Questi non sono testi dell'interfaccia: sono prompt per l'IA.** Fonte: `js/features/templates.js` (`COMMON_ES`, `ROLE_ES`, `BODIES`, `NAMES`, `MEDIA_LABELS`, `LANGUAGE_NAMES`, `EMPTY_HISTORY`). Non stanno in `js/i18n/`, ma sono in spagnolo e vanno rivisti come gli altri.

Come funzionano: l'app prende il testo del template, sostituisce i segnaposto tra graffe con i dati dell'idea e del modulo, e ne ricava il prompt che lei incolla o condivide in un'app di IA. Qui sotto ogni testo è dato completo, come lo riceve l'IA, con i segnaposto lasciati com'erano.

- **I nomi tra graffe** (`{idea}`, `{tipo_media}`, `{descrizione_media}`, `{durata_video}`, `{tono}`, `{obiettivo}`, `{lunghezza}`, `{hashtag}`, `{storico}`, `{stile}`, `{lingua}`) sono i nomi dei dati che l'app riempie. Non si traducono e non si cambiano: se un nome cambia, l'app non lo riempie e lo lascia visibile nel prompt, segnalato come dato non riempito.
- **Il blocco del ruolo** (la prima riga) **e il blocco comune** (da «Tono:» fino a `{storico}`) sono uguali nei quattro template. Nel codice sono scritti una sola volta e valgono per tutti e quattro; in questo elenco compaiono quattro volte.
- Il nome di ogni template (prima riga della tabella) è quello che si vede nell'elenco dei template in Desarrollar.

### Template «foto»

| Voce | Testo in spagnolo | Nota di lei |
|---|---|---|
| Nome nell'elenco dei template (`NAMES`) | Foto → frase |  |
| Valore con cui l'app riempie `{tipo_media}` (`MEDIA_LABELS`) | foto |  |

Testo completo del prompt, come lo riceve l'IA (`BODIES`, con `ROLE_ES` e `COMMON_ES` già inseriti):

```text
Actúa como especialista en redacción de contenido motivacional y de estilo de vida para una página de Facebook.

Parto de una {tipo_media}. Lo que se ve: {descrizione_media}
Idea o contexto: {idea}

Tono: {tono}
Objetivo: {obiettivo}
Longitud de la caption: {lunghezza}
Hashtags: {hashtag}
Escribe todo en {lingua}.

Guía de estilo que debes seguir:
{stile}

Publicaciones anteriores de la página. No repitas sus ideas, frases ni estructuras, y mantén el mismo estilo:
{storico}

Dame dos respuestas separadas, cada una con varias variantes para que yo elija:
1) HOOK: 5 variantes de un hook muy breve (máximo 8 palabras), pensado para escribirlo encima de la foto.
2) CAPTION: 3 variantes de caption para acompañar la publicación.
```

**Nota di lei:**

### Template «video»

| Voce | Testo in spagnolo | Nota di lei |
|---|---|---|
| Nome nell'elenco dei template (`NAMES`) | Vídeo → frase |  |
| Valore con cui l'app riempie `{tipo_media}` (`MEDIA_LABELS`) | vídeo |  |

Testo completo del prompt, come lo riceve l'IA (`BODIES`, con `ROLE_ES` e `COMMON_ES` già inseriti):

```text
Actúa como especialista en redacción de contenido motivacional y de estilo de vida para una página de Facebook.

Parto de un {tipo_media} de {durata_video}. Lo que se ve y se oye: {descrizione_media}
Idea o contexto: {idea}

Tono: {tono}
Objetivo: {obiettivo}
Longitud de la caption: {lunghezza}
Hashtags: {hashtag}
Escribe todo en {lingua}.

Guía de estilo que debes seguir:
{stile}

Publicaciones anteriores de la página. No repitas sus ideas, frases ni estructuras, y mantén el mismo estilo:
{storico}

Dame dos respuestas separadas, cada una con varias variantes para que yo elija:
1) HOOK: 5 variantes de un hook breve (máximo 8 palabras), para los primeros segundos del vídeo o para escribirlo en pantalla.
2) CAPTION: 3 variantes de caption para acompañar la publicación.
```

**Nota di lei:**

### Template «testo»

| Voce | Testo in spagnolo | Nota di lei |
|---|---|---|
| Nome nell'elenco dei template (`NAMES`) | Solo texto |  |
| Valore con cui l'app riempie `{tipo_media}` (`MEDIA_LABELS`) | solo texto |  |

Testo completo del prompt, come lo riceve l'IA (`BODIES`, con `ROLE_ES` e `COMMON_ES` già inseriti):

```text
Actúa como especialista en redacción de contenido motivacional y de estilo de vida para una página de Facebook.

Esta publicación es solo texto, sin foto ni vídeo.
Idea o contexto: {idea}

Tono: {tono}
Objetivo: {obiettivo}
Longitud de la caption: {lunghezza}
Hashtags: {hashtag}
Escribe todo en {lingua}.

Guía de estilo que debes seguir:
{stile}

Publicaciones anteriores de la página. No repitas sus ideas, frases ni estructuras, y mantén el mismo estilo:
{storico}

Dame dos respuestas separadas, cada una con varias variantes para que yo elija:
1) HOOK: 5 variantes de la primera línea (máximo 12 palabras), que invite a seguir leyendo.
2) CAPTION: 3 variantes del texto completo de la publicación.
```

**Nota di lei:**

### Template «frase»

| Voce | Testo in spagnolo | Nota di lei |
|---|---|---|
| Nome nell'elenco dei template (`NAMES`) | Frase → ideas para foto o vídeo |  |
| Valore con cui l'app riempie `{tipo_media}` (`MEDIA_LABELS`) | foto o vídeo |  |

Testo completo del prompt, come lo riceve l'IA (`BODIES`, con `ROLE_ES` e `COMMON_ES` già inseriti):

```text
Actúa como especialista en redacción de contenido motivacional y de estilo de vida para una página de Facebook.

Ya tengo la frase de la publicación: {idea}
Quiero acompañarla con {tipo_media}.

Tono: {tono}
Objetivo: {obiettivo}
Longitud de la caption: {lunghezza}
Hashtags: {hashtag}
Escribe todo en {lingua}.

Guía de estilo que debes seguir:
{stile}

Publicaciones anteriores de la página. No repitas sus ideas, frases ni estructuras, y mantén el mismo estilo:
{storico}

Dame tres respuestas separadas, cada una con varias variantes para que yo elija:
1) IDEAS DE IMAGEN: 5 ideas de foto o de vídeo que acompañen la frase (qué se ve, ambiente, luz).
2) HOOK: 5 variantes de un hook muy breve (máximo 8 palabras), para escribirlo encima de la imagen elegida.
3) CAPTION: 3 variantes de caption para acompañar la publicación.
```

**Nota di lei:**

### Valori che l'app inserisce nei template

Sono testi spagnoli che finiscono dentro il prompt al posto di un segnaposto.

| Voce | Testo in spagnolo | Nota di lei |
|---|---|---|
| Valore di `{lingua}` quando il post è in spagnolo (`LANGUAGE_NAMES`) | español |  |
| Valore di `{lingua}` quando il post è in italiano (`LANGUAGE_NAMES`) | italiano |  |
| Riga che sostituisce `{storico}` quando non ci sono ancora pubblicazioni salvate (`EMPTY_HISTORY`) | (Todavía no hay publicaciones guardadas.) |  |

## Parte 3 — Altro che lei vede sullo schermo

Non sono testi scritti nei due elenchi qui sopra, quindi non c'è nulla da copiare. Sono qui perché si sappia che esistono.

- **Date.** Le date delle schede (idee, prompt, pubblicazioni) e quelle dei grafici le scrive il browser del telefono, nel formato della lingua dell'interfaccia: l'app chiede solo giorno, mese abbreviato e (nelle schede) anno (`toLocaleDateString` in `js/ui/screens/ideas.js`, `develop.js`, `publications.js`, `dashboard.js`). Come appaiono sul Samsung in spagnolo: **[Da provare]**.
- **Numeri.** Le cifre grandi (visualizzazioni, commenti, Dashboard) e i decimali delle dimensioni dei file seguono le regole del browser per la lingua dell'interfaccia (`toLocaleString`). Come appaiono sul Samsung in spagnolo: **[Da provare]**.
- **Etichette dei grafici.** Nei grafici i numeri grandi sono abbreviati con «k» e «M» e con il punto decimale (per esempio «2.61k»). Le scrive il codice (`compact()` in `js/ui/charts.js`), non passano da `es.js` e sono uguali in spagnolo e in italiano. Se in spagnolo vadano scritte così: da decidere.
- **Sigle delle lingue.** «ES» e «IT», accanto alle bandierine in alto e nelle schede, sono i codici delle lingue: non sono testi da rivedere.
- **Nome dell'app e versione.** Il nome «NAY-App» (anche nel titolo della pagina web, `index.html`) e il numero di versione accanto al logo sono fissi e non si traducono.

## Appendice — Testi uguali in più voci

Questi testi in spagnolo sono scritti allo stesso modo in più voci. Se li si corregge in una, conviene correggerli anche nelle altre. Le voci della Parte 2 sono indicate con il nome del template.

| Testo in spagnolo | Voci in cui compare |
|---|---|
| Código de recuperación | `lock.recoveryLabel`, `settings.recovery.code` |
| Exportar copia de seguridad | `menu.exportBackup`, `backup.export.title` |
| Importar copia de seguridad | `menu.importBackup`, `backup.import.title` |
| Ajustes | `menu.settings`, `title.impostazioni` |
| Información | `menu.about`, `settings.about.title` |
| Idear | `nav.ideare`, `title.ideare` |
| Desarrollar | `nav.sviluppare`, `title.sviluppare`, `ideas.develop` |
| Publicaciones | `nav.pubblicazioni`, `pubs.tab.list`, `dashboard.stat.posts` |
| Copiar | `common.copy`, `develop.actions.copy` |
| Compartir | `common.share`, `develop.actions.share` |
| Guardando… | `lock.saving`, `common.saving` |
| Idioma | `topbar.language`, `develop.editor.lang` |
| Buscar por palabra… | `ideas.searchPlaceholder`, `reg.searchPlaceholder` |
| Foto | `ideas.addPhoto`, `ideas.kind.foto`, `develop.kind.foto`, `pubs.type.foto` |
| Vídeo | `ideas.addVideo`, `ideas.kind.video`, `develop.kind.video`, `pubs.type.video` |
| Estado | `ideas.statusLabel`, `reg.status` |
| Tipo | `develop.step.kind`, `develop.editor.kind`, `pubs.filter.type`, `pubs.field.type` |
| Solo texto | `develop.kind.testo`, `pubs.type.testo`, template «testo» (nome) |
| Nueva plantilla | `develop.template.new`, `develop.editor.newTitle` |
| Todos | `pubs.filter.allTypes`, `reg.status.all` |

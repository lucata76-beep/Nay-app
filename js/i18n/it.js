// Testi in italiano. Li scrive Claude; li rivede Luca (T19).
export const it = {
  'app.name': 'NAY-App',

  // Schermata di sblocco e primo avvio
  'lock.title': 'Inserisci la password',
  'lock.passwordLabel': 'Password',
  'lock.unlock': 'Sblocca',
  'lock.useRecovery': 'Usa il codice di recupero',
  'lock.recoveryLabel': 'Codice di recupero',
  'lock.createTitle': 'Crea la tua password',
  'lock.passwordConfirmLabel': 'Ripeti la password',
  'lock.create': 'Crea',
  'lock.strength.debole': 'Debole',
  'lock.strength.media': 'Media',
  'lock.strength.buona': 'Buona',
  'lock.recoveryTitle': 'Il tuo codice di recupero',
  'lock.recoveryHint':
    'Scrivilo su carta e conservalo in un posto sicuro. Non fare uno screenshot: finirebbe in chiaro nella galleria. Non verrà mostrato di nuovo.',
  'lock.recoveryConfirm': 'Ho salvato il codice',
  'lock.continue': 'Continua',

  // Barra in alto e menu ⋮
  'topbar.home': 'Vai alla Home',
  'topbar.menu': 'Menu',
  'lang.es': 'Español',
  'lang.it': 'Italiano',
  'menu.lockNow': 'Blocca ora',
  'menu.exportBackup': 'Esporta backup',
  'menu.importBackup': 'Importa backup',
  'menu.settings': 'Impostazioni',
  'menu.about': 'Informazioni',

  // Barra in basso e titoli delle pagine
  'nav.dashboard': 'Home',
  'nav.ideare': 'Ideare',
  'nav.sviluppare': 'Sviluppare',
  'nav.pubblicazioni': 'Pubblicazioni',
  'title.dashboard': 'Dashboard',
  'title.ideare': 'Ideare',
  'title.sviluppare': 'Sviluppare',
  'title.pubblicazioni': 'Pubblicazioni salvate',
  'title.impostazioni': 'Impostazioni',

  // Bottoni comuni
  'common.save': 'Salva',
  'common.cancel': 'Annulla',
  'common.delete': 'Elimina',
  'common.edit': 'Modifica',
  'common.duplicate': 'Duplica',
  'common.copy': 'Copia',
  'common.share': 'Condividi',
  'common.close': 'Chiudi',
  'common.back': 'Indietro',
  'common.add': 'Aggiungi',
  'common.search': 'Cerca',
  'common.confirm': 'Conferma',

  // Errori
  'error.storageFull': 'Spazio insufficiente nel telefono. Non è stato salvato nulla.',
  'error.wrongSecret': 'La password o il codice non sono corretti.',
  'error.backupCorrupt':
    'Il file di backup è danneggiato o incompleto. I tuoi dati attuali non sono stati modificati.',
  'error.backupVersion':
    "Questo file di backup è di una versione più recente dell'app. I tuoi dati attuali non sono stati modificati.",
  'error.passwordTooShort': 'La password deve avere almeno {n} caratteri.',
  'error.passwordMismatch': 'Le password non coincidono.',
  'error.unexpected': 'Si è verificato un errore imprevisto. Riprova.',
  'error.dataUnreadable':
    'Non è stato possibile leggere i dati salvati (forse un record è danneggiato). Non è stato cancellato nulla.',
  'error.dbUnavailable':
    "Non si riesce ad aprire l'archivio del telefono. Chiudi le altre schede dell'app o riavvia il browser.",
  'common.retry': 'Riprova',

  // Schermata di sblocco e primo avvio (T11)
  'lock.createIntro':
    'Prima volta: crea una password per proteggere i tuoi dati. Restano cifrati in questo telefono. Se perdi la password e il codice di recupero, e non hai un backup, non si possono recuperare.',
  'lock.passwordHint': 'Almeno {n} caratteri.',
  'lock.unlocking': 'Sblocco in corso…',
  'lock.creating': 'Creazione in corso…',
  'lock.saving': 'Salvataggio in corso…',
  'lock.showPassword': 'Mostra la password',
  'lock.hidePassword': 'Nascondi la password',
  'lock.backToPassword': 'Usa la password',
  'lock.recoveryUnlockHint': 'Scrivi il codice di recupero di 32 caratteri. Vanno bene minuscole e spazi.',
  'lock.orphanData':
    "In questo telefono ci sono dati cifrati ma manca la configurazione dell'accesso. Non si crea una nuova password per non perdere quei dati.",
  'lock.loading': 'Caricamento…',

  // Barra in alto e navigazione
  'topbar.version': 'Versione {v}',
  'topbar.language': 'Lingua',
  'nav.label': 'Navigazione principale',
};

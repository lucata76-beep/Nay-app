// Textos en español (idioma predeterminado). Los escribe Claude; los revisa su autora en T19.
export const es = {
  'app.name': 'NAY-App',

  // Pantalla de desbloqueo y primer arranque
  'lock.title': 'Introduce tu contraseña',
  'lock.passwordLabel': 'Contraseña',
  'lock.unlock': 'Desbloquear',
  'lock.useRecovery': 'Usar el código de recuperación',
  'lock.recoveryLabel': 'Código de recuperación',
  'lock.createTitle': 'Crea tu contraseña',
  'lock.passwordConfirmLabel': 'Repite la contraseña',
  'lock.create': 'Crear',
  'lock.strength.debole': 'Débil',
  'lock.strength.media': 'Media',
  'lock.strength.buona': 'Buena',
  'lock.recoveryTitle': 'Tu código de recuperación',
  'lock.recoveryHint':
    'Escríbelo en papel y guárdalo en un lugar seguro. No hagas una captura de pantalla: quedaría sin protección en la galería. No se volverá a mostrar.',
  'lock.recoveryConfirm': 'He guardado el código',
  'lock.continue': 'Continuar',

  // Barra superior y menú ⋮
  'topbar.home': 'Ir al inicio',
  'topbar.menu': 'Menú',
  'lang.es': 'Español',
  'lang.it': 'Italiano',
  'menu.lockNow': 'Bloquear ahora',
  'menu.exportBackup': 'Exportar copia de seguridad',
  'menu.importBackup': 'Importar copia de seguridad',
  'menu.settings': 'Ajustes',
  'menu.about': 'Información',

  // Barra inferior y títulos de página
  'nav.dashboard': 'Inicio',
  'nav.ideare': 'Idear',
  'nav.sviluppare': 'Desarrollar',
  'nav.pubblicazioni': 'Publicaciones',
  'title.dashboard': 'Dashboard',
  'title.ideare': 'Idear',
  'title.sviluppare': 'Desarrollar',
  'title.pubblicazioni': 'Publicaciones guardadas',
  'title.impostazioni': 'Ajustes',

  // Botones comunes
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.duplicate': 'Duplicar',
  'common.copy': 'Copiar',
  'common.share': 'Compartir',
  'common.close': 'Cerrar',
  'common.back': 'Volver',
  'common.add': 'Añadir',
  'common.search': 'Buscar',
  'common.confirm': 'Confirmar',

  // Errores
  'error.storageFull': 'No hay espacio suficiente en el teléfono. No se ha guardado nada.',
  'error.wrongSecret': 'La contraseña o el código no son correctos.',
  'error.backupCorrupt':
    'El archivo de la copia de seguridad está dañado o incompleto. Tus datos actuales no se han modificado.',
  'error.backupVersion':
    'Este archivo de copia de seguridad es de una versión más reciente de la app. Tus datos actuales no se han modificado.',
  'error.passwordTooShort': 'La contraseña debe tener al menos {n} caracteres.',
  'error.passwordMismatch': 'Las contraseñas no coinciden.',
  'error.unexpected': 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
  'error.dataUnreadable':
    'No se han podido leer los datos guardados (puede que un registro esté dañado). No se ha borrado nada.',
  'error.dbUnavailable':
    'No se puede abrir el almacenamiento del teléfono. Cierra las demás pestañas de la app o reinicia el navegador.',
  'common.retry': 'Reintentar',

  // Pantalla de desbloqueo y primer arranque (T11)
  'lock.createIntro':
    'Primera vez: crea una contraseña para proteger tus datos. Se guardan cifrados en este teléfono. Si pierdes la contraseña y el código de recuperación, y no tienes una copia de seguridad, no se pueden recuperar.',
  'lock.passwordHint': 'Mínimo {n} caracteres.',
  'lock.unlocking': 'Desbloqueando…',
  'lock.creating': 'Creando…',
  'lock.saving': 'Guardando…',
  'lock.showPassword': 'Mostrar contraseña',
  'lock.hidePassword': 'Ocultar contraseña',
  'lock.backToPassword': 'Usar la contraseña',
  'lock.recoveryUnlockHint': 'Escribe el código de recuperación de 32 caracteres. Se admiten minúsculas y espacios.',
  'lock.orphanData':
    'Hay datos cifrados en este teléfono pero falta la configuración de acceso. No se crea una contraseña nueva para no perder esos datos.',
  'lock.loading': 'Cargando…',

  // Barra superior y navegación
  'topbar.version': 'Versión {v}',
  'topbar.language': 'Idioma',
  'nav.label': 'Navegación principal',
};

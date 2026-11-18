# Revisión de los textos en español

*Tarea T19, paso 1. Copia fiel de `js/i18n/es.js` y de `js/features/templates.js` tal como están en `main` en el commit `790b6cf`. Ningún texto se ha corregido, traducido ni «mejorado»: la revisión es tuya. Las correcciones llegarán en una tarea aparte, a partir de tus notas.*

## Cómo leer esta lista

Este archivo enumera cada texto en español que la app muestra en la pantalla o prepara para la IA, para que tú, con el español como lengua materna, puedas revisarlo. No hace falta conocer el código.

- **Clave:** el nombre interno del texto (por ejemplo, `lock.title`). Solo sirve para encontrarlo: no hay que cambiarla ni traducirla.
- **Texto en español:** el texto tal como está hoy.
- **Tu nota:** el espacio para tus notas. Está vacío.
- **Las partes entre llaves**, como `{n}` o `{lang}`, son datos que la app inserta por sí sola (un número, un nombre, una fecha...). Se dejan como están; se puede corregir el texto que las rodea.
- A veces el mismo texto aparece en varias entradas (por ejemplo, «Foto»): son entradas distintas porque están en lugares distintos de la app. El apéndice del final las enumera, para corregirlas de forma coherente.
- Algunas etiquetas no se ven en la pantalla: sirven para los lectores de pantalla (por ejemplo, para el botón ⋮). Están indicadas en la línea «Dónde aparece» de su grupo.

**Cómo enviar tus notas.** Envía un mensaje a Luca con la clave y tu corrección. Por ejemplo: `lock.title` → «tu texto corregido». Si tienes varias correcciones, escribe una por línea. Para los textos de la Parte 2, que no tienen clave, indica el nombre de la plantilla y la frase que cambias. La columna «Tu nota» es opcional: no hace falta escribir nada en ella.

El archivo tiene tres partes y un apéndice:

1. **Textos de la interfaz:** 330 entradas, agrupadas por la primera parte de la clave (`lock`, `menu`, `ideas`...). Cada grupo tiene una línea que dice dónde aparece.
2. **Plantillas listas (prompts para la IA):** 15 textos. No son textos de la interfaz: son los prompts que la app prepara y que luego se pegan o se comparten en una app de IA. Están en otro archivo del código (`js/features/templates.js`, no en `js/i18n/`) y por eso van en una parte aparte.
3. **Otras cosas que ves en la pantalla** y que no están en ninguna de las dos listas: fechas, números, etiquetas de los gráficos, siglas.
4. **Apéndice:** textos iguales en varias entradas.

## Parte 1 — Textos de la interfaz (330 entradas)

Fuente: `js/i18n/es.js`. Los grupos siguen la primera parte de la clave; dentro de cada grupo, las entradas están en el orden del archivo.

### `app` (1 entrada)

**Dónde aparece.** El nombre de la app: título grande en la pantalla de acceso (`js/ui/screens/lock.js`) y línea en la ventana de información (`js/ui/screens/settings.js`).

| Clave | Texto en español | Tu nota |
|---|---|---|
| `app.name` | NAY-App |  |

### `lock` (26 entradas)

**Dónde aparece.** Pantalla de acceso (`js/ui/screens/lock.js`): desbloqueo con la contraseña o con el código de recuperación, creación de la primera contraseña, pantalla que muestra el código de recuperación.

- `lock.strength.*` son las tres palabras (débil, media, buena) debajo del campo de la contraseña, en el acceso y en la página de ajustes cuando se cambia la contraseña (`js/ui/fields.js`). En la página de ajustes también aparece `lock.passwordHint`.
- `lock.loading` también se ve en `js/main.js`, como pantalla de espera cuando el bloqueo llega mientras una importación sigue en curso.
- `lock.showPassword` y `lock.hidePassword` son etiquetas del botón del ojo, para los lectores de pantalla: no se ven.

| Clave | Texto en español | Tu nota |
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

### `topbar` (4 entradas)

**Dónde aparece.** Barra superior (`js/ui/topbar.js`).

- `topbar.home`, `topbar.menu` y `topbar.language` son etiquetas para los lectores de pantalla (logo, botón ⋮, banderitas): no se ven.
- `topbar.version` solo aparece en la ventana de información (`js/ui/screens/settings.js`).

| Clave | Texto en español | Tu nota |
|---|---|---|
| `topbar.home` | Ir al inicio |  |
| `topbar.menu` | Menú |  |
| `topbar.version` | Versión {v} |  |
| `topbar.language` | Idioma |  |

### `lang` (2 entradas)

**Dónde aparece.** Nombres de los dos idiomas: en los desplegables del idioma de la idea, de la publicación y de la plantilla (`js/ui/screens/ideas.js`, `publications.js`, `develop.js`), en la frase de `develop.template.langHint` (`develop.js`) y como etiqueta, para los lectores de pantalla, de las dos banderitas de arriba (`js/ui/topbar.js`).

| Clave | Texto en español | Tu nota |
|---|---|---|
| `lang.es` | Español |  |
| `lang.it` | Italiano |  |

### `menu` (5 entradas)

**Dónde aparece.** Menú ⋮ de arriba a la derecha (`js/main.js`), con cinco opciones: bloquear ahora, exportar copia, importar copia, ajustes, información.

- `menu.exportBackup`, `menu.importBackup` y `menu.about` también aparecen como botones en la página de ajustes (`js/ui/screens/settings.js`).
- `menu.about` es también el título de la ventana de información.

| Clave | Texto en español | Tu nota |
|---|---|---|
| `menu.lockNow` | Bloquear ahora |  |
| `menu.exportBackup` | Exportar copia de seguridad |  |
| `menu.importBackup` | Importar copia de seguridad |  |
| `menu.settings` | Ajustes |  |
| `menu.about` | Información |  |

### `nav` (5 entradas)

**Dónde aparece.** Barra inferior (`js/ui/bottombar.js`): cuatro opciones, una por página (la página de ajustes no está: se abre desde el menú ⋮). `nav.label` es la etiqueta de la barra para los lectores de pantalla: no se ve.

| Clave | Texto en español | Tu nota |
|---|---|---|
| `nav.dashboard` | Inicio |  |
| `nav.ideare` | Idear |  |
| `nav.sviluppare` | Desarrollar |  |
| `nav.pubblicazioni` | Publicaciones |  |
| `nav.label` | Navegación principal |  |

### `title` (5 entradas)

**Dónde aparece.** Título de la página, escrito en la barra superior (`js/main.js`): uno para cada una de las cinco páginas, incluida la de ajustes.

| Clave | Texto en español | Tu nota |
|---|---|---|
| `title.dashboard` | Dashboard |  |
| `title.ideare` | Idear |  |
| `title.sviluppare` | Desarrollar |  |
| `title.pubblicazioni` | Publicaciones guardadas |  |
| `title.impostazioni` | Ajustes |  |

### `common` (14 entradas)

**Dónde aparece.** Botones y palabras comunes a varias pantallas: ventanas de confirmación y avisos (`js/ui/dialog.js`), listas y editores de Idear, Desarrollar y Publicaciones (`js/ui/screens/ideas.js`, `develop.js`, `publications.js`), botón para reintentar al arrancar la app y en el acceso (`js/main.js`, `js/ui/screens/lock.js`).

- `common.close` es también la etiqueta, para los lectores de pantalla, del botón que cierra los avisos.
- **Cuatro entradas no figuran como usadas en ningún punto del código actual:** `common.copy`, `common.share`, `common.add`, `common.search`. Las he buscado como texto exacto y también como claves construidas sobre la marcha. Mientras el código no las use, tú no las ves en la pantalla.

| Clave | Texto en español | Tu nota |
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

### `error` (10 entradas)

**Dónde aparece.** Avisos de error, en la pantalla donde ocurre el problema.

- `error.storageFull`: falta espacio en el teléfono (guardados en Idear, Desarrollar y Publicaciones, creación de la contraseña, copias de seguridad, o una página que no logra leer los datos).
- `error.wrongSecret`: contraseña o código de recuperación incorrectos (acceso y copias de seguridad).
- `error.backupCorrupt`, `error.backupVersion`, `error.backupMemory`: problemas con el archivo de la copia de seguridad (página de ajustes e importación desde el menú ⋮).
- `error.passwordTooShort`, `error.passwordMismatch`: creación y cambio de la contraseña.
- `error.unexpected`: error genérico, en varias pantallas. `error.dataUnreadable`: datos guardados que no se pueden leer (Idear, Desarrollar, Publicaciones, o una página que no logra leer los datos). `error.dbUnavailable`: almacenamiento del teléfono que no se puede abrir (al arrancar la app y en el acceso).

| Clave | Texto en español | Tu nota |
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

### `card` (1 entrada)

**Dónde aparece.** Etiqueta, para los lectores de pantalla, del botón ⋮ de cada tarjeta de las listas (`js/ui/cards.js`): no se ve.

| Clave | Texto en español | Tu nota |
|---|---|---|
| `card.menu` | Acciones |  |

### `unit` (3 entradas)

**Dónde aparece.** Unidades de medida junto al tamaño de los archivos (`formatBytes` en `js/ui/screens/ideas.js`). La misma función se usa en Desarrollar (lista de archivos) y en la página de ajustes (tamaño de la copia de seguridad, espacio usado).

| Clave | Texto en español | Tu nota |
|---|---|---|
| `unit.kb` | KB |  |
| `unit.mb` | MB |  |
| `unit.gb` | GB |  |

### `ideas` (38 entradas)

**Dónde aparece.** Página Idear (`js/ui/screens/ideas.js`): lista y búsqueda de las ideas, botón + con las opciones nota, foto y vídeo, editor de una idea nueva o existente (texto, idioma, estado, archivos adjuntos), ventana de eliminación, avisos de parecido.

- `ideas.add` (el botón +) y `ideas.removeMedia` (el botón que quita un archivo) son etiquetas para los lectores de pantalla: no se ven.
- `ideas.develop` es la opción que manda la idea a Desarrollar, en el menú ⋮ de la tarjeta.
- `ideas.status.*` y `ideas.photos` / `ideas.videos` también aparecen en Desarrollar.
- `ideas.draftRestored`, `ideas.discardDraft`, `ideas.noText`, `ideas.similarTitle`, `ideas.similarItem`, `ideas.similarHint` y `ideas.checkFailed` también aparecen en Desarrollar y en Publicaciones.
- **Una entrada no figura como usada en ningún punto del código actual:** `ideas.mediaUnavailable` (buscada como texto exacto y como clave construida sobre la marcha).

| Clave | Texto en español | Tu nota |
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

### `develop` (83 entradas)

**Dónde aparece.** Página Desarrollar (`js/ui/screens/develop.js`), que lleva de la idea al prompt en cinco pasos.

- `develop.step.*`: los cinco pasos de arriba de la página. `develop.step.label` es la etiqueta de la fila de pasos para los lectores de pantalla.
- `develop.pick.title`, `develop.noIdeas`, `develop.goIdeas` y `develop.saved.*`: elección de la idea y lista de los prompts ya generados.
- `develop.kind.*`: elección del tipo de publicación, con la línea de explicación (`.hint`) y la indicación del tipo sugerido.
- `develop.template.*`: elección de la plantilla (lista, predefinida o propia, ventana de eliminación).
- `develop.editor.*`: editor de una plantilla (nueva, edición, copia). `develop.editor.insertOne` es la etiqueta, para los lectores de pantalla, de los botones que insertan un dato.
- `develop.form.*`: formulario con los datos del prompt y la guía de estilo.
- `develop.preview.*`, `develop.actions.*`, `develop.copied`, `develop.copyFailed`, `develop.shared`, `develop.shareUnsupported`, `develop.zip*`: prompt listo, archivos de la idea y botones para copiar, compartir y crear el ZIP. `develop.actions.label` es la etiqueta de esa fila de botones para los lectores de pantalla.
- `develop.template.copySuffix` empieza con un espacio, que aquí no se ve: la app lo pega al nombre de la plantilla cuando se hace una copia. El espacio inicial debe quedarse.

| Clave | Texto en español | Tu nota |
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

### `pubs` (46 entradas)

**Dónde aparece.** Página Publicaciones guardadas (`js/ui/screens/publications.js`).

- `pubs.tab.*` y `pubs.tabs.label`: las dos pestañas (la lista y el registro). `pubs.tabs.label` es la etiqueta para los lectores de pantalla.
- `pubs.filters*` y `pubs.filter.*`: filtros de la lista.
- `pubs.empty`, `pubs.noResults`, `pubs.card.*`: lista y tarjetas.
- `pubs.add` (el botón +): etiqueta para los lectores de pantalla, no se ve. `pubs.newTitle`, `pubs.editTitle`, `pubs.screenshot*`, `pubs.field.*`, `pubs.idea.none`, `pubs.saveAndAdd`, `pubs.savedAddMore`: formulario de una publicación nueva o para modificar.
- `pubs.error.*`: avisos debajo del formulario cuando un campo no es válido.
- `pubs.deleteTitle`, `pubs.deleteMessage`: ventana de eliminación.
- `pubs.type.*` también aparecen en la leyenda del gráfico por tipo del Dashboard (`js/ui/screens/dashboard.js`).

| Clave | Texto en español | Tu nota |
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

### `reg` (24 entradas)

**Dónde aparece.** Pestaña del registro de repeticiones dentro de Publicaciones guardadas (`js/ui/screens/publications.js`): lista, filtros (`reg.filter.*`, `reg.status*`, búsqueda), estado de cada entrada (`reg.status.*`), procedencia del texto (`reg.source.*`), publicación encontrada (`reg.found*`, `reg.shared`, `reg.score`, `reg.checked`) y resumen (`reg.summary`).

- `reg.openShot` es la etiqueta, para los lectores de pantalla, del botón con la miniatura de la captura: no se ve.

| Clave | Texto en español | Tu nota |
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

### `dashboard` (24 entradas)

**Dónde aparece.** Página Dashboard (`js/ui/screens/dashboard.js`): los tres botones grandes con la línea de explicación (`dashboard.btn.*`), el mensaje de página vacía (`dashboard.empty*`), las tres cifras (`dashboard.stat.*`), el recuadro de las repeticiones por valorar (`dashboard.review.*`), los títulos y las notas de los cuatro gráficos (`dashboard.chart.*`, `dashboard.noViews`, `dashboard.noComments`), la hora en las etiquetas del gráfico de las horas (`dashboard.hour`) y la leyenda del gráfico por tipo (`dashboard.legend`).

| Clave | Texto en español | Tu nota |
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

### `settings` (21 entradas)

**Dónde aparece.** Página de ajustes (`js/ui/screens/settings.js`): cambio de la contraseña (`settings.password.*`), restablecimiento con el código de recuperación (`settings.recovery.*`), copia de seguridad (`settings.backup.*`), espacio usado (`settings.storage.*`) y recuadro con el botón de información (`settings.about.title`).

| Clave | Texto en español | Tu nota |
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

### `backup` (12 entradas)

**Dónde aparece.** Ventanas y mensajes para exportar e importar la copia de seguridad (`js/ui/screens/settings.js`), que se abren desde el menú ⋮ o desde la página de ajustes. `backup.import.done` también se ve en la pantalla de acceso después de una importación (`js/main.js`).

| Clave | Texto en español | Tu nota |
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

### `about` (6 entradas)

**Dónde aparece.** Ventana de información (`showAbout` en `js/ui/screens/settings.js`), que se abre desde el menú ⋮ o desde la página de ajustes: descripción de la app, librerías incluidas, licencias.

| Clave | Texto en español | Tu nota |
|---|---|---|
| `about.text` | App sin conexión para ideas, prompts y publicaciones. Los datos se guardan cifrados en este teléfono y no se envían a internet. |  |
| `about.libs` | Librerías incluidas |  |
| `about.lib.fflate` | fflate (ZIP): licencia MIT |  |
| `about.lib.snowball` | snowball-stem (raíces de las palabras): licencia BSD-3-Clause |  |
| `about.licensesNote` | Los textos de las licencias están en la carpeta vendor del repositorio. |  |
| `about.noLicense` | La licencia del proyecto todavía no se ha elegido. |  |

## Parte 2 — Plantillas listas (15 textos)

**Estos no son textos de la interfaz: son prompts para la IA.** Fuente: `js/features/templates.js` (`COMMON_ES`, `ROLE_ES`, `BODIES`, `NAMES`, `MEDIA_LABELS`, `LANGUAGE_NAMES`, `EMPTY_HISTORY`). No están en `js/i18n/`, pero están en español y hay que revisarlos como los demás.

Cómo funcionan: la app toma el texto de la plantilla, sustituye los marcadores entre llaves por los datos de la idea y del formulario, y con eso obtiene el prompt que tú pegas o compartes en una app de IA. Aquí abajo cada texto se da completo, tal como lo recibe la IA, con los marcadores dejados como estaban.

- **Los nombres entre llaves** (`{idea}`, `{tipo_media}`, `{descrizione_media}`, `{durata_video}`, `{tono}`, `{obiettivo}`, `{lunghezza}`, `{hashtag}`, `{storico}`, `{stile}`, `{lingua}`) son los nombres de los datos que la app rellena. No se traducen ni se cambian: si un nombre cambia, la app no lo rellena y lo deja visible en el prompt, señalado como dato sin rellenar.
- **El bloque del rol** (la primera línea) **y el bloque común** (desde «Tono:» hasta `{storico}`) son iguales en las cuatro plantillas. En el código están escritos una sola vez y valen para las cuatro; en esta lista aparecen cuatro veces.
- El nombre de cada plantilla (primera fila de la tabla) es el que se ve en la lista de plantillas de Desarrollar.

### Plantilla «foto»

| Entrada | Texto en español | Tu nota |
|---|---|---|
| Nombre en la lista de plantillas (`NAMES`) | Foto → frase |  |
| Valor con el que la app rellena `{tipo_media}` (`MEDIA_LABELS`) | foto |  |

Texto completo del prompt, tal como lo recibe la IA (`BODIES`, con `ROLE_ES` y `COMMON_ES` ya insertados):

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

**Tu nota:**

### Plantilla «video»

| Entrada | Texto en español | Tu nota |
|---|---|---|
| Nombre en la lista de plantillas (`NAMES`) | Vídeo → frase |  |
| Valor con el que la app rellena `{tipo_media}` (`MEDIA_LABELS`) | vídeo |  |

Texto completo del prompt, tal como lo recibe la IA (`BODIES`, con `ROLE_ES` y `COMMON_ES` ya insertados):

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

**Tu nota:**

### Plantilla «testo»

| Entrada | Texto en español | Tu nota |
|---|---|---|
| Nombre en la lista de plantillas (`NAMES`) | Solo texto |  |
| Valor con el que la app rellena `{tipo_media}` (`MEDIA_LABELS`) | solo texto |  |

Texto completo del prompt, tal como lo recibe la IA (`BODIES`, con `ROLE_ES` y `COMMON_ES` ya insertados):

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

**Tu nota:**

### Plantilla «frase»

| Entrada | Texto en español | Tu nota |
|---|---|---|
| Nombre en la lista de plantillas (`NAMES`) | Frase → ideas para foto o vídeo |  |
| Valor con el que la app rellena `{tipo_media}` (`MEDIA_LABELS`) | foto o vídeo |  |

Texto completo del prompt, tal como lo recibe la IA (`BODIES`, con `ROLE_ES` y `COMMON_ES` ya insertados):

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

**Tu nota:**

### Valores que la app inserta en las plantillas

Son textos en español que acaban dentro del prompt en lugar de un marcador.

| Entrada | Texto en español | Tu nota |
|---|---|---|
| Valor de `{lingua}` cuando la publicación está en español (`LANGUAGE_NAMES`) | español |  |
| Valor de `{lingua}` cuando la publicación está en italiano (`LANGUAGE_NAMES`) | italiano |  |
| Línea que sustituye a `{storico}` cuando todavía no hay publicaciones guardadas (`EMPTY_HISTORY`) | (Todavía no hay publicaciones guardadas.) |  |

## Parte 3 — Otras cosas que ves en la pantalla

No son textos escritos en las dos listas de arriba, así que no hay nada que copiar. Están aquí para que se sepa que existen.

- **Fechas.** Las fechas de las tarjetas (ideas, prompts, publicaciones) y las de los gráficos las escribe el navegador del teléfono, en el formato del idioma de la interfaz: la app solo pide día, mes abreviado y (en las tarjetas) año (`toLocaleDateString` en `js/ui/screens/ideas.js`, `develop.js`, `publications.js`, `dashboard.js`). Cómo aparecen en el Samsung en español: **[Por probar]**.
- **Números.** Las cifras grandes (visualizaciones, comentarios, Dashboard) y los decimales de los tamaños de archivo siguen las reglas del navegador para el idioma de la interfaz (`toLocaleString`). Cómo aparecen en el Samsung en español: **[Por probar]**.
- **Etiquetas de los gráficos.** En los gráficos, los números grandes se abrevian con «k» y «M» y con punto decimal (por ejemplo, «2.61k»). Las escribe el código (`compact()` en `js/ui/charts.js`), no pasan por `es.js` y son iguales en español y en italiano. Si en español deben escribirse así: por decidir.
- **Siglas de los idiomas.** «ES» e «IT», junto a las banderitas de arriba y en las tarjetas, son los códigos de los idiomas: no son textos que revisar.
- **Nombre de la app y versión.** El nombre «NAY-App» (también en el título de la página web, `index.html`) y el número de versión junto al logo son fijos y no se traducen.

## Apéndice — Textos iguales en varias entradas

Estos textos en español están escritos igual en varias entradas. Si se corrigen en una, conviene corregirlos también en las demás. Las entradas de la Parte 2 se indican con el nombre de la plantilla.

| Texto en español | Entradas en las que aparece |
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
| Solo texto | `develop.kind.testo`, `pubs.type.testo`, plantilla «testo» (nombre) |
| Nueva plantilla | `develop.template.new`, `develop.editor.newTitle` |
| Todos | `pubs.filter.allTypes`, `reg.status.all` |

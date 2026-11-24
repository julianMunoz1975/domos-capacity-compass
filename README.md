# Domos Park · Registro de prácticas

App interna de **demostración** para gestionar cupos y lista de espera de yoga y meditación en Domos Park. Hecha con React 19, TanStack Start (router), Tailwind CSS 4 y componentes shadcn/ui. **No tiene backend**: todo se guarda en el navegador.

- Preview: https://id-preview--7d8e37a1-c581-4d56-9e76-7fbf01e28325.lovable.app
- Publicada: https://domos-capacity-compass.lovable.app

## 1. Cómo arrancar

Requisitos: [Bun](https://bun.sh) (el proyecto usa `bun.lock`).

```sh
bun install        # instala dependencias
bun run dev        # servidor de desarrollo (Vite)
bun run build      # compilación de producción
bun run preview    # sirve la compilación local
bun run lint       # ESLint
bun run test       # todas las pruebas (Vitest)
bunx vitest run src/lib/domos/engine.test.ts src/test/app-routing.test.tsx   # pruebas del motor y del enrutado
```

Para empezar a usar la app:

1. Abrí la app. El panel se puede consultar sin ingresar.
2. Entrá en **Acceso y perfiles**, escribí la clave **`DOMOS2026`** y elegí un perfil (Operación, Revisor o Auditor).
3. Ya podés modificar registros según tu perfil (ver más abajo).

## 2. Dónde está cada cosa

| Ruta / carpeta | Qué contiene |
| --- | --- |
| `src/routes/index.tsx` | Pantalla **Panel de cupos** (`/`) |
| `src/routes/alumnos.tsx` | Pantalla **Alumnos** (`/alumnos`) |
| `src/routes/historial.tsx` | Pantalla **Historial** (`/historial`) |
| `src/routes/control.tsx` | Pantalla **Control y exportación** (`/control`) |
| `src/routes/acceso.tsx` | Pantalla **Acceso y perfiles** (`/acceso`) |
| `src/routes/__root.tsx` | Estructura raíz de la app y páginas de error |
| `src/components/domos/pages.tsx` | Contenido de cada pantalla (panel, alumnos, historial, control, acceso) |
| `src/components/domos/layout.tsx` | Menú lateral, barra superior, contexto global (sesión, avisos, guardado) |
| `src/components/domos/student-form.tsx` | Formulario de alta y edición de alumnos |
| `src/lib/domos/engine.ts` | **Motor**: reglas de cupo, lista de espera, comandos, eventos, propuestas, cierres, datos de ejemplo, exportación y migración |
| `src/lib/domos/engine.test.ts` | Pruebas del motor |
| `src/components/ui/` | Componentes de interfaz (shadcn/ui) |
| `src/styles.css` | Estilos y tokens de diseño |
| `roadmap.md` | Estado de las tareas |

### Pantallas

- **Panel de cupos**: ocupación por práctica, lista de espera, filtros (práctica, procedencia, búsqueda), vista de tarjetas o lista, alta rápida y botón **Nueva semana**.
- **Alumnos**: tabla con editar, cambiar de práctica, anotar, cancelar inscripción y borrar; exporta el CSV del filtro vigente.
- **Historial**: eventos y comandos con filtros por registro y por fechas, y detalle de cada evento (estado anterior y nuevo).
- **Control y exportación**: conciliación de cupos, cierres, propuestas de revisión, descarga de CSV y de copia JSON, y restauración de copias.
- **Acceso y perfiles**: ingreso con clave local y elección de perfil.

### Perfiles

| Perfil | Puede |
| --- | --- |
| Operación | Dar de alta, editar, cancelar y borrar alumnos; empezar una nueva semana |
| Revisor | Crear propuestas de cambio, aprobar o rechazar propuestas de otros actores, registrar cierres y restaurar copias |
| Auditor | Solo consultar y exportar |

Los actores sintéticos son Sol, Mar y Luz; sirven para probar la separación de decisiones (quien crea una propuesta no puede decidirla).

## 3. Qué está simulado

Esta app es una demo. **Nada sale del navegador.**

| Funcionalidad | Estado | Cómo se comporta |
| --- | --- | --- |
| Autenticación | Simulada | La clave `DOMOS2026` está en `ACCESS_KEY` (`src/lib/domos/engine.ts`) y es pública en el código del navegador. Elegir un perfil **no verifica identidad**. La sesión se guarda en `sessionStorage` (clave `domos-perfil`) y se pierde al cerrar la pestaña. |
| Base de datos | Simulada | Todo vive en `localStorage` (clave `domos-park-practicas-v2`). Cada navegador y cada equipo tiene sus propios datos. |
| Correos | **No existe** | La app no envía correos. Ningún botón dispara un email. |
| WhatsApp y mensajería | **No existe** | No hay avisos ni mensajes a alumnos (por ejemplo, al pasar de la lista de espera a anotado). La promoción es solo un cambio de estado en el panel. |
| Pagos | **No existe** | Los precios de visitantes que se ven en las tarjetas son informativos. No hay cobro, pasarela de pago ni facturación. |
| Invitar a colaboradores | **No existe** | Compartir el proyecto se hace desde Lovable; la app no invita a nadie. |
| Datos de personas | Sintéticos | Nombres, domos y horarios son ejemplos. **No ingreses datos personales ni de salud reales.** |

## 4. Datos de ejemplo y cómo reiniciarlos

Al abrir la app por primera vez (cuando no existe la clave `domos-park-practicas-v2`) se cargan datos de ejemplo:

- 5 prácticas.
- 26 alumnos (15 huéspedes y 11 visitantes).
- Meditación completa (10/10) y 2 personas en lista de espera.
- 6 comandos (uno rechazado, sin evento), 2 propuestas y 1 cierre con un ajuste no aplicado.

### Reiniciar los datos de ejemplo

Los cambios que hagas se conservan al recargar. Para volver al estado inicial hay que borrar el `localStorage`:

**Opción A: desde las herramientas del navegador**

1. Abrí las herramientas de desarrollo (F12).
2. Andá a **Application** (Chrome, Edge) o **Storage** (Firefox).
3. En **Local Storage**, seleccioná el sitio y borrá la clave `domos-park-practicas-v2` (o usá "Clear All").
4. Recargá la página: se vuelve a crear la semilla.

**Opción B: desde la consola**

```js
localStorage.removeItem("domos-park-practicas-v2");
sessionStorage.removeItem("domos-perfil");
location.reload();
```

Para borrar absolutamente todo lo local de la app, `localStorage.clear()` también sirve.

> Esto elimina también el historial y los cambios que hayas hecho. Si querés conservarlos, antes descargá una copia desde **Control y exportación → Descargar copia JSON**. Después se puede recuperar con **Restaurar copia** (perfil Revisor).

## 5. Reglas de negocio

Solo los alumnos **Anotados** cuentan para el cupo. Cancelar o borrar a un Anotado promociona a una sola persona de la lista de espera, por orden de alta. Los cambios hacia una práctica completa se rechazan sin perder el origen. **Nueva semana** borra solo los Cancelados y conserva el historial.

Los cambios se validan en el motor y se guardan antes de mostrar éxito. Los conflictos entre pestañas, las revisiones desactualizadas y los fallos de almacenamiento conservan el estado anterior y el borrador. Un mismo id de comando es idempotente y no puede reutilizarse con datos distintos. Las condiciones inválidas no escriben nada: el comando rechazado de la semilla ilustra la ausencia de eventos.

## 6. Copias y migración

**Control y exportación** descarga el CSV del filtro combinado vigente (práctica, procedencia, búsqueda) y una copia JSON completa. El Revisor puede restaurar tras la validación y confirmación. Se rechaza toda la copia ante ids repetidos, referencias inválidas, exceso de cupo o falta de conciliación.

Formato v1: misma estructura base con `schemaVersion: 1`; los campos de propuestas, cierres y ajustes ausentes se completan con arreglos vacíos. La migración valida todo antes de escribir y conserva ids y cantidades. Los formatos antiguos distintos se rechazan sin restauración parcial. Restaurar reemplaza el snapshot completo, no lo mezcla: exportá un respaldo actual antes de restaurar.

## 7. Compartir el proyecto

Destinatario solicitado: partners@kodarvia.com. Compartir el proyecto requiere acceso al control de colaboradores del proyecto en Lovable; un enlace por sí solo no concede permisos de edición. La app no envía correos ni invita a nadie.

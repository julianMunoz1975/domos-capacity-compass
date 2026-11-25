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
```

Para empezar a usar la app:

1. Abrí la app. El panel se puede consultar sin ingresar.
2. Entrá en **Acceso y perfiles**, escribí la clave **`DOMOS2026`** y elegí un perfil.
3. Ya podés operar según tu perfil (ver más abajo).

### Cambiar la clave del panel

La clave está en la constante `ACCESS_KEY` de `src/lib/domos/engine.ts`:

```ts
export const ACCESS_KEY = "DOMOS2026";
```

Cambiá el valor entre comillas, guardá y volvé a publicar. Es una clave **pública en el código del navegador**; sirve para separar perfiles en una demo, no para proteger datos reales.

## 2. Dónde está cada cosa

| Ruta / carpeta | Qué contiene |
|---|---|
| `src/routes/index.tsx` | Pantalla **Panel de cupos** (`/`) |
| `src/routes/alumnos.tsx` | Pantalla **Alumnos** (`/alumnos`) |
| `src/routes/historial.tsx` | Pantalla **Historial** (`/historial`) |
| `src/routes/control.tsx` | Pantalla **Control y exportación** (`/control`) |
| `src/routes/acceso.tsx` | Pantalla **Acceso y perfiles** (`/acceso`) |
| `src/routes/__root.tsx` | Raíz de la app, tipografía, páginas de error |
| `src/components/domos/pages.tsx` | Contenido de cada pantalla |
| `src/components/domos/layout.tsx` | Menú, barra superior, contexto global |
| `src/components/domos/student-form.tsx` | Formulario de alta, edición y propuesta |
| `src/lib/domos/engine.ts` | **Motor**: reglas de cupo, lista de espera, comandos, eventos, propuestas, cierres, semilla, exportación y migración |
| `src/lib/domos/engine.test.ts` | Pruebas del motor |
| `src/components/ui/` | Componentes shadcn/ui |
| `src/styles.css` | Paleta y tokens de diseño |
| `roadmap.md` | Estado de tareas |

### Pantallas

- **Panel de cupos**: ocupación por práctica, lista de espera, filtros (práctica, procedencia, búsqueda), vista tarjetas o lista, alta rápida y botón **Nueva semana**.
- **Alumnos**: tabla con proponer cambio, cancelar inscripción y borrar; exporta CSV del filtro vigente.
- **Historial**: eventos y comandos con filtros por registro y fechas, con estado anterior y nuevo.
- **Control y exportación**: conciliación, cierres, propuestas, CSV y copia JSON, restauración.
- **Acceso y perfiles**: ingreso con clave local y elección de perfil.

### Perfiles

| Perfil | Puede |
|---|---|
| Operación | Alta de alumnos, cancelar, borrar, nueva semana y **proponer** cambios de edición |
| Revisor | Aprobar o rechazar propuestas (no las propias), registrar cierres y restaurar copias |
| Auditor | Solo consultar y exportar |

Las reglas se aplican en el motor (`engine.ts`), no solo ocultando botones. Siguen siendo una demo local sin autenticación real entre dispositivos.

## 3. Qué está simulado

Esta app es una demo. **Nada sale del navegador.**

| Funcionalidad | Estado | Cómo se comporta |
|---|---|---|
| Autenticación | Simulada | Clave pública en el código. La sesión se guarda en `sessionStorage` (`domos-perfil`) y se pierde al cerrar la pestaña. |
| Base de datos | Simulada | Todo vive en `localStorage` (`domos-park-practicas-v2`). Cada navegador tiene sus propios datos. |
| Correos | No existe | La app no envía correos ni dispara emails. |
| WhatsApp y mensajería | No existe | No hay avisos a alumnos al pasar de lista de espera a anotado. |
| Pagos | No existe | Los precios de visitantes son informativos. No hay cobro ni pasarela. |
| Datos de personas | Sintéticos | Nombres, domos y horarios son ejemplos. No ingreses datos reales. |

## 4. Datos de ejemplo y cómo reiniciarlos

### Cómo se preparan los datos sintéticos

La función `seed()` en `src/lib/domos/engine.ts` arma todos los datos de ejemplo. Se ejecuta **solo si no existe** la clave `domos-park-practicas-v2` en `localStorage`. Para cambiar los datos de ejemplo, editá `seed()` y reiniciá el almacenamiento local.

La semilla contiene:

- **5 prácticas** con días, horarios, cupos y precios según el catálogo:
  - Yoga suave al amanecer — MAR · JUE, 08:00, 60 min, cupo 12, $12.000
  - Hatha yoga — LUN · MIÉ · VIE, 10:00, 75 min, cupo 14, $14.000
  - Meditación al atardecer — VIE · SÁB, 19:30, 45 min, cupo 10, $9.000
  - Respiración y estiramiento en la playa — SÁB, 09:00, 50 min, cupo 16, $10.000
  - Retiro de fin de semana — SÁB A DOM · 2 JORNADAS, 09:00, cupo 8, $95.000
- **26 alumnos** (15 huéspedes con número de domo, 11 visitantes de día)
- Meditación **completa** (10/10) con 2 personas en lista de espera
- 6 comandos (5 aplicados, 1 rechazado sin evento), 2 propuestas (1 pendiente, 1 rechazada) y 1 cierre con 1 ajuste no aplicado

### Reiniciar los datos de ejemplo

**Opción A: desde las herramientas del navegador**

1. F12 → **Application** (Chrome/Edge) o **Storage** (Firefox)
2. Local Storage → seleccioná el sitio → borrá `domos-park-practicas-v2`
3. Recargá: se vuelve a cargar la semilla

**Opción B: desde la consola**

```js
localStorage.removeItem("domos-park-practicas-v2");
sessionStorage.removeItem("domos-perfil");
location.reload();
```

> Antes de reiniciar, descargá una copia desde **Control y exportación → Descargar copia JSON** si querés conservar los datos actuales. Se puede restaurar con el perfil Revisor.

## 5. Reglas de negocio

Solo los alumnos **Anotados** cuentan para el cupo. Con 2 lugares o menos se muestra «Últimos lugares»; en cero, «Completa» y las nuevas altas van a Lista de espera. Cancelar o borrar un Anotado de una práctica completa promociona al primero de la lista de espera. Los cambios hacia una práctica completa se rechazan sin perder el origen. **Nueva semana** borra solo los Cancelados y conserva el historial.

Operación **propone** los cambios de edición; Revisor los decide. El creador de una propuesta no puede aprobarla. Auditor no modifica datos. Las reglas se validan en el motor antes de guardar.

## 6. Copias y migración

Control y exportación descarga el CSV del filtro vigente y una copia JSON completa. Revisor puede restaurar con validación previa. Se rechaza ante ids repetidos, referencias inválidas, exceso de cupo o falta de conciliación. Restaurar reemplaza el snapshot completo; exportá antes si querés conservar los datos actuales.

## 7. Compartir el proyecto

URL publicada: https://domos-capacity-compass.lovable.app  
Contacto de encargo: partners@kodarvia.com (no contactar al cliente directamente)

Compartir acceso de edición al proyecto se hace desde Lovable → Compartir. La app no envía invitaciones.

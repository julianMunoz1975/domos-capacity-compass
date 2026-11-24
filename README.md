# Domos Park · Registro de prácticas

App interna de demostración para yoga y meditación. React, TanStack Start y Tailwind CSS. No usa servicios remotos para guardar registros.

## Ejecutar y probar

```sh
bun install
bun run dev
bunx vitest run src/lib/domos/engine.test.ts src/test/app-routing.test.tsx
```

## Acceso de demo

Entrá en **Acceso y perfiles**, clave **DOMOS2026**, y elegí Operación, Revisor o Auditor. La clave está en `ACCESS_KEY` de `src/lib/domos/engine.ts`; cambiá esa constante para cambiar la clave. Es pública en el código del navegador: **no es un secreto ni autenticación real**. No ingresar datos personales ni datos de salud reales. La selección de perfil no verifica identidad.

El panel se puede consultar sin ingresar; para modificar registros necesitás un perfil. Operación administra alumnos, Revisor crea y decide propuestas de otros actores, registra cierres y restaura copias; Auditor solo consulta y exporta. Usá los actores sintéticos Sol, Mar y Luz para probar separación de decisiones.

## Datos y conservación

La clave propia `domos-park-practicas-v2` de localStorage conserva el snapshot completo (`schemaVersion`, `revision`, prácticas, alumnos, eventos, comandos, propuestas, cierres y ajustes). La semilla solo se crea cuando no existe esa clave: cinco prácticas, 26 alumnos (15 huéspedes, 11 visitantes), meditación 10/10 y dos en espera, seis comandos (uno rechazado sin evento), dos propuestas y un cierre con un ajuste no aplicado. Horarios y nombres son ejemplos sintéticos.

Solo Anotados cuentan para cupo. Cancelar o borrar a un Anotado promociona una sola persona de espera por orden de alta. Los cambios a un destino completo se rechazan sin perder origen. Nueva semana borra solo Cancelados; conserva el historial. Los cambios se validan en el motor y se guardan antes de mostrar éxito. Conflictos entre pestañas, revisiones desactualizadas y fallos de almacenamiento conservan el estado anterior y el borrador. El mismo id de comando es idempotente y no puede reutilizarse con datos diferentes. Las condiciones inválidas no escriben nada; el comando rechazado de la semilla ilustra ausencia de eventos.

## Copias y migración

Control y exportación descarga el CSV del filtro combinado vigente (práctica, procedencia, búsqueda) y una copia JSON completa. Revisor puede restaurar luego de validación y confirmación. Se rechaza toda la copia ante ids repetidos, referencias inválidas, exceso de cupo o falta de conciliación. Formato v1: misma estructura base con `schemaVersion: 1`; los campos propuestas/cierres/ajustes ausentes se completan con arreglos vacíos. La migración valida todo antes de escribir y conserva ids y cantidades. Formatos antiguos diferentes se rechazan sin restauración parcial.

La copia JSON exportada contiene el historial de esa revisión; restaurarla reemplaza el snapshot completo, no lo mezcla. Exportá un respaldo actual antes de restaurar. Borrar almacenamiento del navegador elimina los datos locales; descargar una copia evita perderlos.

## Preview y compartir

Preview: https://id-preview--7d8e37a1-c581-4d56-9e76-7fbf01e28325.lovable.app

Destinatario solicitado: partners@kodarvia.com. Compartir el proyecto requiere acceso al control de colaboradores del proyecto; un enlace por sí solo no concede permisos de edición. Cada navegador tiene datos propios. No se incluye un envío de correo ni se finge haber invitado al destinatario.

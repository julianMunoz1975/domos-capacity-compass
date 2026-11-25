import { z } from "zod";

export const STORAGE_KEY = "domos-park-practicas-v2";
export const ACCESS_KEY = "DOMOS2026"; // Acceso de demostración, no es un secreto ni autenticación.
export type Profile = "Operación" | "Revisor" | "Auditor";
export type Actor = { perfil: Profile; nombre: string };
const studentSchema = z
  .object({
    id: z.string().min(1),
    nombre: z.string().trim().min(2),
    procedencia: z.enum(["Huésped", "Visitante"]),
    domo: z.number().int().min(1).max(9).nullable(),
    practicaId: z.string(),
    estado: z.enum(["Anotado", "Lista de espera", "Cancelado"]),
    ordenAlta: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    (a) => (a.procedencia === "Huésped" ? a.domo !== null : a.domo === null),
    "Huésped requiere domo 1–9; Visitante no lleva domo.",
  );
export type Student = z.infer<typeof studentSchema>;
const practiceSchema = z
  .object({
    id: z.string(),
    nombre: z.string(),
    horario: z.string(),
    dias: z.string(),
    duracion: z.number().int().positive(),
    cupo: z.number().int().nonnegative(),
    precioVisitante: z.number().nonnegative(),
  })
  .strict();
export type Practice = z.infer<typeof practiceSchema>;
const actorSchema = z
  .object({ perfil: z.enum(["Operación", "Revisor", "Auditor"]), nombre: z.string().min(1) })
  .strict();
const commandSchema = z
  .object({
    id: z.string(),
    tipo: z.string(),
    entidad: z.string(),
    actor: actorSchema,
    instante: z.string().datetime(),
    revisionEsperada: z.number().int().nonnegative(),
    datos: z.record(z.string(), z.unknown()),
    resultado: z.enum(["Aplicado", "Rechazado"]),
  })
  .strict();
export type Command = z.infer<typeof commandSchema>;
const eventSchema = z
  .object({
    id: z.string(),
    comandoOrigen: z.string(),
    registro: z.string(),
    instante: z.string().datetime(),
    actor: actorSchema,
    estadoAnterior: studentSchema.nullable(),
    estadoNuevo: studentSchema.nullable(),
    efecto: z.string(),
    motivo: z.string().min(1),
    versionAnterior: z.number().int().nonnegative(),
    versionNueva: z.number().int().nonnegative(),
  })
  .strict();
export type Event = z.infer<typeof eventSchema>;
const proposalSchema = z
  .object({
    id: z.string(),
    registro: z.string(),
    versionPartida: z.number().int().nonnegative(),
    cambios: studentSchema,
    motivo: z.string().min(1),
    creador: actorSchema,
    decision: z.enum(["Pendiente", "Aprobada", "Rechazada"]),
    decisor: actorSchema.nullable(),
  })
  .strict();
const snapshotSchema = z
  .object({
    schemaVersion: z.literal(2),
    revision: z.number().int().nonnegative(),
    practicas: z.array(practiceSchema),
    alumnos: z.array(studentSchema),
    eventos: z.array(eventSchema),
    comandos: z.array(commandSchema),
    propuestas: z.array(proposalSchema),
    cierres: z.array(
      z
        .object({
          id: z.string(),
          instante: z.string().datetime(),
          actor: actorSchema,
          revision: z.number().int(),
          contadores: z.record(z.string(), z.number().int().nonnegative()),
        })
        .strict(),
    ),
    ajustes: z.array(
      z
        .object({
          id: z.string(),
          practicaId: z.string(),
          cantidad: z.number().int(),
          aplicado: z.boolean(),
          motivo: z.string(),
        })
        .strict(),
    ),
  })
  .strict();
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Adapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};
export type Action = {
  id: string;
  tipo: "alta" | "editar" | "cancelar" | "borrar" | "semana" | "proponer" | "decidir" | "cierre";
  entidad: string;
  actor: Actor;
  revisionEsperada: number;
  datos: { alumno?: Student; motivo: string; aprobar?: boolean };
};
export const uid = () => crypto.randomUUID();
export const occupied = (s: Snapshot, id: string) =>
  s.alumnos.filter((a) => a.practicaId === id && a.estado === "Anotado").length;
export const waiting = (s: Snapshot, id: string) =>
  s.alumnos
    .filter((a) => a.practicaId === id && a.estado === "Lista de espera")
    .sort((a, b) => a.ordenAlta - b.ordenAlta);
export const capacityLabel = (available: number) =>
  available === 0 ? "Completa" : available <= 2 ? "Últimos lugares" : "Disponible";
export const percentage = (numerator: number, denominator: number) =>
  denominator === 0 ? "Sin datos" : `${Math.round((numerator / denominator) * 100)}%`;
export function filtered(s: Snapshot, practice: string, origin: string, search: string) {
  const q = search.trim().toLocaleLowerCase("es");
  return s.alumnos.filter(
    (a) =>
      (!practice || a.practicaId === practice) &&
      (!origin || a.procedencia === origin) &&
      (!q || `${a.nombre} ${a.domo ?? ""}`.toLocaleLowerCase("es").includes(q)),
  );
}
export function seed(): Snapshot {
  const practicas: Practice[] = [
    {
      id: "yoga",
      nombre: "Yoga suave al amanecer",
      dias: "LUN · MIÉ · VIE",
      horario: "07:30",
      duracion: 60,
      cupo: 12,
      precioVisitante: 12000,
    },
    {
      id: "hatha",
      nombre: "Hatha yoga",
      dias: "MAR · JUE · SÁB",
      horario: "10:00",
      duracion: 75,
      cupo: 14,
      precioVisitante: 14000,
    },
    {
      id: "meditacion",
      nombre: "Meditación al atardecer",
      dias: "TODOS LOS DÍAS",
      horario: "18:30",
      duracion: 45,
      cupo: 10,
      precioVisitante: 9000,
    },
    {
      id: "respiracion",
      nombre: "Respiración en la playa",
      dias: "MAR · JUE · DOM",
      horario: "08:30",
      duracion: 45,
      cupo: 16,
      precioVisitante: 10000,
    },
    {
      id: "retiro",
      nombre: "Retiro de yoga y meditación",
      dias: "SÁBADO",
      horario: "09:00",
      duracion: 360,
      cupo: 8,
      precioVisitante: 95000,
    },
  ];
  const names = [
    "Lucía Fernández",
    "Mateo Rodríguez",
    "Valentina López",
    "Santiago Pérez",
    "Camila Torres",
    "Joaquín Silva",
    "Sofía Martínez",
    "Tomás García",
    "Martina Díaz",
    "Nicolás Romero",
    "Emma Suárez",
    "Benjamín Castro",
    "Isabella Ruiz",
    "Felipe Acosta",
    "Victoria Molina",
    "Julieta Vega",
    "Lucas Herrera",
    "Clara Méndez",
    "Pedro Ríos",
    "Ana Costa",
    "Bruno Paz",
    "Paula Soler",
    "Diego Luna",
    "Elena Vidal",
    "Gabriel Santos",
    "Renata Gil",
  ];
  const alumnos: Student[] = names.map((nombre, i) => ({
    id: `alumno-${i + 1}`,
    nombre,
    procedencia: i < 15 ? "Huésped" : "Visitante",
    domo: i < 15 ? (i % 9) + 1 : null,
    practicaId:
      i < 12
        ? "meditacion"
        : i < 18
          ? "yoga"
          : i < 22
            ? "hatha"
            : i < 25
              ? "respiracion"
              : "retiro",
    estado: i === 10 || i === 11 ? "Lista de espera" : "Anotado",
    ordenAlta: i + 1,
  }));
  const actor: Actor = { perfil: "Operación", nombre: "Sol · demo" };
  const reviewer: Actor = { perfil: "Revisor", nombre: "Mar · demo" };
  const instante = "2026-11-23T10:00:00.000Z";
  const comandos: Command[] = practicas.map((p, i) => ({
    id: `semilla-comando-${i + 1}`,
    tipo: "semilla",
    entidad: p.id,
    actor,
    instante,
    revisionEsperada: i,
    datos: { practicaId: p.id },
    resultado: "Aplicado",
  }));
  comandos.push({
    id: "semilla-comando-6",
    tipo: "editar",
    entidad: "alumno-1",
    actor: reviewer,
    instante,
    revisionEsperada: 0,
    datos: { motivo: "Revisión desactualizada" },
    resultado: "Rechazado",
  });
  const eventos: Event[] = alumnos.map((a, i) => {
    const index = practicas.findIndex((p) => p.id === a.practicaId);
    return {
      id: `semilla-evento-${i + 1}`,
      comandoOrigen: `semilla-comando-${index + 1}`,
      registro: a.id,
      instante,
      actor,
      estadoAnterior: null,
      estadoNuevo: { ...a },
      efecto: "Alta inicial",
      motivo: "Datos sintéticos de demostración",
      versionAnterior: index,
      versionNueva: index + 1,
    };
  });
  const first = alumnos[0];
  if (!first) throw new Error("Semilla incompleta");
  return {
    schemaVersion: 2,
    revision: 5,
    practicas,
    alumnos,
    comandos,
    eventos,
    propuestas: [
      {
        id: "propuesta-1",
        registro: first.id,
        versionPartida: 5,
        cambios: { ...first, nombre: "Lucía Fernández Costa" },
        motivo: "Completar apellido del registro",
        creador: actor,
        decision: "Pendiente",
        decisor: null,
      },
      {
        id: "propuesta-2",
        registro: first.id,
        versionPartida: 4,
        cambios: { ...first, practicaId: "hatha" },
        motivo: "Cambio solicitado sin confirmar",
        creador: actor,
        decision: "Rechazada",
        decisor: reviewer,
      },
    ],
    cierres: [
      {
        id: "cierre-1",
        instante,
        actor: reviewer,
        revision: 5,
        contadores: Object.fromEntries(
          practicas.map((p) => [
            p.id,
            alumnos.filter((a) => a.practicaId === p.id && a.estado === "Anotado").length,
          ]),
        ),
      },
    ],
    ajustes: [
      {
        id: "ajuste-1",
        practicaId: "meditacion",
        cantidad: -1,
        aplicado: false,
        motivo: "Propuesta de ajuste pendiente de revisión; no altera los cupos",
      },
    ],
  };
}

export function validateSnapshot(value: unknown): Snapshot {
  const result = snapshotSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      `Copia inválida: ${result.error.issues[0]?.message ?? "estructura incorrecta"}`,
    );
  const s = result.data;
  const groups = [
    s.practicas,
    s.alumnos,
    s.eventos,
    s.comandos,
    s.propuestas,
    s.cierres,
    s.ajustes,
  ];
  const ids = groups.flatMap((group) => group.map((item) => item.id));
  if (new Set(ids).size !== ids.length || ids.some((id) => !id))
    throw new Error("Copia rechazada: ids repetidos o vacíos.");
  const practices = new Set(s.practicas.map((p) => p.id));
  const knownStudents = new Set([
    ...s.alumnos.map((a) => a.id),
    ...s.eventos.flatMap((e) =>
      [e.estadoAnterior?.id, e.estadoNuevo?.id].filter((id): id is string => Boolean(id)),
    ),
  ]);
  const commands = new Map(s.comandos.map((c) => [c.id, c]));
  for (const a of [
    ...s.alumnos,
    ...s.eventos.flatMap((e) =>
      [e.estadoAnterior, e.estadoNuevo].filter((a): a is Student => a !== null),
    ),
    ...s.propuestas.map((p) => p.cambios),
  ])
    if (!practices.has(a.practicaId))
      throw new Error("Copia rechazada: referencia de práctica inválida.");
  for (const e of s.eventos) {
    const c = commands.get(e.comandoOrigen);
    if (
      !c ||
      c.resultado !== "Aplicado" ||
      e.versionNueva !== e.versionAnterior + 1 ||
      e.versionNueva > s.revision ||
      (e.estadoAnterior && e.estadoAnterior.id !== e.registro) ||
      (e.estadoNuevo && e.estadoNuevo.id !== e.registro)
    )
      throw new Error("Copia rechazada: referencias de evento inválidas.");
  }
  for (const p of s.propuestas)
    if (
      !knownStudents.has(p.registro) ||
      p.cambios.id !== p.registro ||
      p.versionPartida > s.revision ||
      (p.decision === "Aprobada" && p.decisor?.nombre === p.creador.nombre)
    )
      throw new Error("Copia rechazada: propuesta inválida.");
  for (const a of s.ajustes)
    if (!practices.has(a.practicaId)) throw new Error("Copia rechazada: ajuste inválido.");
  for (const c of s.comandos)
    if (
      c.revisionEsperada > s.revision ||
      (!["semana", "cierre"].includes(c.tipo) &&
        !practices.has(c.entidad) &&
        !knownStudents.has(c.entidad) &&
        !s.propuestas.some((p) => p.id === c.entidad))
    )
      throw new Error("Copia rechazada: referencia de comando inválida.");
  for (const c of s.cierres)
    if (c.revision > s.revision || Object.keys(c.contadores).some((id) => !practices.has(id)))
      throw new Error("Copia rechazada: cierre inválido.");
  for (const p of s.practicas)
    if (occupied(s, p.id) > p.cupo) throw new Error("Copia rechazada: cupo excedido.");
  const reconciliation = reconcile(s);
  if (reconciliation.some((r) => r.diferencia !== 0))
    throw new Error("Copia rechazada: entidades y eventos no concilian.");
  const replay = new Map<string, Student>();
  for (const e of s.eventos) {
    if (e.estadoAnterior && canonical(replay.get(e.registro)) !== canonical(e.estadoAnterior))
      throw new Error("Copia rechazada: cadena de estados de evento inválida.");
    if (e.estadoNuevo) replay.set(e.registro, e.estadoNuevo);
    else if (e.estadoAnterior) replay.delete(e.registro);
  }
  if (
    replay.size !== s.alumnos.length ||
    s.alumnos.some((a) => canonical(replay.get(a.id)) !== canonical(a))
  )
    throw new Error("Copia rechazada: registros y eventos no coinciden.");
  return s;
}
export function migrate(value: unknown): Snapshot {
  if (typeof value !== "object" || value === null) throw new Error("Copia inválida.");
  const source = value as Record<string, unknown>;
  if (source["schemaVersion"] === 1)
    return validateSnapshot({
      ...source,
      schemaVersion: 2,
      propuestas: source["propuestas"] ?? [],
      cierres: source["cierres"] ?? [],
      ajustes: source["ajustes"] ?? [],
    });
  return validateSnapshot(value);
}
export function load(adapter: Adapter): Snapshot {
  const raw = adapter.getItem(STORAGE_KEY);
  if (raw === null) {
    const s = seed();
    adapter.setItem(STORAGE_KEY, JSON.stringify(s));
    return s;
  }
  const parsed: unknown = JSON.parse(raw);
  const s = migrate(parsed);
  if ((parsed as Record<string, unknown>)["schemaVersion"] === 1)
    adapter.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}
export function reconcile(s: Snapshot) {
  const source = new Map<string, Student>();
  for (const e of s.eventos) {
    if (e.estadoNuevo) source.set(e.registro, e.estadoNuevo);
    else if (e.estadoAnterior) source.delete(e.registro);
  }
  return s.practicas.map((p) => {
    const eventos = [...source.values()].filter(
      (a) => a.practicaId === p.id && a.estado === "Anotado",
    ).length;
    const actual = occupied(s, p.id);
    return { practica: p.nombre, id: p.id, actual, eventos, diferencia: actual - eventos };
  });
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "";
}
export function apply(
  s: Snapshot,
  action: Action,
): { snapshot: Snapshot; message: string; duplicate: boolean } {
  const previous = s.comandos.find((c) => c.id === action.id);
  if (previous) {
    const same =
      previous.tipo === action.tipo &&
      previous.entidad === action.entidad &&
      canonical(previous.datos) === canonical(action.datos) &&
      canonical(previous.actor) === canonical(action.actor) &&
      previous.revisionEsperada === action.revisionEsperada;
    if (!same)
      throw new Error(
        "El id de comando ya existe con datos distintos. No se guardó ningún cambio.",
      );
    return {
      snapshot: s,
      message: "Este comando ya se procesó; no se repite el efecto.",
      duplicate: true,
    };
  }
  if (action.actor.perfil === "Auditor")
    throw new Error("Auditor solo puede consultar y exportar.");
  if (action.revisionEsperada !== s.revision)
    throw new Error("Revisión desactualizada. Recargá los datos antes de guardar.");
  if (!action.datos.motivo.trim()) throw new Error("Indicá el motivo del cambio.");
  if (action.actor.perfil === "Revisor" && !["proponer", "decidir", "cierre"].includes(action.tipo))
    throw new Error("Revisor debe enviar una propuesta, no editar directamente.");
  if (action.actor.perfil === "Operación" && action.tipo === "editar")
    throw new Error("Operación debe enviar una propuesta, no editar directamente.");
  if (["decidir", "cierre"].includes(action.tipo) && action.actor.perfil !== "Revisor")
    throw new Error("Esta acción requiere el perfil Revisor.");
  const next = structuredClone(s);
  const instante = new Date().toISOString();
  let message = "Cambios guardados.";
  const event = (before: Student | null, after: Student | null, effect: string, registro: string) =>
    next.eventos.push({
      id: uid(),
      comandoOrigen: action.id,
      registro,
      instante,
      actor: action.actor,
      estadoAnterior: before ? { ...before } : null,
      estadoNuevo: after ? { ...after } : null,
      efecto: effect,
      motivo: action.datos.motivo,
      versionAnterior: s.revision,
      versionNueva: s.revision + 1,
    });
  const promote = (practiceId: string) => {
    const p = next.practicas.find((p) => p.id === practiceId);
    const first = waiting(next, practiceId)[0];
    if (p && first && occupied(next, practiceId) < p.cupo) {
      const before = { ...first };
      first.estado = "Anotado";
      event(before, first, "Promoción de lista de espera", first.id);
      message += ` ${first.nombre} pasó de lista de espera a Anotado.`;
    }
  };
  const edit = (input: Student, isNew: boolean) => {
    const parsed = studentSchema.safeParse(input);
    if (!parsed.success)
      throw new Error(
        `Registro inválido: ${parsed.error.issues[0]?.message ?? "revisá los campos"}`,
      );
    const a = parsed.data;
    const p = next.practicas.find((p) => p.id === a.practicaId);
    if (!p) throw new Error("La práctica no existe.");
    const index = next.alumnos.findIndex((item) => item.id === a.id);
    const before = next.alumnos[index];
    if (isNew && (before || next.eventos.some((e) => e.registro === a.id)))
      throw new Error("El id de alumno ya existe.");
    if (!isNew && !before) throw new Error("El alumno ya no existe.");
    const available = p.cupo - occupied(next, p.id);
    if (before && before.practicaId !== a.practicaId && available === 0)
      throw new Error("La práctica de destino está completa. Se conserva la práctica de origen.");
    if (
      a.estado === "Anotado" &&
      !(before?.estado === "Anotado" && before.practicaId === a.practicaId) &&
      available === 0
    ) {
      if (isNew) {
        a.estado = "Lista de espera";
        message = "La práctica está completa. Alumno agregado a la lista de espera.";
      } else throw new Error("No hay cupo disponible para anotar.");
    }
    if (isNew) {
      a.ordenAlta = Math.max(0, ...next.alumnos.map((a) => a.ordenAlta)) + 1;
      next.alumnos.push(a);
    } else {
      if (before) a.ordenAlta = before.ordenAlta;
      next.alumnos[index] = a;
    }
    event(before ?? null, a, isNew ? "Alta de alumno" : "Edición de alumno", a.id);
    if (
      before?.estado === "Anotado" &&
      (a.estado !== "Anotado" || a.practicaId !== before.practicaId)
    )
      promote(before.practicaId);
  };
  if (action.tipo === "alta" || action.tipo === "editar") {
    if (!action.datos.alumno || action.datos.alumno.id !== action.entidad)
      throw new Error("Falta un alumno válido.");
    edit(action.datos.alumno, action.tipo === "alta");
  } else if (action.tipo === "cancelar" || action.tipo === "borrar") {
    const index = next.alumnos.findIndex((a) => a.id === action.entidad);
    const a = next.alumnos[index];
    if (!a) throw new Error("El alumno ya no existe.");
    const before = { ...a };
    if (action.tipo === "borrar") {
      next.alumnos.splice(index, 1);
      event(before, null, "Baja de alumno", a.id);
      message = "Alumno borrado.";
    } else {
      if (a.estado === "Cancelado") throw new Error("El registro ya está cancelado.");
      a.estado = "Cancelado";
      event(before, a, "Cancelación", a.id);
      message = "Inscripción cancelada.";
    }
    if (before.estado === "Anotado") promote(before.practicaId);
  } else if (action.tipo === "semana") {
    const cancelled = next.alumnos.filter((a) => a.estado === "Cancelado");
    for (const a of cancelled) event(a, null, "Limpieza semanal: cancelado", a.id);
    next.alumnos = next.alumnos.filter((a) => a.estado !== "Cancelado");
    if (!cancelled.length) event(null, null, "Nueva semana sin cancelados", "semana");
    message = `Nueva semana: ${cancelled.length} cancelados borrados. Anotados y lista de espera se conservan.`;
  } else if (action.tipo === "proponer") {
    const a = action.datos.alumno;
    if (!a || !next.alumnos.some((item) => item.id === a.id) || a.id !== action.entidad)
      throw new Error("El registro no existe.");
    const checked = studentSchema.parse(a);
    next.propuestas.push({
      id: uid(),
      registro: a.id,
      versionPartida: s.revision + 1,
      cambios: checked,
      motivo: action.datos.motivo,
      creador: action.actor,
      decision: "Pendiente",
      decisor: null,
    });
    event(null, null, "Propuesta creada", a.id);
    message = "Propuesta guardada; no modifica el alumno hasta su aprobación.";
  } else if (action.tipo === "decidir") {
    const proposal = next.propuestas.find((p) => p.id === action.entidad);
    if (!proposal || proposal.decision !== "Pendiente")
      throw new Error("La propuesta ya fue decidida o no existe.");
    if (proposal.creador.nombre === action.actor.nombre)
      throw new Error("El creador no puede decidir su propia propuesta.");
    if (action.datos.aprobar) {
      if (proposal.versionPartida !== s.revision)
        throw new Error(
          "La propuesta parte de una versión desactualizada. Rechazala y creá una nueva.",
        );
      edit(proposal.cambios, false);
    }
    proposal.decision = action.datos.aprobar ? "Aprobada" : "Rechazada";
    proposal.decisor = action.actor;
    event(null, null, `Propuesta ${proposal.decision.toLocaleLowerCase("es")}`, proposal.registro);
    message = `Propuesta ${proposal.decision.toLocaleLowerCase("es")}.`;
  } else if (action.tipo === "cierre") {
    if (reconcile(next).some((r) => r.diferencia !== 0))
      throw new Error("No se puede cerrar: hay diferencias de conciliación.");
    next.cierres.push({
      id: uid(),
      instante,
      actor: action.actor,
      revision: s.revision + 1,
      contadores: Object.fromEntries(next.practicas.map((p) => [p.id, occupied(next, p.id)])),
    });
    event(null, null, "Cierre de conciliación", "cierre");
    message = "Cierre registrado sin modificar los cupos.";
  }
  next.revision += 1;
  next.comandos.push({
    id: action.id,
    tipo: action.tipo,
    entidad: action.entidad,
    actor: action.actor,
    instante,
    revisionEsperada: action.revisionEsperada,
    datos: action.datos,
    resultado: "Aplicado",
  });
  return { snapshot: validateSnapshot(next), message, duplicate: false };
}
export function transact(s: Snapshot, action: Action, adapter: Adapter) {
  const stored = adapter.getItem(STORAGE_KEY);
  if (stored !== null && migrate(JSON.parse(stored)).revision !== s.revision)
    throw new Error("Otra pestaña cambió los datos. Recargá antes de guardar.");
  const result = apply(s, action);
  if (!result.duplicate) {
    try {
      adapter.setItem(STORAGE_KEY, JSON.stringify(result.snapshot));
    } catch {
      throw new Error(
        "No se pudo guardar en este navegador. Tu borrador y los datos anteriores se conservan.",
      );
    }
  }
  return result;
}
export function restore(
  value: unknown,
  adapter: Adapter,
  actor: Actor,
  current: Snapshot,
): Snapshot {
  if (actor.perfil !== "Revisor") throw new Error("Solo Revisor puede restaurar una copia.");
  const validated = migrate(value);
  const stored = adapter.getItem(STORAGE_KEY);
  if (stored && migrate(JSON.parse(stored)).revision !== current.revision)
    throw new Error("Otra pestaña cambió los datos. Recargá antes de restaurar.");
  try {
    adapter.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch {
    throw new Error("No se pudo guardar la copia. Los datos anteriores se conservan.");
  }
  return validated;
}
export function toCsv(rows: Student[], s: Snapshot) {
  const cell = (v: unknown) => {
    let text = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\ufeff" +
    [
      ["Nombre", "Procedencia", "Domo", "Práctica", "Estado"],
      ...rows.map((a) => [
        a.nombre,
        a.procedencia,
        a.domo,
        s.practicas.find((p) => p.id === a.practicaId)?.nombre,
        a.estado,
      ]),
    ]
      .map((row) => row.map(cell).join(";"))
      .join("\r\n")
  );
}

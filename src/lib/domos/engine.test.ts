import { describe, it, expect } from "vitest";
import {
  seed,
  apply,
  transact,
  restore,
  load,
  migrate,
  validateSnapshot,
  occupied,
  waiting,
  capacityLabel,
  percentage,
  filtered,
  STORAGE_KEY,
  type Action,
  type Snapshot,
  type Student,
} from "./engine";
const actor = { perfil: "Operación" as const, nombre: "Sol · demo" };
function action(s: Snapshot, tipo: Action["tipo"], entidad: string, alumno?: Student): Action {
  return {
    id: "test-command",
    tipo,
    entidad,
    actor,
    revisionEsperada: s.revision,
    datos: { motivo: "Prueba", ...(alumno ? { alumno } : {}) },
  };
}
function newStudent(s: Snapshot): Student {
  const a = s.alumnos[0];
  if (!a) throw new Error("Sin semilla");
  return { ...a, id: "nuevo", nombre: "Prueba Alumno", procedencia: "Visitante", domo: null };
}
function adapter(s: Snapshot) {
  let raw = JSON.stringify(s);
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
}
describe("reglas de Domos Park", () => {
  it("semilla: cinco cupos y precios concretos, 26 alumnos, 15 huéspedes y 11 visitantes", () => {
    const s = seed();
    expect(s.practicas.map((p) => [p.cupo, p.precioVisitante])).toEqual([
      [12, 12000],
      [14, 14000],
      [10, 9000],
      [16, 10000],
      [8, 95000],
    ]);
    expect(s.alumnos).toHaveLength(26);
    expect(s.alumnos.filter((a) => a.procedencia === "Huésped")).toHaveLength(15);
    expect(s.alumnos.filter((a) => a.procedencia === "Visitante")).toHaveLength(11);
    expect(s.comandos).toHaveLength(6);
    expect(s.comandos.filter((c) => c.resultado === "Rechazado")).toHaveLength(1);
    expect(s.eventos.some((e) => e.comandoOrigen === "semilla-comando-6")).toBe(false);
    expect(validateSnapshot(s)).toEqual(s);
  });
  it("solo Anotados cuentan: meditación 10/10 con dos en espera", () => {
    const s = seed();
    expect(occupied(s, "meditacion")).toBe(10);
    expect(waiting(s, "meditacion")).toHaveLength(2);
  });
  it("etiqueta completa en cero y últimos lugares en uno y dos", () => {
    expect(capacityLabel(0)).toBe("Completa");
    expect(capacityLabel(1)).toBe("Últimos lugares");
    expect(capacityLabel(2)).toBe("Últimos lugares");
    expect(capacityLabel(3)).toBe("Disponible");
  });
  it("alta completa va a espera", () => {
    const s = seed();
    const n = newStudent(s);
    const r = apply(s, action(s, "alta", n.id, n));
    expect(r.snapshot.alumnos.find((a) => a.id === n.id)?.estado).toBe("Lista de espera");
    expect(occupied(r.snapshot, "meditacion")).toBe(10);
  });
  for (const tipo of ["cancelar", "borrar"] as const)
    it(`${tipo} libera solo una vacante y promociona al primero`, () => {
      const s = seed();
      const r = apply(s, action(s, tipo, "alumno-1"));
      expect(r.snapshot.alumnos.find((a) => a.id === "alumno-11")?.estado).toBe("Anotado");
      expect(r.snapshot.alumnos.find((a) => a.id === "alumno-12")?.estado).toBe("Lista de espera");
      expect(occupied(r.snapshot, "meditacion")).toBe(10);
      if (tipo === "borrar")
        expect(r.snapshot.alumnos.some((a) => a.id === "alumno-1")).toBe(false);
    });
  it("domo obligatorio solo huésped en rango 1–9", () => {
    const s = seed();
    for (const domo of [null, 0, 10]) {
      const n = { ...newStudent(s), procedencia: "Huésped" as const, domo };
      expect(() => apply(s, action(s, "alta", n.id, n))).toThrow();
    }
    const n = { ...newStudent(s), practicaId: "yoga" };
    expect(apply(s, action(s, "alta", n.id, n)).snapshot.alumnos.at(-1)?.domo).toBeNull();
  });
  it("filtros combinados", () => {
    expect(filtered(seed(), "meditacion", "Huésped", "Lucía").map((a) => a.id)).toEqual([
      "alumno-1",
    ]);
    expect(filtered(seed(), "meditacion", "Visitante", "Lucía")).toEqual([]);
  });
  it("cambio a destino completo rechaza y conserva origen", () => {
    const s = seed();
    const a = s.alumnos.find((a) => a.practicaId === "yoga");
    if (!a) throw new Error("Sin alumno");
    expect(() => apply(s, action(s, "editar", a.id, { ...a, practicaId: "meditacion" }))).toThrow(
      "destino",
    );
    expect(s.alumnos.find((item) => item.id === a.id)?.practicaId).toBe("yoga");
  });
  it("mismo comando un solo efecto; datos distintos rechazan", () => {
    const s = seed();
    const a = action(s, "cancelar", "alumno-1");
    const r = apply(s, a);
    expect(apply(r.snapshot, a).snapshot).toEqual(r.snapshot);
    expect(() => apply(r.snapshot, { ...a, datos: { motivo: "Otro" } })).toThrow("datos distintos");
  });
  it("revisión desactualizada e inválidos conservan estado", () => {
    const s = seed();
    const before = structuredClone(s);
    expect(() => apply(s, { ...action(s, "cancelar", "alumno-1"), revisionEsperada: 0 })).toThrow(
      "desactualizada",
    );
    expect(() => apply(s, action(s, "cancelar", "inexistente"))).toThrow();
    expect(s).toEqual(before);
  });
  it("fallo del adaptador conserva estado y borrador", () => {
    const s = seed();
    const a = action(s, "alta", "nuevo", newStudent(s));
    const before = structuredClone(a);
    expect(() =>
      transact(s, a, {
        getItem: () => JSON.stringify(s),
        setItem: () => {
          throw new Error("fallo");
        },
      }),
    ).toThrow("borrador");
    expect(a).toEqual(before);
    expect(s.alumnos).toHaveLength(26);
  });
  it("Auditor no modifica en el motor", () => {
    const s = seed();
    expect(() =>
      apply(s, {
        ...action(s, "cancelar", "alumno-1"),
        actor: { perfil: "Auditor", nombre: "Luz" },
      }),
    ).toThrow("Auditor");
  });
  it("creador no aprueba su propuesta", () => {
    const s = seed();
    expect(() =>
      apply(s, {
        ...action(s, "decidir", "propuesta-1"),
        actor: { perfil: "Revisor", nombre: "Sol · demo" },
        datos: { motivo: "Aprobar", aprobar: true },
      }),
    ).toThrow("creador");
  });
  it("nueva semana borra solo cancelados sin borrar eventos", () => {
    const s = seed();
    const cancelled = apply(s, action(s, "cancelar", "alumno-1")).snapshot;
    const next = apply(cancelled, {
      ...action(cancelled, "semana", "semana"),
      id: "week",
    }).snapshot;
    expect(next.alumnos).toHaveLength(25);
    expect(next.alumnos.filter((a) => a.estado === "Lista de espera")).toHaveLength(1);
    expect(next.eventos.length).toBeGreaterThan(cancelled.eventos.length);
  });
  it("persistencia tras recarga", () => {
    const s = seed();
    const a = adapter(s);
    const r = transact(s, action(s, "cancelar", "alumno-1"), a);
    expect(load(a)).toEqual(r.snapshot);
    expect(STORAGE_KEY).toBe("domos-park-practicas-v2");
  });
  it("migración v1 conserva ids y cantidades y rechaza inválidos sin escritura", () => {
    const s = seed();
    expect(migrate({ ...s, schemaVersion: 1 }).alumnos).toEqual(s.alumnos);
    const a = adapter(s);
    expect(() =>
      restore(
        { ...s, schemaVersion: 1, alumnos: [...s.alumnos, s.alumnos[0]] },
        a,
        { perfil: "Revisor", nombre: "Mar" },
        s,
      ),
    ).toThrow("ids repetidos");
    expect(load(a)).toEqual(s);
  });
  it("restauración rechaza referencias inválidas completamente", () => {
    const s = seed();
    const a = adapter(s);
    const copy = structuredClone(s);
    const first = copy.alumnos[0];
    if (first) first.practicaId = "inexistente";
    expect(() => restore(copy, a, { perfil: "Revisor", nombre: "Mar" }, s)).toThrow("referencia");
    expect(load(a)).toEqual(s);
  });
});

describe("respaldo y control adicional", () => {
  it("indicadores sin denominador muestran Sin datos", () => {
    expect(percentage(0, 0)).toBe("Sin datos");
    expect(percentage(24, 60)).toBe("40%");
  });
  it("visitante no lleva domo", () => {
    const s = seed();
    const n = { ...newStudent(s), domo: 1 };
    expect(() => apply(s, action(s, "alta", n.id, n))).toThrow("Visitante");
  });
  it("revisor aprueba propuesta ajena de versión vigente", () => {
    const s = seed();
    const a = {
      ...action(s, "decidir", "propuesta-1"),
      actor: { perfil: "Revisor" as const, nombre: "Mar · demo" },
      datos: { motivo: "Revisión realizada", aprobar: true },
    };
    const r = apply(s, a);
    expect(r.snapshot.alumnos[0]?.nombre).toBe("Lucía Fernández Costa");
    expect(r.snapshot.propuestas[0]?.decision).toBe("Aprobada");
  });
  it("propuesta desactualizada no modifica", () => {
    const s = seed();
    const r = apply(s, action(s, "cancelar", "alumno-2")).snapshot;
    const a = {
      ...action(r, "decidir", "propuesta-1"),
      id: "approve",
      actor: { perfil: "Revisor" as const, nombre: "Mar · demo" },
      datos: { motivo: "Revisión realizada", aprobar: true },
    };
    expect(() => apply(r, a)).toThrow("desactualizada");
    expect(r.propuestas[0]?.decision).toBe("Pendiente");
  });
  it("otra pestaña impide sobrescritura", () => {
    const s = seed();
    const other = apply(s, action(s, "cancelar", "alumno-1")).snapshot;
    const store = adapter(other);
    expect(() => transact(s, action(s, "cancelar", "alumno-2"), store)).toThrow("pestaña");
    expect(load(store)).toEqual(other);
  });
  it("semilla solo con clave ausente", () => {
    let raw: string | null = null;
    let writes = 0;
    const store = {
      getItem: () => raw,
      setItem: (_k: string, v: string) => {
        raw = v;
        writes++;
      },
    };
    const first = load(store);
    expect(first.alumnos).toHaveLength(26);
    expect(load(store)).toEqual(first);
    expect(writes).toBe(1);
  });
  it("datos de entidades alterados sin evento invalidan copia", () => {
    const s = seed();
    const first = s.alumnos[0];
    if (!first) throw new Error("Sin datos");
    first.nombre = "Cambio sin evento";
    expect(() => validateSnapshot(s)).toThrow("no coinciden");
  });
  it("Auditor no restaura y copia inválida no escribe", () => {
    const s = seed();
    const store = adapter(s);
    expect(() => restore(s, store, { perfil: "Auditor", nombre: "Luz" }, s)).toThrow("Revisor");
    expect(load(store)).toEqual(s);
  });
});

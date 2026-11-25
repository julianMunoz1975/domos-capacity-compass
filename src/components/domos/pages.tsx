import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sun,
  Flower2,
  Moon,
  Wind,
  Palmtree,
  Plus,
  ArrowRight,
  Clock3,
  Users,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Download,
  Pencil,
  Trash2,
  X,
  ArrowLeftRight,
  History,
  ShieldCheck,
  Check,
  Upload,
  FileJson,
  ClipboardCheck,
  LockKeyhole,
  ArrowUpRight,
  CircleCheck,
  SlidersHorizontal,
  TentTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import coast from "@/assets/domos-coast.png.asset.json";
import {
  uid,
  occupied,
  waiting,
  filtered,
  capacityLabel,
  percentage,
  reconcile,
  toCsv,
  migrate,
  type Student,
  type Profile,
  type Action,
  type Snapshot,
} from "@/lib/domos/engine";
import { useDomos } from "./layout";
import { StudentForm } from "./student-form";
const money = (n: number) => `$${n.toLocaleString("es-AR")}`;
const icons = [Sun, Flower2, Moon, Wind, Palmtree];
function Loading() {
  const { loaded } = useDomos();
  return (
    <div className="empty-state">
      {loaded
        ? "No se pudieron cargar los datos. Se conserva la copia local para su revisión."
        : "Preparando las prácticas…"}
    </div>
  );
}
export function Filters() {
  const { snapshot, practice, origin, search, setPractice, setOrigin, setSearch } = useDomos();
  return (
    <>
      <select
        className="select-control"
        aria-label="Filtrar por práctica"
        value={practice}
        onChange={(e) => setPractice(e.target.value)}
      >
        <option value="">Todas las prácticas</option>
        {snapshot?.practicas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
      <select
        className="select-control"
        aria-label="Filtrar por procedencia"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
      >
        <option value="">Toda procedencia</option>
        <option>Huésped</option>
        <option>Visitante</option>
      </select>
      <div className="relative flex-1 min-w-44">
        <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
        <Input
          className="pl-9 h-[38px] bg-card text-xs"
          aria-label="Buscar alumno"
          placeholder="Buscar alumno o domo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {(practice || origin || search) && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Limpiar filtros"
          title="Limpiar filtros"
          onClick={() => {
            setPractice("");
            setOrigin("");
            setSearch("");
          }}
        >
          <X />
        </Button>
      )}
    </>
  );
}
function useRegistration() {
  const { actor, notify } = useDomos();
  const [form, setForm] = useState<{ initial: Student | null; practiceId: string } | null>(null);
  const open = (initial: Student | null, practiceId = "") => {
    if (!actor) {
      notify("Ingresá con un perfil de demo antes de modificar registros.", true);
      return;
    }
    if (actor.perfil === "Auditor" || (actor.perfil === "Revisor" && !initial)) {
      notify("Este perfil no puede dar altas ni editar directamente.", true);
      return;
    }
    setForm({ initial, practiceId });
  };
  return {
    open,
    formElement: form ? (
      <StudentForm
        initial={form.initial}
        practiceId={form.practiceId}
        close={() => setForm(null)}
      />
    ) : null,
  };
}
function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function ExportCsv() {
  const { snapshot, practice, origin, search, notify } = useDomos();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (snapshot) {
          const rows = filtered(snapshot, practice, origin, search);
          download(toCsv(rows, snapshot), "domos-park-alumnos.csv", "text/csv;charset=utf-8");
          notify(`CSV exportado: ${rows.length} alumnos del filtro vigente.`);
        }
      }}
    >
      <Download />
      Exportar CSV
    </Button>
  );
}
function Confirm({
  title,
  text,
  accept,
  close,
}: {
  title: string;
  text: string;
  accept: () => void;
  close: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription>{text}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={close}>
            Volver
          </Button>
          <Button onClick={accept}>
            <Check />
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function PanelPage() {
  const { snapshot, actor, practice, origin, search, setPractice, dispatch } = useDomos();
  const { open, formElement } = useRegistration();
  const [list, setList] = useState(false);
  const [week, setWeek] = useState(false);
  const [weekId, setWeekId] = useState("");
  const [weekRevision, setWeekRevision] = useState(0);
  if (!snapshot) return <Loading />;
  const total = snapshot.alumnos.filter((a) => a.estado === "Anotado").length;
  const waitTotal = snapshot.alumnos.filter((a) => a.estado === "Lista de espera").length;
  const capacity = snapshot.practicas.reduce((n, p) => n + p.cupo, 0);
  const rows = filtered(snapshot, practice, origin, search);
  const practices = snapshot.practicas.filter(
    (p) =>
      (!practice || p.id === practice) &&
      (!(origin || search) || rows.some((a) => a.practicaId === p.id)),
  );
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">BIENESTAR EN DOMOS PARK</p>
          <h1 className="page-heading">Panel de cupos</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Cada práctica, un momento para conectar.
          </p>
        </div>
        <Button
          onClick={() => open(null)}
          disabled={actor?.perfil === "Auditor" || actor?.perfil === "Revisor"}
        >
          <Plus />
          Anotar alumno
        </Button>
      </div>
      <div className="coast-strip">
        <img src={coast.url} alt="Domo de glamping frente al mar entre médanos y pastos costeros" />
        <div className="coast-copy">
          <h2>
            Bienestar, al ritmo
            <br />
            de la costa.
          </h2>
          <p>Yoga y meditación · Domos Park</p>
        </div>
      </div>
      <div className="stats-band">
        <div className="stat">
          <div className="stat-label">
            <Users size={14} />
            Alumnos anotados
          </div>
          <div className="stat-value">
            {total}
            <span className="text-sm text-muted-foreground ml-2">/ {capacity}</span>
          </div>
          <div className="stat-help">En las cinco prácticas</div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <Clock3 size={14} />
            En lista de espera
          </div>
          <div className="stat-value">{waitTotal.toString().padStart(2, "0")}</div>
          <div className="stat-help">Por orden de inscripción</div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <Leaf size={14} />
            Prácticas disponibles
          </div>
          <div className="stat-value">
            {snapshot.practicas
              .filter((p) => occupied(snapshot, p.id) < p.cupo)
              .length.toString()
              .padStart(2, "0")}
            <span className="text-sm text-muted-foreground ml-2">
              / {snapshot.practicas.length}
            </span>
          </div>
          <div className="stat-help">Con lugares para anotar</div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <TentTree size={14} />
            Ocupación total
          </div>
          <div className="stat-value">{percentage(total, capacity)}</div>
          <div className="stat-help">Solo alumnos anotados</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 mt-7">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={16} strokeWidth={1.5} />
          Prácticas de la semana
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={actor?.perfil === "Auditor" || actor?.perfil === "Revisor"}
          onClick={() => {
            setWeekId(uid());
            setWeekRevision(snapshot.revision);
            setWeek(true);
          }}
        >
          <CalendarDays />
          Nueva semana
        </Button>
      </div>
      <div className="filter-row">
        <Filters />
        <div className="hidden sm:flex items-center border border-border rounded-md bg-card p-0.5">
          <Button
            variant={list ? "ghost" : "secondary"}
            size="icon"
            className="size-8"
            title="Vista de tarjetas"
            aria-label="Vista de tarjetas"
            aria-pressed={!list}
            onClick={() => setList(false)}
          >
            <LayoutGrid />
          </Button>
          <Button
            variant={list ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            title="Vista de lista"
            aria-label="Vista de lista"
            aria-pressed={list}
            onClick={() => setList(true)}
          >
            <List />
          </Button>
        </div>
      </div>
      {list ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRÁCTICA</th>
                <th>HORARIO</th>
                <th>OCUPADOS / CUPO</th>
                <th>ESPERA</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {practices.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nombre}</td>
                  <td>{p.horario}</td>
                  <td>
                    {occupied(snapshot, p.id)} / {p.cupo}
                  </td>
                  <td>{waiting(snapshot, p.id).length}</td>
                  <td>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/alumnos" onClick={() => setPractice(p.id)}>
                        Ver alumnos
                        <ArrowRight />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="practice-grid">
          {practices.map((p) => {
            const n = occupied(snapshot, p.id);
            const available = p.cupo - n;
            const label = capacityLabel(available);
            const index = snapshot.practicas.findIndex((item) => item.id === p.id);
            const Icon = icons[index] ?? Leaf;
            return (
              <article key={p.id} className={`practice-card ${available === 0 ? "complete" : ""}`}>
                <div className="flex justify-between items-center gap-2">
                  <Icon size={24} strokeWidth={1.3} />
                  <span className={`chalk-tag ${available === 0 ? "complete" : ""}`}>{label}</span>
                </div>
                <h2 className="practice-name">{p.nombre}</h2>
                <div className="card-meta">
                  <Clock3 size={12} />
                  {p.id === "retiro" ? (
                    <span>2 jornadas · Sáb a Dom</span>
                  ) : (
                    <>
                      <span>{p.horario} hs</span>
                      <span className="mx-1">·</span>
                      <span>{p.duracion >= 60 ? `${p.duracion / 60} h` : `${p.duracion} min`}</span>
                    </>
                  )}
                </div>
                <p className="text-[9px] text-chalk-muted mt-2 tracking-[1px]">{p.dias}</p>
                <div className="chalk-divider" />
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-chalk-muted">Visitantes</span>
                    <p className="text-base mt-0.5">
                      {money(p.precioVisitante)}
                      <span className="text-[9px] text-chalk-muted ml-1">/ persona</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-chalk text-3xl">
                      {n}
                      <span className="text-chalk-muted text-xl"> / {p.cupo}</span>
                    </span>
                    <p className="text-[9px] text-chalk-muted">lugares ocupados</p>
                  </div>
                </div>
                <progress
                  className="chalk-progress"
                  max={p.cupo || 1}
                  value={n}
                  aria-label={`Ocupación de ${p.nombre}`}
                />
                <div className="flex items-center justify-between text-[10px] text-chalk-muted mb-4">
                  <span className="flex items-center gap-1.5">
                    <Users size={12} />
                    {waiting(snapshot, p.id).length} en lista de espera
                  </span>
                  <span>
                    {available} {available === 1 ? "lugar libre" : "lugares libres"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <Button variant="chalkLink" size="sm" className="px-0 text-xs" asChild>
                    <Link to="/alumnos" onClick={() => setPractice(p.id)}>
                      Ver alumnos
                      <ArrowRight size={13} />
                    </Link>
                  </Button>
                  <Button
                    variant="chalk"
                    size="icon"
                    className="size-7"
                    aria-label={`Anotar en ${p.nombre}`}
                    title={`Anotar en ${p.nombre}`}
                    disabled={actor?.perfil === "Auditor" || actor?.perfil === "Revisor"}
                    onClick={() => open(null, p.id)}
                  >
                    <Plus />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {!practices.length && (
        <div className="empty-state">No hay prácticas que coincidan con los filtros.</div>
      )}
      <div className="health-note">
        <Leaf size={19} className="shrink-0 text-success mt-0.5" />
        <div>
          <span className="font-medium text-foreground">Cuidamos cada experiencia.</span>
          <p>
            Salud · Ejemplo: si tenés una lesión, estás embarazada o sentís molestias, avisale a
            quien guía la práctica.
          </p>
        </div>
      </div>
      {formElement}
      {week && (
        <Confirm
          title="¿Empezamos una nueva semana?"
          text="Se borran solo los alumnos Cancelados. Los Anotados, la lista de espera y el historial se conservan."
          close={() => setWeek(false)}
          accept={() => {
            if (
              dispatch({
                id: weekId,
                tipo: "semana",
                entidad: "semana",
                revisionEsperada: weekRevision,
                datos: { motivo: "Limpieza de cancelados por nueva semana" },
              })
            )
              setWeek(false);
          }}
        />
      )}
    </>
  );
}
export function StudentsPage() {
  const { snapshot, actor, practice, origin, search, dispatch } = useDomos();
  const { open, formElement } = useRegistration();
  const [confirm, setConfirm] = useState<{
    student: Student;
    tipo: "cancelar" | "borrar";
    id: string;
    revision: number;
  } | null>(null);
  if (!snapshot) return <Loading />;
  const rows = filtered(snapshot, practice, origin, search);
  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-2">PERSONAS Y PRÁCTICAS</p>
          <h1 className="page-heading">Alumnos</h1>
          <p className="text-xs text-muted-foreground mt-2">
            {rows.length} registros ·{" "}
            {snapshot.alumnos.filter((a) => a.procedencia === "Huésped").length} huéspedes y{" "}
            {snapshot.alumnos.filter((a) => a.procedencia === "Visitante").length} visitantes
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCsv />
          <Button
            disabled={actor?.perfil === "Auditor" || actor?.perfil === "Revisor"}
            onClick={() => open(null, practice)}
          >
            <Plus />
            Anotar alumno
          </Button>
        </div>
      </div>
      <div className="filter-row mt-7">
        <Filters />
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ALUMNO</th>
              <th>PROCEDENCIA</th>
              <th>DOMO</th>
              <th>PRÁCTICA</th>
              <th>ESTADO</th>
              <th className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="font-medium">{a.nombre}</span>
                  <span className="block text-[10px] text-muted-foreground mt-1">
                    Registro #{a.ordenAlta.toString().padStart(3, "0")}
                  </span>
                </td>
                <td>{a.procedencia}</td>
                <td>{a.domo ? `Domo ${a.domo}` : "—"}</td>
                <td>{snapshot.practicas.find((p) => p.id === a.practicaId)?.nombre}</td>
                <td>
                  <span
                    className={`status-label ${a.estado === "Lista de espera" ? "waiting" : a.estado === "Cancelado" ? "cancelled" : ""}`}
                  >
                    {a.estado}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar alumno"
                      aria-label={`Editar ${a.nombre}`}
                      disabled={actor?.perfil === "Auditor"}
                      onClick={() => open(a)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Cambiar práctica"
                      aria-label={`Cambiar práctica de ${a.nombre}`}
                      disabled={actor?.perfil === "Auditor"}
                      onClick={() => open(a)}
                    >
                      <ArrowLeftRight size={14} />
                    </Button>
                    {a.estado !== "Anotado" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Anotar"
                        aria-label={`Anotar ${a.nombre}`}
                        disabled={actor?.perfil === "Auditor" || actor?.perfil === "Revisor"}
                        onClick={() => open({ ...a, estado: "Anotado" })}
                      >
                        <Check size={14} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Cancelar inscripción"
                      aria-label={`Cancelar ${a.nombre}`}
                      disabled={
                        a.estado === "Cancelado" ||
                        actor?.perfil === "Auditor" ||
                        actor?.perfil === "Revisor"
                      }
                      onClick={() =>
                        setConfirm({
                          student: a,
                          tipo: "cancelar",
                          id: uid(),
                          revision: snapshot.revision,
                        })
                      }
                    >
                      <X size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Borrar alumno"
                      aria-label={`Borrar ${a.nombre}`}
                      disabled={actor?.perfil === "Auditor" || actor?.perfil === "Revisor"}
                      onClick={() =>
                        setConfirm({
                          student: a,
                          tipo: "borrar",
                          id: uid(),
                          revision: snapshot.revision,
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty-state">No hay alumnos que coincidan con los filtros.</div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-4">
        {rows.length} de {snapshot.alumnos.length} registros · Orden de alta
      </p>
      {formElement}
      {confirm && (
        <Confirm
          title={confirm.tipo === "borrar" ? "¿Borrar este alumno?" : "¿Cancelar la inscripción?"}
          text={`${confirm.student.nombre}. ${confirm.tipo === "borrar" ? "El registro se quita del panel; el historial se conserva." : "El registro queda como Cancelado."} Si libera un lugar, pasa el primer alumno de la lista de espera.`}
          close={() => setConfirm(null)}
          accept={() => {
            if (
              dispatch({
                id: confirm.id,
                tipo: confirm.tipo,
                entidad: confirm.student.id,
                revisionEsperada: confirm.revision,
                datos: {
                  motivo:
                    confirm.tipo === "borrar"
                      ? "Baja confirmada por operación"
                      : "Cancelación confirmada por operación",
                },
              })
            )
              setConfirm(null);
          }}
        />
      )}
    </>
  );
}
export function HistoryPage() {
  const { snapshot } = useDomos();
  const [record, setRecord] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"eventos" | "comandos">("eventos");
  if (!snapshot) return <Loading />;
  const events = snapshot.eventos
    .filter(
      (e) =>
        (!record || e.registro === record) &&
        (!from || e.instante.slice(0, 10) >= from) &&
        (!to || e.instante.slice(0, 10) <= to),
    )
    .slice()
    .reverse();
  const commands = snapshot.comandos
    .filter(
      (c) =>
        (!record ||
          c.entidad === record ||
          snapshot.eventos.some((e) => e.comandoOrigen === c.id && e.registro === record)) &&
        (!from || c.instante.slice(0, 10) >= from) &&
        (!to || c.instante.slice(0, 10) <= to),
    )
    .slice()
    .reverse();
  const allRecords = [
    ...new Set(
      snapshot.eventos.filter((e) => e.estadoAnterior || e.estadoNuevo).map((e) => e.registro),
    ),
  ];
  const name = (id: string) =>
    snapshot.alumnos.find((a) => a.id === id)?.nombre ??
    snapshot.eventos.find((e) => e.registro === id)?.estadoNuevo?.nombre ??
    id;
  const event = snapshot.eventos.find((e) => e.id === selected);
  return (
    <>
      <p className="eyebrow mb-2">TRAZABILIDAD</p>
      <h1 className="page-heading">Historial</h1>
      <p className="text-xs text-muted-foreground mt-2">
        Cada cambio conserva su origen. El historial no se borra.
      </p>
      <div className="filter-row mt-7">
        <select
          className="select-control max-w-72"
          aria-label="Registro del historial"
          value={record}
          onChange={(e) => setRecord(e.target.value)}
        >
          <option value="">Todos los registros</option>
          {allRecords.map((id) => (
            <option key={id} value={id}>
              {name(id)}
            </option>
          ))}
        </select>
        <label className="text-xs flex items-center gap-2">
          Desde
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-card"
          />
        </label>
        <label className="text-xs flex items-center gap-2">
          Hasta
          <Input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-card"
          />
        </label>
        <div className="flex gap-1 ml-auto">
          <Button
            variant={mode === "eventos" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("eventos")}
          >
            <History />
            Eventos
          </Button>
          <Button
            variant={mode === "comandos" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("comandos")}
          >
            <ClipboardCheck />
            Comandos
          </Button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>REGISTRO / COMANDO</th>
              <th>PERFIL</th>
              <th>EFECTO</th>
              <th>VERSIÓN</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mode === "eventos"
              ? events.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {new Date(e.instante).toLocaleDateString("es-AR")}
                      <span className="block text-[10px] text-muted-foreground mt-1">
                        {new Date(e.instante).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="max-w-60">
                      <p className="font-medium">{name(e.registro)}</p>
                      <p className="text-[9px] text-muted-foreground mt-1 truncate">
                        {e.comandoOrigen}
                      </p>
                    </td>
                    <td>
                      {e.actor.perfil}
                      <p className="text-[10px] text-muted-foreground">{e.actor.nombre}</p>
                    </td>
                    <td>
                      {e.efecto}
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-56">{e.motivo}</p>
                    </td>
                    <td>
                      {e.versionAnterior} → {e.versionNueva}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ver detalle del evento"
                        aria-label={`Ver evento ${e.id}`}
                        onClick={() => setSelected(e.id)}
                      >
                        <ArrowUpRight />
                      </Button>
                    </td>
                  </tr>
                ))
              : commands.map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.instante).toLocaleDateString("es-AR")}</td>
                    <td className="max-w-60 break-all">
                      {c.id}
                      <p className="text-[10px] text-muted-foreground">
                        {c.tipo} · {name(c.entidad)}
                      </p>
                    </td>
                    <td>
                      {c.actor.perfil}
                      <p className="text-[10px] text-muted-foreground">{c.actor.nombre}</p>
                    </td>
                    <td>
                      <span
                        className={`status-label ${c.resultado === "Rechazado" ? "cancelled" : ""}`}
                      >
                        {c.resultado}
                      </span>
                      <p className="text-[10px] mt-2 text-muted-foreground">
                        {c.resultado === "Rechazado"
                          ? "Sin evento ni efecto"
                          : `${snapshot.eventos.filter((e) => e.comandoOrigen === c.id).length} eventos`}
                      </p>
                    </td>
                    <td>{c.revisionEsperada}</td>
                    <td />
                  </tr>
                ))}
          </tbody>
        </table>
        {!(mode === "eventos" ? events : commands).length && (
          <div className="empty-state">Sin cambios en el período seleccionado.</div>
        )}
      </div>
      {event && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v) setSelected(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalle del evento</DialogTitle>
              <DialogDescription>
                {event.efecto} · {event.motivo}
              </DialogDescription>
            </DialogHeader>
            <dl className="text-xs grid gap-3">
              <div>
                <dt className="text-muted-foreground">Id evento</dt>
                <dd className="break-all mt-1">{event.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Id comando</dt>
                <dd className="break-all mt-1">{event.comandoOrigen}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fecha y perfil</dt>
                <dd className="mt-1">
                  {event.instante} · {event.actor.perfil} · {event.actor.nombre}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Versión</dt>
                <dd className="mt-1">
                  {event.versionAnterior} → {event.versionNueva}
                </dd>
              </div>
            </dl>
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-medium mb-2">Estado anterior</p>
                <pre className="text-[10px] bg-muted p-3 whitespace-pre-wrap break-all">
                  {JSON.stringify(event.estadoAnterior, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Estado nuevo</p>
                <pre className="text-[10px] bg-muted p-3 whitespace-pre-wrap break-all">
                  {JSON.stringify(event.estadoNuevo, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
export function ControlPage() {
  const { snapshot, actor, dispatch, importSnapshot, notify, notice } = useDomos();
  const file = useRef<HTMLInputElement>(null);
  const [copy, setCopy] = useState<Snapshot | null>(null);
  const [confirmAction, setConfirmAction] = useState<Omit<Action, "actor"> | null>(null);
  if (!snapshot) return <Loading />;
  const rows = reconcile(snapshot);
  const differences = rows.filter((r) => r.diferencia !== 0);
  const close = () =>
    setConfirmAction({
      id: uid(),
      tipo: "cierre",
      entidad: "cierre",
      revisionEsperada: snapshot.revision,
      datos: { motivo: "Conciliación revisada y cierre confirmado" },
    });
  return (
    <>
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <p className="eyebrow mb-2">INTEGRIDAD Y RESPALDO</p>
          <h1 className="page-heading">Control y exportación</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Contadores conciliados contra los eventos de origen.
          </p>
        </div>
        <span className="status-label flex items-center gap-2">
          <ShieldCheck size={14} />
          {differences.length ? `${differences.length} diferencias` : "Todo en orden"}
        </span>
      </div>
      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl">Conciliación de cupos</h2>
          <Button
            variant="outline"
            size="sm"
            disabled={actor?.perfil !== "Revisor"}
            onClick={close}
          >
            <ClipboardCheck />
            Registrar cierre
          </Button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRÁCTICA</th>
                <th>CONTADOR ACTUAL</th>
                <th>EVENTOS FUENTE</th>
                <th>DIFERENCIA</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.practica}</td>
                  <td>{r.actual}</td>
                  <td>{r.eventos}</td>
                  <td>
                    {r.diferencia === 0 ? "0" : `${r.diferencia > 0 ? "+" : ""}${r.diferencia}`}
                  </td>
                  <td>
                    <span className="text-success flex gap-2 items-center">
                      <CircleCheck size={14} />
                      {r.diferencia === 0 ? "Conciliado" : "Revisar diferencia"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {`${percentage(rows.length - differences.length, rows.length)}${rows.length ? " conciliado" : ""}`}{" "}
          · {snapshot.cierres.length} cierres registrados ·{" "}
          {snapshot.ajustes.filter((a) => !a.aplicado).length} ajustes no aplicados
        </p>
        {snapshot.ajustes.map((a) => (
          <div key={a.id} className="text-xs border-l-2 border-border pl-3 mt-4">
            <p className="font-medium">
              Ajuste {a.aplicado ? "aplicado" : "no aplicado"} ·{" "}
              {snapshot.practicas.find((p) => p.id === a.practicaId)?.nombre} ({a.cantidad})
            </p>
            <p className="text-muted-foreground mt-1">{a.motivo}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="font-display text-xl">Exportar y restaurar</h2>
        <div className="filter-row">
          <Filters />
        </div>
        <div className="flex gap-3 flex-wrap">
          <ExportCsv />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              download(
                JSON.stringify(snapshot, null, 2),
                `domos-park-v2-r${snapshot.revision}.json`,
                "application/json",
              );
              notify("Copia JSON versionada exportada.");
            }}
          >
            <FileJson />
            Descargar copia JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={actor?.perfil !== "Revisor"}
            onClick={() => file.current?.click()}
          >
            <Upload />
            Restaurar copia
          </Button>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const chosen = e.target.files?.[0];
              if (!chosen) return;
              try {
                const parsed: unknown = JSON.parse(await chosen.text());
                setCopy(migrate(parsed));
              } catch (error) {
                notify(
                  error instanceof Error ? error.message : "No se pudo leer la copia JSON.",
                  true,
                );
              }
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          CSV: filtro vigente. JSON: copia completa v{snapshot.schemaVersion} · revisión{" "}
          {snapshot.revision}.
        </p>
      </section>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="font-display text-xl mb-4">Propuestas de revisión</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>REGISTRO Y CAMBIO</th>
                <th>CREADOR</th>
                <th>VERSIÓN</th>
                <th>DECISIÓN</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {snapshot.propuestas.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium">
                      {snapshot.alumnos.find((a) => a.id === p.registro)?.nombre ?? p.registro}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{p.motivo}</p>
                    <p className="text-[11px] mt-2">
                      Propuesto: {p.cambios.nombre} ·{" "}
                      {snapshot.practicas.find((a) => a.id === p.cambios.practicaId)?.nombre} ·{" "}
                      {p.cambios.estado}
                    </p>
                  </td>
                  <td>
                    {p.creador.nombre}
                    <p className="text-[10px] text-muted-foreground mt-1">{p.creador.perfil}</p>
                  </td>
                  <td>{p.versionPartida}</td>
                  <td>
                    <span
                      className={`status-label ${p.decision === "Pendiente" ? "waiting" : p.decision === "Rechazada" ? "cancelled" : ""}`}
                    >
                      {p.decision}
                    </span>
                    {p.decisor && (
                      <p className="text-[10px] mt-2 text-muted-foreground">{p.decisor.nombre}</p>
                    )}
                  </td>
                  <td>
                    {p.decision === "Pendiente" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Aprobar propuesta"
                          aria-label={`Aprobar ${p.id}`}
                          disabled={
                            actor?.perfil !== "Revisor" || actor.nombre === p.creador.nombre
                          }
                          onClick={() =>
                            setConfirmAction({
                              id: uid(),
                              tipo: "decidir",
                              entidad: p.id,
                              revisionEsperada: snapshot.revision,
                              datos: { aprobar: true, motivo: "Propuesta aprobada por revisor" },
                            })
                          }
                        >
                          <Check />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Rechazar propuesta"
                          aria-label={`Rechazar ${p.id}`}
                          disabled={
                            actor?.perfil !== "Revisor" || actor.nombre === p.creador.nombre
                          }
                          onClick={() =>
                            setConfirmAction({
                              id: uid(),
                              tipo: "decidir",
                              entidad: p.id,
                              revisionEsperada: snapshot.revision,
                              datos: { aprobar: false, motivo: "Propuesta rechazada por revisor" },
                            })
                          }
                        >
                          <X />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="font-display text-xl mb-4">Cierres registrados</h2>
        {snapshot.cierres
          .slice()
          .reverse()
          .map((c) => (
            <div
              key={c.id}
              className="py-3 border-b border-border text-xs flex flex-wrap justify-between gap-2"
            >
              <span>
                {new Date(c.instante).toLocaleString("es-AR")} · {c.actor.nombre}
              </span>
              <span className="text-muted-foreground">
                Revisión {c.revision} · {Object.values(c.contadores).reduce((a, b) => a + b, 0)}{" "}
                anotados
              </span>
            </div>
          ))}
      </section>
      {copy && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v) setCopy(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Restaurar esta copia?</DialogTitle>
              <DialogDescription>
                Validación completa superada. Se reemplazan todos los datos locales, no se mezclan
                registros.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm">
              Versión {copy.schemaVersion} · revisión {copy.revision}
              <br />
              {copy.alumnos.length} alumnos · {copy.eventos.length} eventos · {copy.comandos.length}{" "}
              comandos
            </p>
            {notice?.error && (
              <p role="alert" className="text-xs text-destructive">
                {notice.text}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCopy(null)}>
                Volver
              </Button>
              <Button
                onClick={() => {
                  if (importSnapshot(copy)) setCopy(null);
                }}
              >
                <Upload />
                Restaurar completa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {confirmAction && (
        <Confirm
          title={
            confirmAction.tipo === "cierre"
              ? "¿Registrar el cierre?"
              : confirmAction.datos.aprobar
                ? "¿Aprobar esta propuesta?"
                : "¿Rechazar esta propuesta?"
          }
          text={
            confirmAction.tipo === "cierre"
              ? "El cierre conserva los contadores conciliados, sin cambiar los cupos."
              : "La decisión quedará registrada en el historial. La aprobación verifica la versión y el cupo nuevamente."
          }
          close={() => setConfirmAction(null)}
          accept={() => {
            if (dispatch(confirmAction)) setConfirmAction(null);
          }}
        />
      )}
    </>
  );
}
export function AccessPage() {
  const { actor, login, logout, notice } = useDomos();
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [profile, setProfile] = useState<Profile>("Operación");
  const [identity, setIdentity] = useState("Sol · demo");
  return (
    <div className="entry-page">
      <TentTree size={48} strokeWidth={1.3} className="text-primary mb-5" />
      <p className="eyebrow mb-3">DOMOS PARK · ACCESO DE DEMO</p>
      <h1>
        Un lugar para
        <br />
        estar en calma.
      </h1>
      <div className="notice mt-6">
        <LockKeyhole size={18} className="mb-2 text-primary" />
        <p className="font-medium">
          Acceso local sin verificación de identidad — datos sintéticos en este navegador
        </p>
      </div>
      {actor && (
        <div className="flex justify-between items-center bg-success-soft p-3 text-xs mb-5">
          <span>
            Perfil actual: {actor.perfil} · {actor.nombre}
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Salir del perfil actual"
            title="Salir"
            onClick={logout}
          >
            <X />
          </Button>
        </div>
      )}
      <form
        className="grid gap-5 mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (login(key, { perfil: profile, nombre: identity })) void navigate({ to: "/" });
        }}
      >
        <label className="field-label">
          Clave local
          <Input
            autoFocus
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            placeholder="Ingresá la clave de demo"
            autoComplete="off"
          />
        </label>
        <label className="field-label">
          Perfil
          <select
            className="select-control"
            value={profile}
            onChange={(e) => {
              const p = e.target.value as Profile;
              setProfile(p);
              setIdentity(
                p === "Operación" ? "Sol · demo" : p === "Revisor" ? "Mar · demo" : "Luz · demo",
              );
            }}
          >
            <option>Operación</option>
            <option>Revisor</option>
            <option>Auditor</option>
          </select>
        </label>
        <label className="field-label">
          Actor sintético
          <select
            className="select-control"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
          >
            <option>Sol · demo</option>
            <option>Mar · demo</option>
            <option>Luz · demo</option>
          </select>
        </label>
        {notice?.error && <p className="text-xs text-destructive">{notice.text}</p>}
        <Button type="submit" className="mt-1 h-11">
          Entrar al panel
          <ArrowRight />
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/">
            Consultar sin ingresar
            <ArrowUpRight />
          </Link>
        </Button>
      </form>
    </div>
  );
}

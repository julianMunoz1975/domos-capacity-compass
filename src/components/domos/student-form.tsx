import { useState } from "react";
import { UserPlus, Check, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid, occupied, type Student } from "@/lib/domos/engine";
import { useDomos } from "./layout";
export function StudentForm({
  initial,
  practiceId,
  close,
}: {
  initial: Student | null;
  practiceId: string;
  close: () => void;
}) {
  const { snapshot, actor, dispatch, notice } = useDomos();
  const [draft, setDraft] = useState<Student>(() =>
    initial
      ? { ...initial }
      : {
          id: uid(),
          nombre: "",
          procedencia: "Huésped",
          domo: 1,
          practicaId: practiceId || snapshot?.practicas[0]?.id || "",
          estado: "Anotado",
          ordenAlta: 0,
        },
  );
  const [commandId] = useState(uid);
  const [baseRevision] = useState(snapshot?.revision ?? 0);
  const [motivo, setMotivo] = useState(
    initial ? "Actualización del registro" : "Inscripción a práctica",
  );
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!snapshot) return null;
  const practice = snapshot.practicas.find((p) => p.id === draft.practicaId);
  const full = practice ? occupied(snapshot, practice.id) >= practice.cupo : false;
  const proposal = actor?.perfil === "Revisor" && initial !== null;
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-success mb-2">
            <UserPlus size={20} />
            <span className="eyebrow">REGISTRO DE ALUMNOS</span>
          </div>
          <DialogTitle className="font-display text-2xl font-medium">
            {initial ? "Editar alumno" : "Anotar un alumno"}
          </DialogTitle>
          <DialogDescription>
            {initial ? initial.nombre : "Un nuevo momento de bienestar en Domos Park."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (saving) return;
            setSaving(true);
            const ok = dispatch({
              id: commandId,
              tipo: proposal ? "proponer" : initial ? "editar" : "alta",
              entidad: draft.id,
              revisionEsperada: baseRevision,
              datos: { alumno: draft, motivo },
            });
            setSaving(false);
            if (ok) close();
            else setFailed(true);
          }}
        >
          <label className="field-label">
            Nombre y apellido
            <Input
              autoFocus
              required
              minLength={2}
              value={draft.nombre}
              placeholder="Nombre del alumno"
              onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="field-label">
              Procedencia
              <select
                className="select-control"
                value={draft.procedencia}
                onChange={(e) => {
                  const v = e.target.value === "Huésped" ? "Huésped" : "Visitante";
                  setDraft({ ...draft, procedencia: v, domo: v === "Visitante" ? null : 1 });
                }}
              >
                <option>Huésped</option>
                <option>Visitante</option>
              </select>
            </label>
            <label className="field-label">
              Domo
              {draft.procedencia === "Huésped" ? (
                <Input
                  type="number"
                  required
                  min={1}
                  max={9}
                  step={1}
                  value={draft.domo ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, domo: e.target.value ? Number(e.target.value) : null })
                  }
                />
              ) : (
                <Input disabled value="No corresponde" />
              )}
            </label>
          </div>
          <label className="field-label">
            Práctica
            <select
              className="select-control"
              required
              value={draft.practicaId}
              onChange={(e) => setDraft({ ...draft, practicaId: e.target.value })}
            >
              {snapshot.practicas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {p.horario}
                </option>
              ))}
            </select>
          </label>
          {full && (
            <p className="text-xs bg-sand p-3 leading-relaxed">
              {initial && initial.practicaId !== draft.practicaId
                ? "La práctica de destino está completa. El cambio no se podrá guardar."
                : !initial
                  ? "Práctica completa: el alta irá a Lista de espera."
                  : "Esta práctica tiene todos sus lugares ocupados."}
            </p>
          )}
          <label className="field-label">
            Estado
            <select
              className="select-control"
              value={draft.estado}
              onChange={(e) => setDraft({ ...draft, estado: e.target.value as Student["estado"] })}
            >
              <option>Anotado</option>
              <option>Lista de espera</option>
              <option>Cancelado</option>
            </select>
          </label>
          <label className="field-label">
            Motivo
            <Input required value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </label>
          {failed && notice?.error && (
            <p role="alert" className="text-xs text-destructive bg-muted p-3">
              {notice.text}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Salud · Ejemplo: si tenés una lesión, estás embarazada o sentís molestias, avisale a
            quien guía la práctica.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" type="button" onClick={close}>
              Volver
            </Button>
            <Button type="submit" disabled={saving || actor?.perfil === "Auditor"}>
              {proposal ? <Send /> : <Check />}
              {saving
                ? "Guardando…"
                : proposal
                  ? "Enviar propuesta"
                  : initial
                    ? "Guardar cambios"
                    : "Anotar alumno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

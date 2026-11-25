import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutGrid,
  Users,
  History,
  ShieldCheck,
  Leaf,
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  CircleHelp,
  ChevronRight,
  LockKeyhole,
  TentTree,
  CircleCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  load,
  transact,
  restore,
  ACCESS_KEY,
  type Snapshot,
  type Actor,
  type Action,
} from "@/lib/domos/engine";

type Context = {
  snapshot: Snapshot | null;
  actor: Actor | null;
  loaded: boolean;
  notice: { text: string; error: boolean } | null;
  practice: string;
  origin: string;
  search: string;
  setPractice: (v: string) => void;
  setOrigin: (v: string) => void;
  setSearch: (v: string) => void;
  dispatch: (a: Omit<Action, "actor">) => boolean;
  notify: (text: string, error?: boolean) => void;
  login: (key: string, actor: Actor) => boolean;
  logout: () => void;
  importSnapshot: (v: unknown) => boolean;
  reload: () => void;
};
const DomosContext = createContext<Context | null>(null);
export function useDomos() {
  const c = useContext(DomosContext);
  if (!c) throw new Error("Falta contexto de Domos Park");
  return c;
}
export function DomosProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [actor, setActor] = useState<Actor | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<Context["notice"]>(null);
  const [practice, setPractice] = useState("");
  const [origin, setOrigin] = useState("");
  const [search, setSearch] = useState("");
  const notify = (text: string, error = false) => setNotice(text.trim() ? { text, error } : null);
  const reload = () => {
    try {
      setSnapshot(load(window.localStorage));
      setLoaded(true);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "No se pudieron leer los datos locales.",
        true,
      );
      setLoaded(true);
    }
  };
  useEffect(() => {
    reload();
    try {
      const raw = sessionStorage.getItem("domos-perfil");
      if (raw) {
        const parsed = JSON.parse(raw) as Actor;
        if (
          ["Operación", "Revisor", "Auditor"].includes(parsed.perfil) &&
          typeof parsed.nombre === "string"
        )
          setActor(parsed);
      }
    } catch {
      /* Una sesión inválida no se restaura. */
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === "domos-park-practicas-v2")
        notify("Los datos cambiaron en otra pestaña. Recargá antes de guardar.", true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const login = (key: string, next: Actor) => {
    if (key !== ACCESS_KEY) {
      notify("La clave local no coincide.", true);
      return false;
    }
    try {
      sessionStorage.setItem("domos-perfil", JSON.stringify(next));
      setActor(next);
      setNotice(null);
      return true;
    } catch {
      notify("El navegador no permite guardar la sesión local.", true);
      return false;
    }
  };
  const logout = () => {
    sessionStorage.removeItem("domos-perfil");
    setActor(null);
    setNotice(null);
  };
  const dispatch: Context["dispatch"] = (a) => {
    if (!snapshot || !actor) {
      notify("Ingresá con un perfil de demo antes de modificar registros.", true);
      return false;
    }
    try {
      const result = transact(snapshot, { ...a, actor }, window.localStorage);
      setSnapshot(result.snapshot);
      notify(result.message);
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "No se pudo guardar. El borrador se conserva.",
        true,
      );
      return false;
    }
  };
  const importSnapshot = (v: unknown) => {
    if (!snapshot || !actor) {
      notify("Ingresá como Revisor para restaurar.", true);
      return false;
    }
    try {
      const next = restore(v, window.localStorage, actor, snapshot);
      setSnapshot(next);
      notify("Copia validada y restaurada completa.");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Copia inválida.", true);
      return false;
    }
  };
  return (
    <DomosContext.Provider
      value={{
        snapshot,
        actor,
        loaded,
        notice,
        practice,
        origin,
        search,
        setPractice,
        setOrigin,
        setSearch,
        dispatch,
        notify,
        login,
        logout,
        importSnapshot,
        reload,
      }}
    >
      {children}
    </DomosContext.Provider>
  );
}
const nav = [
  { to: "/" as const, label: "Panel de cupos", icon: LayoutGrid },
  { to: "/alumnos" as const, label: "Alumnos", icon: Users },
  { to: "/historial" as const, label: "Historial", icon: History },
  { to: "/control" as const, label: "Control y exportación", icon: ShieldCheck },
];
export function DomosShell({ children }: { children: ReactNode }) {
  const { actor, snapshot, notice, logout, notify, reload } = useDomos();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const current = nav.find((item) => item.to === pathname)?.label ?? "Acceso local";
  return (
    <div>
      <aside className={`app-sidebar ${menu ? "open" : ""}`} aria-label="Navegación principal">
        <div className="brand">
          <TentTree strokeWidth={1.3} className="brand-mark" />
          <div>
            <div className="brand-name">domos park</div>
            <div className="brand-sub">GLAMPING & BIENESTAR</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-auto"
            aria-label="Cerrar menú"
            onClick={() => setMenu(false)}
          >
            <X />
          </Button>
        </div>
        <p className="sidebar-label">GESTIÓN DE PRÁCTICAS</p>
        <nav>
          {nav.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              asChild
              className="nav-item"
              data-active={pathname === item.to}
            >
              <Link to={item.to} onClick={() => setMenu(false)}>
                <item.icon size={17} strokeWidth={1.5} />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="px-3 pb-6 flex items-center gap-2 text-xs text-success">
            <Leaf size={16} strokeWidth={1.5} />
            <span>Un ritmo más natural.</span>
          </div>
          <div className="local-note">
            <div className="flex items-center gap-2 text-foreground mb-2">
              <span className="size-1.5 rounded-full bg-success" />
              Modo local · Datos de demo
            </div>
            Acceso sin verificación de identidad. Datos sintéticos en este navegador.
          </div>
          <Button variant="ghost" className="nav-item mb-0" asChild>
            <Link to="/acceso" onClick={() => setMenu(false)}>
              <CircleHelp size={16} />
              Acceso y perfiles
              <ArrowUpRight className="ml-auto" />
            </Link>
          </Button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menú"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </Button>
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span>Bienestar</span>
              <ChevronRight size={12} />
              <span className="text-foreground font-medium">{current}</span>
            </div>
            <span className="sm:hidden text-xs font-medium">{current}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <CircleCheck size={13} className="text-success" />
              Guardado local{snapshot ? ` · v${snapshot.schemaVersion}` : ""}
            </span>
            {actor ? (
              <>
                <div className="h-6 border-l border-border hidden sm:block" />
                <div className="profile-avatar">
                  {actor.nombre.split(" ")[0]?.slice(0, 2).toUpperCase()}
                </div>
                <Button variant="ghost" size="sm" className="px-0 h-auto text-xs" asChild>
                  <Link to="/acceso">
                    {actor.perfil}
                    <ChevronRight size={12} />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Salir del perfil"
                  aria-label="Salir del perfil"
                  onClick={logout}
                >
                  <LogOut />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/acceso">
                  <LockKeyhole />
                  Ingresar
                </Link>
              </Button>
            )}
          </div>
        </header>
        <main className="page-content">
          {notice?.text.trim() && (
            <div
              className={`notice ${notice.error ? "error" : ""}`}
              role={notice.error ? "alert" : "status"}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {notice.text}
                  {notice.error && !actor && (
                    <Link to="/acceso" className="underline ml-2">
                      Ingresar
                    </Link>
                  )}
                  {notice.text.includes("pestaña") && (
                    <Button size="sm" variant="outline" className="ml-2" onClick={reload}>
                      Recargar datos
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 shrink-0"
                  aria-label="Cerrar aviso"
                  onClick={() => notify("")}
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
          )}
          {children}
          <footer className="page-footer">
            <span>Domos Park · Un lugar para conectar.</span>
            <span>
              Datos sintéticos · Solo en este navegador{" "}
              {snapshot ? `· Revisión ${snapshot.revision}` : ""}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

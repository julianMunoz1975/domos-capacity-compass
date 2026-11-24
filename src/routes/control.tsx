import { createFileRoute } from "@tanstack/react-router";
import { ControlPage } from "@/components/domos/pages";
export const Route = createFileRoute("/control")({
  head: () => ({
    meta: [
      { title: "Control y exportación · Domos Park" },
      {
        name: "description",
        content: "Conciliación de cupos, propuestas, CSV y copias JSON versionadas de Domos Park.",
      },
      { property: "og:title", content: "Control y exportación · Domos Park" },
      {
        property: "og:description",
        content: "Revisión de eventos fuente y restauración validada de datos locales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ControlPage,
});

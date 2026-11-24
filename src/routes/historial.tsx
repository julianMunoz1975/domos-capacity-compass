import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/components/domos/pages";
export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial · Domos Park" },
      {
        name: "description",
        content: "Trazabilidad de registros, comandos y versiones de las prácticas de Domos Park.",
      },
      { property: "og:title", content: "Historial · Domos Park" },
      {
        property: "og:description",
        content: "Consulta los eventos de cada registro y su origen sin borrado de historial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

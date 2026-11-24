import { createFileRoute } from "@tanstack/react-router";
import { PanelPage } from "@/components/domos/pages";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel de cupos · Domos Park" },
      {
        name: "description",
        content:
          "Cupos y lista de espera de yoga y meditación en Domos Park. Panel local con datos sintéticos.",
      },
      { property: "og:title", content: "Panel de cupos · Domos Park" },
      {
        property: "og:description",
        content: "Prácticas de bienestar, alumnos anotados y lugares disponibles en Domos Park.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PanelPage,
});

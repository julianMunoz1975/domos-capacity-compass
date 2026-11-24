import { createFileRoute } from "@tanstack/react-router";
import { AccessPage } from "@/components/domos/pages";
export const Route = createFileRoute("/acceso")({
  head: () => ({
    meta: [
      { title: "Acceso local · Domos Park" },
      {
        name: "description",
        content:
          "Entrada local con perfiles sintéticos de Operación, Revisor y Auditor de Domos Park.",
      },
      { property: "og:title", content: "Acceso local · Domos Park" },
      {
        property: "og:description",
        content:
          "Demostración local sin verificación de identidad. Datos sintéticos en este navegador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccessPage,
});

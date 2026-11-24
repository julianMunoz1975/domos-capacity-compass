import { createFileRoute } from "@tanstack/react-router";
import { StudentsPage } from "@/components/domos/pages";
export const Route = createFileRoute("/alumnos")({
  head: () => ({
    meta: [
      { title: "Alumnos · Domos Park" },
      {
        name: "description",
        content: "Registro local de huéspedes y visitantes para las prácticas de Domos Park.",
      },
      { property: "og:title", content: "Alumnos · Domos Park" },
      {
        property: "og:description",
        content: "Inscripciones y lista de espera de alumnos de yoga y meditación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentsPage,
});

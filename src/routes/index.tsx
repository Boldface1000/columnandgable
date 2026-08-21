import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Column & Gable — Best Choice You Ever Made" },
      {
        name: "description",
        content:
          "Column & Gable is a next-generation investment app: weekly compounding, insured portfolios, loans and a 401(k) built for every generation.",
      },
      { property: "og:title", content: "Column & Gable — Best Choice You Ever Made" },
      {
        property: "og:description",
        content: "Weekly compounding, insured portfolios and a legacy account built for every generation.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Phone, Mail, Building2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Column & Gable" },
      {
        name: "description",
        content:
          "Reach the Column & Gable member desk by phone, email or at our Boston head office.",
      },
      { property: "og:title", content: "Contact Us — Column & Gable" },
      { property: "og:description", content: "Member desk phone, email and Boston head office." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={() => navigate({ to: "/settings" })}>
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Contact us</h1>
      </header>

      <div className="space-y-4 px-6 pt-6">
        <Card
          icon={<Building2 className="size-5 text-primary" />}
          title="Head office — New England"
        >
          One Federal Street, 27th Floor
          <br />
          Boston, MA 02110, United States
          <br />
          <span className="text-xs">Financial District · Mon–Fri, 8am–6pm ET</span>
        </Card>
        <Card icon={<MapPin className="size-5 text-primary" />} title="West coast desk">
          1200 Wilshire Blvd, Suite 1400
          <br />
          Los Angeles, CA 90017, United States
        </Card>
        <Card icon={<Phone className="size-5 text-primary" />} title="Member desk">
          <a href="tel:+16175550182">+1 (617) 555-0182</a>
          <br />
          Mon–Fri, 8am–8pm ET
        </Card>
        <Card icon={<Mail className="size-5 text-primary" />} title="Email">
          <a href="mailto:support@columnandgable.com">support@columnandgable.com</a>
          <br />
          <a href="mailto:support.columnandgable@gmail.com">support.columnandgable@gmail.com</a>
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-display font-bold">{title}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

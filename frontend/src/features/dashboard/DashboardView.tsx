import { Link } from "@tanstack/react-router";
import { ArrowRight, ListChecks, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/i18n";

export function DashboardView() {
  const t = useI18n();

  const destinations = [
    {
      title: t.dashboard.examplesTitle,
      description: t.dashboard.examplesDescription,
      href: "/examples",
      icon: ListChecks,
      action: t.dashboard.openExamples,
    },
    {
      title: t.dashboard.statusTitle,
      description: t.dashboard.statusDescription,
      href: "/status",
      icon: Server,
      action: t.dashboard.openStatus,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          {t.dashboard.title}
        </h1>
        <p className="text-muted-foreground">{t.dashboard.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          return (
            <Card key={destination.href}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="text-lg">{destination.title}</CardTitle>
                    <CardDescription>{destination.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link to={destination.href}>
                    {destination.action}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

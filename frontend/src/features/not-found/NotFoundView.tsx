import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function NotFoundView() {
  const t = useI18n();

  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold tracking-normal">
        {t.notFound.title}
      </h1>
      <p className="text-muted-foreground">{t.notFound.description}</p>
      <Button asChild>
        <Link to="/">{t.notFound.action}</Link>
      </Button>
    </section>
  );
}

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";

type ExampleRowId = "draft" | "review" | "done";

const exampleRows: Array<{ id: ExampleRowId; status: string }> = [
  { id: "draft", status: "Ready" },
  { id: "review", status: "Template" },
  { id: "done", status: "Replace me" },
];

export function ExamplesView() {
  const t = useI18n();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">
            {t.examples.title}
          </h1>
          <p className="text-muted-foreground">{t.examples.description}</p>
        </div>
        <Button type="button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.examples.create}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border px-4 py-3 text-sm font-medium text-muted-foreground">
          <span>{t.examples.itemColumn}</span>
          <span>{t.examples.statusColumn}</span>
        </div>
        <div className="divide-y divide-border">
          {exampleRows.map((row) => (
            <div
              className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
              key={row.id}
            >
              <div>
                <p className="font-medium">{t.examples.rows[row.id]}</p>
                <p className="text-sm text-muted-foreground">
                  {t.examples.rowDescription}
                </p>
              </div>
              <Badge variant="secondary">{row.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

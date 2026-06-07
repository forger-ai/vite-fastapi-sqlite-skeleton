import { Link, Outlet } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { appNavigationItems } from "./routes";

const desktopLinkClass =
  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const mobileLinkClass =
  "flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

export function AppShell() {
  const t = useI18n();

  return (
    <div className="grid h-dvh min-h-0 bg-background text-foreground md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-card px-4 py-5 md:flex md:min-h-0 md:flex-col">
        <div className="px-2 pb-6">
          <p className="text-base font-semibold">{t.app.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.app.subtitle}</p>
        </div>
        <nav aria-label={t.navigation.label} className="flex flex-col gap-1">
          {appNavigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                activeOptions={{ exact: item.path === "/" }}
                activeProps={{ className: cn(desktopLinkClass, "bg-muted text-foreground") }}
                inactiveProps={{ className: cn(desktopLinkClass, "text-muted-foreground") }}
                key={item.id}
                to={item.path}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t.navigation.items[item.id]}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
        <main className="min-h-0 overflow-auto px-5 py-6 pb-24 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
        <nav
          aria-label={t.navigation.label}
          className="grid grid-cols-3 border-t border-border bg-card md:hidden"
        >
          {appNavigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                activeOptions={{ exact: item.path === "/" }}
                activeProps={{ className: cn(mobileLinkClass, "text-primary") }}
                inactiveProps={{ className: cn(mobileLinkClass, "text-muted-foreground") }}
                key={item.id}
                to={item.path}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{t.navigation.items[item.id]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

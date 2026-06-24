export const FORGER_FLOATING_LAYER_ATTRIBUTE = "data-forger-floating-layer";

const OPEN_FORGER_FLOATING_LAYER_SELECTOR = `[${FORGER_FLOATING_LAYER_ATTRIBUTE}][data-state="open"]`;

interface QueryableRoot {
  querySelector: (selectors: string) => Element | null;
}

interface PreventableEvent {
  defaultPrevented: boolean;
  preventDefault: () => void;
}

export function isForgerFloatingLayerOpen(root?: QueryableRoot | null): boolean {
  return Boolean(root?.querySelector(OPEN_FORGER_FLOATING_LAYER_SELECTOR));
}

export function preventDialogDismissWhileFloatingLayerOpen(
  event: PreventableEvent,
  root: QueryableRoot | null =
    typeof document === "undefined" ? null : document,
): void {
  if (!event.defaultPrevented && isForgerFloatingLayerOpen(root)) {
    event.preventDefault();
  }
}

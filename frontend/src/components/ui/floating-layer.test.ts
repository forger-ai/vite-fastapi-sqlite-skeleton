import { describe, expect, it, vi } from "vitest";
import {
  FORGER_FLOATING_LAYER_ATTRIBUTE,
  isForgerFloatingLayerOpen,
  preventDialogDismissWhileFloatingLayerOpen,
} from "./floating-layer";

describe("floating layer helpers", () => {
  it("detects open Forger floating layers", () => {
    let capturedSelector = "";
    const root = {
      querySelector: (selector: string) => {
        capturedSelector = selector;
        return {} as Element;
      },
    };

    expect(isForgerFloatingLayerOpen(root)).toBe(true);
    expect(capturedSelector).toBe(
      `[${FORGER_FLOATING_LAYER_ATTRIBUTE}][data-state="open"]`,
    );
  });

  it("does not report closed or missing floating layers as open", () => {
    expect(isForgerFloatingLayerOpen(null)).toBe(false);
    expect(isForgerFloatingLayerOpen({ querySelector: () => null })).toBe(false);
  });

  it("prevents dialog dismissal while a floating layer is open", () => {
    const preventDefault = vi.fn();
    preventDialogDismissWhileFloatingLayerOpen(
      { defaultPrevented: false, preventDefault },
      { querySelector: () => ({} as Element) },
    );

    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("does not override already prevented events or normal outside interactions", () => {
    const alreadyPrevented = vi.fn();
    preventDialogDismissWhileFloatingLayerOpen(
      { defaultPrevented: true, preventDefault: alreadyPrevented },
      { querySelector: () => ({} as Element) },
    );

    const normalOutsideClick = vi.fn();
    preventDialogDismissWhileFloatingLayerOpen(
      { defaultPrevented: false, preventDefault: normalOutsideClick },
      { querySelector: () => null },
    );

    expect(alreadyPrevented).not.toHaveBeenCalled();
    expect(normalOutsideClick).not.toHaveBeenCalled();
  });
});

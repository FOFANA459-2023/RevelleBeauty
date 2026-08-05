import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLineValidated } from '@contracts/index';

/**
 * Client-owned cart. Line identity is the server's variantId.
 * All prices here are DISPLAY CACHES — the server reprices at checkout and
 * on validate; nothing money-related here is ever trusted.
 */
export interface CartLine {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  shadeName: string;
  shadeHex: string | null;
  shadeHexSecondary: string | null;
  imageUrl: string | null;
  unitPriceCents: number; // display only
  maxQuantity: number;
  quantity: number;
  addedAt: number;
}

interface CartState {
  lines: CartLine[];
  /** True when validate() changed a price/removed a line — UI shows one notice. */
  reconciled: boolean;
  add: (line: Omit<CartLine, 'quantity' | 'addedAt'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Overwrite display caches with server truth. */
  applyValidation: (lines: CartLineValidated[], removed: string[]) => void;
  dismissReconciled: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      reconciled: false,

      add: (line, quantity = 1) => {
        const existing = get().lines.find((l) => l.variantId === line.variantId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.variantId === line.variantId
                ? { ...l, quantity: Math.min(l.quantity + quantity, l.maxQuantity) }
                : l,
            ),
          });
        } else {
          set({
            lines: [
              ...get().lines,
              { ...line, quantity: Math.min(quantity, line.maxQuantity), addedAt: Date.now() },
            ],
          });
        }
      },

      setQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          set({ lines: get().lines.filter((l) => l.variantId !== variantId) });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.variantId === variantId
              ? { ...l, quantity: Math.min(quantity, l.maxQuantity) }
              : l,
          ),
        });
      },

      remove: (variantId) =>
        set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),

      clear: () => set({ lines: [], reconciled: false }),

      applyValidation: (validated, removed) => {
        const byId = new Map(validated.map((v) => [v.variantId, v]));
        let changed = false;
        const next: CartLine[] = [];

        for (const line of get().lines) {
          if (removed.includes(line.variantId)) {
            changed = true;
            continue;
          }
          const v = byId.get(line.variantId);
          if (!v) {
            next.push(line);
            continue;
          }
          if (!v.available) {
            changed = true;
            continue;
          }
          const clampedQty = Math.min(line.quantity, v.maxQuantity);
          if (
            v.unitPriceCents !== line.unitPriceCents ||
            clampedQty !== line.quantity ||
            v.imageUrl !== line.imageUrl
          ) {
            changed = true;
          }
          next.push({
            ...line,
            productName: v.productName,
            shadeName: v.variantName,
            shadeHex: v.hexColor,
            shadeHexSecondary: v.hexColorSecondary,
            imageUrl: v.imageUrl,
            unitPriceCents: v.unitPriceCents,
            maxQuantity: v.maxQuantity,
            quantity: clampedQty,
          });
        }
        set({ lines: next, reconciled: changed });
      },

      dismissReconciled: () => set({ reconciled: false }),
    }),
    { name: 'revelle-cart', version: 1 },
  ),
);

export const selectItemCount = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectSubtotalCents = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);

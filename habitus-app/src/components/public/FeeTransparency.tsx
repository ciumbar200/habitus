import { Info, Calculator, CheckCircle } from "@phosphor-icons/react";
import { useI18n } from "../../lib/I18nContext";

interface FeeBreakdownProps {
  monthlyRent: number;
  platformFee?: number;
  showDetail?: boolean;
}

/**
 * Spacest-style fee transparency: shows total cost breakdown upfront
 * Platform fee is a percentage of monthly rent, displayed clearly
 */
export function FeeBreakdown({
  monthlyRent,
  platformFee,
  showDetail = false,
}: FeeBreakdownProps) {
  const t = useI18n();
  const copy = t.public.feeTransparency;
  // Platform fee is typically 5-10% of monthly rent
  const fee = platformFee ?? Math.round(monthlyRent * 0.08);
  const total = monthlyRent + fee;

  return (
    <div className="rounded-xl bg-stone-50 p-4 text-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-stone-700">{copy.summary}</span>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle size={14} weight="fill" />
          {copy.noHiddenFees}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-stone-600">{copy.monthlyRent}</span>
          <span className="font-semibold text-stone-900">
            {monthlyRent.toLocaleString("es-ES")} €
          </span>
        </div>

        <div className="flex justify-between text-stone-500">
          <span className="flex items-center gap-1">
            <Info size={14} />
            {copy.platformFeeOnce}
          </span>
          <span className="font-medium">+{fee.toLocaleString("es-ES")} €</span>
        </div>

        {showDetail && (
          <div className="mt-2 pt-2 border-t border-stone-200 text-xs text-stone-500">
            <p>{copy.platformFeeDetail}</p>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-stone-300 text-base">
          <span className="font-semibold text-stone-900">{copy.firstMonthTotal}</span>
          <span className="font-bold text-terracotta">
            {total.toLocaleString("es-ES")} €
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Fee calculator for property cards and detail pages
 * Shows breakdown on hover/click
 */
export function FeeCalculator({ rent }: { rent: number }) {
  const t = useI18n();
  const copy = t.public.feeTransparency;
  const [isOpen, setIsOpen] = useState(false);
  const fee = Math.round(rent * 0.08);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
      >
        <Calculator size={14} />
        <span>{copy.viewBreakdown}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg bg-white p-4 shadow-xl border border-stone-200 z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-stone-700">{copy.monthlyCosts}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">{copy.rent}</span>
              <span className="font-medium">{rent.toLocaleString("es-ES")} €</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>{copy.platformFeePercent}</span>
              <span>+{fee.toLocaleString("es-ES")} €</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-200 font-bold">
              <span className="text-stone-900">{copy.total}</span>
              <span className="text-terracotta">
                {(rent + fee).toLocaleString("es-ES")} €
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

/**
 * Inline fee display for property cards - shows fee next to price
 * Spacest style: transparent from the start
 */
export function InlineFeeDisplay({
  price,
  currencySymbol = "€",
}: {
  price: number;
  currencySymbol?: string;
}) {
  const t = useI18n();
  const copy = t.public.feeTransparency;
  const fee = Math.round(price * 0.08);

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold text-deep-navy">
        {currencySymbol}
        {price.toLocaleString("es-ES")}
      </span>
      <span className="text-sm text-warm-slate">{copy.perMonthShort}</span>
      <span className="text-xs text-stone-400">
        + {currencySymbol}
        {fee.toLocaleString("es-ES")} {copy.fee}
      </span>
    </div>
  );
}

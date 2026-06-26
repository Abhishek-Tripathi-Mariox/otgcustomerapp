/**
 * Currency formatting helpers — matches the admin panel's convention
 * (`₹` prefix, Indian digit grouping, no decimals).
 *
 * Use `formatCurrency(123456.78)` → "₹1,23,457"
 * Use `formatPrice(123.45)` → "1,23,457" (no symbol)
 */

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '₹0';
  }
  return `₹${Math.round(Number(amount)).toLocaleString('en-IN')}`;
};

export const formatPrice = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '0';
  }
  return Math.round(Number(amount)).toLocaleString('en-IN');
};

/**
 * Detailed currency formatter that preserves paise (2 decimal places).
 * Use for itemized accounting/tax breakdowns where the cents matter
 * (e.g. cart price summary: Basic Price, GST, MRP, Selling Price).
 *
 * formatCurrencyDetailed(6610.1610) → "₹6,610.16"
 */
export const formatCurrencyDetailed = (
  amount: number | null | undefined,
): string => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '₹0.00';
  }
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

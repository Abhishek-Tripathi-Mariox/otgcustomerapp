/**
 * Client-side mirror of the backend's `computeConvenienceFee`
 * (OTG backend/src/controllers/mobileOrders.controller.ts) — kept in sync so
 * the displayed cart/checkout total always matches what's actually charged.
 * "per_km" has no distance data available anywhere in this app yet, so it's
 * treated the same as "fixed" rather than guessing a distance.
 */
export const computeConvenienceFee = (
  transportation: {type?: string; charge?: number} | undefined,
  quantity: number,
): number => {
  const charge = Number(transportation?.charge) || 0;
  if (!transportation || transportation.type === 'free' || charge <= 0) return 0;
  if (transportation.type === 'per_unit') return +(charge * quantity).toFixed(2);
  return +charge.toFixed(2); // "fixed" and "per_km"
};

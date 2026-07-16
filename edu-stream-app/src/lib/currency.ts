// CFA franc (XOF) has no minor unit, so amounts are always whole numbers —
// unlike the $12.50-style USD formatting this app used before.
const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return formatter.format(amount);
}

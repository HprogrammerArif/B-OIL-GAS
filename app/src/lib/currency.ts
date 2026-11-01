// src/utils/currency.ts
export const formatBDT = (amount: number) =>
  new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
  }).format(amount);

//   <Text className="text-success">{formatBDT(150)}</Text> // → ৳১৫০.০০

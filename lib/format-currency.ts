/**
 * Format number as Pound Sterling currency
 * @param amount - The amount to format
 * @returns Formatted currency string with £ symbol
 */
export const formatPounds = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

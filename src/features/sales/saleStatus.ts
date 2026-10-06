import type { Sale } from '@/types';

/** A sale counts as Partially paid when some money is in but a balance remains. */
// Derived here as well as on the server so the status reads correctly even
// when the API only knows Sold / Paid.
export function withEffectiveStatus(sale: Sale): Sale {
  const status = sale.status === 'SOLD' && sale.receivedAmount > 0 ? 'PARTIALLY_PAID' : sale.status;
  return status === sale.status ? sale : { ...sale, status };
}


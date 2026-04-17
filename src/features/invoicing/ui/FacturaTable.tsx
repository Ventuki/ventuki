import type { InvoiceRecord } from "../types/invoice.types";

export function FacturaTable({ invoices }: { invoices: InvoiceRecord[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-left">Folio</th>
          <th className="text-left">Cliente</th>
          <th className="text-right">Total</th>
          <th className="text-left">Estatus</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.series}-{invoice.folio}</td>
            <td>{invoice.fiscal_data.businessName}</td>
            <td className="text-right">${invoice.total.toFixed(2)}</td>
            <td>{invoice.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

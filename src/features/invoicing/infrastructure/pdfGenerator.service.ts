export const pdfGeneratorService = {
  async generate(invoiceId: string) {
    if (!invoiceId) throw new Error("Factura inválida para PDF");
    return {
      pdf_url: `https://cdn.example.com/invoices/${invoiceId}.pdf`,
    };
  },
};

export const emailService = {
  async sendInvoice(to: string, attachments: { pdfUrl: string | null; xmlUrl: string | null }) {
    if (!to) throw new Error("Email requerido");
    return {
      delivered: true,
      to,
      attachments,
    };
  },
};

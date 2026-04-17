import { reportRepository } from "../infrastructure/report.repository";

export async function getDailySalesUseCase(
  companyId: string,
  startDate: Date,
  endDate: Date,
  permissions: string[]
) {
  // Aseguramos que el usuario tiene permisos de nivel gerencial/admin
  if (!permissions.includes("report.view")) {
    throw new Error("Permiso denegado: Se requiere rol visualizador de reportes.");
  }

  const { data, error } = await reportRepository.getDailySales(companyId, startDate, endDate);

  if (error || !data) {
    throw new Error("Error al calcular el reporte analítico desde la Base de Datos");
  }

  return data;
}

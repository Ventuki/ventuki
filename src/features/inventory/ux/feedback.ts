export function stockAlertLabel(severity: "low" | "overflow") {
  return severity === "low" ? "Stock mínimo alcanzado" : "Stock máximo excedido";
}

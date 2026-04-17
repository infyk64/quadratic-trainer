import { api } from "../api/client";

export async function downloadCsv(endpoint: string, filename: string) {
  const response = await api.get(endpoint, { responseType: "blob" });
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

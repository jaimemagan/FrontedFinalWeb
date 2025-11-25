// src/services/productoService.js

const API_URL = import.meta.env.VITE_API_URL; // <-- CAMBIA ESTO

export async function crearProducto(formDataProducto) {
  // Si usas JWT, puedes descomentar esto:
  // const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/Productos`, {
    method: "POST",
    body: formDataProducto,
    // No pongas Content-Type, el navegador lo setea para FormData
    // headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Error al crear producto: ${response.status} ${errorText}`
    );
  }

  return response.json().catch(() => null);
}

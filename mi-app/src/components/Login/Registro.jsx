import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;
import "./Login.css";

export default function Registro() {
  const navigate = useNavigate();

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    correo: "",
    phone: "",
    password: "",
  });

  const [mensaje, setMensaje] = useState("");

  // Estados para verificación de correo
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [errorPopup, setErrorPopup] = useState("");
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);

  // Manejo del cambio en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 1) Enviar código de verificación al correo -> abre popup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setErrorPopup("");

    if (!form.correo) {
      setMensaje("⚠️ Debes ingresar un correo electrónico.");
      return;
    }

    try {
      setEnviandoCodigo(true);

      const res = await fetch(`${API_URL}/api/verificacion/enviar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.correo }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        setMensaje(
          error.mensaje ||
            error.message ||
            "⚠️ No se pudo enviar el código de verificación."
        );
        return;
      }

      // Código enviado correctamente → mostramos el popup
      setPopupAbierto(true);
      setMensaje(""); // mensaje general lo manejamos después del registro
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al conectar con el servidor de verificación.");
    } finally {
      setEnviandoCodigo(false);
    }
  };

  // 2) Registrar al usuario en la API de Usuarios (solo después de verificar el código)
  const registrarUsuario = async () => {
    setMensaje("");

    const data = {
      idUsuario: form.usuario,
      nombreUsuario: form.nombre,
      emailUsuario: form.correo,
      telefonoUsuario: form.phone,
      password: form.password,
    };

    try {
      const res = await fetch(`${API_URL}/api/Usuarios/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        setMensaje(error.message || "⚠️ Error al registrar usuario");
        return;
      }

      const result = await res.json();
      setMensaje(`✅ Usuario ${result.idUsuario} registrado correctamente.`);

      // Limpiar
      setForm({
        nombre: "",
        usuario: "",
        correo: "",
        phone: "",
        password: "",
      });
      setCodigo("");
      setPopupAbierto(false);

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al conectar con el servidor.");
    }
  };

  // 3) Verificar código ingresado en el popup
  const handleVerificarCodigo = async () => {
    setErrorPopup("");

    if (!codigo || codigo.trim().length !== 6) {
      setErrorPopup("Ingresa el código de 6 dígitos.");
      return;
    }

    try {
      setVerificandoCodigo(true);

      const res = await fetch(`${API_URL}/api/verificacion/verificar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.correo,
          codigo: codigo.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        setErrorPopup(
          error.mensaje ||
            error.message ||
            "Código incorrecto o expirado. Intenta de nuevo."
        );
        return;
      }

      // Código validado → ahora sí registramos al usuario
      await registrarUsuario();
    } catch (err) {
      console.error(err);
      setErrorPopup("❌ Error al verificar el código.");
    } finally {
      setVerificandoCodigo(false);
    }
  };

  // (Opcional) Reenviar código desde el popup
  const handleReenviarCodigo = async () => {
    setErrorPopup("");
    setMensaje("");

    if (!form.correo) {
      setErrorPopup("No hay correo válido para reenviar el código.");
      return;
    }

    try {
      setEnviandoCodigo(true);

      const res = await fetch(`${API_URL}/api/Verificacion/enviar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.correo }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        setErrorPopup(
          error.mensaje ||
            error.message ||
            "No se pudo reenviar el código, intenta más tarde."
        );
        return;
      }

      setErrorPopup("✅ Se ha reenviado el código a tu correo.");
    } catch (err) {
      console.error(err);
      setErrorPopup("❌ Error al reenviar el código.");
    } finally {
      setEnviandoCodigo(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Crear cuenta</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              autoComplete="name"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="usuario"
              placeholder="Usuario (único)"
              autoComplete="username"
              value={form.usuario}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="correo"
              placeholder="Correo electrónico"
              autoComplete="email"
              value={form.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="phone"
              placeholder="Número Telefónico"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              autoComplete="new-password"
              minLength={6}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Botón principal reutilizando tu estilo .btn-53 */}
          <button
            type="submit"
            className="btn-53"
            disabled={enviandoCodigo || verificandoCodigo}
          >
            <div className="original">
              {enviandoCodigo ? "Enviando código..." : "Registrarme"}
            </div>
            <div className="letters">
              <span>R</span>
              <span>E</span>
              <span>G</span>
              <span>I</span>
              <span>S</span>
              <span>T</span>
              <span>R</span>
              <span>A</span>
              <span>R</span>
              <span>M</span>
              <span>E</span>
            </div>
          </button>
        </form>

        {/* Mensaje de resultado general */}
        {mensaje && (
          <p
            style={{
              marginTop: "1rem",
              textAlign: "center",
              color: mensaje.startsWith("✅") ? "green" : "red",
            }}
          >
            {mensaje}
          </p>
        )}

        <div className="register-section" style={{ marginTop: "1.2rem" }}>
          <p>¿Ya tienes cuenta?</p>
          <button
            type="button"
            className="btn-register"
            onClick={() => navigate("/login")}
          >
            Iniciar sesión
          </button>
        </div>
      </div>

      {/* ================= POPUP VERIFICACIÓN CORREO ================= */}
      {popupAbierto && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Verifica tu correo</h3>
            <p className="modal-text">
              Te enviamos un código de verificación a:
              <br />
              <strong>{form.correo}</strong>
            </p>

            <input
              type="text"
              maxLength={6}
              className="modal-input"
              placeholder="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />

            {errorPopup && <p className="modal-error">{errorPopup}</p>}

            <div className="modal-actions">
              <button
                className="btn-modal-primary"
                onClick={handleVerificarCodigo}
                disabled={verificandoCodigo}
              >
                {verificandoCodigo ? "Verificando..." : "Verificar código"}
              </button>

              <button
                className="btn-modal-secondary"
                type="button"
                onClick={() => {
                  setPopupAbierto(false);
                  setCodigo("");
                  setErrorPopup("");
                }}
              >
                Cancelar
              </button>
            </div>

            <button
              type="button"
              className="modal-resend"
              onClick={handleReenviarCodigo}
              disabled={enviandoCodigo}
            >
              {enviandoCodigo ? "Reenviando..." : "Reenviar código"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

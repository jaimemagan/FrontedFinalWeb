// src/pages/AgregarProducto.jsx
import React, { useState, useEffect, useRef } from "react";
import "./agregarProducto.css";
import { crearProducto } from "./productoService";

const CONDICIONES = [
  { id: "C001", nombre: "Nuevo" },
  { id: "C002", nombre: "Usado - Como nuevo" },
  { id: "C003", nombre: "Usado - Buen estado" },
  { id: "C004", nombre: "Usado - Regular" },
  { id: "C005", nombre: "Reacondicionado" },
];

const CATEGORIAS = [
  { id: "CAT001", nombre: "Relojes" },
  { id: "CAT002", nombre: "Joyería" },
  { id: "CAT003", nombre: "Electrónica" },
  { id: "CAT004", nombre: "Moda" },
  { id: "CAT005", nombre: "Hogar y decoración" },
  { id: "CATS01", nombre: "Slider y Ofertas" },
];

// Select animado
const AnimatedSelect = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.id === value);

  return (
    <div
      className={`ap-select-wrapper ${open ? "ap-select-open" : ""}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="ap-select-display"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>
          {selected
            ? `${selected.nombre} (${selected.id})`
            : placeholder || "Selecciona..."}
        </span>
        <span className="ap-select-arrow" aria-hidden="true" />
      </button>

      <ul className="ap-select-menu">
        {options.map((opt) => (
          <li
            key={opt.id}
            className={`ap-select-option ${
              value === opt.id ? "ap-select-option--active" : ""
            }`}
            onClick={() => {
              onChange(opt.id);
              setOpen(false);
            }}
          >
            <span className="ap-option-nombre">{opt.nombre}</span>
            <span className="ap-option-id">{opt.id}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AgregarProducto = () => {
  const [idUsuario, setIdUsuario] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [marca, setMarca] = useState("");
  const [condicion, setCondicion] = useState("C001");
  const [categoria, setCategoria] = useState("CAT001");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        const userObj = JSON.parse(userData);

        if (userObj && userObj.idUsuario) {
          setIdUsuario(userObj.idUsuario);
        } else {
          console.warn("No se encontró idUsuario dentro de user");
        }
      } catch (error) {
        console.error("Error al parsear user:", error);
      }
    } else {
      console.warn("No hay usuario en localStorage");
    }
  }, []);

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    setImagen(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!idUsuario) {
      setMensaje("No se encontró el ID de usuario en el navegador.");
      return;
    }
    if (!imagen) {
      setMensaje("Debes seleccionar una imagen.");
      return;
    }

    try {
      setCargando(true);

      const formData = new FormData();
      formData.append("idUsuario", idUsuario);
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      formData.append("marca", marca);
      formData.append("idCondicion", condicion);
      formData.append("idCategoria", categoria);
      formData.append("precio", precio);
      formData.append("imagen", imagen);

      await crearProducto(formData);
      setMensaje("Producto publicado correctamente 😎");

      setTitulo("");
      setDescripcion("");
      setMarca("");
      setCondicion("C001");
      setCategoria("CAT001");
      setPrecio("");
      setImagen(null);
      setPreview(null);
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error al guardar el producto.");
    } finally {
      setCargando(false);
    }
  };

  const isSuccessMessage =
    mensaje && mensaje.toLowerCase().includes("correctamente");

  return (
    <main className="contenedor agregar-producto-page">
      <section className="agregar-producto-card">
        <header className="ap-header">
          <div className="ap-header-left">
            <span className="ap-badge-mercauca">MercaUca · Vender</span>
            <h2 className="ap-title">Publicar un producto</h2>
            <p className="ap-subtitle">
              Sube una buena foto, describe tu producto y ponlo a la venta en el
              catálogo de MercaUca.
            </p>
          </div>
          <div className="ap-header-right">
            <span className="ap-step-pill">Paso 1 de 1</span>
            <span className="ap-step-hint">Formulario de publicación</span>
          </div>
        </header>

        <form className="agregar-producto-form" onSubmit={handleSubmit}>
          {/* Columna imagen */}
          <div className="agregar-producto-columna">
            <div className="ap-upload-card">
              <label className="ap-label ap-label-upload">
                <span className="ap-label-text">Imagen del producto</span>

                <div className="ap-upload-dropzone">
                  <div className="ap-upload-icon">📷</div>
                  <div className="ap-upload-main">
                    Haz clic para seleccionar una imagen
                  </div>
                  <div className="ap-upload-sub">
                    JPEG o PNG recomendados · Ideal 1024×1024px
                  </div>
                  <div className="ap-upload-hint">
                    Una buena foto ayuda a vender más rápido.
                  </div>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="ap-input-file"
                />
              </label>

              {preview && (
                <div className="ap-preview-wrapper">
                  <div className="ap-preview-header">
                    <p className="ap-preview-titulo">Vista previa</p>
                    <span className="ap-preview-chip">Se verá así en el catálogo</span>
                  </div>
                  <div className="ap-preview-img-frame">
                    <img
                      src={preview}
                      alt="Vista previa producto"
                      className="ap-preview-img"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna datos */}
          <div className="agregar-producto-columna">
            <label className="ap-label">
              Título del producto
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="ap-input"
                placeholder="Ej. Reloj de pulsera clásico de acero inoxidable"
                required
              />
            </label>

            <label className="ap-label">
              Descripción
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="ap-textarea ap-input"
                rows={4}
                placeholder="Describe el estado, características, tamaño, color, etc."
                required
              />
            </label>

            <label className="ap-label">
              Marca
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="ap-input"
                placeholder="Ej. Casio, Samsung, sin marca…"
              />
            </label>

            <div className="ap-flex">
              <label className="ap-label ap-flex-item">
                Condición
                <AnimatedSelect
                  options={CONDICIONES}
                  value={condicion}
                  onChange={setCondicion}
                  placeholder="Selecciona condición"
                />
              </label>

              <label className="ap-label ap-flex-item">
                Categoría
                <AnimatedSelect
                  options={CATEGORIAS}
                  value={categoria}
                  onChange={setCategoria}
                  placeholder="Selecciona categoría"
                />
              </label>
            </div>

            <label className="ap-label">
              Precio (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="ap-input"
                placeholder="Ej. 19.99"
                required
              />
            </label>

            <div className="ap-id-usuario">
              <span>ID Usuario</span>
              <span className="ap-id-usuario-valor">
                {idUsuario || "No disponible"}
              </span>
            </div>

            <button
              type="submit"
              className="ap-boton-enviar"
              disabled={cargando}
            >
              <span className="ap-boton-main">
                {cargando ? "Publicando producto…" : "Publicar producto"}
              </span>
              <span className="ap-boton-sub">
                Se añadirá al catálogo de MercaUca
              </span>
            </button>

            {mensaje && (
              <p
                className={
                  "ap-mensaje " +
                  (isSuccessMessage
                    ? "ap-mensaje--success"
                    : "ap-mensaje--error")
                }
              >
                {mensaje}
              </p>
            )}
          </div>
        </form>
      </section>
    </main>
  );
};

export default AgregarProducto;

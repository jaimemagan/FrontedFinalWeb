// src/components/Productos/Producto_detalle.jsx
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import "./CSS/productDetail.css";

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Producto que puede venir desde:
  // - popup de búsqueda (fotoBase64 / foto)
  // - grid (imgSrc)
  const productoInicial = location.state?.producto || null;

  const [producto, setProducto] = useState(productoInicial);
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Popup bonito para mostrar mensajes (agregado / ya existe / error)
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success"); // "success" | "error"
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Función rápida para disparar el popup
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackOpen(true);

    // Que el popup se cierre solo después de un ratito
    setTimeout(() => {
      setFeedbackOpen(false);
    }, 2300);
  };

  // Traer detalle del producto desde la API
  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await fetch(`${API_URL}/api/Productos/${id}`);

        if (!res.ok) {
          console.warn("Error al obtener detalle:", res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (data.descripcion) {
          setDescripcion(data.descripcion);
        }

        // Si venimos directo del grid, armamos el objeto aquí
        if (!productoInicial) {
          setProducto({
            idProducto: data.idProducto,
            idProductoVariante: data.idProductoVariante, // si existe
            tituloProducto: data.tituloProducto,
            precio: data.precio,
            fotoBase64: data.fotoBase64,
            foto: data.foto,
          });
        }
      } catch (err) {
        console.error("Error obteniendo detalle:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [id, productoInicial]);

  const handleBack = () => navigate(-1);

  const incrementar = () => setCantidad((c) => c + 1);
  const decrementar = () => setCantidad((c) => (c > 1 ? c - 1 : 1));

  // ===== PRECIOS =====
  const unitPrice = Number(producto?.precio ?? 0);
  const totalPrice = unitPrice * cantidad;

  // Imagen del producto (probamos varias propiedades por si viene de fuentes distintas)
  const imageSrc =
    producto?.fotoBase64 ||
    producto?.foto ||
    producto?.imgSrc || // viene del grid
    "";

  // Agregar al carrito
  const handleAddToCart = async () => {
    if (!producto) return;

    try {
      setAdding(true);

      // Revisamos que haya usuario logueado
      const rawUser = localStorage.getItem("user");
      const rawToken = localStorage.getItem("token");

      if (!rawUser || !rawToken) {
        // Si no hay sesión, lo mandamos al login
        navigate("/Login");
        return;
      }

      let parsedUser = null;
      try {
        parsedUser = JSON.parse(rawUser);
      } catch {
        parsedUser = null;
      }

      const finalUser = parsedUser?.user || parsedUser || null;

      // El backend espera IdUsuario (o IdComprador, por si acaso)
      const idUsuario = finalUser?.idUsuario || finalUser?.idComprador;

      if (!idUsuario) {
        console.error("No se encontró idUsuario en el usuario logueado");
        navigate("/Login");
        return;
      }

      // Tomamos el id de variante o, en su defecto, el id del producto
      const idProductoVariante =
        producto.idProductoVariante ||
        producto.idProducto ||
        producto.id;

      // Precio total (unidad * cantidad)
      const precioTotal = totalPrice;

      // Payload para el endpoint de agregar al carrito
      const payload = {
        idUsuario,          // dueño del carrito
        idProductoVariante, // qué variante / producto estamos metiendo
        cantidad,           // cuántos
        precio: precioTotal,
        moneda: "USD",
      };

      console.log("Payload agregar-articulo:", payload);

      const res = await fetch(
        `${API_URL}/api/Carrito/agregar-articulo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Intentamos leer el cuerpo como JSON para agarrar el "mensaje"
      let mensaje = "";
      try {
        const data = await res.json();
        mensaje = data?.mensaje || "";
      } catch {
        // Si el backend no manda JSON o truena, no pasa nada, usamos mensajes genéricos
      }

      if (!res.ok) {
        // Si la API responde error, mostramos el mensaje que venga o uno genérico
        if (mensaje) {
          // Por ejemplo: "El artículo ya está en el carrito."
          showFeedback("error", mensaje);
        } else {
          showFeedback("error", "No se pudo agregar al carrito.");
        }
        return;
      }

      // Si todo salió bien, mensaje bonito
      if (mensaje) {
        // Puede ser "Artículo agregado correctamente." o algo similar
        showFeedback("success", mensaje);
      } else {
        showFeedback("success", "Producto agregado al carrito ✅");
      }
    } catch (err) {
      console.error("Error en handleAddToCart:", err);
      showFeedback("error", "Ups, algo pasó al agregar al carrito.");
    } finally {
      setAdding(false);
    }
  };

  // ===== ESTADOS DE CARGA / ERROR =====
  if (!producto && loading) {
    return (
      <main className="product-page">
        <div className="pd-back-wrap">
          <button
            type="button"
            className="pd-back-btn"
            onClick={handleBack}
          >
            REGRESAR A TIENDA
          </button>
        </div>
        <p className="pd-status">Cargando producto…</p>
      </main>
    );
  }

  if (!producto && !loading) {
    return (
      <main className="product-page">
        <div className="pd-back-wrap">
          <div className="pd-back-wrap">
            <button
              type="button"
              className="pd-back-btn"
              onClick={handleBack}
            >
              <span className="pd-back-icon">←</span>

              <div className="pd-back-text">
                <span className="pd-back-label">Regresar a tienda</span>
                <span className="pd-back-sub">
                  Seguir viendo más productos
                </span>
              </div>
            </button>
          </div>
        </div>
        <p className="pd-status">No se encontró el producto.</p>
      </main>
    );
  }

  // Vista principal
  return (
    <main className="product-page">
      {/* Barra superior para regresar */}
      <div className="pd-back-wrap">
        <button
          type="button"
          className="pd-back-btn"
          onClick={handleBack}
        >
          REGRESAR A TIENDA
        </button>
      </div>

      {/* Layout principal */}
      <section className="pd-layout">
        {/* Imagen grande del producto */}
        <div className="pd-image-card">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={producto.tituloProducto || producto.nombre}
              className="pd-image"
            />
          )}
        </div>

        {/* Info del producto */}
        <div className="pd-info">
          <h1 className="pd-title">
            {producto.tituloProducto || producto.nombre}
          </h1>

          {/* Precio unitario */}
          <div className="pd-price-row">
            <span className="pd-price-label">Precio unidad</span>
            <span className="pd-price-value">
              ${unitPrice.toFixed(2)}
            </span>
          </div>

          {/* Cantidad + Total */}
          <div className="pd-summary-card">
            <div className="pd-qty-block">
              <span className="pd-block-title">Cantidad</span>
              <div className="pd-qty-control">
                <button
                  type="button"
                  className="pd-qty-btn"
                  onClick={decrementar}
                  disabled={adding}
                >
                  −
                </button>
                <span className="pd-qty-value">{cantidad}</span>
                <button
                  type="button"
                  className="pd-qty-btn"
                  onClick={incrementar}
                  disabled={adding}
                >
                  +
                </button>
              </div>
            </div>

            <div className="pd-total-block">
              <span className="pd-block-title">Precio total</span>
              <div className="pd-total-row">
                <span className="pd-total-label">
                  {cantidad} x ${unitPrice.toFixed(2)}
                </span>
                <span className="pd-total-value">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="pd-description">
            <h2 className="pd-subtitle">DESCRIPCIÓN</h2>
            <p className="pd-description-text">
              {descripcion ||
                "Descripción no disponible por el momento."}
            </p>
          </div>

          {/* Botón agregar al carrito */}
          <button
            type="button"
            className="pd-add-btn"
            onClick={handleAddToCart}
            disabled={adding}
          >
            {adding ? "Agregando..." : "Agregar al carrito"}
          </button>
        </div>
      </section>

      {/* POPUP / TOAST PARA MENSAJES DEL CARRITO */}
      {feedbackOpen && (
        <div
          className="pd-toast-overlay"
          onClick={() => setFeedbackOpen(false)}
        >
          <div
            className={`pd-toast pd-toast-${feedbackType}`}
            onClick={(e) => e.stopPropagation()} // que no se cierre si hace click dentro
          >
            <div className="pd-toast-icon">
              {feedbackType === "success" ? "✔" : "✖"}
            </div>
            <p className="pd-toast-message">{feedbackMessage}</p>
          </div>
        </div>
      )}
    </main>
  );
}

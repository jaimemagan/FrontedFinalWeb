// src/components/Productos/Producto_detalle.jsx
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import "./CSS/productDetail.css";

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const productoInicial = location.state?.producto || null;

  const [producto, setProducto] = useState(productoInicial);
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success"); // "success" | "error"
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackOpen(true);

    setTimeout(() => {
      setFeedbackOpen(false);
    }, 2300);
  };

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

        if (!productoInicial) {
          setProducto({
            idProducto: data.idProducto,
            idProductoVariante: data.idProductoVariante,
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

  const unitPrice = Number(producto?.precio ?? 0);
  const totalPrice = unitPrice * cantidad;

  const imageSrc =
    producto?.fotoBase64 ||
    producto?.foto ||
    producto?.imgSrc ||
    "";

  const codigoProducto =
    producto?.idProductoVariante ||
    producto?.idProducto ||
    producto?.id ||
    "N/A";

  const handleAddToCart = async () => {
    if (!producto) return;

    try {
      setAdding(true);

      const rawUser = localStorage.getItem("user");
      const rawToken = localStorage.getItem("token");

      if (!rawUser || !rawToken) {
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
      const idUsuario = finalUser?.idUsuario || finalUser?.idComprador;

      if (!idUsuario) {
        console.error("No se encontró idUsuario en el usuario logueado");
        navigate("/Login");
        return;
      }

      const idProductoVariante =
        producto.idProductoVariante ||
        producto.idProducto ||
        producto.id;

      const precioTotal = totalPrice;

      const payload = {
        idUsuario,
        idProductoVariante,
        cantidad,
        precio: precioTotal,
        moneda: "USD",
      };

      console.log("Payload agregar-articulo:", payload);

      const res = await fetch(`${API_URL}/api/Carrito/agregar-articulo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawToken}`,
        },
        body: JSON.stringify(payload),
      });

      let mensaje = "";
      try {
        const data = await res.json();
        mensaje = data?.mensaje || "";
      } catch {
        // si no hay JSON, mensaje genérico
      }

      if (!res.ok) {
        if (mensaje) {
          showFeedback("error", mensaje);
        } else {
          showFeedback("error", "No se pudo agregar al carrito.");
        }
        return;
      }

      if (mensaje) {
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
          <button
            type="button"
            className="pd-back-btn"
            onClick={handleBack}
          >
            <span className="pd-back-icon">←</span>
            <span className="pd-back-label">Regresar a tienda</span>
          </button>
        </div>
        <p className="pd-status">No se encontró el producto.</p>
      </main>
    );
  }

  return (
    <main className="product-page">
      {/* Barra superior para regresar */}
      <div className="pd-back-wrap">
        <button
          type="button"
          className="pd-back-btn"
          onClick={handleBack}
        >
          <span className="pd-back-icon">←</span>
          <span className="pd-back-label">Regresar a tienda</span>
        </button>
      </div>

      {/* Layout principal */}
      <section className="pd-layout">
        {/* Imagen grande del producto con marco mejorado */}
        <div className="pd-image-card">
          <div className="pd-image-inner">
            {imageSrc && (
              <img
                src={imageSrc}
                alt={producto.tituloProducto || producto.nombre}
                className="pd-image"
              />
            )}

            <div className="pd-image-gradient" />

            <div className="pd-image-badge">
              <span className="pd-image-badge-main">MercaUca</span>
              <span className="pd-image-badge-sub">Producto destacado</span>
            </div>

            <div className="pd-image-price-tag">
              <span className="pd-image-price-label">Desde</span>
              <span className="pd-image-price-value">
                ${unitPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Info del producto */}
        <div className="pd-info">
          {/* Badge + título + código */}
          <div className="pd-header-block">
            <span className="pd-chip-category">Artículo de catálogo</span>
            <h1 className="pd-title">
              {producto.tituloProducto || producto.nombre}
            </h1>
            <div className="pd-meta-row">
              <span className="pd-meta-pill">
                Código: <strong>{codigoProducto}</strong>
              </span>
              <span className="pd-meta-pill pd-meta-pill-soft">
                Disponible · Compra segura
              </span>
            </div>
          </div>

          {/* Precio unitario */}
          <div className="pd-price-row">
            <span className="pd-price-label">Precio por unidad</span>
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
              <span className="pd-qty-hint">
                Ajusta la cantidad antes de agregarlo a tu carrito.
              </span>
            </div>

            <div className="pd-total-block">
              <span className="pd-block-title">Resumen</span>
              <div className="pd-total-row">
                <span className="pd-total-label">
                  {cantidad} x ${unitPrice.toFixed(2)}
                </span>
                <span className="pd-total-value">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <span className="pd-total-hint">
                El precio puede variar al aplicar envío o promociones.
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div className="pd-description">
            <h2 className="pd-subtitle">DESCRIPCIÓN DEL PRODUCTO</h2>
            <p className="pd-description-text">
              {descripcion ||
                "Descripción no disponible por el momento. Pronto agregaremos más información sobre este producto."}
            </p>
          </div>

          {/* Botón agregar al carrito (diseño mejorado) */}
          <button
            type="button"
            className="pd-add-btn pd-add-btn-elevated"
            onClick={handleAddToCart}
            disabled={adding}
          >
            <div className="pd-add-left">
              <span className="pd-add-main">
                {adding ? "Agregando al carrito…" : "Agregar al carrito"}
              </span>
              <span className="pd-add-sub">
                Total estimado: ${totalPrice.toFixed(2)} USD
              </span>
            </div>
            <span className="pd-add-icon">
              🛒
            </span>
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
            onClick={(e) => e.stopPropagation()}
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

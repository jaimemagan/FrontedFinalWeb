// src/components/Carrito/CartPopup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;
import "./carrito.css";

const formatPrice = (value) => value.toFixed(2) + "$";

export default function CartPopup({ open, onClose }) {
  const [products, setProducts] = useState([]);
  const [shippingMode, setShippingMode] = useState("store"); // "store" | "home"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // <-- popup confirmación
  const navigate = useNavigate();

  //  CARGAR CARRITO DESDE LA API CUANDO SE ABRE EL POPUP
  useEffect(() => {
    if (!open) return; // si está cerrado, no hacemos nada

    const fetchCarrito = async () => {
      try {
        setLoading(true);
        setError("");

        const rawUser = localStorage.getItem("user");
        const rawToken = localStorage.getItem("token");

        if (!rawUser || !rawToken) {
          navigate("/Login");
          onClose && onClose();
          return;
        }

        let parsedUser = null;
        try {
          parsedUser = JSON.parse(rawUser);
        } catch {
          parsedUser = null;
        }

        const finalUser = parsedUser?.user || parsedUser || null;
        const usuario = finalUser?.idUsuario || finalUser?.idComprador;

        if (!usuario) {
          console.error("No se encontró usuario en localStorage para el carrito");
          navigate("/Login");
          onClose && onClose();
          return;
        }

        const res = await fetch(`${API_URL}/api/Carrito/${usuario}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${rawToken}`,
          },
        });

        if (!res.ok) {
          console.error("Error al obtener carrito:", res.status);
          const text = await res.text().catch(() => "");
          console.error("Detalle error carrito:", text);
          setError("No se pudo cargar el carrito.");
          setProducts([]);
          return;
        }

        const data = await res.json();
        console.log("Carrito desde API:", data);

        // data = array de CarritoItemDto:
        // { idProducto, tituloProducto, fotoBase64, precio, cantidad }
        const mapped = data.map((item, index) => ({
          id: item.idProducto || index, // <- este ID se usa para eliminar (debe ser IdProductoVariante)
          name: item.tituloProducto,
          sku: `#${item.idProducto || "N/A"}`,
          color: "N/A",
          extra: "",
          unitPrice: Number(item.precio ?? 0),
          quantity: item.cantidad,
          image: item.fotoBase64 || "",
        }));

        setProducts(mapped);
      } catch (err) {
        console.error("Error inesperado al cargar el carrito:", err);
        setError("Ocurrió un error inesperado cargando el carrito.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCarrito();
  }, [open, navigate, onClose]);

  // Si no está abierto, no renderizamos nada
  if (!open) return null;

  const subtotal = products.reduce(
    (acc, p) => acc + p.unitPrice * p.quantity,
    0
  );
  const shippingCost = shippingMode === "home" ? 9.9 : 0;
  const total = subtotal + shippingCost;

  // ===== ELIMINAR ARTÍCULO DEL CARRITO =====
  const handleRemoveItem = async (productId) => {
    try {
      setError("");

      const rawUser = localStorage.getItem("user");
      const rawToken = localStorage.getItem("token");

      if (!rawUser || !rawToken) {
        navigate("/Login");
        onClose && onClose();
        return;
      }

      let parsedUser = null;
      try {
        parsedUser = JSON.parse(rawUser);
      } catch {
        parsedUser = null;
      }

      const finalUser = parsedUser?.user || parsedUser || null;
      const usuario = finalUser?.idUsuario || finalUser?.idComprador;

      if (!usuario) {
        console.error("No se encontró usuario en localStorage para eliminar artículo");
        navigate("/Login");
        onClose && onClose();
        return;
      }

      const res = await fetch(
        `${API_URL}/api/Carrito/eliminar-articulo/${usuario}/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${rawToken}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Error al eliminar artículo:", res.status);
        const text = await res.text().catch(() => "");
        console.error("Detalle error eliminar artículo:", text);
        setError("No se pudo eliminar el artículo del carrito.");
        return;
      }

      // Si todo bien, quitarlo del estado local
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("Error inesperado al eliminar artículo:", err);
      setError("Ocurrió un error inesperado al eliminar el artículo.");
    }
  };

  // ===== FINALIZAR COMPRA (LLAMADO DESDE EL POPUP DE CONFIRMACIÓN) =====
  const handleCheckout = async () => {
    if (!products.length) {
      alert("Tu carrito está vacío.");
      return;
    }

    try {
      setCheckingOut(true);
      setError("");

      const rawUser = localStorage.getItem("user");
      const rawToken = localStorage.getItem("token");

      if (!rawUser || !rawToken) {
        navigate("/Login");
        onClose && onClose();
        return;
      }

      let parsedUser = null;
      try {
        parsedUser = JSON.parse(rawUser);
      } catch {
        parsedUser = null;
      }

      const finalUser = parsedUser?.user || parsedUser || null;
      const usuario = finalUser?.idUsuario || finalUser?.idComprador;

      if (!usuario) {
        console.error("No se encontró usuario en localStorage para finalizar compra");
        navigate("/Login");
        onClose && onClose();
        return;
      }

      const res = await fetch(
        `${API_URL}/api/Carrito/finalizar-compra/${usuario}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${rawToken}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Error al finalizar compra:", res.status);
        const text = await res.text().catch(() => "");
        console.error("Detalle error finalizar compra:", text);
        setError("No se pudo finalizar la compra.");
        return;
      }

      setProducts([]);

      // Animación de éxito
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose && onClose();
      }, 2500);
    } catch (err) {
      console.error("Error inesperado al finalizar compra:", err);
      setError("Ocurrió un error inesperado al finalizar la compra.");
    } finally {
      setCheckingOut(false);
    }
  };

  // Botón "Terminar pedido" ahora solo abre el popup de confirmación
  const handleOpenConfirm = () => {
    if (!products.length) {
      alert("Tu carrito está vacío.");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmCheckout = async () => {
    setShowConfirm(false);
    await handleCheckout();
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div
        className="cart-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="cart-header">
          <div className="cart-header-left">
            <span className="cart-badge-mercauca">MercaUca</span>
            <h2 className="cart-title">Tu carrito</h2>
            <p className="cart-subtitle">
              Revisa tus productos antes de confirmar tu pedido
            </p>
          </div>

          <button className="cart-ghost-button" onClick={onClose}>
            ← Seguir comprando
          </button>
        </header>

        {/* ESTADO DE CARGA / ERROR */}
        {loading && <p className="cart-status">Cargando carrito…</p>}
        {error && !loading && (
          <p className="cart-status cart-status-error">{error}</p>
        )}

        {/* CABECERA TABLA */}
        {!loading && products.length > 0 && (
          <div className="cart-table-header">
            <span className="cart-col-product">Productos</span>
            <span className="cart-col-price">Precio unitario</span>
            <span className="cart-col-qty">QTY</span>
            <span className="cart-col-total">TOTAL</span>
            <span className="cart-col-actions">Acciones</span>
          </div>
        )}

        {/* ITEMS */}
        <div className="cart-items">
          {!loading && products.length === 0 && !error && (
            <p className="cart-empty">Tu carrito está vacío.</p>
          )}

          {products.map((product) => {
            const lineTotal = product.unitPrice * product.quantity;

            return (
              <div className="cart-row" key={product.id}>
                <div className="cart-col-product cart-product-info">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="cart-product-image"
                    />
                  )}
                  <div>
                    <div className="cart-product-name">{product.name}</div>
                    <div className="cart-product-sku">{product.sku}</div>
                    <div className="cart-product-meta">
                      Color: {product.color}
                      {" // "}
                      <span className="cart-product-extra">
                        Extra: {product.extra || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cart-col-price">
                  {formatPrice(product.unitPrice)}
                </div>

                {/* QTY SOLO LECTURA */}
                <div className="cart-col-qty">
                  <span className="qty-value">{product.quantity}</span>
                </div>

                <div className="cart-col-total">
                  {formatPrice(lineTotal)}
                </div>

                {/* BOTÓN ELIMINAR */}
                <div className="cart-col-actions">
                  <button
                    className="cart-remove-btn"
                    onClick={() => handleRemoveItem(product.id)}
                  >
                    ✕ Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ENVÍO + RESUMEN */}
        <section className="cart-bottom">
          {/* Envío */}
          <div>
            <h3 className="cart-shipping-title">Elige un modo de envio</h3>

            <label className="shipping-option">
              <input
                type="radio"
                name="shipping"
                value="store"
                checked={shippingMode === "store"}
                onChange={(e) => setShippingMode(e.target.value)}
              />
              <span className="shipping-radio" />
              <div className="shipping-text">
                <div className="shipping-main">
                  Retirar en tienda (Listo en 20 min)
                </div>
                <div className="shipping-sub">Gratis</div>
              </div>
            </label>

            <label className="shipping-option">
              <input
                type="radio"
                name="shipping"
                value="home"
                checked={shippingMode === "home"}
                onChange={(e) => setShippingMode(e.target.value)}
              />
              <span className="shipping-radio" />
              <div className="shipping-text">
                <div className="shipping-main">
                  Entrega en casa (Alrededor de 2 – 4 dias)
                </div>
                <div className="shipping-sub">9.90$</div>
                <div className="shipping-address">
                  At 45 Glendrige Ave, Brooklyn, NY 11220
                </div>
              </div>
            </label>
          </div>

          {/* Resumen */}
          <div className="cart-summary">
            <div className="summary-row">
              <span>SUBTOTAL TTC</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="summary-row">
              <span>Envio</span>
              <span>
                {shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}
              </span>
            </div>

            <div className="summary-row summary-row-total">
              <span>TOTAL</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={handleOpenConfirm}
              disabled={checkingOut || loading || !products.length}
            >
              {checkingOut ? "Procesando..." : "Terminar Pedido"}
              <span className="checkout-amount">{formatPrice(total)}</span>
            </button>
          </div>
        </section>

        {/* POPUP DE CONFIRMACIÓN DE COMPRA */}
        {showConfirm && (
          <div className="cart-confirm-overlay">
            <div className="cart-confirm-modal">
              <h3 className="cart-confirm-title">Confirmar compra</h3>
              <p className="cart-confirm-text">
                Vas a realizar un pedido por <strong>{formatPrice(total)}</strong>.
                <br />
                ¿Deseas continuar?
              </p>
              <div className="cart-confirm-actions">
                <button
                  className="cart-confirm-cancel"
                  onClick={() => setShowConfirm(false)}
                  disabled={checkingOut}
                >
                  Cancelar
                </button>
                <button
                  className="cart-confirm-ok"
                  onClick={handleConfirmCheckout}
                  disabled={checkingOut}
                >
                  Sí, confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ANIMACIÓN DE CONFIRMACIÓN FINAL */}
        {success && (
          <div className="cart-success-overlay">
            <div className="cart-success-modal">
              <div className="cart-success-icon">✔</div>
              <h3 className="cart-success-title">¡Compra realizada!</h3>
              <p className="cart-success-text">
                Te hemos enviado un correo con el resumen de tu pedido.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

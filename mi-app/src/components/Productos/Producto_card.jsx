// src/components/Productos/Producto_card.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Producto_card.css";

export default function ProductoCard({
  to = "/producto",
  producto,          // objeto original
  imgSrc = "",
  alt = "Producto",
  nombre = "Producto",
  precio = "$0.00",
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();

    // Mandamos el producto + la img resuelta
    navigate(to, {
      state: {
        producto: {
          ...(producto || {}),
          imgSrc, // imagen ya resuelta en la card
        },
      },
    });
  };

  // Intentamos extraer un código de producto si existe
  const codigo =
    producto?.idProductoVariante ||
    producto?.idProducto ||
    producto?.id ||
    null;

  return (
    <div className="producto">
      <a
        href={to}
        onClick={handleClick}
        className="producto__link"
        aria-label={`Ver detalle: ${nombre}`}
      >
        {/* Imagen + badges */}
        <div className="producto__image-wrap">
          <img
            className="producto__imagen"
            src={imgSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
          />

          <div className="producto__badge">
            <span className="producto__badge-main">MercaUca</span>
            <span className="producto__badge-sub">Ver detalle</span>
          </div>

          <div className="producto__price-pill">
            <span className="producto__price-label">Desde</span>
            <span className="producto__price-value">{precio}</span>
          </div>
        </div>

        {/* Info inferior */}
        <div className="producto__informacion">
          <p className="producto__nombre">{nombre}</p>

          <div className="producto__meta-row">
            {codigo && (
              <span className="producto__sku">
                #{codigo}
              </span>
            )}
            <span className="producto__meta">
              Entrega rápida · Pago seguro
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

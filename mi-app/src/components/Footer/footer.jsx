// src/components/Layout/Footer.jsx
import React from "react";
import "./footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    // CAMBIA ENTRE ESTAS DOS OPCIONES:
    // 1) footer-mercauca--boxed  (footer del tamaño del contenido)
    // 2) footer-mercauca--full   (footer que llena todo el ancho)
    
    <footer className="footer-mercauca footer-mercauca--full">
      <div className="footer-inner">
        <h2 className="footer-brand">MERCAUCA</h2>

        <div className="footer-divider"></div>

        <p className="footer-copy">
          © {year} MercaUca — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

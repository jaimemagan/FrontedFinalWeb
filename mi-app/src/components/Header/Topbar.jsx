// src/components/Topbar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;
import "./topbar.css";

export default function Topbar({ onCartClick }) {
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  // --- Popup Search ---
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  //Cantidad de CARRITO
  const obtenerCantidadArticulos = async (idUsuario) => {
    if (!idUsuario) {
      setCartCount(0);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setCartCount(0);
        return;
      }

      const res = await fetch(
        `${API_URL}/api/Carrito/cantidad-articulos/${encodeURIComponent(
          idUsuario
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // JWT para pasar la autorizacion y no rebotar un 404
          },
        }
      );

      if (!res.ok) {
        setCartCount(0);
        return;
      }

      const data = await res.json();
      const numero = typeof data === "number" ? data : Number(data);

      if (!Number.isNaN(numero)) {
        setCartCount(numero);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error("Error al obtener cantidad de artículos:", err);
      setCartCount(0);
    }
  };

  // Barra de busqueda de productos
  const onSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowResults(true);
  };

  const buscarProductos = async (texto) => {
    try {
      setIsSearching(true);

      const res = await fetch(
        `${API_URL}/api/Search/buscar?query=${encodeURIComponent(texto)}`
      );

      if (!res.ok) {
        setResults([]);
        setShowResults(true);
        return;
      }

      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setShowResults(true);
    } catch (err) {
      console.error("Error al buscar productos:", err);
      setResults([]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const texto = query.trim();
    if (!texto) {
      setShowResults(false);
      setResults([]);
      return;
    }

    const id = setTimeout(() => buscarProductos(texto), 350);
    return () => clearTimeout(id);
  }, [query]);

  const irAProducto = (producto) => {
    navigate(`/producto/${producto.idProducto}`, {
      state: { producto },
    });
    setShowResults(false);
  };

  // Verificacion de token
  useEffect(() => {
    const verificarToken = async () => {
      try {
        const rawUser = localStorage.getItem("user");
        const rawToken = localStorage.getItem("token");
        const expiresAtUtc = localStorage.getItem("expiresAtUtc");

        let parsedUser = null;
        if (rawUser) {
          try {
            parsedUser = JSON.parse(rawUser);
          } catch {}
        }

        const token = parsedUser?.token || rawToken;

        if (!token) {
          setUser(null);
          setCartCount(0);
          return;
        }

        if (expiresAtUtc && new Date(expiresAtUtc) <= new Date()) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("expiresAtUtc");
          setUser(null);
          setCartCount(0);
          return;
        }

        // Validamos el token en ASP.NET
        const res = await fetch(`${API_URL}/api/Usuarios/verify`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const finalUser = parsedUser?.user || parsedUser || null;
          setUser(finalUser);

          // 👇 APENAS SE VERIFICA EL TOKEN, CARGAMOS EL CARRITO
          if (finalUser?.idUsuario) {
            obtenerCantidadArticulos(finalUser.idUsuario);
          }
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("expiresAtUtc");
          setUser(null);
          setCartCount(0);
        }
      } catch (err) {
        console.error("Error al verificar token:", err);
        setUser(null);
        setCartCount(0);
      }
    };

    verificarToken();
  }, []);

  // Recargar usuario si el carrito cambia
  useEffect(() => {
    if (user?.idUsuario) {
      obtenerCantidadArticulos(user.idUsuario);
    }
  }, [user]);

  //Topbar
  return (
    <section id="topbar" role="banner">
      <div className="topbar__wrap">
        {/* Logo */}
        <a href="/" className="topbar__brand" aria-label="Inicio MERCAUCA">
          MERCAUCA
        </a>

        {/* Buscador */}
        <form
          className="topbar__search"
          role="search"
          aria-label="Buscar productos"
          onSubmit={onSubmit}
        >
          <input
            type="search"
            name="q"
            placeholder="Buscar joyas, anillos, collares…"
            aria-label="Buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            autoComplete="off"
          />

          {showResults && (
            <div className="topbar__search-popup">
              {isSearching && (
                <div className="topbar__search-status">Buscando…</div>
              )}

              {!isSearching && results.length === 0 && (
                <div className="topbar__search-status">
                  Sin resultados para “{query.trim()}”
                </div>
              )}

              {!isSearching && results.length > 0 && (
                <ul className="topbar__search-list">
                  {results.map((p) => {
                    const imageSrc = p.fotoBase64 || p.foto;
                    return (
                      <li
                        key={p.idProducto}
                        className="topbar__search-item"
                        onMouseDown={() => irAProducto(p)}
                      >
                        {imageSrc && (
                          <img
                            src={imageSrc}
                            alt={p.tituloProducto}
                            className="topbar__search-thumb"
                          />
                        )}

                        <div className="topbar__search-info">
                          <span className="topbar__search-title">
                            {p.tituloProducto}
                          </span>
                          <span className="topbar__search-price">
                            ${Number(p.precio).toFixed(2)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </form>

        {/* Acciones derechas */}
        <div className="topbar__actions">
          {/* Icono carrito */}
          <button
            className="icon-btn"
            aria-label="Carrito"
            type="button"
            onClick={onCartClick}
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 17 18ZM6.2 6 5 2H2v2h2l3.6 9.59-1.35 3.14A2 2 0 0 0 8.1 19H19v-2H8.42a.25.25 0 0 1-.23-.15l.03-.1L9 15h7.55a2 2 0 0 0 1.85-1.23L21.88 8H19.7l-2.1 5H9.42L7.97 6H6.2Z"
              />
            </svg>
            <span className="badge">{cartCount}</span>
          </button>

          {/* Cuenta */}
          <div className="action-with-label">
            <button
              className="icon-btn"
              aria-label="Cuenta"
              type="button"
              onClick={() => navigate("/login")}
            >
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="currentColor"
                  d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                />
              </svg>
            </button>

            <span className="icon-label">
              {user
                ? user.nombreUsuario
                  ? `Bienvenido, ${user.nombreUsuario} 👋`
                  : `Bienvenido, ${user.idUsuario}`
                : "No has iniciado sesión"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

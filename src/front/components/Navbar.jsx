import { Link } from "react-router-dom";

export const Navbar = () => {
  const linkStyle = {
    background: "none",
    border: "none",
    color: "#CFE0CC",
    fontSize: 14,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    cursor: "pointer",
    padding: 0,
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "26px 64px",
        background: "#1F3327",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Link to="/" style={{ textDecoration: "none" }}>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#F6F4EE",
            letterSpacing: "-0.01em",
          }}
        >
          CAN CARGOL
        </span>
      </Link>
      <div style={{ display: "flex", gap: 40 }}>
        <Link to="/entorno" style={{ textDecoration: "none" }}>
          <button style={linkStyle}>Entorno</button>
        </Link>
        <Link to="/estancia" style={{ textDecoration: "none" }}>
          <button style={linkStyle}>La estancia</button>
        </Link>
        <Link to="/calendario" style={{ textDecoration: "none" }}>
          <button style={linkStyle}>Reservas</button>
        </Link>
        <Link to="/contacto" style={{ textDecoration: "none" }}>
          <button style={linkStyle}>Contacto</button>
        </Link>
      </div>
    </nav>
  );
};
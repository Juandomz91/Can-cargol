import { useState } from "react";

export const ContactForm = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    mensaje: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert("¡Gracias por contactarnos! Te responderemos pronto.");
        setFormData({ nombre: "", email: "", telefono: "", mensaje: "" });
      } else {
        alert("Error al enviar el mensaje. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error('Error:', error);
      alert("Error de conexión. Inténtalo de nuevo.");
    }
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#1F3327", display: "block", marginBottom: 6 };
  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 4,
    border: "1px solid #C8CABB",
    background: "#F6F4EE",
    fontSize: 15,
    fontFamily: "inherit",
  };

  return (
    <div style={{ background: "#EAE8DE", minHeight: "100vh", padding: "88px 24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: "#1F3327", textAlign: "center", margin: 0 }}>
          Contacto
        </h2>
        <p style={{ fontSize: 15, color: "#4B5647", textAlign: "center", marginTop: 12 }}>
          Cuéntanos qué buscas en tu escapada.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label htmlFor="nombre" style={labelStyle}>Nombre</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="telefono" style={labelStyle}>Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+34 600 000 000"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="mensaje" style={labelStyle}>Mensaje</label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows="4"
              value={formData.mensaje}
              onChange={handleChange}
              placeholder="Escribe tu consulta..."
              required
              style={{ ...inputStyle, resize: "vertical" }}
            ></textarea>
          </div>

          <button
            type="submit"
            style={{
              padding: 14,
              border: "none",
              borderRadius: 4,
              background: "#1F3327",
              color: "#F6F4EE",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

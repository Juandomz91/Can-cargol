import React from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function Home() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", minHeight: "80vh" }}>
      <div
        style={{
          padding: "80px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#1F3327",
          color: "#F6F4EE",
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#C9A66B", fontWeight: 600 }}>
          Amer · Girona
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 56, fontWeight: 700, lineHeight: 1.05, margin: "16px 0 0" }}>
          Naturaleza en estado puro
        </h1>
        <p style={{ fontSize: 17, color: "#CFE0CC", lineHeight: 1.7, marginTop: 24, maxWidth: 460 }}>
          Can Cargol es una masía rural rodeada de bosques y ríos cristalinos, en el corazón de <strong>Amer, Girona</strong>. Un lugar sencillo, tranquilo, para pasear, pedalear y desconectar del ritmo diario, redescubriendo el encanto de lo simple: senderos, rutas en bicicleta y la calma de un hogar rural con historia.
        </p>
        <Link
        to="/calendario"
        style={{
          marginTop: 32,
          display: "inline-flex",
          width: "fit-content",
          padding: "14px 28px",
          borderRadius: 4,
          background: "#C9A66B",
          color: "#1F3327",
          fontWeight: 600,
          fontSize: 15,
          textDecoration: "none",
  }}
>
  Reserva tu estancia
</Link>
      </div>
      <img
        src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/578583960.jpg?k=b62e764b5292d397ed8a6bd5e647bb3ee8e0acc84cc635da78a90f7547af68bb&o="
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 520 }}
        alt="Hotel Can Cargol"
      />
    </div>
  );
}

export default Home;

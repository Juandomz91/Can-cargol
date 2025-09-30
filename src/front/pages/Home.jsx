import React from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <div className="jumbotron text-black d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center container" style={{ maxWidth: "1000px" }}>
          <img 
            src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/578583960.jpg?k=b62e764b5292d397ed8a6bd5e647bb3ee8e0acc84cc635da78a90f7547af68bb&o="
            className="img-fluid rounded mb-4"
            alt="Hotel Can Cargol"
          />
          <h1 className="display-4">Can Cargol</h1>
          <p className="lead">
            Bienvenido a <strong>Can Cargol</strong>, tu refugio en plena naturaleza.  
            En el corazón de <strong>Amer, Girona</strong>, te esperan montañas cubiertas de bosques, ríos cristalinos y senderos que invitan a la calma y a la aventura.  
            Aquí podrás desconectar del ritmo diario y redescubrir el encanto de lo sencillo: paseos por la naturaleza, rutas en bicicleta, excursiones por el entorno y la tranquilidad de un hogar rural con historia.
          </p>
        </div>
      </div>
    </div>
  );
}



export default Home;

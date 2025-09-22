import React from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <div className="jumbotron text-black d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center container" style={{ maxWidth: "1000px" }}>
          <img 
            src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/202121894.jpg?k=d8aab19fe36b288c9a69ccb2d5fb00b179b2cba21f21c70a45a17f92aa3e0124&o=" 
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

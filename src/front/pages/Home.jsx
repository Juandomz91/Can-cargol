import React from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <div className="jumbotron text-black bg-success, d-flex, h-80vh, alignItems-center, justifyContent-center" style={{

      }}>

        <div className="text-center">
          <img src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/202121894.jpg?k=d8aab19fe36b288c9a69ccb2d5fb00b179b2cba21f21c70a45a17f92aa3e0124&o=" />
          <h1 className="display-4">Can Cargol</h1>
          <p className="lead">Descubre la tranquilidad y el encanto de nuestro hogar</p>
        </div>
      </div>

      <div>
        <div className="container py-5">
          <div className="row">
            <div className="col-md-3">
              <Link to="/entorno">
                <img
                  src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/143386646.jpg?k=718690d18ac11578222b56332c8ee148706fb2d2ad7ac1a1e53ce99b27c6ab57&o="
                  className="img-fixed"
                  alt="Entorno"
                />
                <p className="text-center mt-2 text-dark"><strong>Entorno</strong></p>
              </Link>
            </div>
            <div className="col-md-3">
              <Link to="/casa">
                <img
                  src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/371769732.jpg?k=b54311777dcc674cfe099887a4557b72d4d8a1710fc2ee033e8988243b6ec56d&o="
                  className="img-fixed"
                  alt="La casa"
                />
                <p className="text-center mt-2 text-dark"><strong>La casa</strong></p>
              </Link>
            </div>
            <div className="col-md-3">
              <Link to="/calendario">
                <img
                  src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/205976046.jpg?k=18ee8fdbfbf148c108d8db5bd134193e2e8e4254ea0716faf303e60cf22f210b&o="
                  className="img-fixed"
                  alt="Reservas"
                />
                <p className="text-center mt-2 text-dark"><strong>Reservas</strong></p>
              </Link>
            </div>
            <div className="col-md-3">
              <Link to="/contacto">
                <img
                  src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/142942103.jpg?k=409d4d5100c8515ff3872fad0765bd983843953b7fc4ec3f6e84923195588566&o="
                  className="img-fixed"
                  alt="Contacto"
                />
                <p className="text-center mt-2 text-dark"><strong>Contacto</strong></p>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}



export default Home;

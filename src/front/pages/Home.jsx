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

     

      </div>

  );
}



export default Home;

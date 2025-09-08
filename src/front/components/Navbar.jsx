import React from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const navbarStyle = {
    backgroundColor: "#596c0eff",
    padding: "0.5rem 1rem",
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
  };

  return (
    <div>
    <nav className="navbar navbar-expand-lg" style={navbarStyle}>
      <div className="container-fluid">
        <Link to="/" className="navbar-brand" style={linkStyle}>
          Can Cargol
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/features">
                Features
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/pricing">
                Pricing
              </Link>
            </li>
            <li className="nav-item">
              <span className="nav-link disabled" aria-disabled="true">
                Disabled
              </span>
            </li>
          </ul>
        </div>
      </div>
   
    </nav>
       </div>
  );
};

import { Link } from "react-router-dom";

export const Navbar = () => {
  const navbarStyle = {
    backgroundColor: '#596c0eff', // Cambia por el verde exacto que quieras
    padding: '0.5rem 1rem'
  };

  const buttonStyle = {
    backgroundColor: '#596c0eff', // mismo verde
    color: 'white',
    border: 'none',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.25rem',
    cursor: 'pointer'
  };

  return (
    <nav className="navbar" style={navbarStyle}>
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/">
          <span className="navbar-brand mb-0 h1" style={{ color: 'white' }}>
            React Boilerplate
          </span>
        </Link>
        <div>
          <Link to="/demo">
            <button style={buttonStyle}>
              Check the Context in action
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

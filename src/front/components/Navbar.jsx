import { Link } from "react-router-dom";

export const Navbar = () => {

	return (
		<nav className="navbar navbar-dark bg-dark">
			<div className="container">
				<Link to="/">
					<span className="btn btn-secondary ">Can Cargol</span>
				</Link>
				<div className="ml-auto">
					<Link to="/entorno">
						<button className="btn btn-secondary">Entorno</button>
					</Link>
					<Link to="/estancia">
						<button className="btn btn-secondary">La estancia</button>
					</Link>
					<Link to="/calendario">
						<button className="btn btn-secondary">Reservas</button>
					</Link>
					<Link to="/contacto">
						<button className="btn btn-secondary">Contacto</button>
					</Link>
				</div>
			</div>
		</nav>
	);
};
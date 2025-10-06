import { Link } from "react-router-dom";

export const Navbar = () => {

	return (
		<nav className="navbar navbar-dark bg-dark">
			<div className="container">
				<Link to="/">
					<span>Can Cargol</span>
				</Link>
				<div className="ml-auto">
					<Link to="/entorno">
						<button >Entorno</button>
					</Link>
					<Link to="/estancia">
						<button >La estancia</button>
					</Link>
					<Link to="/calendario">
						<button >Reservas</button>
					</Link>
					<Link to="/contacto">
						<button >Contacto</button>
					</Link>
				</div>
			</div>
		</nav>
	);
};
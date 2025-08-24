import React from "react";

function Entorno() {
  const lugares = [
    {
      nombre: "Bicicarril",
      descripcion: "Una ruta muy cómoda y facil de hacer con un desnivel muy poco pronunciado para subir, pero suficiente para bajar sin esfuerzo.",
      imagen: "https://imgs.search.brave.com/yyXLtRrktqvGWyhq4D-q4aYKiHPsP0vJ1fdn9YX4lRk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/dmllc3ZlcmRlcy5j/YXQvd3AtY29udGVu/dC91cGxvYWRzLzIw/MTcvMTIvRFNDMjk4/Ni5qcGc"
    },
    {
      nombre: "Gorgs",
      descripcion: "Lugares de ensueño, escondidos, que vale la pena descubrir y cuidar.",
      imagen: "https://imgs.search.brave.com/Sh8wpy8V66au0X4moox5VgJZQsf3_N6AwptRbS-lJFs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS1jZG4udHJpcGFk/dmlzb3IuY29tL21l/ZGlhL3Bob3RvLW8v/MGUvN2MvODUvZmMv/Z29yZy1kZWwtbW9s/aS1kZWwtbXVycmlz/LmpwZw"
    },
    {
      nombre: "Olot y sus volcanes dormidos",
      descripcion: "Inacabables, descubre la atmosfera íntima que puedes vivir en ellos, date un paseo por la hayeda d'en Jordà",
      imagen: "https://imgs.search.brave.com/gcN7B_oPZYrKAFFxPg_1CqpWbtdRw0_o-5mgyngvNkg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wYXRy/aW1vbmkuZ2Fycm90/eGEuY2F0L3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDIzLzExL2Vs/c192b2xjYW5zX29s/b3QtbWluLXNjYWxl/ZC5qcGc"
    },
    {
      nombre: "Costa Brava",
      descripcion: "Roca, arena y sal. A 45 minutos en coche se encuentra una joya mediterránea. Conocida por la rica biodiversidad que la compone y por sus aguas cristalinas. ",
      imagen: "https://imgs.search.brave.com/BCnzyE0OLwIp4wIZdyGQIAdYnF5PWwtRDhQczD6oapY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAzLzc4LzkxLzE3/LzM2MF9GXzM3ODkx/MTc0NF9peDNybllJ/b1dUalNpcDhDTHhT/ZHdqS09BcHhsRkpX/by5qcGc"
    }
  ];

  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">Descubre el Entorno</h1>
      <div className="row">
        {lugares.map((lugar, index) => (
          <div key={index} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100 shadow-sm">
              <img
                src={lugar.imagen}
                className="card-img-top"
                alt={lugar.nombre}
                style={{ height: "250px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="card-title">{lugar.nombre}</h5>
                <p className="card-text">{lugar.descripcion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-5">
        <a href="/calendario" className="btn btn-success btn-lg">
          Reserva tu estancia y vive esta experiencia
        </a>
      </div>
    </div>
  );
}

export default Entorno;

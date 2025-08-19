import React, { useRef } from "react";
import { useLocation, useNavigate, useState } from "react-router-dom";
import { Dialog } from 'primereact/dialog';
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe('pk_test_51RxrAVJClk6FcopzRPr9bU6KJQNNrDHFy7W6zaYfquO4MluVeLMtSmJOnXHoky5iQ3tT7nwBCblE0bMPnT7ViA6D00YYOeZ5zN')

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [tipoAlojamiento, setTipoAlojamiento] = useState("");
    const [datosCliente, setDatosCliente] = useState({
        nombre: "",
        email: "",
        telefono: "",
    });

    return (
        <div className="container py-5">
            <toast ref={toast} />

            <div className="row justify-content-center">
                <div className="col-md-8">
                    <h1 className="text-center mb-4">Finalizar reserva</h1>

                    {/* Resumen de la reserva */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <h6 className="card-title text-center">Detalles de la reserva</h6>


                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
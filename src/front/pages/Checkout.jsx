import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { loadStripe } from "@stripe/stripe-js";

// Clave pública de Stripe (modo prueba)
const stripePromise = loadStripe('pk_test_51RxrAVJClk6FcopzRPr9bU6KJQNNrDHFy7W6zaYfquO4MluVeLMtSmJOnXHoky5iQ3tT7nwBCblE0bMPnT7ViA6D00YYOeZ5zN');

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [datosCliente, setDatosCliente] = useState({
        nombre: "",
        email: "",
        telefono: "",
    });

    const [pagoEnProceso, setPagoEnProceso] = useState(false);
    const [pagoCompletado, setPagoCompletado] = useState(false);
    const [estadoReserva, setEstadoReserva] = useState("pendiente");
    const [reservaId, setReservaId] = useState("");

    // Fechas recibidas desde CalendarPage
    const { startDate, endDate } = location.state || {};

    // Verificar estado del pago Stripe al cargar (si vuelve de Stripe Checkout)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        if (sessionId) {
            verificarPago(sessionId);
        }
    }, []);

    // Redirigir si no hay fechas seleccionadas
    useEffect(() => {
        if (!startDate || !endDate) {
            navigate("/calendario");
        }
    }, [startDate, endDate, navigate]);

    // Calcular número de noches
    const calcularNoches = () => {
        if (!startDate || !endDate) return 0;
        const inicio = new Date(startDate);
        const fin = new Date(endDate);
        const difTiempo = Math.abs(fin - inicio);
        return Math.ceil(difTiempo / (1000 * 60 * 60 * 24));
    };

    // Calcular total según días laborales y fines de semana
    const calcularTotal = (start, end) => {
        if (!start || !end) return 0;
        const inicio = new Date(start);
        const fin = new Date(end);
        let total = 0;

        for (let d = new Date(inicio); d < fin; d.setDate(d.getDate() + 1)) {
            const diaSemana = d.getDay(); // 0=Domingo, 6=Sábado
            if (diaSemana === 0 || diaSemana === 6) {
                total += 150; // Fin de semana
            } else {
                total += 117; // Día laboral
            }
        }
        return total;
    };

    const noches = calcularNoches();
    const totalReserva = calcularTotal(startDate, endDate);

    // Validación del formulario
    const formularioValido = () => {
        return (
            datosCliente.nombre.trim() &&
            datosCliente.email.trim() &&
            datosCliente.telefono.trim() &&
            datosCliente.email.includes("@")
        );
    };

    // Verificar pago en backend
    const verificarPago = async (sessionId) => {
        try {
            const response = await fetch(`http://localhost:3001/api/verify-payment/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                setPagoCompletado(true);
                setEstadoReserva("pendiente");
                setReservaId(data.reservationId || data.reservaId || "");
                toast.current?.show({
                    severity: "success",
                    summary: "Pago exitoso",
                    detail: "Tu pago ha sido retenido. En breve el propietario aprobará o rechazará la reserva.",
                });
            } else {
                toast.current?.show({
                    severity: "warn",
                    summary: "Pago no completado",
                    detail: data.error || "No se pudo confirmar el pago.",
                });
            }
        } catch (error) {
            console.error("Error verificando el pago:", error);
            toast.current?.show({ severity: "error", summary: "Error", detail: "Hubo un problema verificando el pago." });
        }
    };

    // Procesar pago con Stripe Checkout
    const procesarPago = async () => {
        if (!formularioValido()) {
            toast.current?.show({ severity: "error", summary: "Error", detail: "Completa todos los campos correctamente." });
            return;
        }
        setPagoEnProceso(true);

        try {
            const response = await fetch("http://localhost:3001/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    datosCliente,
                    totalReserva,
                    noches,
                }),
            });

            const { sessionId, error } = await response.json();
            if (error) throw new Error(error);

            const stripe = await stripePromise;
            const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
            if (stripeError) throw new Error(stripeError.message);
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "Error en el pago",
                detail: error.message || "Hubo un problema procesando el pago.",
            });
        } finally {
            setPagoEnProceso(false);
        }
    };

    // Simulación del propietario (aprobación/rechazo demo)
    const simularDecisionPropietario = async (aprobar) => {
        try {
            const response = await fetch("http://localhost:3001/api/owner-decision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reservationId: reservaId,
                    approve: aprobar,
                }),
            });
            const data = await response.json();

            if (data.success) {
                setEstadoReserva(aprobar ? "aprobada" : "rechazada");
                toast.current?.show({
                    severity: aprobar ? "success" : "warn",
                    summary: aprobar ? "Reserva Aprobada" : "Reserva Rechazada",
                    detail: aprobar
                        ? "Tu reserva ha sido confirmada y el pago procesado."
                        : "Tu reserva ha sido rechazada. Stripe reembolsará el importe en 3-5 días hábiles.",
                });
            } else {
                throw new Error(data.error || "No se pudo actualizar la reserva");
            }
        } catch (error) {
            toast.current?.show({ severity: "error", summary: "Error", detail: error.message });
        }
    };

    // Formatear fechas
    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        const opciones = { year: "numeric", month: "long", day: "numeric" };
        return new Date(fecha).toLocaleDateString("es-ES", opciones);
    };

    return (
        <div className="container py-5">
            <Toast ref={toast} />

            <div className="row justify-content-center">
                <div className="col-md-8">
                    <h1 className="text-center mb-4">Finalizar Reserva</h1>

                    {pagoCompletado ? (
                        // ==========================
                        // BLOQUE: PAGO COMPLETADO
                        // ==========================
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">Estado de tu Reserva</h5>
                                {estadoReserva === 'pendiente' && (
                                    <div className="alert alert-info">
                                        <i className="pi pi-clock"></i> Tu reserva está pendiente de aprobación del propietario.
                                        El pago ha sido retenido en Stripe y se procesará una vez aprobada.
                                    </div>
                                )}
                                {estadoReserva === 'aprobada' && (
                                    <div className="alert alert-success">
                                        <i className="pi pi-check"></i> ¡Reserva confirmada! El pago ha sido procesado por Stripe.
                                        Recibirás un email de confirmación.
                                    </div>
                                )}
                                {estadoReserva === 'rechazada' && (
                                    <div className="alert alert-warning">
                                        <i className="pi pi-times"></i> Tu reserva ha sido rechazada.
                                        El pago será reembolsado automáticamente por Stripe en 3-5 días hábiles.
                                    </div>
                                )}

                                {estadoReserva === 'pendiente' && (
                                    <div className="mt-3">
                                        <small className="text-muted">Simulación del propietario:</small><br />
                                        <Button
                                            label="Aprobar Reserva"
                                            className="p-button-success p-button-sm me-2 mt-2"
                                            onClick={() => simularDecisionPropietario(true)}
                                        />
                                        <Button
                                            label="Rechazar Reserva"
                                            className="p-button-danger p-button-sm mt-2"
                                            onClick={() => simularDecisionPropietario(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // ==========================
                        // BLOQUE: FORMULARIO + PAGO
                        // ==========================
                        <div className="card mb-4 p-4 shadow-lg">
                            <h2 className="text-2xl font-semibold mb-4 text-center">Datos y Pago</h2>
                            <div className="p-grid p-fluid">

                                {/* Columna 1: Detalles de la reserva */}
                                <div className="p-col-12 p-md-6 mb-4 border-b md:border-b-0 md:border-r border-gray-200 md:pr-4">
                                    <h5 className="mb-3 font-bold text-lg">1. Detalles de la Reserva</h5>
                                    <p><strong>Fecha de inicio:</strong> {formatearFecha(startDate)}</p>
                                    <p><strong>Fecha de fin:</strong> {formatearFecha(endDate)}</p>
                                    <p className="mb-4"><strong>Número de noches:</strong> {noches}</p>
                                </div>

                                {/* Columna 2: Datos del cliente */}
                                <div className="p-col-12 p-md-6 md:pl-4">
                                    <h5 className="mb-3 font-bold text-lg">2. Datos del Cliente</h5>
                                    <div className="field mb-3">
                                        <label htmlFor="nombre">Nombre Completo *</label>
                                        <InputText
                                            id="nombre"
                                            value={datosCliente.nombre}
                                            onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
                                            className="w-100"
                                            placeholder="Introduce tu nombre completo"
                                        />
                                    </div>
                                    <div className="field mb-3">
                                        <label htmlFor="email">Email *</label>
                                        <InputText
                                            id="email"
                                            type="email"
                                            value={datosCliente.email}
                                            onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
                                            className="w-100"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                    <div className="field mb-4">
                                        <label htmlFor="telefono">Teléfono *</label>
                                        <InputText
                                            id="telefono"
                                            value={datosCliente.telefono}
                                            onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
                                            className="w-100"
                                            placeholder="+34 123 456 789"
                                        />
                                    </div>

                                    {/* Resumen del precio */}
                                    {noches > 0 && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                                            <h6 className="font-semibold">Resumen del Precio</h6>
                                            <p className="mb-1 text-sm">{noches} noches seleccionadas</p>
                                            <p className="mb-0 text-xl font-bold text-green-600">Total: €{totalReserva}</p>
                                            <small className="text-muted">Procesado de forma segura por Stripe</small>
                                        </div>
                                    )}

                                    {/* Botón de Pago */}
                                    <div className="text-center mt-4">
                                        <Button
                                            label={pagoEnProceso ? "Redirigiendo a Stripe..." : "Pagar"}
                                            className="p-button-success w-full"
                                            onClick={procesarPago}
                                            disabled={!formularioValido() || pagoEnProceso}
                                            loading={pagoEnProceso}
                                            style={{ borderRadius: '20px', height: '50px', width: '150px', backgroundColor: 'green', color: 'white' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Volver al calendario */}
                    <div className="text-center mt-5">
                        <Button
                            label="Volver al Calendario"
                            className="p-button-secondary p-button-text"
                            onClick={() => navigate('/calendario')}
                            style={{ borderRadius: '20px', backgroundColor: 'green', color: 'white' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
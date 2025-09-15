import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { RadioButton } from 'primereact/radiobutton';
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe('pk_test_51RxrAVJClk6FcopzRPr9bU6KJQNNrDHFy7W6zaYfquO4MluVeLMtSmJOnXHoky5iQ3tT7nwBCblE0bMPnT7ViA6D00YYOeZ5zN');

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [mostrarModal, setMostrarModal] = useState(true);
    const [tipoAlojamiento, setTipoAlojamiento] = useState("");
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

    // Verificar estado del pago Stripe al cargar la página (si vuelve de Stripe Checkout)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        if (sessionId) {
            verificarPago(sessionId);
        }
    }, []);

    // Redireccionar al usuario si no hay fechas seleccionadas
    useEffect(() => {
        if (!startDate || !endDate) {
            navigate("/calendario");
        }
    }, [startDate, endDate, navigate]);

    // Calcular noches de la reserva
    const calcularNoches = () => {
        if (!startDate || !endDate) return 0;
        const inicio = new Date(startDate);
        const fin = new Date(endDate);
        const difTiempo = Math.abs(fin - inicio);
        return Math.ceil(difTiempo / (1000 * 60 * 60 * 24));
    };

    // Precios por noche
    const precios = {
        habitacion: 80,
        casa: 152,
    };

    const precioPorNoche = precios[tipoAlojamiento] || 0;
    const noches = calcularNoches();
    const totalReserva = precioPorNoche * noches;

    // Validación del formulario
    const formularioValido = () => {
        return (
            tipoAlojamiento &&
            datosCliente.nombre.trim() &&
            datosCliente.email.trim() &&
            datosCliente.telefono.trim() &&
            datosCliente.email.includes("@")
        );
    };

    // Verificar el estado del pago con el backend
    const verificarPago = async (sessionId) => {
        try {
            const response = await fetch(`http://localhost:3001/api/verify-payment/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                setPagoCompletado(true);
                setEstadoReserva("pendiente");
                setReservaId(data.reservationId || data.reservaId || "");
                setMostrarModal(false);

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
                    tipoAlojamiento,
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

    // Simular decisión del propietario (demo)
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

    // Formatear fechas para mostrar
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
                    <h1 className="text-center mb-4">Finalizar reserva</h1>

                    {/* Resumen de la reserva */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <h6 className="card-title text-center">Detalles de la reserva</h6>
                            <p><strong>Fecha de inicio:</strong> {formatearFecha(startDate)}</p>
                            <p><strong>Fecha de fin:</strong> {formatearFecha(endDate)}</p>
                            <p><strong>Número de noches:</strong> {noches}</p>
                            <p><strong>Tipo de alojamiento:</strong> {tipoAlojamiento ? (tipoAlojamiento.charAt(0).toUpperCase() + tipoAlojamiento.slice(1)) : 'No seleccionado'}</p>
                            <p><strong>Precio por noche:</strong> {precioPorNoche ? `€${precioPorNoche}` : 'N/A'}</p>
                            <h5 className="mt-3 text-center">Total a pagar: €{totalReserva}</h5>
                        </div>
                    </div>

                    {pagoCompletado && (
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
                    )}

                    {/* Volver al calendario */}
                    <div className="text-center">
                        <Button
                            label="Volver al Calendario"
                            className="p-button-secondary"
                            onClick={() => navigate('/calendario')}
                            style={{ borderRadius: '20px', backgroundColor: 'green' }}
                        />
                    </div>
                </div>
            </div>

            {/* Modal para completar la reserva */}
            <Dialog
                header="Completa tu Reserva"
                className="dialogo-checkout"
                visible={mostrarModal}
                style={{ width: '50vw' }}
                onHide={() => setMostrarModal(false)}
                closable={false}
            >
                <div className="p-4">
                    {/* Selección de tipo de alojamiento */}
                    <div className="mb-4">
                        <h6>Tipo de Alojamiento</h6>
                        <div className="field-radiobutton mb-3">
                            <RadioButton
                                inputId="habitacion"
                                name="alojamiento"
                                value="habitacion"
                                onChange={(e) => setTipoAlojamiento(e.value)}
                                checked={tipoAlojamiento === 'habitacion'}
                            />
                            <label htmlFor="habitacion" className="ml-2">
                                Habitación para 2 personas - €{precios.habitacion}/noche
                            </label>
                        </div>
                        <div className="field-radiobutton">
                            <RadioButton
                                inputId="casa"
                                name="alojamiento"
                                value="casa"
                                onChange={(e) => setTipoAlojamiento(e.value)}
                                checked={tipoAlojamiento === 'casa'}
                            />
                            <label htmlFor="casa" className="ml-2">
                                Casa Completa - €{precios.casa}/noche
                            </label>
                        </div>
                    </div>

                    {/* Formulario de datos del cliente */}
                    <div className="mb-4">
                        <h6>Datos del Cliente</h6>
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
                        <div className="field mb-3">
                            <label htmlFor="telefono">Teléfono *</label>
                            <InputText
                                id="telefono"
                                value={datosCliente.telefono}
                                onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
                                className="w-100"
                                placeholder="+34 123 456 789"
                            />
                        </div>
                    </div>

                    {/* Resumen del precio */}
                    {tipoAlojamiento && (
                        <div className="mb-4 p-3 bg-light rounded" style={{ color: 'black' }}>
                            <h6>Resumen del Precio</h6>
                            <p className="mb-1">{noches} noches × €{precioPorNoche}</p>
                            <p className="mb-0"><strong>Total: €{totalReserva}</strong></p>
                            <small className="text-muted">Procesado de forma segura por Stripe</small>
                        </div>
                    )}

                    {/* Botones del modal */}
                    <div className="text-center">
                        <Button
                            label="Cancelar"
                            className="p-button-secondary me-2"
                            onClick={() => navigate('/calendario')}
                            disabled={pagoEnProceso}
                            style={{ borderRadius: '20px', backgroundColor: 'green', marginBottom: '5px' }}
                        />
                        <Button
                            label={pagoEnProceso ? "Redirigiendo a Stripe..." : "Pagar con Stripe"}
                            className="p-button-primary"
                            onClick={procesarPago}
                            disabled={!formularioValido() || pagoEnProceso}
                            loading={pagoEnProceso}
                            style={{ borderRadius: '20px', backgroundColor: 'green', marginBottom: '5px' }}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
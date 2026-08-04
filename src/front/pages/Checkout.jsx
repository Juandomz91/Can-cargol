import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe('pk_test_51SEBRzRfXX5i4eS5afDiTQnlH2KZ3GnmsvepKatFySwz0kPcRLEubhWPUo4iB2BdklWlbVg8jqUjR38uaLp211HU00xhmmqs43');

// Debe coincidir con HABITACIONES en CalendarPage y HABITACIONES_VALIDAS en routes.py
const HABITACIONES = {
    1: "Cama de matrimonio",
    2: "Dos camas individuales",
};

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
    const [reservaIds, setReservaIds] = useState([]);

    const { startDate, endDate, habitacionIds } = location.state || {};

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        if (sessionId) {
            verificarPago(sessionId);
        }
    }, []);

    useEffect(() => {
        if (!startDate || !endDate || !habitacionIds || habitacionIds.length === 0) {
            navigate("/calendario");
        }
    }, [startDate, endDate, habitacionIds, navigate]);

    const calcularNoches = () => {
        if (!startDate || !endDate) return 0;
        const inicio = new Date(startDate);
        const fin = new Date(endDate);
        const difTiempo = Math.abs(fin - inicio);
        return Math.ceil(difTiempo / (1000 * 60 * 60 * 24));
    };

    // Precio por noche de UNA habitación (120 laborables / 150 findes),
    // multiplicado por el número de habitaciones seleccionadas.
    const calcularTotal = (start, end, numHabitaciones) => {
        if (!start || !end || !numHabitaciones) return 0;
        const inicio = new Date(start);
        const fin = new Date(end);
        let totalPorHabitacion = 0;

        for (let d = new Date(inicio); d < fin; d.setDate(d.getDate() + 1)) {
            const diaSemana = d.getDay();
            totalPorHabitacion += (diaSemana === 0 || diaSemana === 6) ? 150 : 120;
        }
        return totalPorHabitacion * numHabitaciones;
    };

    const noches = calcularNoches();
    const numHabitaciones = habitacionIds?.length || 0;
    const totalReserva = calcularTotal(startDate, endDate, numHabitaciones);
    const nombresHabitaciones = (habitacionIds || []).map(id => HABITACIONES[id]).join(" + ");

    const formularioValido = () => {
        return (
            datosCliente.nombre.trim() &&
            datosCliente.email.trim() &&
            datosCliente.telefono.trim() &&
            datosCliente.email.includes("@")
        );
    };

    const verificarPago = async (sessionId) => {
        try {
            const response = await fetch(`http://localhost:3001/api/verify-payment/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                setPagoCompletado(true);
                setEstadoReserva("pendiente");
                setReservaIds(data.reservaIds || []);
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
                    habitacionIds,
                    datosCliente,
                    totalReserva,
                    noches,
                }),
            });

            const { sessionId, error, detalles } = await response.json();
            if (error) throw new Error(detalles?.join(", ") || error);

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

    const simularDecisionPropietario = async (aprobar) => {
        try {
            const response = await fetch("http://localhost:3001/api/owner-decision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reservationIds: reservaIds,
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

    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        const opciones = { year: "numeric", month: "long", day: "numeric" };
        return new Date(fecha).toLocaleDateString("es-ES", opciones);
    };

    const cardStyle = {
        background: "#EAE8DE",
        borderRadius: 6,
        padding: 32,
        border: "none",
    };
    const labelStyle = { fontSize: 13, fontWeight: 600, color: "#1F3327", display: "block", marginBottom: 6 };
    const inputStyle = { width: "100%", borderRadius: 4, border: "1px solid #C8CABB", background: "#F6F4EE" };
    const primaryBtn = { borderRadius: 4, background: "#1F3327", color: "#F6F4EE", border: "none", fontWeight: 600 };

    return (
        <div style={{ background: "#F6F4EE", minHeight: "100vh", padding: "88px 24px", fontFamily: "'Inter', sans-serif" }}>
            <Toast ref={toast} />

            <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: "#1F3327", textAlign: "center", marginBottom: 40 }}>
                    Finalizar Reserva
                </div>

                {pagoCompletado ? (
                    <div style={cardStyle}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#1F3327", marginBottom: 16 }}>
                            Estado de tu Reserva
                        </div>
                        {estadoReserva === 'pendiente' && (
                            <div style={{ background: "#DCE6D8", color: "#1F3327", padding: "14px 16px", borderRadius: 4, fontSize: 14 }}>
                                Tu reserva está pendiente de aprobación del propietario. El pago ha sido retenido en Stripe y se procesará una vez aprobada.
                            </div>
                        )}
                        {estadoReserva === 'aprobada' && (
                            <div style={{ background: "#DCE6D8", color: "#1F3327", padding: "14px 16px", borderRadius: 4, fontSize: 14 }}>
                                ¡Reserva confirmada! El pago ha sido procesado por Stripe. Recibirás un email de confirmación.
                            </div>
                        )}
                        {estadoReserva === 'rechazada' && (
                            <div style={{ background: "#F3E6D8", color: "#7A4B22", padding: "14px 16px", borderRadius: 4, fontSize: 14 }}>
                                Tu reserva ha sido rechazada. El pago será reembolsado automáticamente por Stripe en 3-5 días hábiles.
                            </div>
                        )}

                        {estadoReserva === 'pendiente' && (
                            <div style={{ marginTop: 20 }}>
                                <small style={{ color: "#6C7867" }}>Simulación del propietario:</small><br />
                                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                    <Button
                                        label="Aprobar Reserva"
                                        onClick={() => simularDecisionPropietario(true)}
                                        style={{ ...primaryBtn, background: "#1F3327" }}
                                    />
                                    <Button
                                        label="Rechazar Reserva"
                                        onClick={() => simularDecisionPropietario(false)}
                                        style={{ ...primaryBtn, background: "#8C4A2F" }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={cardStyle}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#1F3327", textAlign: "center", marginBottom: 28 }}>
                            Datos y Pago
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                            <div style={{ borderRight: "1px solid #D8D5C7", paddingRight: 24 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "#1F3327", marginBottom: 14 }}>1. Detalles de la Reserva</div>
                                <p style={{ fontSize: 15, color: "#3A4436", margin: "0 0 8px" }}><strong>Habitación(es):</strong> {nombresHabitaciones}</p>
                                <p style={{ fontSize: 15, color: "#3A4436", margin: "0 0 8px" }}><strong>Fecha de inicio:</strong> {formatearFecha(startDate)}</p>
                                <p style={{ fontSize: 15, color: "#3A4436", margin: "0 0 8px" }}><strong>Fecha de fin:</strong> {formatearFecha(endDate)}</p>
                                <p style={{ fontSize: 15, color: "#3A4436", margin: 0 }}><strong>Número de noches:</strong> {noches}</p>
                            </div>

                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "#1F3327", marginBottom: 14 }}>2. Datos del Cliente</div>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle} htmlFor="nombre">Nombre Completo *</label>
                                    <InputText
                                        id="nombre"
                                        value={datosCliente.nombre}
                                        onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
                                        style={inputStyle}
                                        placeholder="Introduce tu nombre completo"
                                    />
                                </div>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle} htmlFor="email">Email *</label>
                                    <InputText
                                        id="email"
                                        type="email"
                                        value={datosCliente.email}
                                        onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
                                        style={inputStyle}
                                        placeholder="tu@email.com"
                                    />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={labelStyle} htmlFor="telefono">Teléfono *</label>
                                    <InputText
                                        id="telefono"
                                        value={datosCliente.telefono}
                                        onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
                                        style={inputStyle}
                                        placeholder="+34 123 456 789"
                                    />
                                </div>

                                {noches > 0 && (
                                    <div style={{ marginBottom: 20, padding: 16, background: "#F6F4EE", borderRadius: 4, border: "1px solid #D8D5C7" }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1F3327" }}>Resumen del Precio</div>
                                        <p style={{ margin: "6px 0 2px", fontSize: 14, color: "#4B5647" }}>
                                            {noches} noches × {numHabitaciones} habitación(es)
                                        </p>
                                        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1F3327" }}>Total: €{totalReserva}</p>
                                        <small style={{ color: "#6C7867" }}>Procesado de forma segura por Stripe</small>
                                    </div>
                                )}

                                <div style={{ textAlign: "center", marginTop: 16 }}>
                                    <Button
                                        label={pagoEnProceso ? "Redirigiendo a Stripe..." : "Pagar"}
                                        onClick={procesarPago}
                                        disabled={!formularioValido() || pagoEnProceso}
                                        loading={pagoEnProceso}
                                        style={{ ...primaryBtn, height: 50, width: "100%" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ textAlign: "center", marginTop: 40 }}>
                    <Button
                        label="Volver al Calendario"
                        onClick={() => navigate('/calendario')}
                        style={{ background: "transparent", border: "none", color: "#1F3327", fontWeight: 600, textDecoration: "underline" }}
                    />
                </div>
            </div>
        </div>
    );
}

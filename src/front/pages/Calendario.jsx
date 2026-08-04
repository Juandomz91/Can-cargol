import React, { useState, useMemo } from "react";
import { Calendar as PRCalendar } from "primereact/calendar";
import { useNavigate } from "react-router-dom";

// IDs reales de tu BBDD (habitaciones.id) — ajusta si no coinciden
const HABITACIONES = [
    { id: 1, nombre: "Cama de matrimonio", tipo: "matrimonio" },
    { id: 2, nombre: "Dos camas individuales", tipo: "dos_camas" },
];

export default function CalendarPage() {
    const navigate = useNavigate();
    const [selectedRange, setSelectedRange] = useState(null);
    const [habitacionIds, setHabitacionIds] = useState([]); // array: puede tener 1 o las 2

    const toMidnight = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null);
    const [startMid, endMid] = useMemo(() => {
        if (!selectedRange) return [null, null];
        const [s, e] = selectedRange;
        return [toMidnight(s), toMidnight(e)];
    }, [selectedRange]);

    const dateTemplate = (date) => {
        const current = new Date(date.year, date.month, date.day);
        const currentMid = toMidnight(current);

        const isStart = startMid && currentMid.getTime() === startMid.getTime();
        const isEnd = endMid && currentMid.getTime() === endMid.getTime();
        const isBetween = startMid && endMid && currentMid > startMid && currentMid < endMid;

        const style = (isStart || isEnd)
            ? { color: "#F6F4EE", backgroundColor: "#1F3327", borderRadius: "4px", fontWeight: 600 }
            : isBetween
            ? { color: "#1F3327", backgroundColor: "#DCE6D8", borderRadius: "4px", fontWeight: 400 }
            : undefined;
        return <span style={style}>{date.day}</span>;
    };

    const toggleHabitacion = (id) => {
        setHabitacionIds((prev) =>
            prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
        );
    };

    const goToPayment = () => {
        const [start, end] = Array.isArray(selectedRange) ? selectedRange : [];
        if (!start || !end) {
            alert("Por favor, selecciona un rango de fechas válido.");
            return;
        }
        if (habitacionIds.length === 0) {
            alert("Por favor, selecciona al menos una habitación.");
            return;
        }
        navigate("/checkout", {
            state: {
                startDate: selectedRange[0].toISOString(),
                endDate: selectedRange[1].toISOString(),
                habitacionIds, // ej. [1] o [1, 2]
            }
        });
    };

    return (
        <div
            style={{
                background: "#F6F4EE",
                minHeight: "100vh",
                width: "100%",
                boxSizing: "border-box",
                padding: "88px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <style>{`
                .can-cargol-calendar.p-datepicker { border: none; background: transparent; font-family: 'Inter', sans-serif; width: 100%; }
                .can-cargol-calendar .p-datepicker-header { background: transparent; border: none; padding-bottom: 12px; }
                .can-cargol-calendar table {
                    table-layout: fixed;
                    width: 100%;
                }
                .can-cargol-calendar table th,
                .can-cargol-calendar table td {
                    width: 14.28%;
                }
                .can-cargol-calendar .p-datepicker-header .p-datepicker-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #1F3327; }
                .can-cargol-calendar .p-datepicker-title button,
                .can-cargol-calendar .p-datepicker-title .p-datepicker-month,
                .can-cargol-calendar .p-datepicker-title .p-datepicker-year {
                    display: inline-block;
                }
                .can-cargol-calendar .p-datepicker-title .p-datepicker-month {
                    margin-right: 0.35rem;
                }
                .can-cargol-calendar .p-datepicker-prev,
                .can-cargol-calendar .p-datepicker-next {
                    background: transparent !important;
                    border: none !important;
                    color: #1F3327 !important;
                    width: auto !important;
                    height: auto !important;
                    box-shadow: none !important;
                }
                .can-cargol-calendar .p-datepicker-prev:hover,
                .can-cargol-calendar .p-datepicker-next:hover { background: transparent !important; color: #C9A66B !important; }
                .can-cargol-calendar table th { color: #6C7867; font-weight: 700; text-transform: uppercase; font-size: 12px; border: none; }
                .can-cargol-calendar table td { border: none; text-align: center; }
                .can-cargol-calendar table td > span {
                    width: 2.4rem; height: 2.4rem; line-height: 2.4rem; margin: 0 auto;
                    color: #1F3327; border-radius: 4px;
                }
                .can-cargol-calendar table td > span:hover { background: #DCE6D8 !important; }
                .can-cargol-calendar .p-datepicker-buttonbar {
                    border-top: 1px solid #D8D5C7; padding-top: 16px; display: flex; justify-content: space-between;
                }
                .can-cargol-calendar .p-datepicker-buttonbar .p-button {
                    background: #1F3327 !important; border: none !important; color: #F6F4EE !important;
                    border-radius: 4px !important; box-shadow: none !important; font-weight: 600;
                }
            `}</style>

            <div
                style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 34,
                    fontWeight: 700,
                    color: "#1F3327",
                }}
            >
                Reservas
            </div>
            <p style={{ fontSize: 16, color: "#4B5647", marginTop: 12, marginBottom: 32 }}>
                Selecciona las fechas disponibles para tu estancia
            </p>

            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    background: "#EAE8DE",
                    borderRadius: 6,
                    padding: 28,
                }}
            >
                {/* Selector de habitaciones (multi-selección) */}
                <p style={{ fontSize: 13, color: "#4B5647", marginBottom: 8, fontWeight: 600 }}>
                    ¿Qué habitación quieres reservar?
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    {HABITACIONES.map((h) => (
                        <button
                            key={h.id}
                            type="button"
                            onClick={() => toggleHabitacion(h.id)}
                            style={{
                                flex: 1,
                                padding: "10px 12px",
                                borderRadius: 4,
                                border: habitacionIds.includes(h.id) ? "2px solid #1F3327" : "1px solid #D8D5C7",
                                background: habitacionIds.includes(h.id) ? "#DCE6D8" : "transparent",
                                color: "#1F3327",
                                fontWeight: 500,
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            {h.nombre}
                        </button>
                    ))}
                </div>
                {habitacionIds.length === HABITACIONES.length && (
                    <p style={{ fontSize: 12, color: "#6C7867", marginTop: -12, marginBottom: 20 }}>
                        Has seleccionado la casa completa
                    </p>
                )}

                <PRCalendar
                    inline
                    selectionMode="range"
                    value={selectedRange}
                    onChange={(e) => setSelectedRange(e.value)}
                    numberOfMonths={1}
                    className="can-cargol-calendar"
                    dateTemplate={dateTemplate}
                    showButtonBar
                />

                {selectedRange?.[0] && selectedRange?.[1] && (
                    <p style={{ marginTop: 16, fontSize: 14, color: "#1F3327", textAlign: "center" }}>
                        {selectedRange[0].toLocaleDateString()} — {selectedRange[1].toLocaleDateString()}
                    </p>
                )}

                <button
                    id="booking-button"
                    onClick={goToPayment}
                    disabled={habitacionIds.length === 0}
                    style={{
                        marginTop: 20,
                        width: "100%",
                        padding: "14px",
                        border: "none",
                        borderRadius: 4,
                        background: habitacionIds.length === 0 ? "#9AA398" : "#1F3327",
                        color: "#F6F4EE",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: habitacionIds.length === 0 ? "not-allowed" : "pointer",
                    }}
                >
                    Reservar
                </button>
            </div>
        </div>
    );
}
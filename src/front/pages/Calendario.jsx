import React, { useState, useMemo } from "react";
import { Calendar as PRCalendar } from "primereact/calendar";
import { useNavigate } from "react-router-dom";

export default function CalendarPage() {
    const navigate = useNavigate();
    const [selectedRange, setSelectedRange] = useState(null);

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

        const style = (isStart || isEnd || isBetween)
            ? { color: 'green', backgroundColor: "rgb(198, 252, 206)", borderRadius: "5px", fontWeight: 400 }
            : undefined;
        return <span style={style}>{date.day}</span>;
    };

    // CONST PARA DERIVACION AL CHECKOUT PAYMENT DE LA RESERVA

    const goToPayment = () => {
        const [start, end] = Array.isArray(selectedRange) ? selectedRange : [];
        if (!start || !end) {
            alert("Por favor, selecciona un rango de fechas válido.");
            return;
        }
        navigate("/checkout", {
            state: {
                startDate: selectedRange[0].toISOString(),
                endDate: selectedRange[1].toISOString()
            }
        });
    };

    // END CONST PARA DERIVACION AL CHECKOUT PAYMENT DE LA RESERVA

    return (
        <div className="container py-5" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <p className="lead">Selecciona las fechas disponibles para tu estancia</p>
            <div className="row" style={{ width: "100%", maxWidth: "600px" }}>
                <div className="col-md-8 offset-md-2" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <PRCalendar
                        inline
                        selectionMode="range"
                        value={selectedRange}
                        onChange={(e) => setSelectedRange(e.value)}
                        numberOfMonths={1}
                        className="no-border calendar-panel"
                        dateTemplate={dateTemplate}
                        style={{ width: "100%" }}
                        showButtonBar

                    />
                    {selectedRange?.[0] && selectedRange?.[1] && (
                        <p className="mt-3" style={{ fontSize: "1rem", color: "green" }}>
                            Fecha seleccionada: {selectedRange[0].toLocaleDateString()} — {selectedRange[1].toLocaleDateString()}
                        </p>
                    )}
                    <button id="booking-button" onClick={goToPayment}>Reservar</button>
                </div>
            </div>
        </div>
    );
}
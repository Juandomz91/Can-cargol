import os
from flask import Blueprint, request, jsonify
from api.models import db, Reserva
from api.utils import APIException
from flask_cors import CORS
import stripe
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

api = Blueprint('api', __name__)
CORS(api)

# Configuración Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# ========== FUNCIONES AUXILIARES ==========
def send_email(to_email, subject, body):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    email_usuario = os.getenv("EMAIL_USER", "sistemacancargol@gmail.com")
    email_password = os.getenv("EMAIL_PASSWORD")

    try:
        msg = MIMEMultipart()
        msg['From'] = email_usuario
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_usuario, email_password)
        server.sendmail(email_usuario, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        print(f"Error enviando email: {str(e)}")

# ========== ENDPOINTS ==========

@api.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    try:
        data = request.json
        # Guardar reserva en la BD
        reserva = Reserva(
            nombre=data["datosCliente"]["nombre"],
            email=data["datosCliente"]["email"],
            telefono=data["datosCliente"]["telefono"],
            fecha_entrada=data["startDate"],
            fecha_salida=data["endDate"],
            personas=2 if data["tipoAlojamiento"] == "habitacion" else 6,
            importe=data["totalReserva"],
            estado="pendiente"
        )
        db.session.add(reserva)
        db.session.commit()

        # Crear sesión de pago Stripe
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Reserva {data['tipoAlojamiento'].capitalize()} ({reserva.id})"
                    },
                    "unit_amount": int(data["totalReserva"] * 100), # en céntimos
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"http://localhost:3000/checkout?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url="http://localhost:3000/calendario",
            metadata={"reserva_id": reserva.id}
        )

        return jsonify({"sessionId": session.id})

    except Exception as e:
        print("Error en create-checkout-session:", e)
        return jsonify({"error": str(e)}), 500


@api.route("/verify-payment/<session_id>", methods=["GET"])
def verify_payment(session_id):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        reserva_id = session.metadata.get("reserva_id")

        if session.payment_status == "paid":
            reserva = Reserva.query.get(reserva_id)
            if reserva:
                reserva.estado = "pagado"
                db.session.commit()

                # Enviar emails
                send_email(
                    reserva.email,
                    "Confirmación de pago",
                    f"Hola {reserva.nombre}, tu pago de {reserva.importe}€ ha sido recibido. ¡Gracias por tu reserva!"
                )
                send_email(
                    os.getenv("EMAIL_DESTINO", "bonicargol@gmail.com"),
                    "Nueva reserva confirmada",
                    f"Reserva confirmada de {reserva.nombre}, del {reserva.fecha_entrada} al {reserva.fecha_salida}."
                )

            return jsonify({"success": True, "reservaId": reserva_id})
        else:
            return jsonify({"success": False, "error": "Pago no completado"})

    except Exception as e:
        print("Error en verify-payment:", e)
        return jsonify({"success": False, "error": str(e)}), 500


@api.route("/owner-decision", methods=["POST"])
def owner_decision():
    try:
        data = request.json
        reserva = Reserva.query.get(data["reservationId"])
        if not reserva:
            return jsonify({"success": False, "error": "Reserva no encontrada"}), 404

        if data["approve"]:
            reserva.estado = "aprobada"
            mensaje = f"Tu reserva del {reserva.fecha_entrada} al {reserva.fecha_salida} ha sido aprobada."
        else:
            reserva.estado = "rechazada"
            # Aquí se podría automatizar el reembolso con Stripe:
            # stripe.Refund.create(payment_intent=session.payment_intent)
            mensaje = f"Tu reserva del {reserva.fecha_entrada} al {reserva.fecha_salida} ha sido rechazada. El importe será reembolsado."

        db.session.commit()

        send_email(reserva.email, "Estado de tu reserva", mensaje)

        return jsonify({"success": True})

    except Exception as e:
        print("Error en owner-decision:", e)
        return jsonify({"success": False, "error": str(e)}), 500

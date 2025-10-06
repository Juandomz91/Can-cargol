import os
import logging
from flask import Blueprint, request, jsonify
from api.models import db, Reserva
from api.utils import APIException
from flask_cors import CORS
import stripe
from stripe import StripeError
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import re

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api = Blueprint('api', __name__)
CORS(api)

# Configuración Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# URLs desde variables de entorno
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ========== FUNCIONES AUXILIARES ==========

def validar_email(email):
    """Valida formato de email"""
    patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(patron, email) is not None

def validar_fechas(fecha_entrada, fecha_salida):
    """Valida que las fechas sean correctas"""
    try:
        entrada = datetime.strptime(fecha_entrada, "%Y-%m-%d")
        salida = datetime.strptime(fecha_salida, "%Y-%m-%d")
        hoy = datetime.now().date()
        
        if entrada.date() < hoy:
            return False, "La fecha de entrada no puede ser anterior a hoy"
        if salida <= entrada:
            return False, "La fecha de salida debe ser posterior a la de entrada"
        
        return True, None
    except ValueError:
        return False, "Formato de fecha inválido. Usa YYYY-MM-DD"

def validar_datos_reserva(data):
    """Valida todos los datos de la reserva"""
    errores = []
    
    # Validar estructura de datos
    if "datosCliente" not in data:
        errores.append("Faltan datos del cliente")
        return False, errores
    
    cliente = data["datosCliente"]
    
    # Validar campos obligatorios
    if not cliente.get("nombre") or len(cliente["nombre"].strip()) < 2:
        errores.append("El nombre es obligatorio y debe tener al menos 2 caracteres")
    
    if not cliente.get("email"):
        errores.append("El email es obligatorio")
    elif not validar_email(cliente["email"]):
        errores.append("El formato del email no es válido")
    
    if not cliente.get("telefono") or len(cliente["telefono"].strip()) < 9:
        errores.append("El teléfono es obligatorio y debe tener al menos 9 dígitos")
    
    if not data.get("startDate") or not data.get("endDate"):
        errores.append("Las fechas de entrada y salida son obligatorias")
    else:
        fechas_validas, error_fecha = validar_fechas(data["startDate"], data["endDate"])
        if not fechas_validas:
            errores.append(error_fecha)
    
    if not data.get("tipoAlojamiento") or data["tipoAlojamiento"] not in ["habitacion", "casa"]:
        errores.append("Tipo de alojamiento inválido")
    
    if not data.get("totalReserva") or data["totalReserva"] <= 0:
        errores.append("El importe de la reserva debe ser mayor a 0")
    
    return len(errores) == 0, errores

def send_email(to_email, subject, body):
    """Envía email usando SMTP de Gmail"""
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    email_usuario = os.getenv("EMAIL_USER", "sistemacancargol@gmail.com")
    email_password = os.getenv("EMAIL_PASSWORD")

    if not email_password:
        logger.error("EMAIL_PASSWORD no configurado en variables de entorno")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = email_usuario
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_usuario, email_password)
        server.sendmail(email_usuario, to_email, msg.as_string())
        server.quit()
        
        logger.info(f"Email enviado correctamente a {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando email a {to_email}: {str(e)}")
        return False

# ========== ENDPOINTS ==========

@api.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    """Crea una sesión de pago en Stripe y guarda la reserva"""
    try:
        data = request.json
        
        # Validar datos
        valido, errores = validar_datos_reserva(data)
        if not valido:
            logger.warning(f"Validación fallida: {errores}")
            return jsonify({"error": "Datos inválidos", "detalles": errores}), 400
        
        # Guardar reserva en la BD
        reserva = Reserva(
            nombre=data["datosCliente"]["nombre"].strip(),
            email=data["datosCliente"]["email"].strip().lower(),
            telefono=data["datosCliente"]["telefono"].strip(),
            fecha_entrada=data["startDate"],
            fecha_salida=data["endDate"],
            personas=2 if data["tipoAlojamiento"] == "habitacion" else 6,
            importe=round(float(data["totalReserva"]), 2),
            estado="pendiente"
        )
        db.session.add(reserva)
        db.session.commit()
        
        logger.info(f"Reserva creada con ID: {reserva.id}")

        # Crear sesión de pago Stripe
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Reserva {data['tipoAlojamiento'].capitalize()}",
                        "description": f"Del {reserva.fecha_entrada} al {reserva.fecha_salida} - ID: {reserva.id}"
                    },
                    "unit_amount": int(reserva.importe * 100),  # en céntimos
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{FRONTEND_URL}/checkout?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/calendario",
            metadata={
                "reserva_id": str(reserva.id),
                "email": reserva.email
            }
        )

        return jsonify({
            "sessionId": session.id,
            "reservaId": reserva.id
        }), 200

    except StripeError as e:
        logger.error(f"Error de Stripe: {str(e)}")
        return jsonify({"error": "Error al procesar el pago", "detalles": str(e)}), 500
    
    except Exception as e:
        logger.error(f"Error en create-checkout-session: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500


@api.route("/verify-payment/<session_id>", methods=["GET"])
def verify_payment(session_id):
    """Verifica el estado del pago y actualiza la reserva"""
    try:
        # Recuperar sesión de Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        reserva_id = session.metadata.get("reserva_id")

        if not reserva_id:
            logger.error("No se encontró reserva_id en metadata")
            return jsonify({"success": False, "error": "Sesión inválida"}), 400

        reserva = Reserva.query.get(reserva_id)
        if not reserva:
            logger.error(f"Reserva {reserva_id} no encontrada")
            return jsonify({"success": False, "error": "Reserva no encontrada"}), 404

        if session.payment_status == "paid":
            # Actualizar estado de la reserva
            reserva.estado = "pagado"
            db.session.commit()
            
            logger.info(f"Pago confirmado para reserva {reserva_id}")

            # Enviar email al cliente
            email_cliente = f"""Hola {reserva.nombre},

¡Tu pago de {reserva.importe}€ ha sido recibido con éxito!

Detalles de tu reserva:
- ID de reserva: {reserva.id}
- Fechas: Del {reserva.fecha_entrada} al {reserva.fecha_salida}
- Personas: {reserva.personas}
- Importe: {reserva.importe}€

¡Gracias por tu reserva! Recibirás un email adicional cuando sea confirmada por el propietario.

Saludos,
Can Cargol"""

            send_email(
                reserva.email,
                "Confirmación de pago - Can Cargol",
                email_cliente
            )

            # Enviar email al propietario
            email_propietario = f"""Nueva reserva confirmada (PAGO RECIBIDO)

Cliente: {reserva.nombre}
Email: {reserva.email}
Teléfono: {reserva.telefono}
Fechas: Del {reserva.fecha_entrada} al {reserva.fecha_salida}
Personas: {reserva.personas}
Importe: {reserva.importe}€
ID Reserva: {reserva.id}

Estado: PAGADO - Pendiente de aprobación

Por favor, revisa la reserva y aprueba o rechaza desde el panel de administración."""

            send_email(
                os.getenv("EMAIL_DESTINO", "bonicargol@gmail.com"),
                f"Nueva reserva #{reserva.id} - {reserva.nombre}",
                email_propietario
            )

            return jsonify({
                "success": True,
                "reservaId": reserva_id,
                "estado": reserva.estado
            }), 200
        else:
            logger.warning(f"Pago no completado para sesión {session_id}. Estado: {session.payment_status}")
            return jsonify({
                "success": False,
                "error": "Pago no completado",
                "payment_status": session.payment_status
            }), 400

    except StripeError as e:
        logger.error(f"Error de Stripe en verify-payment: {str(e)}")
        return jsonify({"success": False, "error": "Error al verificar el pago"}), 500
    
    except Exception as e:
        logger.error(f"Error en verify-payment: {str(e)}")
        return jsonify({"success": False, "error": "Error interno del servidor"}), 500


@api.route("/owner-decision", methods=["POST"])
def owner_decision():
    """Permite al propietario aprobar o rechazar una reserva"""
    try:
        data = request.json
        
        # Validar datos
        if "reservationId" not in data or "approve" not in data:
            return jsonify({"success": False, "error": "Datos incompletos"}), 400
        
        reserva = Reserva.query.get(data["reservationId"])
        if not reserva:
            logger.warning(f"Reserva {data['reservationId']} no encontrada")
            return jsonify({"success": False, "error": "Reserva no encontrada"}), 404

        if reserva.estado != "pagado":
            logger.warning(f"Intento de aprobar/rechazar reserva {reserva.id} con estado {reserva.estado}")
            return jsonify({
                "success": False,
                "error": f"Solo se pueden aprobar/rechazar reservas pagadas. Estado actual: {reserva.estado}"
            }), 400

        if data["approve"]:
            # Aprobar reserva
            reserva.estado = "aprobada"
            
            mensaje = f"""Hola {reserva.nombre},

¡Buenas noticias! Tu reserva ha sido aprobada.

Detalles de tu reserva:
- ID: {reserva.id}
- Fechas: Del {reserva.fecha_entrada} al {reserva.fecha_salida}
- Personas: {reserva.personas}
- Importe: {reserva.importe}€

Nos pondremos en contacto contigo próximamente con más información.

¡Esperamos verte pronto!

Saludos,
Can Cargol"""
            
            logger.info(f"Reserva {reserva.id} aprobada")
        else:
            # Rechazar reserva
            reserva.estado = "rechazada"
            
            # Procesar reembolso en Stripe
            try:
                # Buscar el PaymentIntent asociado
                sessions = stripe.checkout.Session.list(limit=100)
                payment_intent_id = None
                
                for session in sessions.data:
                    if session.metadata.get("reserva_id") == str(reserva.id):
                        payment_intent_id = session.payment_intent
                        break
                
                if payment_intent_id:
                    refund = stripe.Refund.create(
                        payment_intent=payment_intent_id,
                        reason="requested_by_customer"
                    )
                    logger.info(f"Reembolso creado: {refund.id} para reserva {reserva.id}")
                    reembolso_msg = "El importe será reembolsado a tu método de pago original en 5-10 días hábiles."
                else:
                    logger.warning(f"No se encontró payment_intent para reserva {reserva.id}")
                    reembolso_msg = "El importe será reembolsado manualmente. Nos pondremos en contacto contigo."
                    
            except StripeError as e:
                logger.error(f"Error al crear reembolso: {str(e)}")
                reembolso_msg = "Procesaremos el reembolso manualmente. Nos pondremos en contacto contigo."

            mensaje = f"""Hola {reserva.nombre},

Lamentamos informarte que tu reserva ha sido rechazada debido a falta de disponibilidad.

Detalles de la reserva:
- ID: {reserva.id}
- Fechas: Del {reserva.fecha_entrada} al {reserva.fecha_salida}
- Importe: {reserva.importe}€

{reembolso_msg}

Si tienes alguna pregunta, no dudes en contactarnos.

Disculpa las molestias,
Can Cargol"""
            
            logger.info(f"Reserva {reserva.id} rechazada")

        db.session.commit()

        # Enviar email al cliente
        send_email(
            reserva.email,
            f"Estado de tu reserva #{reserva.id}",
            mensaje
        )

        return jsonify({
            "success": True,
            "estado": reserva.estado
        }), 200

    except Exception as e:
        logger.error(f"Error en owner-decision: {str(e)}")
        db.session.rollback()
        return jsonify({"success": False, "error": "Error interno del servidor"}), 500


@api.route("/health", methods=["GET"])
def health_check():
    """Endpoint para verificar que el servicio está funcionando"""
    return jsonify({
        "status": "ok",
        "stripe_configured": bool(os.getenv("STRIPE_SECRET_KEY")),
        "email_configured": bool(os.getenv("EMAIL_PASSWORD"))
    }), 200
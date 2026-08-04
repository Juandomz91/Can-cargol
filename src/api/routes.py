import os
import logging
from flask import Blueprint, request, jsonify
from api.models import db, Reserva
from api.utils import APIException
from api.extensions import limiter
from flask_cors import CORS
import stripe
from stripe import StripeError
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
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

# Habitaciones válidas (debe coincidir con la tabla habitaciones / frontend)
HABITACIONES_VALIDAS = {
    1: "Cama de matrimonio",
    2: "Dos camas individuales",
}

# Precios oficiales (fuente de verdad: SOLO el servidor decide el precio)
PRECIO_NOCHE_LABORABLE = 120
PRECIO_NOCHE_FINDE = 150

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

    if "datosCliente" not in data:
        errores.append("Faltan datos del cliente")
        return False, errores

    cliente = data["datosCliente"]

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

    habitacion_ids = data.get("habitacionIds")
    if not habitacion_ids or not isinstance(habitacion_ids, list) or len(habitacion_ids) == 0:
        errores.append("Debes seleccionar al menos una habitación")
    else:
        invalidas = [h for h in habitacion_ids if h not in HABITACIONES_VALIDAS]
        if invalidas:
            errores.append(f"Habitación(es) inválida(s): {invalidas}")
        if len(set(habitacion_ids)) != len(habitacion_ids):
            errores.append("Habitaciones duplicadas en la selección")

    # totalReserva ya NO se valida aquí — el precio lo calcula el servidor,
    # no se confía en nada que mande el cliente para determinar dinero
    return len(errores) == 0, errores


def esta_disponible(fecha_entrada, fecha_salida):
    """
    Comprueba si HAY SITIO LIBRE para nuevos huéspedes en ese rango.
    No se distingue por habitación: los clientes deben estar solos en
    la casa mientras se alojan, así que si CUALQUIERA de las dos
    habitaciones ya tiene una reserva 'pagado' o 'aprobada' que se
    solape con estas fechas, se considera que la casa ya tiene
    inquilinos y NINGUNA habitación (ni la ocupada ni la que en teoría
    está libre) se puede reservar por otro cliente en esas fechas.
    """
    solapamientos = Reserva.query.filter(
        Reserva.estado.in_(["pagado", "aprobada"]),
        Reserva.fecha_entrada < fecha_salida,
        Reserva.fecha_salida > fecha_entrada
    ).count()
    return solapamientos == 0


def calcular_precio_total(fecha_entrada_str, fecha_salida_str, num_habitaciones):
    """
    Calcula el precio real de la reserva en el SERVIDOR, ignorando
    cualquier importe que venga del cliente. PRECIO_NOCHE_LABORABLE
    entre semana, PRECIO_NOCHE_FINDE en fin de semana, por cada
    habitación reservada.
    """
    entrada = datetime.strptime(fecha_entrada_str, "%Y-%m-%d").date()
    salida = datetime.strptime(fecha_salida_str, "%Y-%m-%d").date()

    total_por_habitacion = 0
    dia = entrada
    while dia < salida:
        # weekday(): 0=lunes ... 5=sábado, 6=domingo
        total_por_habitacion += PRECIO_NOCHE_FINDE if dia.weekday() in (5, 6) else PRECIO_NOCHE_LABORABLE
        dia += timedelta(days=1)

    return round(total_por_habitacion * num_habitaciones, 2)


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

@api.route("/health", methods=["GET"])
def health_check():
    """Endpoint para verificar que el servicio está funcionando"""
    return jsonify({
        "status": "ok",
        "stripe_configured": bool(os.getenv("STRIPE_SECRET_KEY")),
        "email_configured": bool(os.getenv("EMAIL_PASSWORD"))
    }), 200


@api.route("/habitaciones/ocupacion", methods=["GET"])
@limiter.limit("60 per minute")
def ocupacion_casa():
    """
    Devuelve los rangos de fechas en los que ya hay algún huésped
    alojado en la casa (por cualquiera de las dos habitaciones).
    El frontend usa esto para bloquear el calendario ENTERO en esas
    fechas, sin distinguir habitación — porque si hay alguien
    alojado, no se acepta a nadie más aunque quede una habitación
    libre.
    """
    reservas = Reserva.query.filter(
        Reserva.estado.in_(["pagado", "aprobada"])
    ).all()

    # Puede haber fechas duplicadas si las dos habitaciones se
    # reservaron juntas (mismo rango, dos filas) — las deduplicamos
    rangos_vistos = set()
    ocupacion = []
    for r in reservas:
        clave = (r.fecha_entrada.isoformat(), r.fecha_salida.isoformat())
        if clave not in rangos_vistos:
            rangos_vistos.add(clave)
            ocupacion.append({
                "entrada": r.fecha_entrada.isoformat(),
                "salida": r.fecha_salida.isoformat()
            })

    return jsonify(ocupacion), 200


@api.route("/create-checkout-session", methods=["POST"])
@limiter.limit("5 per minute")
def create_checkout_session():
    """
    Crea una sesión de pago en Stripe y guarda una fila de Reserva
    por cada habitación seleccionada (1 o las 2), todas vinculadas
    a la misma sesión de Stripe.

    La disponibilidad se comprueba a nivel de CASA, no de habitación:
    si ya hay un huésped alojado en esas fechas (en cualquiera de las
    dos habitaciones), no se permite ninguna reserva nueva, para que
    los clientes nunca coincidan con desconocidos.

    El precio se calcula SIEMPRE en el servidor a partir de fechas y
    número de habitaciones — el totalReserva que mande el cliente se
    ignora por completo.

    Límite de 5 peticiones por minuto: nadie legítimo hace 6 intentos
    de reserva en un minuto, pero sí lo haría alguien probando a
    saturar Stripe o buscando bugs.
    """
    try:
        data = request.json

        # Validar datos
        valido, errores = validar_datos_reserva(data)
        if not valido:
            logger.warning(f"Validación fallida: {errores}")
            return jsonify({"error": "Datos inválidos", "detalles": errores}), 400

        habitacion_ids = data["habitacionIds"]

        # Comprobar disponibilidad de LA CASA (no por habitación)
        if not esta_disponible(data["startDate"], data["endDate"]):
            logger.warning(
                f"Casa no disponible: {data['startDate']} - {data['endDate']}"
            )
            return jsonify({
                "error": "Esas fechas ya no están disponibles"
            }), 409

        # PRECIO CALCULADO EN SERVIDOR — se ignora totalReserva del body
        num_habitaciones = len(habitacion_ids)
        total_reserva = calcular_precio_total(data["startDate"], data["endDate"], num_habitaciones)

        if total_reserva <= 0:
            logger.warning(f"Precio calculado inválido: {total_reserva}")
            return jsonify({"error": "No se pudo calcular un precio válido para esas fechas"}), 400

        importe_por_habitacion = round(total_reserva / num_habitaciones, 2)
        personas = 2 * num_habitaciones  # cada habitación tiene capacidad 2

        # Crear una fila Reserva por cada habitación
        reservas_creadas = []
        for hid in habitacion_ids:
            reserva = Reserva(
                habitacion_id=hid,
                nombre=data["datosCliente"]["nombre"].strip(),
                email=data["datosCliente"]["email"].strip().lower(),
                telefono=data["datosCliente"]["telefono"].strip(),
                fecha_entrada=data["startDate"],
                fecha_salida=data["endDate"],
                personas=personas,
                importe=importe_por_habitacion,
                estado="pendiente",
                tipo_alojamiento="habitacion"
            )
            db.session.add(reserva)
            reservas_creadas.append(reserva)

        db.session.commit()

        reserva_ids = [r.id for r in reservas_creadas]
        logger.info(f"Reservas creadas con IDs: {reserva_ids}, total calculado en servidor: {total_reserva}€")

        # Un solo line item en Stripe por el total (aunque sean 2 habitaciones)
        nombres_habitaciones = " + ".join(HABITACIONES_VALIDAS[h] for h in habitacion_ids)
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Reserva {nombres_habitaciones}",
                        "description": (
                            f"Del {data['startDate']} al {data['endDate']} - "
                            f"IDs: {','.join(str(i) for i in reserva_ids)}"
                        )
                    },
                    "unit_amount": int(total_reserva * 100),  # en céntimos
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{FRONTEND_URL}/checkout?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/calendario",
            metadata={
                "reserva_ids": ",".join(str(i) for i in reserva_ids),
                "email": reservas_creadas[0].email
            }
        )

        return jsonify({
            "sessionId": session.id,
            "reservaIds": reserva_ids
        }), 200

    except StripeError as e:
        logger.error(f"Error de Stripe: {str(e)}")
        return jsonify({"error": "Error al procesar el pago", "detalles": str(e)}), 500

    except Exception as e:
        logger.error(f"Error en create-checkout-session: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500


@api.route("/verify-payment/<session_id>", methods=["GET"])
@limiter.limit("30 per minute")
def verify_payment(session_id):
    """Verifica el estado del pago y actualiza TODAS las reservas del grupo"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        reserva_ids_raw = session.metadata.get("reserva_ids")

        if not reserva_ids_raw:
            logger.error("No se encontró reserva_ids en metadata")
            return jsonify({"success": False, "error": "Sesión inválida"}), 400

        reserva_ids = [int(i) for i in reserva_ids_raw.split(",")]
        reservas = Reserva.query.filter(Reserva.id.in_(reserva_ids)).all()

        if not reservas:
            logger.error(f"Reservas {reserva_ids} no encontradas")
            return jsonify({"success": False, "error": "Reserva no encontrada"}), 404

        if session.payment_status == "paid":
            for reserva in reservas:
                reserva.estado = "pagado"
            db.session.commit()

            logger.info(f"Pago confirmado para reservas {reserva_ids}")

            primera = reservas[0]
            total_pagado = sum(r.importe for r in reservas)
            habitaciones_txt = ", ".join(HABITACIONES_VALIDAS.get(r.habitacion_id, "?") for r in reservas)

            email_cliente = f"""Hola {primera.nombre},

¡Tu pago de {total_pagado}€ ha sido recibido con éxito!

Detalles de tu reserva:
- Habitación(es): {habitaciones_txt}
- Fechas: Del {primera.fecha_entrada} al {primera.fecha_salida}
- Importe total: {total_pagado}€

¡Gracias por tu reserva! Recibirás un email adicional cuando sea confirmada por el propietario.

Saludos,
Can Cargol"""

            send_email(
                primera.email,
                "Confirmación de pago - Can Cargol",
                email_cliente
            )

            email_propietario = f"""Nueva reserva confirmada (PAGO RECIBIDO)

Cliente: {primera.nombre}
Email: {primera.email}
Teléfono: {primera.telefono}
Habitación(es): {habitaciones_txt}
Fechas: Del {primera.fecha_entrada} al {primera.fecha_salida}
Importe total: {total_pagado}€
IDs Reserva: {reserva_ids}

Estado: PAGADO - Pendiente de aprobación

Por favor, revisa la reserva y aprueba o rechaza desde el panel de administración."""

            send_email(
                os.getenv("EMAIL_DESTINO", "bonicargol@gmail.com"),
                f"Nueva reserva #{'-'.join(str(i) for i in reserva_ids)} - {primera.nombre}",
                email_propietario
            )

            return jsonify({
                "success": True,
                "reservaIds": reserva_ids,
                "estado": "pagado"
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


@api.route("/stripe-webhook", methods=["POST"])
def stripe_webhook():
    """
    Endpoint que Stripe llama directamente cuando ocurre un evento
    (pago completado, fallido, etc). Verificamos la firma para
    asegurarnos de que la petición viene realmente de Stripe y no
    de alguien simulándola.

    Sirve de red de seguridad frente a verify-payment: si el cliente
    cierra la pestaña justo después de pagar, esto igualmente
    confirma la reserva.

    NO se aplica rate limiting aquí: las peticiones vienen de los
    servidores de Stripe (IP compartida entre muchos comercios), no
    de un usuario individual — limitar por IP penalizaría a Stripe,
    no a un atacante. La protección real de este endpoint es la
    verificación de firma (construct_event), no el rate limit.
    """
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET no configurado")
        return jsonify({"error": "Webhook no configurado"}), 500

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        logger.error("Payload de webhook inválido")
        return jsonify({"error": "Payload inválido"}), 400
    except stripe.error.SignatureVerificationError:
        logger.error("Firma de webhook inválida — posible intento de falsificación")
        return jsonify({"error": "Firma inválida"}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        reserva_ids_raw = session.get("metadata", {}).get("reserva_ids")

        if not reserva_ids_raw:
            logger.warning("checkout.session.completed sin reserva_ids en metadata")
            return jsonify({"received": True}), 200

        reserva_ids = [int(i) for i in reserva_ids_raw.split(",")]
        reservas = Reserva.query.filter(Reserva.id.in_(reserva_ids)).all()

        if not reservas:
            logger.warning(f"Webhook: reservas {reserva_ids} no encontradas")
            return jsonify({"received": True}), 200

        # Idempotencia: si ya están pagadas (porque verify-payment se
        # adelantó), no las volvemos a procesar ni a mandar email duplicado
        ya_procesadas = all(r.estado != "pendiente" for r in reservas)
        if ya_procesadas:
            logger.info(f"Webhook: reservas {reserva_ids} ya estaban procesadas, ignorando")
            return jsonify({"received": True}), 200

        for r in reservas:
            r.estado = "pagado"
        db.session.commit()

        logger.info(f"Webhook: pago confirmado para reservas {reserva_ids}")

        primera = reservas[0]
        total_pagado = sum(r.importe for r in reservas)
        habitaciones_txt = ", ".join(HABITACIONES_VALIDAS.get(r.habitacion_id, "?") for r in reservas)

        email_propietario = f"""Nueva reserva confirmada (PAGO RECIBIDO vía webhook)

Cliente: {primera.nombre}
Email: {primera.email}
Teléfono: {primera.telefono}
Habitación(es): {habitaciones_txt}
Fechas: Del {primera.fecha_entrada} al {primera.fecha_salida}
Importe total: {total_pagado}€
IDs Reserva: {reserva_ids}

Estado: PAGADO - Pendiente de aprobación

Por favor, revisa la reserva y aprueba o rechaza desde el panel de administración."""

        send_email(
            os.getenv("EMAIL_DESTINO", "bonicargol@gmail.com"),
            f"Nueva reserva #{'-'.join(str(i) for i in reserva_ids)} - {primera.nombre}",
            email_propietario
        )

        email_cliente = f"""Hola {primera.nombre},

¡Tu pago de {total_pagado}€ ha sido recibido con éxito!

Detalles de tu reserva:
- Habitación(es): {habitaciones_txt}
- Fechas: Del {primera.fecha_entrada} al {primera.fecha_salida}
- Importe total: {total_pagado}€

¡Gracias por tu reserva! Recibirás un email adicional cuando sea confirmada por el propietario.

Saludos,
Can Cargol"""

        send_email(primera.email, "Confirmación de pago - Can Cargol", email_cliente)

    return jsonify({"received": True}), 200


@api.route("/owner-decision", methods=["POST"])
@limiter.limit("20 per minute")
def owner_decision():
    """
    Permite al propietario aprobar o rechazar un GRUPO de reservas
    (todas las habitaciones de la misma sesión de pago, a la vez).
    """
    try:
        data = request.json

        if "reservationIds" not in data or "approve" not in data:
            return jsonify({"success": False, "error": "Datos incompletos"}), 400

        reserva_ids = data["reservationIds"]
        if not isinstance(reserva_ids, list) or len(reserva_ids) == 0:
            return jsonify({"success": False, "error": "reservationIds debe ser una lista no vacía"}), 400

        reservas = Reserva.query.filter(Reserva.id.in_(reserva_ids)).all()
        if not reservas:
            logger.warning(f"Reservas {reserva_ids} no encontradas")
            return jsonify({"success": False, "error": "Reserva no encontrada"}), 404

        no_pagadas = [r.id for r in reservas if r.estado != "pagado"]
        if no_pagadas:
            logger.warning(f"Intento de aprobar/rechazar reservas no pagadas: {no_pagadas}")
            return jsonify({
                "success": False,
                "error": f"Solo se pueden aprobar/rechazar reservas pagadas. IDs no válidos: {no_pagadas}"
            }), 400

        primera = reservas[0]
        habitaciones_txt = ", ".join(HABITACIONES_VALIDAS.get(r.habitacion_id, "?") for r in reservas)
        total_importe = sum(r.importe for r in reservas)

        if data["approve"]:
            for r in reservas:
                r.estado = "aprobada"

            mensaje = f"""Hola {primera.nombre},

¡Buenas noticias! Tu reserva ha sido aprobada.

Detalles de tu reserva:
- Habitación(es): {habitaciones_txt}
- Fechas: Del {primera.fecha_entrada} al {primera.fecha_salida}
- Importe total: {total_importe}€

Nos pondremos en contacto contigo próximamente con más información.

¡Esperamos verte pronto!

Saludos,
Can Cargol"""

            logger.info(f"Reservas {reserva_ids} aprobadas")
        else:
            for r in reservas:
                r.estado = "rechazada"

            # Procesar reembolso en Stripe (una sola vez, es un único pago)
            try:
                sessions = stripe.checkout.Session.list(limit=100)
                payment_intent_id = None

                for session in sessions.data:
                    meta_ids = session.metadata.get("reserva_ids", "")
                    if sorted(meta_ids.split(",")) == sorted(str(r.id) for r in reservas):
                        payment_intent_id = session.payment_intent
                        break

                if payment_intent_id:
                    refund = stripe.Refund.create(
                        payment_intent=payment_intent_id,
                        reason="requested_by_customer"
                    )
                    logger.info(f"Reembolso creado: {refund.id} para reservas {reserva_ids}")
                    reembolso_msg = "El importe será reembolsado a tu método de pago original en 5-10 días hábiles."
                else:
                    logger.warning(f"No se encontró payment_intent para reservas {reserva_ids}")
                    reembolso_msg = "El importe será reembolsado manualmente. Nos pondremos en contacto contigo."

            except StripeError as e:
                logger.error(f"Error al crear reembolso: {str(e)}")
                reembolso_msg = "Procesaremos el reembolso manualmente. Nos pondremos en contacto contigo."

            mensaje = f"""Hola {primera.nombre},

Lamentamos informarte que tu reserva ha sido rechazada debido a falta de disponibilidad.

Detalles de la reserva:
- Habitación(es): {habitaciones_txt}
- Fechas: Del {primera.fecha_entrada} al {primera.fecha_salida}
- Importe total: {total_importe}€

{reembolso_msg}

Si tienes alguna pregunta, no dudes en contactarnos.

Disculpa las molestias,
Can Cargol"""

            logger.info(f"Reservas {reserva_ids} rechazadas")

        db.session.commit()

        send_email(
            primera.email,
            f"Estado de tu reserva #{'-'.join(str(i) for i in reserva_ids)}",
            mensaje
        )

        return jsonify({
            "success": True,
            "estado": reservas[0].estado
        }), 200

    except Exception as e:
        logger.error(f"Error en owner-decision: {str(e)}")
        db.session.rollback()
        return jsonify({"success": False, "error": "Error interno del servidor"}), 500

        OWNER_SECRET = os.getenv("OWNER_DASHBOARD_SECRET")

@api.route("/owner-decision", methods=["POST"])
def owner_decision():
    token = request.headers.get("X-Owner-Token")
    if not OWNER_SECRET or token != OWNER_SECRET:
        logger.warning("Intento de acceso no autorizado a owner-decision")
        return jsonify({"success": False, "error": "No autorizado"}), 401
        
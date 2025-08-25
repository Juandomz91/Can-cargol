"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import stripe
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import request, jsonify, Blueprint
from .models import db, User, Reservation
from .utils import APIException
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

# Configurar Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Variables de entorno
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASS = os.getenv('EMAIL_PASS')
OWNER_EMAIL = os.getenv('OWNER_EMAIL')

# Utilidades
def parse_iso_date(s: str):
    """Parsear fecha ISO con soporte para Z"""
    if not s:
        return None
    s = s.replace('Z', '+00:00') if s.endswith('Z') else s
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        try:
            return datetime.strptime(s[:10], '%Y-%m-%d').date()
        except Exception:
            raise ValueError(f"Invalid date format: {s}")

def send_email(to_email: str, subject: str, body_html: str):
    """Enviar email usando SMTP"""
    if not EMAIL_USER or not EMAIL_PASS:
        print("Email credentials not configured; skipping email send.")
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body_html, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# ENDPOINT ORIGINAL
@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200

# ENDPOINTS PARA EL CHECKOUT CON STRIPE

@api.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json() or {}

        # Validaciones
        required = ['startDate', 'endDate', 'tipoAlojamiento', 'datosCliente', 'totalReserva', 'noches']
        for r in required:
            if r not in data:
                return jsonify({'error': f'Campo requerido: {r}'}), 400

        # Metadata para Stripe
        metadata = {
            'start_date': data['startDate'],
            'end_date': data['endDate'],
            'accommodation_type': data['tipoAlojamiento'],
            'customer_name': data['datosCliente'].get('nombre', ''),
            'customer_email': data['datosCliente'].get('email', ''),
            'customer_phone': data['datosCliente'].get('telefono', ''),
            'nights': str(data['noches']),
            'total_price': str(data['totalReserva'])
        }

        # Crear sesión de Stripe
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"Reserva - {data['tipoAlojamiento']}",
                        'description': f"{data['noches']} noches - {data['datosCliente'].get('nombre','')}",
                    },
                    'unit_amount': int(float(data['totalReserva']) * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',
                'metadata': metadata
            },
            success_url=f"{FRONTEND_URL}/checkout?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/calendario",
        )

        return jsonify({'sessionId': session.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/verify-payment/<session_id>', methods=['GET'])
def verify_payment(session_id):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_intent_id = getattr(session, 'payment_intent', None)

        if not payment_intent_id:
            return jsonify({'success': False, 'error': 'No payment_intent en la sesión'}), 400

        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id, expand=['charges.data'])
        pi_status = payment_intent.status
        charges = getattr(payment_intent, 'charges', {}).get('data', [])
        charge_paid = any(c.get('paid') for c in charges) if charges else False

        if pi_status in ('requires_capture', 'succeeded') or charge_paid:
            # Crear reserva
            meta = payment_intent.metadata or {}

            reservation = Reservation(
                start_date=parse_iso_date(meta.get('start_date')),
                end_date=parse_iso_date(meta.get('end_date')),
                nights=int(meta.get('nights', 0)),
                accommodation_type=meta.get('accommodation_type', ''),
                total_price=float(meta.get('total_price', 0.0)),
                customer_name=meta.get('customer_name', ''),
                customer_email=meta.get('customer_email', ''),
                customer_phone=meta.get('customer_phone', ''),
                payment_intent_id=payment_intent_id,
                session_id=session_id,
                status='pending'
            )

            db.session.add(reservation)
            db.session.commit()

            # Notificar propietario
            if OWNER_EMAIL:
                subject = f"Nueva Reserva Pendiente - {reservation.customer_name}"
                body = f"""
                <h3>Nueva solicitud de reserva</h3>
                <p><strong>Cliente:</strong> {reservation.customer_name}</p>
                <p><strong>Email:</strong> {reservation.customer_email}</p>
                <p><strong>Teléfono:</strong> {reservation.customer_phone}</p>
                <p><strong>Fechas:</strong> {reservation.start_date} - {reservation.end_date}</p>
                <p><strong>Noches:</strong> {reservation.nights}</p>
                <p><strong>Tipo:</strong> {reservation.accommodation_type}</p>
                <p><strong>Total:</strong> €{reservation.total_price}</p>
                <p><strong>ID:</strong> {reservation.id}</p>
                <p>El pago está retenido en Stripe hasta su aprobación.</p>
                """
                send_email(OWNER_EMAIL, subject, body)

            return jsonify({'success': True, 'reservationId': reservation.id})
        else:
            return jsonify({'success': False, 'error': f'PaymentIntent status: {pi_status}'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/owner-decision', methods=['POST'])
def owner_decision():
    try:
        data = request.get_json() or {}
        reservation_id = data.get('reservationId')
        approve = data.get('approve')

        if not reservation_id:
            return jsonify({'error': 'reservationId is required'}), 400

        reservation = Reservation.query.get(reservation_id)
        if not reservation:
            return jsonify({'error': 'Reservation not found'}), 404

        if approve:
            # Capturar el pago
            stripe.PaymentIntent.capture(reservation.payment_intent_id)
            reservation.status = 'approved'

            # Notificar al cliente
            subject = "Reserva Confirmada"
            body = f"""
            <h3>Reserva confirmada</h3>
            <p>Hola {reservation.customer_name},</p>
            <p>Tu reserva ha sido aprobada. Detalles:</p>
            <ul>
                <li>Fechas: {reservation.start_date} - {reservation.end_date}</li>
                <li>Noches: {reservation.nights}</li>
                <li>Total: €{reservation.total_price}</li>
            </ul>
            <p>¡Esperamos verte pronto!</p>
            """
            send_email(reservation.customer_email, subject, body)
        else:
            # Rechazar y cancelar el pago
            try:
                stripe.PaymentIntent.cancel(reservation.payment_intent_id)
            except Exception as e:
                print(f"Warning: no se pudo cancelar PaymentIntent: {e}")
            reservation.status = 'rejected'

            # Notificar al cliente
            subject = "Reserva no disponible"
            body = f"""
            <h3>Reserva no disponible</h3>
            <p>Hola {reservation.customer_name},</p>
            <p>Lamentamos informarte que tu reserva no ha podido ser confirmada.</p>
            <p>El importe será liberado/reembolsado automáticamente por Stripe en los próximos días.</p>
            <p>Gracias por tu comprensión.</p>
            """
            send_email(reservation.customer_email, subject, body)

        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/reservations', methods=['GET'])
def get_reservations():
    try:
        reservations = Reservation.query.order_by(Reservation.created_at.desc()).all()
        return jsonify([r.serialize() for r in reservations])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
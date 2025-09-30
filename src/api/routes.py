"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body)

@api.route('/send-email', methods=['POST'])
def send_email():
    data = request.json
    
    # Configuración del servidor SMTP - USANDO VARIABLES DE ENTORNO
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    email_usuario = os.getenv("EMAIL_USER", "sistemacancargol@gmail.com")
    email_password = os.getenv("EMAIL_PASSWORD")  # Contraseña desde .env
    email_destino = os.getenv("EMAIL_DESTINO", "bonicargol@gmail.com")
    
    if not email_password:
        return jsonify({"success": False, "error": "Configuración de email incompleta"}), 500
    
    try:
        msg = MIMEMultipart()
        msg['From'] = email_usuario
        msg['To'] = email_destino
        msg['Reply-To'] = data['email']  # Para poder responder al cliente
        msg['Subject'] = f"🏨 Nuevo contacto de {data['nombre']}"
        
        body = f"""
        ¡Nuevo mensaje de contacto desde la web!
        
        👤 Cliente: {data['nombre']}
        📧 Email: {data['email']}
        📱 Teléfono: {data['telefono']}
        
        💬 Mensaje:
        {data['mensaje']}
        
        ---
        Para responder, simplemente pulsa "Responder" y llegará directamente al cliente.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_usuario, email_password)
        server.sendmail(email_usuario, email_destino, msg.as_string())
        server.quit()
        
        return jsonify({"success": True, "message": "Email enviado correctamente"})
    
    except Exception as e:
        print(f"Error enviando email: {str(e)}")  # Para debug
        return jsonify({"success": False, "error": "Error interno del servidor"}), 500
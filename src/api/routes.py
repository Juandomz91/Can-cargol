"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
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





@app.route('/send-email', methods=['POST'])
def send_email():
    data = request.json
    
    # Configuración del servidor SMTP (ejemplo con Gmail)
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    email_usuario = "sistemacancargol@gmail.com"
    email_password = "sistemacargolet"  # Contraseña de aplicación
    
    try:
        msg = MIMEMultipart()
        msg['From'] = "sistemacancargol@gmail.com"
        msg['To'] = "bonicargol@gmail.com"  # Email del hotel
        msg['Subject'] = f"Nuevo contacto de {data['nombre']}"
        
        body = f"""
        Nuevo mensaje de contacto:
        
        Nombre: {data['nombre']}
        Email: {data['email']}
        Teléfono: {data['telefono']}
        
        Mensaje:
        {data['mensaje']}
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_usuario, email_password)
        server.sendmail(email_usuario, "hotel@tudominio.com", msg.as_string())
        server.quit()
        
        return jsonify({"success": True, "message": "Email enviado correctamente"})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
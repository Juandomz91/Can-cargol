from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

db = SQLAlchemy()

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False)


    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            # do not serialize the password, its a security breach
        }


class Reserva(db.Model):
    __tablename__ = "reservas"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    telefono = db.Column(db.String(50), nullable=False)

    fecha_entrada = db.Column(db.Date, nullable=False)
    fecha_salida = db.Column(db.Date, nullable=False)
    personas = db.Column(db.Integer, nullable=False)

    importe = db.Column(db.Float, nullable=False)

    # Estados posibles: pendiente, pagado, aprobada, rechazada
    estado = db.Column(db.String(20), default="pendiente", nullable=False)

    # Campos opcionales para control
    tipo_alojamiento = db.Column(db.String(50), nullable=True)   # "habitacion" o "casa"
    noches = db.Column(db.Integer, nullable=True)

    # Stripe
    stripe_session_id = db.Column(db.String(255), nullable=True)
    stripe_payment_intent = db.Column(db.String(255), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "telefono": self.telefono,
            "fecha_entrada": self.fecha_entrada.isoformat() if self.fecha_entrada else None,
            "fecha_salida": self.fecha_salida.isoformat() if self.fecha_salida else None,
            "personas": self.personas,
            "importe": self.importe,
            "estado": self.estado,
            "tipo_alojamiento": self.tipo_alojamiento,
            "noches": self.noches,
            "stripe_session_id": self.stripe_session_id,
            "stripe_payment_intent": self.stripe_payment_intent
        }
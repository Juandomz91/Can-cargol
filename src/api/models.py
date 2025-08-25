import uuid
from datetime import datetime
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
            # do not serialize the password, it's a security breach
        }

class Reservation(db.Model):
    __tablename__ = 'reservations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    nights = db.Column(db.Integer, nullable=False)
    accommodation_type = db.Column(db.String(50), nullable=False)
    total_price = db.Column(db.Float, nullable=False)

    # Datos del cliente
    customer_name = db.Column(db.String(200), nullable=False)
    customer_email = db.Column(db.String(200), nullable=False)
    customer_phone = db.Column(db.String(50), nullable=False)

    # Stripe
    payment_intent_id = db.Column(db.String(200), nullable=False)
    session_id = db.Column(db.String(200), nullable=False)

    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def serialize(self):
        return {
            'id': self.id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'nights': self.nights,
            'accommodation_type': self.accommodation_type,
            'total_price': self.total_price,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }
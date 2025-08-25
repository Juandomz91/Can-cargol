# src/main.py
import os
from dotenv import load_dotenv
from flask import Flask
from flask_migrate import Migrate
from src.api.models import db
from src.api.routes import api as api_blueprint

load_dotenv()

def create_app():
    app = Flask(__name__)
    database_url = os.getenv('DATABASE_URL', 'sqlite:///tmp/dev.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    Migrate(app, db)

    app.register_blueprint(api_blueprint, url_prefix='/api')

    @app.route('/')
    def index():
        return {'status': 'ok'}, 200

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 3001)), debug=True)
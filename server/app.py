from flask import Flask
from db import close_db

def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config["SECRET_KEY"] = "dev-secret-change-me"

    if test_config:
        app.config.update(test_config)

    app.teardown_appcontext(close_db)

    return app

from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify(status="ok", service="flask")


@app.get("/")
def root():
    return jsonify(service="flask", endpoints=["/health"])

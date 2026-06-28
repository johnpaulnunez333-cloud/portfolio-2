from flask import Flask, render_template, request, redirect, url_for, session
import json, os, hashlib

app = Flask(__name__)
app.secret_key = "mdn_secret_key_2025"

USERS_FILE = "users.json"


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)


def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


@app.route("/")
def home():
    if "username" not in session:
        return redirect(url_for("login"))
    return redirect(url_for("site"))


@app.route("/login", methods=["GET", "POST"])
def login():
    error = ""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        users = load_users()
        if username in users and users[username]["password"] == hash_password(password):
            session["username"] = username
            return redirect(url_for("site"))
        else:
            error = "Invalid username or password."
    return render_template("login.html", error=error)


@app.route("/signup", methods=["GET", "POST"])
def signup():
    error = ""
    success = ""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        confirm = request.form.get("confirm", "").strip()
        users = load_users()
        if not username or not password:
            error = "All fields are required."
        elif password != confirm:
            error = "Passwords do not match."
        elif username in users:
            error = "Username already taken."
        elif len(password) < 6:
            error = "Password must be at least 6 characters."
        else:
            users[username] = {"password": hash_password(password)}
            save_users(users)
            success = "Account created! You can now log in."
    return render_template("signup.html", error=error, success=success)


@app.route("/site")
def site():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

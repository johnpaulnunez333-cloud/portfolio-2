from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room
import json, os, bcrypt, re
from datetime import datetime

app = Flask(__name__)
app.secret_key = "mdn_secret_key_2025"
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

USERS_FILE = "users.json"
MESSAGES_FILE = "messages.json"

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

def load_messages():
    if not os.path.exists(MESSAGES_FILE):
        return []
    with open(MESSAGES_FILE, "r") as f:
        return json.load(f)

def save_messages(messages):
    with open(MESSAGES_FILE, "w") as f:
        json.dump(messages, f)

def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())

def valid_email(email):
    return re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email)

online_users = {}

@app.route("/")
def home():
    if "username" not in session:
        return redirect(url_for("login"))
    return redirect(url_for("site"))

@app.route("/login", methods=["GET", "POST"])
def login():
    error = ""
    if request.method == "POST":
        login_input = request.form.get("login_input", "").strip()
        password = request.form.get("password", "").strip()
        users = load_users()
        matched_user = None
        for uname, udata in users.items():
            if uname == login_input or udata.get("email", "") == login_input:
                matched_user = (uname, udata)
                break
        if matched_user and check_password(password, matched_user[1]["password"]):
            session["username"] = matched_user[0]
            return redirect(url_for("site"))
        else:
            error = "Invalid username/email or password."
    return render_template("login.html", error=error)

@app.route("/signup", methods=["GET", "POST"])
def signup():
    error = ""
    success = ""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email    = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()
        confirm  = request.form.get("confirm", "").strip()
        users = load_users()
        if not username or not email or not password:
            error = "All fields are required."
        elif not valid_email(email):
            error = "Enter a valid email address."
        elif password != confirm:
            error = "Passwords do not match."
        elif username in users:
            error = "Username already taken."
        elif any(u.get("email") == email for u in users.values()):
            error = "Email already registered."
        elif len(password) < 6:
            error = "Password must be at least 6 characters."
        else:
            users[username] = {"email": email, "password": hash_password(password)}
            save_users(users)
            success = "Account created! You can now log in."
    return render_template("signup.html", error=error, success=success)

@app.route("/site")
def site():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])

@app.route("/chat")
def chat():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("chat.html", username=session["username"])

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@socketio.on("join")
def on_join(data):
    username = data.get("username")
    online_users[request.sid] = username
    join_room("mdn-chat")
    messages = load_messages()[-50:]
    emit("load_messages", messages)
    emit("user_joined", {"username": username, "online": list(online_users.values())}, to="mdn-chat")

@socketio.on("send_message")
def on_message(data):
    username = online_users.get(request.sid, "Unknown")
    content = data.get("content", "").strip()
    if not content or len(content) > 500:
        return
    msg = {
        "username": username,
        "content": content,
        "time": datetime.now().strftime("%I:%M %p")
    }
    messages = load_messages()
    messages.append(msg)
    if len(messages) > 200:
        messages = messages[-200:]
    save_messages(messages)
    emit("new_message", msg, to="mdn-chat")

@socketio.on("disconnect")
def on_disconnect():
    username = online_users.pop(request.sid, None)
    if username:
        emit("user_left", {"username": username, "online": list(online_users.values())}, to="mdn-chat")

if __name__ == "__main__":
    # Babasahin nito ang port na binibigay ng Railway, kung wala (gaya ng local), gagamit ito ng 5000
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=False)

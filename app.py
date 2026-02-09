from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

# ---- Database configuration ----
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "tasks.db")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + DB_PATH
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "dev"

# ---- Initialize DB ----
db = SQLAlchemy(app)

# ---- Task Model ----
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(10), default="Medium")
    due_date = db.Column(db.String(20), nullable=True)

    def __repr__(self):
        return f"<Task {self.id}>"

# ---- Create tables (fresh DB) ----
with app.app_context():
    db.create_all()

# ---- Routes ----
@app.route("/")
def index():
    tasks = Task.query.order_by(Task.id.desc()).all()
    
    # Calculate days remaining for each task
    today = datetime.now().date()
    for task in tasks:
        if task.due_date:
            try:
                due_date = datetime.strptime(task.due_date, "%Y-%m-%d").date()
                days_remaining = (due_date - today).days
                task.days_remaining = days_remaining
                if days_remaining < 0:
                    task.status = "overdue"
                elif days_remaining == 0:
                    task.status = "today"
                elif days_remaining <= 3:
                    task.status = "urgent"
                else:
                    task.status = "normal"
            except:
                task.days_remaining = None
                task.status = "normal"
        else:
            task.days_remaining = None
            task.status = "normal"
    
    return render_template("index.html", tasks=tasks, today=today)

@app.route("/add", methods=["POST"])
def add():
    task_content = request.form.get("content")
    if task_content and task_content.strip():
        new_task = Task(
            content=task_content.strip(),
            priority=request.form.get("priority"),
            due_date=request.form.get("due_date")
        )
        db.session.add(new_task)
        db.session.commit()
    return redirect(url_for("index"))

@app.route("/complete/<int:id>")
def complete(id):
    task = Task.query.get_or_404(id)
    task.completed = not task.completed
    db.session.commit()
    return redirect(url_for("index"))

@app.route("/delete/<int:id>")
def delete(id):
    task = Task.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    return redirect(url_for("index"))

@app.route("/edit/<int:id>", methods=["POST"])
def edit(id):
    task = Task.query.get_or_404(id)
    new_content = request.form.get("content")
    if new_content and new_content.strip():
        task.content = new_content.strip()
        task.priority = request.form.get("priority")
        task.due_date = request.form.get("due_date")
        db.session.commit()
    return redirect(url_for("index"))

# ---- Run App ----
if __name__ == "__main__":
    app.run(debug=True)

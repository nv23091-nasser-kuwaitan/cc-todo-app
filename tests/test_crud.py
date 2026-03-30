import pytest
from app import app, db, Task


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.drop_all()


def test_create_task(client):
    # ACT: create a task
    resp = client.post("/add", data={"content": "Buy milk", "priority": "Medium", "due_date": ""}, follow_redirects=True)

    # ASSERT: page loads and task appears
    assert resp.status_code == 200
    assert "Buy milk" in resp.get_data(as_text=True)


def test_update_task(client):
    # ARRANGE: create a task first
    client.post("/add", data={"content": "Old title", "priority": "Medium", "due_date": ""}, follow_redirects=True)

    # ACT: edit the task (id=1)
    resp = client.post("/edit/1", data={"content": "New title", "priority": "High", "due_date": ""}, follow_redirects=True)

    # ASSERT: updated content appears on page
    assert resp.status_code == 200
    assert "New title" in resp.get_data(as_text=True)


def test_delete_task(client):
    # ARRANGE: create a task first
    client.post("/add", data={"content": "To be deleted", "priority": "Low", "due_date": ""}, follow_redirects=True)

    # ACT: delete the task (id=1)
    resp = client.get("/delete/1", follow_redirects=True)

    # ASSERT: task no longer appears on page
    assert resp.status_code == 200
    assert "To be deleted" not in resp.get_data(as_text=True)

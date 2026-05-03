import requests

r = requests.post(
    "http://localhost:8000/api/auth/register/",
    json={"email": "test@example.com", "password": "short"},
)
print(r.status_code)
print(r.text)

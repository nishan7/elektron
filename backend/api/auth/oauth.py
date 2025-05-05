import jwt
from fastapi import APIRouter, Request, Body, HTTPException

router = APIRouter()
from api.auth.auth import create_access_token
from api.user_service import get_or_create_user
from main import app

# === Google OAuth 2 settings ===
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/google/callback"

# Google's endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


# === Route: start Google Login ===
# @app.get("/auth/google/login")
# def google_login():
#     params = {
#         "client_id": GOOGLE_CLIENT_ID,
#         "response_type": "code",
#         "scope": "openid email profile",
#         "redirect_uri": GOOGLE_REDIRECT_URI,
#         "prompt": "consent",  # force to show account selection
#         "access_type": "offline"
#     }
#     url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
#     return RedirectResponse(url)


@router.post("/auth/google/login")
async def google_callback(body: dict = Body(...)) -> dict:
    credential = body.get("credential")

    if not credential:
        raise HTTPException(status_code=400, detail="Missing 'credential' in request body.")

    try:
        decoded = jwt.decode(credential, options={"verify_signature": False})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid credential: {str(e)}")

    userinfo = {
        "email": decoded.get("email"),
        "name": decoded.get("name"),
        "picture": decoded.get("picture"),
        "type": "job_seeker"
    }

    user = await get_or_create_user(userinfo)
    access_token = create_access_token(data={"sub": user["email"]})

    print("User info:", user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "type": user.get("type")
    }

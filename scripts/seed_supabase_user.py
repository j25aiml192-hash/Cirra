import os
import sys
import httpx
from dotenv import load_dotenv

# Load env
load_dotenv()
load_dotenv("services/api/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tdndulxcozfckfmcivzv.supabase.co").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"Supabase URL: {SUPABASE_URL}")
print(f"Service Role Key present: {bool(SUPABASE_SERVICE_ROLE_KEY)}")

if not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_SERVICE_ROLE_KEY is missing!")
    sys.exit(1)

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

def ensure_user():
    email = "hiten@cirra.dev"
    password = "12345"

    with httpx.Client(timeout=15.0) as client:
        # 1. Search for existing user
        print(f"Checking if {email} exists in Supabase...")
        res = client.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers)
        print(f"List users response status: {res.status_code}")
        
        user_id = None
        if res.status_code == 200:
            users_data = res.json()
            users = users_data.get("users", [])
            for u in users:
                if u.get("email") == email:
                    user_id = u.get("id")
                    print(f"Found existing user with ID: {user_id}")
                    break

        if user_id:
            # Update password and confirm email
            print(f"Updating user {user_id} password to 12345 and email_confirm: true...")
            update_res = client.put(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers=headers,
                json={
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "name": "Hiten Shah",
                        "company_name": "Cirra"
                    }
                }
            )
            print(f"Update response: {update_res.status_code} {update_res.text}")
        else:
            # Create user
            print(f"Creating user {email} with email_confirm: true...")
            create_res = client.post(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers=headers,
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "name": "Hiten Shah",
                        "company_name": "Cirra"
                    }
                }
            )
            print(f"Create response: {create_res.status_code} {create_res.text}")

        # Now test signing in with password using anon key to verify!
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        if anon_key:
            print("Verifying signInWithPassword via Supabase token endpoint...")
            auth_res = client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={
                    "apikey": anon_key,
                    "Content-Type": "application/json"
                },
                json={
                    "email": email,
                    "password": password
                }
            )
            print(f"Verify status: {auth_res.status_code}")
            if auth_res.status_code == 200:
                print("SUCCESS: Supabase password authentication works perfectly!")
            else:
                print(f"Supabase auth verify failed: {auth_res.text}")

if __name__ == "__main__":
    ensure_user()

#!/usr/bin/env python
"""
Set Custom Firebase Admin Role Claim.
Run this script to elevate any registered user account to admin privileges.

Usage:
  python set_admin.py --email user@example.com --key path/to/firebase-credentials.json
"""
import argparse
import firebase_admin
from firebase_admin import auth, credentials

def main():
    parser = argparse.ArgumentParser(description="Elevate Firebase User to Admin")
    parser.add_argument("--email", required=True, help="User email address")
    parser.add_argument("--key", default=None, help="Path to Firebase Service Account JSON credentials")
    args = parser.parse_args()

    # Init Firebase Admin SDK
    if not firebase_admin._apps:
        if args.key:
            cred = credentials.Certificate(args.key)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()

    try:
        user = auth.get_user_by_email(args.email)
        # Set custom user claims
        auth.set_custom_user_claims(user.uid, {"role": "admin"})
        
        print(f"🎉 Success! Elevated {args.email} to Admin Role.")
        print(f"User UID: {user.uid}")
        print("Please ask the user to sign out and sign back in to apply the changes.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()

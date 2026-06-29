#!/usr/bin/env python
"""
Seed approved medical articles into Cloud Firestore knowledge base.
Includes WHO, ICMR, and NHS guidelines for pregnancy and baby care.
"""
import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

# Add parent dir to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SEED_ARTICLES = [
    {
        "title": "WHO Guidelines on Prenatal Care and Nutrition",
        "summary": "Essential advice from the World Health Organization on maintaining a healthy pregnancy through proper diet, regular check-ups, and safe exercise.",
        "full_content": "The World Health Organization (WHO) recommends a minimum of eight antenatal care contacts to reduce perinatal mortality and improve the care experience. Nutrition is a cornerstone: pregnant women should increase daily energy intake by approximately 350-450 kcal depending on the trimester. Supplementation of iron (30-60mg) and folic acid (400mcg) is strongly advised to prevent anemia and neural tube defects.",
        "source_url": "https://www.who.int/publications/i/item/9789241549691",
        "source_name": "WHO",
        "category": "pregnancy",
        "tags": ["prenatal", "nutrition", "who-guidelines"],
        "pregnancy_weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        "ai_confidence_score": 0.98,
        "status": "published",
        "published_at": datetime.now(timezone.utc),
    },
    {
        "title": "ICMR Guidelines on Maternal and Child Nutrition in India",
        "summary": "Key recommendations from the Indian Council of Medical Research focusing on local diets, micronutrients, and regional Indian maternal care.",
        "full_content": "The National Institute of Nutrition (ICMR-NIN) India recommends dietary diversity including millets (ragi, jowar), pulses, green leafy vegetables, and milk products. Iron-folic acid (IFA) tablets should be consumed for at least 180 days starting from the second trimester. Calcium supplementation (1g/day) is also critical, particularly for women with low dietary calcium intake.",
        "source_url": "https://www.icmr.gov.in",
        "source_name": "ICMR",
        "category": "nutrition",
        "tags": ["indian-diet", "icmr", "ragi", "calcium"],
        "pregnancy_weeks": [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
        "ai_confidence_score": 0.95,
        "status": "published",
        "published_at": datetime.now(timezone.utc),
    },
    {
        "title": "Safe Sleep Practices for Newborns",
        "summary": "Guidance from the American Academy of Pediatrics (AAP) on ensuring a safe sleep environment for infants to reduce the risk of SIDS.",
        "full_content": "The American Academy of Pediatrics (AAP) recommends that babies sleep on their backs on a flat, firm sleep surface without any loose bedding, pillows, bumpers, or soft toys. Room-sharing without bed-sharing is recommended for at least the first six months. Avoid exposing the baby to secondhand smoke and ensure they do not overheat.",
        "source_url": "https://www.aap.org",
        "source_name": "AAP",
        "category": "newborn",
        "tags": ["safe-sleep", "sids", "newborn-care"],
        "baby_age_months": [0, 1, 2, 3, 4, 5, 6],
        "ai_confidence_score": 0.97,
        "status": "published",
        "published_at": datetime.now(timezone.utc),
    }
]

def seed():
    # Init Firebase Admin SDK
    if not firebase_admin._apps:
        # Use default credentials or environment fallback
        try:
            firebase_admin.initialize_app()
        except ValueError:
            print("Could not initialize Firebase Admin. Please verify GOOGLE_APPLICATION_CREDENTIALS environment variable.")
            return

    db = firestore.client()
    col_ref = db.collection("knowledge_articles")

    print("🌱 Seeding initial approved articles to Firestore...")
    for art in SEED_ARTICLES:
        # Check if already exists
        docs = col_ref.where("title", "==", art["title"]).stream()
        if any(docs):
            print(f"⚠️ Article '{art['title']}' already exists. Skipping.")
            continue
            
        col_ref.add(art)
        print(f"✅ Seeded: '{art['title']}'")
    print("🎉 Seeding complete!")

if __name__ == "__main__":
    seed()

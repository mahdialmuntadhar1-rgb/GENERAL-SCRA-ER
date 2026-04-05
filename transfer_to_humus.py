"""
Data Pipeline: Transfer cleaned Iraqi business data from 18-AGENTS to HUMUS database
"""

import requests
import json

# Source: 18-AGENTS database (where scraper saves data)
SOURCE_SUPABASE_URL = "https://mxxaxhrtccomkazpvthn.supabase.co"
SOURCE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGF4aHJ0Y2NvbWthenB2dGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyNDk5MSwiZXhwIjoyMDg4ODAwOTkxfQ.KtZfSdvLe0EKBQRf9m7UyXBDTTYaOUGs-ZoWtHoxHpI"

# Target: HUMUS frontend database
TARGET_SUPABASE_URL = "https://hsadukhmcclwixuntqwu.supabase.co"
TARGET_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4MzM2OCwiZXhwIjoyMDg4NjU5MzY4fQ.2YpuPKrlv4jQNG-5dDlnzWzFqjqRbO_bxXksWh4PRZY"


def get_source_businesses():
    """Fetch all businesses from 18-AGENTS database"""
    url = f"{SOURCE_SUPABASE_URL}/rest/v1/businesses?select=*&limit=1000"
    headers = {
        "apikey": SOURCE_SERVICE_KEY,
        "Authorization": f"Bearer {SOURCE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error fetching from source: {response.status_code}")
        print(response.text)
        return []


def clean_and_transform(business):
    """Clean and transform business data for HUMUS format"""
    return {
        "id": business.get("id") or business.get("fsq_id"),
        "name": business.get("name"),
        "name_ar": business.get("name_ar") or business.get("local_name"),
        "name_ku": business.get("name_ku"),
        "category": business.get("category") or business.get("foursquare_category") or "Restaurant",
        "subcategory": business.get("subcategory") or business.get("user_category"),
        "governorate": business.get("governorate") or business.get("city"),
        "city": business.get("city"),
        "address": business.get("address"),
        "phone": business.get("phone"),
        "website": business.get("website"),
        "latitude": business.get("latitude"),
        "longitude": business.get("longitude"),
        "rating": business.get("rating") or 4.0,
        "review_count": business.get("review_count") or 0,
        "verified": business.get("verified") or business.get("data_quality") == "osm",
        "image_url": business.get("image_url"),
        "description": business.get("description"),
        "description_ar": business.get("description_ar"),
        "status": business.get("status") or "active",
        "whatsapp": business.get("whatsapp"),
        "tags": business.get("tags", [])
    }


def insert_to_target(businesses, batch_size=50):
    """Insert businesses into HUMUS database"""
    url = f"{TARGET_SUPABASE_URL}/rest/v1/businesses"
    headers = {
        "apikey": TARGET_SERVICE_KEY,
        "Authorization": f"Bearer {TARGET_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"  # Handle duplicates
    }
    
    total = len(businesses)
    success_count = 0
    error_count = 0
    
    for i in range(0, total, batch_size):
        batch = businesses[i:i+batch_size]
        
        response = requests.post(url, headers=headers, json=batch)
        
        if response.status_code in [200, 201]:
            success_count += len(batch)
            print(f"✅ Batch {i//batch_size + 1}: Inserted {len(batch)} businesses")
        else:
            error_count += len(batch)
            print(f"❌ Batch {i//batch_size + 1}: Error {response.status_code}")
            print(response.text[:200])
    
    return success_count, error_count


def run_pipeline():
    """Main pipeline function"""
    print("=" * 60)
    print("🚀 IRAQI BUSINESS DATA PIPELINE")
    print("18-AGENTS → HUMUS Database Transfer")
    print("=" * 60)
    
    # Step 1: Fetch from source
    print("\n📥 Step 1: Fetching businesses from 18-AGENTS...")
    businesses = get_source_businesses()
    print(f"   Found {len(businesses)} businesses")
    
    if not businesses:
        print("❌ No businesses to transfer. Exiting.")
        return
    
    # Step 2: Clean and transform
    print("\n🧹 Step 2: Cleaning and transforming data...")
    cleaned = [clean_and_transform(b) for b in businesses]
    print(f"   Cleaned {len(cleaned)} businesses")
    
    # Step 3: Insert to target
    print("\n📤 Step 3: Transferring to HUMUS database...")
    success, errors = insert_to_target(cleaned)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TRANSFER COMPLETE")
    print("=" * 60)
    print(f"✅ Successfully transferred: {success}")
    print(f"❌ Errors: {errors}")
    print(f"📈 Total: {success + errors}")
    
    if success > 0:
        print("\n🎉 Data is now in HUMUS database!")
        print("   Refresh: https://humuplus.vercel.app")


if __name__ == "__main__":
    run_pipeline()

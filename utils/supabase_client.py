"""
Supabase integration for immediate data persistence.
Handles upsert operations for businesses, contacts, and social links.
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    print("Warning: supabase package not installed. Run: pip install supabase")
    create_client = None
    Client = None

@dataclass
class SupabaseConfig:
    url: str
    anon_key: str
    service_key: Optional[str] = None

class SupabaseManager:
    """Manages Supabase operations for immediate data persistence."""
    
    def __init__(self, config: Optional[SupabaseConfig] = None):
        if config is None:
            config = self._load_from_env()
        
        if create_client is None:
            raise ImportError("supabase package is required. Install with: pip install supabase")
            
        self.client: Client = create_client(config.url, config.anon_key)
        self.service_key = config.service_key
        
    def _load_from_env(self) -> SupabaseConfig:
        """Load Supabase configuration from environment variables."""
        url = os.getenv("SCRAPER_SUPABASE_URL")
        anon_key = os.getenv("SCRAPER_SUPABASE_KEY")
        service_key = os.getenv("SCRAPER_SUPABASE_SERVICE_KEY")
        
        if not url or not anon_key:
            raise ValueError(
                "Missing required environment variables: "
                "SCRAPER_SUPABASE_URL and SCRAPER_SUPABASE_KEY"
            )
            
        return SupabaseConfig(url=url, anon_key=anon_key, service_key=service_key)
    
    async def upsert_business(self, business: Dict[str, Any]) -> Dict[str, Any]:
        """
        Upsert a business record to the businesses table.
        Returns the upserted record.
        """
        try:
            # Prepare the business data
            business_data = {
                "name": business.get("name"),
                "name_en": business.get("name_en"),
                "name_ar": business.get("name_ar"),
                "name_ku": business.get("name_ku"),
                "address": business.get("address"),
                "city": business.get("city"),
                "governorate": business.get("governorate"),
                "lat": business.get("latitude"),
                "lng": business.get("longitude"),
                "category": business.get("category"),
                "subcategory": business.get("subcategory"),
                "website": business.get("website"),
                "email": business.get("email"),
                "phone": business.get("phone"),
                "facebook": business.get("facebook"),
                "instagram": business.get("instagram"),
                "whatsapp": business.get("whatsapp"),
                "description": business.get("description"),
                "data_quality": business.get("data_quality", "osm"),
                "source": business.get("source", "scraper"),
                "external_id": business.get("external_id"),
                "raw_data": business.get("raw_data"),
                "_status": business.get("_status", "needs_review"),
            }
            
            # Remove None values
            business_data = {k: v for k, v in business_data.items() if v is not None}
            
            # Upsert using external_id as the conflict key
            response = self.client.table("businesses").upsert(
                business_data,
                on_conflict="external_id",
                returning="*"
            ).execute()
            
            return response.data[0] if response.data else {}
            
        except Exception as e:
            print(f"Error upserting business {business.get('name', 'unknown')}: {e}")
            return {}
    
    async def upsert_contact(self, business_id: str, contact: Dict[str, Any]) -> Dict[str, Any]:
        """
        Upsert a contact record linked to a business.
        """
        try:
            contact_data = {
                "business_id": business_id,
                "type": contact.get("type", "general"),
                "name": contact.get("name"),
                "title": contact.get("title"),
                "phone": contact.get("phone"),
                "email": contact.get("email"),
                "department": contact.get("department"),
                "is_primary": contact.get("is_primary", False),
            }
            
            # Remove None values
            contact_data = {k: v for k, v in contact_data.items() if v is not None}
            
            response = self.client.table("contacts").upsert(
                contact_data,
                on_conflict="business_id,type",
                returning="*"
            ).execute()
            
            return response.data[0] if response.data else {}
            
        except Exception as e:
            print(f"Error upserting contact for business {business_id}: {e}")
            return {}
    
    async def upsert_social_link(self, business_id: str, social: Dict[str, Any]) -> Dict[str, Any]:
        """
        Upsert a social media link record linked to a business.
        """
        try:
            social_data = {
                "business_id": business_id,
                "platform": social.get("platform"),
                "url": social.get("url"),
                "handle": social.get("handle"),
                "followers_count": social.get("followers_count"),
                "verified": social.get("verified", False),
                "last_checked": social.get("last_checked"),
            }
            
            # Remove None values
            social_data = {k: v for k, v in social_data.items() if v is not None}
            
            response = self.client.table("social_links").upsert(
                social_data,
                on_conflict="business_id,platform",
                returning="*"
            ).execute()
            
            return response.data[0] if response.data else {}
            
        except Exception as e:
            print(f"Error upserting social link for business {business_id}: {e}")
            return {}
    
    async def save_business_complete(self, business: Dict[str, Any]) -> bool:
        """
        Save a complete business record with all related data.
        Returns True if successful, False otherwise.
        """
        try:
            # Upsert the main business record
            business_result = await self.upsert_business(business)
            if not business_result:
                return False
            
            business_id = business_result.get("id")
            if not business_id:
                print(f"No ID returned for business: {business.get('name', 'unknown')}")
                return False
            
            # Extract and save contacts from raw_data if present
            raw_data = business.get("raw_data", {})
            if isinstance(raw_data, dict):
                contacts = raw_data.get("contacts", [])
                if isinstance(contacts, list):
                    for contact in contacts:
                        await self.upsert_contact(business_id, contact)
            
            # Save social media links
            social_platforms = [
                {"platform": "facebook", "url": business.get("facebook")},
                {"platform": "instagram", "url": business.get("instagram")},
                {"platform": "whatsapp", "url": business.get("whatsapp")},
            ]
            
            for social in social_platforms:
                if social.get("url"):
                    await self.upsert_social_link(business_id, social)
            
            return True
            
        except Exception as e:
            print(f"Error saving complete business record: {e}")
            return False
    
    async def batch_save_businesses(self, businesses: List[Dict[str, Any]], batch_size: int = 10) -> Dict[str, int]:
        """
        Save multiple businesses in batches.
        Returns a dictionary with success/failure counts.
        """
        results = {"success": 0, "failed": 0}
        
        for i in range(0, len(businesses), batch_size):
            batch = businesses[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.save_business_complete(business) for business in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, bool) and result:
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    if isinstance(result, Exception):
                        print(f"Batch save error: {result}")
            
            # Small delay between batches to avoid rate limiting
            if i + batch_size < len(businesses):
                await asyncio.sleep(0.1)
        
        return results

# Global instance for immediate use
_supabase_manager: Optional[SupabaseManager] = None

def get_supabase_manager() -> SupabaseManager:
    """Get or create the global Supabase manager instance."""
    global _supabase_manager
    if _supabase_manager is None:
        _supabase_manager = SupabaseManager()
    return _supabase_manager

async def save_business_immediately(business: Dict[str, Any]) -> bool:
    """
    Convenience function to save a business immediately.
    This is the main function to call from the scraper pipeline.
    """
    manager = get_supabase_manager()
    return await manager.save_business_complete(business)

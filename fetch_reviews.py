import json
import os
import requests

# Configuration
# Tip: Get a free API key from serpapi.com and add it here or as a GitHub Secret
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "YOUR_FREE_SERPAPI_KEY_HERE")
SEARCH_QUERY = "Roots Rum Shack, Newland Ave, Hull"

def fetch_live_reviews():
    print("🔍 Dialling into Google Maps API network...")
    search_url = "https://serpapi.com/search.json"
    
    # Phase 1: Search for the venue to lock onto its unique Google Data ID token
    search_params = {
        "engine": "google_maps",
        "q": SEARCH_QUERY,
        "api_key": SERPAPI_KEY,
        "type": "search"
    }
    
    try:
        search_res = requests.get(search_url, params=search_params)
        search_res.raise_for_status()
        search_data = search_res.json()
        
        # Pull the unique map identifier data_id safely
        local_results = search_data.get("local_results", [{}])
        data_id = local_results[0].get("data_id") or search_data.get("place_results", {}).get("data_id")
        
        if not data_id:
            print("⚠️ Venue found, but unique Google Data ID token could not be resolved.")
            return
            
        print(f"🎯 Target confirmed (Data ID: {data_id}). Querying user review feed...")
        
        # Phase 2: Fetch the live reviews ordered by newest drops
        review_params = {
            "engine": "google_maps_reviews",
            "data_id": data_id,
            "api_key": SERPAPI_KEY,
            "sort_by": "newest"
        }
        
        review_res = requests.get(search_url, params=review_params)
        review_res.raise_for_status()
        review_payload = review_res.json()
        
        raw_reviews = review_payload.get("reviews", [])
        print(f"✅ Harvested {len(raw_reviews)} live user feedback records.")
        
        # Phase 3: Transform raw metrics to match our dashboard arrays perfectly
        formatted_reviews = []
        for rev in raw_reviews[:10]: # Filter down to the latest 10 reviews
            review_text = rev.get("snippet", "")
            lower_text = review_text.lower()
            
            # Simple algorithmic tagging engine to feed your sentiment word cloud matrix
            tags = []
            if any(w in lower_text for w in ["food", "jerk", "chicken", "curry", "mutton", "balls", "wrap"]): 
                tags.append("food")
            if any(w in lower_text for w in ["drink", "rum", "punch", "cocktail", "zombie", "pint", "stripe"]): 
                tags.append("drinks")
            if any(w in lower_text for w in ["service", "staff", "friendly", "team", "waiter"]): 
                tags.append("service")
            if any(w in lower_text for w in ["vibe", "music", "reggae", "playlist", "atmosphere", "styling"]): 
                tags.append("vibe")
            if any(w in lower_text for w in ["slow", "long"]): 
                tags.append("slow")
            if any(w in lower_text for w in ["value", "cheap", "deal", "price"]): 
                tags.append("value")
                
            formatted_reviews.append({
                "author": rev.get("user", {}).get("name", "Guest Reviewer"),
                "rating": int(rev.get("rating", 5)),
                "source": "Google",
                "date": rev.get("date", "Just recently"),
                "text": review_text if review_text else "Left a rating only.",
                "tags": tags if tags else ["vibe"] # Default baseline fall-back tag
            })
            
        # Write the transformed state out to your hosted asset file
        output_file = "reviews_data.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(formatted_reviews, f, indent=4, ensure_ascii=False)
            
        print(f"🎉 Stream sync complete! Live metrics pushed cleanly into {output_file}")
        
    except Exception as e:
        print(f"❌ Automation engine exception: {str(e)}")

if __name__ == "__main__":
    fetch_live_reviews()

"""
Simple data population script using the existing API
This populates the database by making search requests with ingest=True
"""
import asyncio
import httpx
from tqdm import tqdm

# Categories to populate
CATEGORIES = [
    "ocean sunset", "mountain landscape", "city architecture",
    "forest nature", "beach waves", "desert dunes",
    "waterfall", "northern lights", "tropical paradise",
    "urban street", "modern building", "vintage car",
    "food photography", "abstract art", "wildlife animals",
    "flowers garden", "space galaxy", "underwater coral"
]

API_BASE = "http://localhost:8000"


async def populate_category(client: httpx.AsyncClient, category: str, per_page: int = 30):
    """Populate database with images from a category."""
    try:
        response = await client.post(
            f"{API_BASE}/search",
            json={
                "query": category,
                "ingest": True,
                "top_k": 10,
                "per_page": per_page
            },
            timeout=60.0
        )
        
        if response.status_code == 200:
            data = response.json()
            ingested = len(data.get("ingested", []))
            results = len(data.get("results", []))
            return {
                "category": category,
                "ingested": ingested,
                "results": results,
                "success": True
            }
        else:
            return {
                "category": category,
                "error": f"HTTP {response.status_code}",
                "success": False
            }
    except Exception as e:
        return {
            "category": category,
            "error": str(e),
            "success": False
        }


async def main():
    """Main population function."""
    print("🚀 Starting simple data population...")
    print(f"📊 Categories: {len(CATEGORIES)}")
    print(f"📦 Images per category: ~30")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        # Check backend connection
        try:
            health = await client.get(f"{API_BASE}/health", timeout=5.0)
            if health.status_code != 200:
                print("❌ Backend not responding!")
                return
            print("✅ Backend connected\n")
        except Exception as e:
            print(f"❌ Cannot connect to backend: {e}")
            return
        
        total_ingested = 0
        total_results = 0
        failed = []
        
        # Process each category
        for category in tqdm(CATEGORIES, desc="Populating"):
            result = await populate_category(client, category)
            
            if result["success"]:
                total_ingested += result["ingested"]
                total_results += result["results"]
                print(f"  ✅ {category}: {result['ingested']} ingested, {result['results']} results")
            else:
                failed.append(result)
                print(f"  ❌ {category}: {result.get('error')}")
            
            # Small delay to avoid overwhelming the API
            await asyncio.sleep(1)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 POPULATION SUMMARY")
        print("=" * 60)
        print(f"✅ Total images ingested: {total_ingested}")
        print(f"📈 Total results: {total_results}")
        print(f"❌ Failed categories: {len(failed)}")
        
        if failed:
            print("\n⚠️  Failed categories:")
            for f in failed:
                print(f"  - {f['category']}: {f.get('error')}")
        
        # Get final stats
        try:
            stats = await client.get(f"{API_BASE}/stats", timeout=10.0)
            if stats.status_code == 200:
                data = stats.json()
                print(f"\n📈 Database Stats:")
                print(f"  Total vectors: {data.get('total_vectors', 0)}")
                print(f"  Dimension: {data.get('dimension', 0)}")
        except Exception as e:
            print(f"\n⚠️  Could not fetch stats: {e}")
        
        print("\n✅ Population complete!")
        print("\n💡 Now try searching for:")
        print("  - 'ocean sunset' (should show high scores)")
        print("  - 'mountain landscape' (should show high scores)")
        print("  - 'city architecture' (should show high scores)")


if __name__ == "__main__":
    asyncio.run(main())

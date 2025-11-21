"""
Data Population Script for Semantic Image Search
Indexes 500-1000 images across 15+ categories from Unsplash
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.settings import get_settings
from app.services.clip_service import CLIPService
from app.services.image_search_engine import ImageSearchEngine
from app.services.unsplash_fetcher import UnsplashFetcher
import httpx
from tqdm import tqdm
import time


# 15+ diverse categories for comprehensive coverage
CATEGORIES = [
    "nature",
    "architecture", 
    "food",
    "travel",
    "people",
    "animals",
    "technology",
    "fashion",
    "sports",
    "art",
    "business",
    "health",
    "education",
    "transportation",
    "music",
    "wallpapers",
    "textures-patterns",
    "experimental",
]


async def populate_database(
    images_per_category: int = 50,
    total_target: int = 1000,
    batch_size: int = 10
):
    """
    Populate the database with images from multiple categories.
    
    Args:
        images_per_category: Number of images to fetch per category
        total_target: Total target number of images
        batch_size: Number of images to process in parallel
    """
    settings = get_settings()
    
    # Initialize services
    clip_service = CLIPService()
    search_engine = ImageSearchEngine(settings, clip_service)
    unsplash_fetcher = UnsplashFetcher(settings)
    
    print(f"🚀 Starting data population...")
    print(f"📊 Target: {total_target} images across {len(CATEGORIES)} categories")
    print(f"📦 Batch size: {batch_size}")
    print(f"=" * 60)
    
    total_indexed = 0
    category_stats = {}
    failed_images = []
    start_time = time.time()
    
    for category in CATEGORIES:
        print(f"\n📁 Processing category: {category.upper()}")
        category_start = time.time()
        
        try:
            # Fetch images from Unsplash
            photos = await unsplash_fetcher.search_photos(
                query=category,
                per_page=images_per_category
            )
            
            if not photos:
                print(f"⚠️  No photos found for category: {category}")
                category_stats[category] = {"indexed": 0, "failed": 0}
                continue
            
            print(f"✅ Fetched {len(photos)} photos from Unsplash")
            
            # Process in batches
            indexed_count = 0
            failed_count = 0
            
            for i in tqdm(range(0, len(photos), batch_size), desc="Indexing"):
                batch = photos[i:i + batch_size]
                
                for photo in batch:
                    try:
                        # Extract metadata
                        image_url = photo.get("urls", {}).get("regular")
                        thumbnail_url = photo.get("urls", {}).get("small")
                        
                        if not image_url:
                            failed_count += 1
                            continue
                        
                        metadata = {
                            "image_url": image_url,
                            "thumbnail_url": thumbnail_url,
                            "photographer": photo.get("user", {}).get("name"),
                            "photographer_profile": photo.get("user", {}).get("links", {}).get("html"),
                            "description": photo.get("description") or photo.get("alt_description"),
                            "category": category,
                            "tags": [tag.get("title") for tag in photo.get("tags", [])[:5]],
                            "color": photo.get("color"),
                            "width": photo.get("width"),
                            "height": photo.get("height"),
                        }
                        
                        # Generate embedding and index
                        embedding = await clip_service.encode_image_from_url(image_url)
                        vector_id = f"{category}_{photo.get('id')}"
                        
                        await search_engine.index_image(
                            vector_id=vector_id,
                            embedding=embedding,
                            metadata=metadata
                        )
                        
                        indexed_count += 1
                        total_indexed += 1
                        
                    except Exception as e:
                        failed_count += 1
                        failed_images.append({
                            "category": category,
                            "photo_id": photo.get("id"),
                            "error": str(e)
                        })
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)
            
            category_time = time.time() - category_start
            category_stats[category] = {
                "indexed": indexed_count,
                "failed": failed_count,
                "time": category_time
            }
            
            print(f"✅ Category '{category}': {indexed_count} indexed, {failed_count} failed ({category_time:.2f}s)")
            
            # Check if we've reached target
            if total_indexed >= total_target:
                print(f"\n🎯 Reached target of {total_target} images!")
                break
                
        except Exception as e:
            print(f"❌ Error processing category '{category}': {e}")
            category_stats[category] = {"indexed": 0, "failed": 0, "error": str(e)}
    
    total_time = time.time() - start_time
    
    # Print summary
    print(f"\n{'=' * 60}")
    print(f"📊 POPULATION SUMMARY")
    print(f"{'=' * 60}")
    print(f"✅ Total images indexed: {total_indexed}")
    print(f"❌ Total failures: {len(failed_images)}")
    print(f"⏱️  Total time: {total_time:.2f}s")
    print(f"⚡ Average speed: {total_indexed / total_time:.2f} images/sec")
    print(f"\n📁 Category Breakdown:")
    
    for category, stats in category_stats.items():
        if "error" in stats:
            print(f"  ❌ {category}: ERROR - {stats['error']}")
        else:
            print(f"  ✅ {category}: {stats['indexed']} indexed, {stats['failed']} failed")
    
    if failed_images:
        print(f"\n⚠️  Failed images: {len(failed_images)}")
        print("First 5 failures:")
        for fail in failed_images[:5]:
            print(f"  - {fail['category']}/{fail['photo_id']}: {fail['error']}")
    
    # Get final stats from Pinecone
    try:
        stats = await search_engine.get_stats()
        print(f"\n📈 Database Stats:")
        print(f"  Total vectors: {stats.get('total_vectors', 0)}")
        print(f"  Dimension: {stats.get('dimension', 0)}")
    except Exception as e:
        print(f"⚠️  Could not fetch database stats: {e}")
    
    print(f"\n✅ Data population complete!")


async def verify_database():
    """Verify database contents and perform sample searches."""
    settings = get_settings()
    clip_service = CLIPService(settings)
    search_engine = ImageSearchEngine(settings, clip_service)
    
    print("\n🔍 Verifying database...")
    
    # Get stats
    stats = await search_engine.get_stats()
    print(f"📊 Total vectors: {stats.get('total_vectors', 0)}")
    
    # Perform test searches
    test_queries = [
        "beautiful sunset over mountains",
        "modern architecture building",
        "delicious food photography",
        "cute animals in nature",
        "technology and innovation"
    ]
    
    print(f"\n🧪 Running {len(test_queries)} test searches...")
    
    for query in test_queries:
        try:
            embedding = await clip_service.encode_text(query)
            results = await search_engine.search(embedding, top_k=3)
            
            print(f"\n  Query: '{query}'")
            print(f"  Results: {len(results)}")
            if results:
                top_score = results[0].get("score", 0)
                print(f"  Top score: {top_score:.4f}")
        except Exception as e:
            print(f"  ❌ Error: {e}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Populate semantic search database")
    parser.add_argument("--images-per-category", type=int, default=50, help="Images per category")
    parser.add_argument("--total-target", type=int, default=1000, help="Total target images")
    parser.add_argument("--batch-size", type=int, default=10, help="Batch processing size")
    parser.add_argument("--verify", action="store_true", help="Verify database after population")
    
    args = parser.parse_args()
    
    # Run population
    asyncio.run(populate_database(
        images_per_category=args.images_per_category,
        total_target=args.total_target,
        batch_size=args.batch_size
    ))
    
    # Verify if requested
    if args.verify:
        asyncio.run(verify_database())

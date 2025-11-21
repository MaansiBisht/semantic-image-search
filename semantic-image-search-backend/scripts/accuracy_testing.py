"""
Accuracy Testing and Threshold Tuning Script
Tests search accuracy and helps tune similarity thresholds
"""
import asyncio
import sys
from pathlib import Path
from typing import List, Dict, Tuple
import json
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.settings import get_settings
from app.services.clip_service import CLIPService
from app.services.image_search_engine import ImageSearchEngine
import numpy as np


# Test queries with expected categories for validation
TEST_QUERIES = [
    {"query": "sunset over ocean", "expected_categories": ["nature", "wallpapers", "travel"]},
    {"query": "modern skyscraper", "expected_categories": ["architecture", "business"]},
    {"query": "delicious pizza", "expected_categories": ["food"]},
    {"query": "cute puppy", "expected_categories": ["animals", "people"]},
    {"query": "laptop and coffee", "expected_categories": ["technology", "business", "food"]},
    {"query": "yoga pose", "expected_categories": ["health", "people", "sports"]},
    {"query": "mountain landscape", "expected_categories": ["nature", "travel", "wallpapers"]},
    {"query": "street fashion", "expected_categories": ["fashion", "people"]},
    {"query": "abstract painting", "expected_categories": ["art", "wallpapers", "experimental"]},
    {"query": "concert crowd", "expected_categories": ["music", "people"]},
    {"query": "vintage car", "expected_categories": ["transportation", "travel"]},
    {"query": "classroom learning", "expected_categories": ["education", "people"]},
    {"query": "geometric patterns", "expected_categories": ["textures-patterns", "art", "wallpapers"]},
    {"query": "running athlete", "expected_categories": ["sports", "people", "health"]},
    {"query": "city at night", "expected_categories": ["architecture", "travel", "wallpapers"]},
]


class AccuracyTester:
    def __init__(self):
        self.settings = get_settings()
        self.clip_service = CLIPService(self.settings)
        self.search_engine = ImageSearchEngine(self.settings, self.clip_service)
        self.results = []
    
    async def test_query(
        self,
        query: str,
        expected_categories: List[str],
        top_k: int = 10
    ) -> Dict:
        """Test a single query and evaluate results."""
        try:
            # Perform search
            embedding = await self.clip_service.encode_text(query)
            results = await self.search_engine.search(embedding, top_k=top_k)
            
            if not results:
                return {
                    "query": query,
                    "success": False,
                    "error": "No results returned",
                    "scores": [],
                    "categories_found": []
                }
            
            # Extract scores and categories
            scores = [r.get("score", 0) for r in results]
            categories_found = [r.get("metadata", {}).get("category") for r in results]
            
            # Calculate metrics
            avg_score = np.mean(scores)
            max_score = max(scores)
            min_score = min(scores)
            std_score = np.std(scores)
            
            # Check category accuracy
            matching_categories = sum(
                1 for cat in categories_found 
                if cat in expected_categories
            )
            category_accuracy = matching_categories / len(results) if results else 0
            
            # Check if any expected category appears in top 3
            top_3_categories = categories_found[:3]
            has_expected_in_top_3 = any(
                cat in expected_categories 
                for cat in top_3_categories
            )
            
            return {
                "query": query,
                "success": True,
                "expected_categories": expected_categories,
                "categories_found": categories_found,
                "matching_categories": matching_categories,
                "category_accuracy": category_accuracy,
                "has_expected_in_top_3": has_expected_in_top_3,
                "scores": {
                    "avg": float(avg_score),
                    "max": float(max_score),
                    "min": float(min_score),
                    "std": float(std_score),
                    "all": [float(s) for s in scores]
                },
                "num_results": len(results)
            }
            
        except Exception as e:
            return {
                "query": query,
                "success": False,
                "error": str(e),
                "scores": [],
                "categories_found": []
            }
    
    async def run_all_tests(self, top_k: int = 10) -> Dict:
        """Run all test queries and compile results."""
        print(f"🧪 Running accuracy tests on {len(TEST_QUERIES)} queries...")
        print(f"📊 Top-K: {top_k}")
        print("=" * 60)
        
        all_results = []
        
        for i, test_case in enumerate(TEST_QUERIES, 1):
            print(f"\n[{i}/{len(TEST_QUERIES)}] Testing: '{test_case['query']}'")
            
            result = await self.test_query(
                test_case["query"],
                test_case["expected_categories"],
                top_k
            )
            
            all_results.append(result)
            
            if result["success"]:
                print(f"  ✅ Score range: {result['scores']['min']:.4f} - {result['scores']['max']:.4f}")
                print(f"  📊 Avg score: {result['scores']['avg']:.4f} (±{result['scores']['std']:.4f})")
                print(f"  🎯 Category accuracy: {result['category_accuracy']:.2%}")
                print(f"  🏆 Expected in top-3: {'Yes' if result['has_expected_in_top_3'] else 'No'}")
            else:
                print(f"  ❌ Error: {result.get('error')}")
        
        # Calculate overall statistics
        successful_tests = [r for r in all_results if r["success"]]
        
        if not successful_tests:
            print("\n❌ No successful tests!")
            return {"success": False, "results": all_results}
        
        overall_stats = {
            "total_tests": len(TEST_QUERIES),
            "successful_tests": len(successful_tests),
            "failed_tests": len(TEST_QUERIES) - len(successful_tests),
            "avg_category_accuracy": np.mean([r["category_accuracy"] for r in successful_tests]),
            "top_3_hit_rate": sum(r["has_expected_in_top_3"] for r in successful_tests) / len(successful_tests),
            "avg_score": np.mean([r["scores"]["avg"] for r in successful_tests]),
            "avg_max_score": np.mean([r["scores"]["max"] for r in successful_tests]),
            "avg_min_score": np.mean([r["scores"]["min"] for r in successful_tests]),
            "score_distribution": self._analyze_score_distribution(successful_tests)
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 ACCURACY TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Successful tests: {overall_stats['successful_tests']}/{overall_stats['total_tests']}")
        print(f"🎯 Average category accuracy: {overall_stats['avg_category_accuracy']:.2%}")
        print(f"🏆 Top-3 hit rate: {overall_stats['top_3_hit_rate']:.2%}")
        print(f"\n📈 Score Statistics:")
        print(f"  Average score: {overall_stats['avg_score']:.4f}")
        print(f"  Average max score: {overall_stats['avg_max_score']:.4f}")
        print(f"  Average min score: {overall_stats['avg_min_score']:.4f}")
        
        print(f"\n📊 Score Distribution:")
        for threshold, percentage in overall_stats['score_distribution'].items():
            print(f"  {threshold}: {percentage:.2%}")
        
        # Recommend thresholds
        recommendations = self._recommend_thresholds(overall_stats)
        print(f"\n💡 THRESHOLD RECOMMENDATIONS:")
        print(f"  Excellent match (>= {recommendations['excellent']:.3f})")
        print(f"  Good match (>= {recommendations['good']:.3f})")
        print(f"  Fair match (>= {recommendations['fair']:.3f})")
        print(f"  Minimum threshold: {recommendations['minimum']:.3f}")
        
        return {
            "success": True,
            "overall_stats": overall_stats,
            "recommendations": recommendations,
            "detailed_results": all_results,
            "timestamp": datetime.now().isoformat()
        }
    
    def _analyze_score_distribution(self, results: List[Dict]) -> Dict[str, float]:
        """Analyze the distribution of similarity scores."""
        all_scores = []
        for r in results:
            all_scores.extend(r["scores"]["all"])
        
        if not all_scores:
            return {}
        
        total = len(all_scores)
        return {
            ">= 0.9": sum(1 for s in all_scores if s >= 0.9) / total,
            ">= 0.8": sum(1 for s in all_scores if s >= 0.8) / total,
            ">= 0.7": sum(1 for s in all_scores if s >= 0.7) / total,
            ">= 0.6": sum(1 for s in all_scores if s >= 0.6) / total,
            ">= 0.5": sum(1 for s in all_scores if s >= 0.5) / total,
            "< 0.5": sum(1 for s in all_scores if s < 0.5) / total,
        }
    
    def _recommend_thresholds(self, stats: Dict) -> Dict[str, float]:
        """Recommend similarity thresholds based on test results."""
        avg_max = stats["avg_max_score"]
        avg_score = stats["avg_score"]
        avg_min = stats["avg_min_score"]
        
        # Calculate recommended thresholds
        excellent = avg_max * 0.95  # Top 5% of max scores
        good = avg_score * 1.1  # 10% above average
        fair = avg_score * 0.9  # 10% below average
        minimum = max(avg_min * 1.2, 0.5)  # 20% above min, but at least 0.5
        
        return {
            "excellent": excellent,
            "good": good,
            "fair": fair,
            "minimum": minimum
        }
    
    async def save_results(self, results: Dict, filename: str = "accuracy_test_results.json"):
        """Save test results to file."""
        output_path = Path(__file__).parent / filename
        
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Results saved to: {output_path}")


async def main():
    """Run accuracy testing."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test search accuracy and tune thresholds")
    parser.add_argument("--top-k", type=int, default=10, help="Number of results to retrieve")
    parser.add_argument("--save", action="store_true", help="Save results to file")
    
    args = parser.parse_args()
    
    tester = AccuracyTester()
    results = await tester.run_all_tests(top_k=args.top_k)
    
    if args.save and results["success"]:
        await tester.save_results(results)


if __name__ == "__main__":
    asyncio.run(main())

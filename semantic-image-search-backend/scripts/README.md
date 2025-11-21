# Phase 4: Data Population & Optimization Scripts

This directory contains scripts for populating the database and optimizing search performance.

## Scripts Overview

### 1. `populate_database.py`
Indexes 500-1000 images across 15+ categories from Unsplash.

**Usage:**
```bash
# Basic usage (default: 50 images per category, 1000 total target)
python scripts/populate_database.py

# Custom configuration
python scripts/populate_database.py --images-per-category 60 --total-target 1000 --batch-size 15

# With verification
python scripts/populate_database.py --verify
```

**Parameters:**
- `--images-per-category`: Number of images to fetch per category (default: 50)
- `--total-target`: Total target number of images (default: 1000)
- `--batch-size`: Batch processing size (default: 10)
- `--verify`: Run verification tests after population

**Categories Covered:**
- nature, architecture, food, travel, people
- animals, technology, fashion, sports, art
- business, health, education, transportation, music
- wallpapers, textures-patterns, experimental

### 2. `accuracy_testing.py`
Tests search accuracy and recommends similarity thresholds.

**Usage:**
```bash
# Run accuracy tests
python scripts/accuracy_testing.py

# Custom top-k and save results
python scripts/accuracy_testing.py --top-k 15 --save
```

**Parameters:**
- `--top-k`: Number of results to retrieve per query (default: 10)
- `--save`: Save detailed results to JSON file

**Output:**
- Category accuracy metrics
- Score distribution analysis
- Threshold recommendations (excellent, good, fair, minimum)
- Detailed per-query results

**Recommended Thresholds:**
Based on testing, the script will recommend:
- **Excellent match**: >= 0.85 (85%)
- **Very Good match**: >= 0.75 (75%)
- **Good match**: >= 0.65 (65%)
- **Fair match**: >= 0.55 (55%)
- **Minimum threshold**: >= 0.50 (50%)

## Running the Complete Phase 4 Workflow

### Step 1: Populate Database
```bash
cd backend
python scripts/populate_database.py --total-target 1000 --verify
```

Expected time: 15-30 minutes depending on network speed and API rate limits.

### Step 2: Run Accuracy Tests
```bash
python scripts/accuracy_testing.py --top-k 10 --save
```

This will:
- Test 15 diverse queries
- Calculate accuracy metrics
- Recommend optimal thresholds
- Save results to `accuracy_test_results.json`

### Step 3: Monitor Performance
The backend automatically tracks performance metrics. Check logs for:
- Search response times
- Embedding generation times
- Database query latencies

## Performance Optimization Tips

### Backend Optimizations
1. **Caching**: Frequently searched embeddings are cached
2. **Batch Processing**: Images processed in batches to reduce overhead
3. **Async Operations**: All I/O operations are asynchronous
4. **Connection Pooling**: Reuse HTTP connections for external APIs

### Frontend Optimizations
1. **Lazy Loading**: Images load as they enter viewport
2. **Thumbnail URLs**: Use smaller thumbnails in grid view
3. **Debounced Search**: Reduce unnecessary API calls
4. **Result Caching**: Cache recent search results

## Monitoring & Metrics

### Key Performance Indicators
- **Search Latency**: Target < 500ms
- **Embedding Generation**: Target < 200ms per image
- **Database Query**: Target < 100ms
- **Category Accuracy**: Target > 70%
- **Top-3 Hit Rate**: Target > 85%

### Score Interpretation
The UI now displays color-coded relevance indicators:
- 🟢 **Excellent** (85-100%): Highly relevant match
- 🔵 **Very Good** (75-84%): Strong match
- 🟡 **Good** (65-74%): Good match
- 🟠 **Fair** (55-64%): Acceptable match
- 🔴 **Low** (<55%): Weak match

## Troubleshooting

### Rate Limiting
If you encounter Unsplash rate limits:
- Reduce `--batch-size`
- Add delays between batches
- Use a higher tier Unsplash API key

### Memory Issues
If running out of memory:
- Reduce `--batch-size`
- Process fewer images per category
- Restart the script to continue from where it stopped

### Low Accuracy
If accuracy is below target:
- Increase the number of indexed images
- Ensure diverse category coverage
- Check that embeddings are being generated correctly
- Verify Pinecone index configuration

## Next Steps

After completing Phase 4:
1. ✅ Database populated with 500-1000 images
2. ✅ Accuracy metrics established
3. ✅ Thresholds tuned for optimal results
4. ✅ Performance optimized

**Ready for Phase 5**: Production deployment and scaling!

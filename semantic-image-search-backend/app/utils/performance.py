"""
Performance optimization utilities for backend
"""
import time
import functools
from typing import Callable, Any
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


def timing_decorator(func: Callable) -> Callable:
    """Decorator to measure function execution time."""
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        start = time.time()
        try:
            result = await func(*args, **kwargs)
            elapsed = time.time() - start
            logger.info(f"{func.__name__} took {elapsed:.3f}s")
            return result
        except Exception as e:
            elapsed = time.time() - start
            logger.error(f"{func.__name__} failed after {elapsed:.3f}s: {e}")
            raise
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        start = time.time()
        try:
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            logger.info(f"{func.__name__} took {elapsed:.3f}s")
            return result
        except Exception as e:
            elapsed = time.time() - start
            logger.error(f"{func.__name__} failed after {elapsed:.3f}s: {e}")
            raise
    
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper


@asynccontextmanager
async def performance_monitor(operation_name: str):
    """Context manager for monitoring operation performance."""
    start = time.time()
    logger.info(f"Starting: {operation_name}")
    
    try:
        yield
    finally:
        elapsed = time.time() - start
        logger.info(f"Completed: {operation_name} in {elapsed:.3f}s")


class PerformanceMetrics:
    """Track and report performance metrics."""
    
    def __init__(self):
        self.metrics = {}
    
    def record(self, operation: str, duration: float):
        """Record a performance metric."""
        if operation not in self.metrics:
            self.metrics[operation] = {
                "count": 0,
                "total_time": 0,
                "min_time": float('inf'),
                "max_time": 0,
                "avg_time": 0
            }
        
        m = self.metrics[operation]
        m["count"] += 1
        m["total_time"] += duration
        m["min_time"] = min(m["min_time"], duration)
        m["max_time"] = max(m["max_time"], duration)
        m["avg_time"] = m["total_time"] / m["count"]
    
    def get_report(self) -> dict:
        """Get performance report."""
        return self.metrics
    
    def reset(self):
        """Reset all metrics."""
        self.metrics = {}


# Global metrics instance
metrics = PerformanceMetrics()


import asyncio

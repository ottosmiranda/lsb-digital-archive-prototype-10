
import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Percentage of container height to trigger load (default: 70)
  rootMargin?: string; // Intersection observer root margin
  enabled?: boolean; // Enable/disable infinite scroll
}

export const useInfiniteScroll = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 70,
  rootMargin = '100px',
  enabled = true
}: UseInfiniteScrollProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTriggerRef = useRef<number>(0);

  // Throttle function to prevent excessive calls
  const throttledLoadMore = useCallback(() => {
    const now = Date.now();
    if (now - lastTriggerRef.current > 1000) { // Throttle to max 1 call per second
      lastTriggerRef.current = now;
      onLoadMore();
    }
  }, [onLoadMore]);

  const handleScroll = useCallback(() => {
    if (!enabled || loading || !hasMore || !containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate scroll percentage
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight * 100;

    if (scrollPercentage >= threshold) {
      console.log(`📜 Infinite scroll triggered at ${scrollPercentage.toFixed(1)}%`);
      throttledLoadMore();
    }
  }, [enabled, loading, hasMore, threshold, throttledLoadMore]);

  // Intersection Observer for the loading element
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading && enabled) {
      console.log('📜 Infinite scroll triggered by intersection observer');
      throttledLoadMore();
    }
  }, [hasMore, loading, enabled, throttledLoadMore]);

  // Set up intersection observer
  useEffect(() => {
    const element = loadingRef.current;
    if (!element || !enabled) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0,
      rootMargin
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin, enabled]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, enabled]);

  return { 
    loadingRef, 
    containerRef,
    // Utility function to check if should show loading skeleton
    shouldShowLoading: hasMore && (loading || !enabled)
  };
};

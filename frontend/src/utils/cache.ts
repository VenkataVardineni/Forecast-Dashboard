import { ForecastQuery, ForecastResponse } from '../types';

interface CacheEntry {
  data: ForecastResponse;
  timestamp: number;
}

class ForecastCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 50; // Maximum number of cached entries
  private ttl: number = 5 * 60 * 1000; // 5 minutes TTL

  private getKey(query: ForecastQuery): string {
    return `${query.model}_${query.horizon}_${query.fold_id || 'default'}_${query.overlay_mode || false}`;
  }

  get(query: ForecastQuery): ForecastResponse | null {
    const key = this.getKey(query);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(query: ForecastQuery, data: ForecastResponse): void {
    const key = this.getKey(query);

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const forecastCache = new ForecastCache();


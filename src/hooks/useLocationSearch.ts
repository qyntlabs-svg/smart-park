import { useState, useEffect, useRef } from "react";

export interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY as string;

// Simple in-memory cache to avoid duplicate API calls
const cache = new Map<string, LocationSuggestion[]>();

export const useLocationSearch = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Debounce 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Check cache first
      if (cache.has(trimmed)) {
        setSuggestions(cache.get(trimmed)!);
        return;
      }

      // Cancel previous in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsSearching(true);
      setError(null);

      try {
        const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(trimmed)}&limit=5&format=json&countrycodes=in`;
        const res = await fetch(url, { signal: abortRef.current.signal });

        if (!res.ok) throw new Error("Search failed");

        const data: LocationSuggestion[] = await res.json();
        cache.set(trimmed, data);
        setSuggestions(data);
      } catch (err: any) {
        if (err.name === "AbortError") return; // cancelled — ignore
        setError("Search unavailable. Try again.");
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    setError(null);
  };

  return { query, setQuery, suggestions, isSearching, error, clear };
};

export const reverseGeocode = async (
  lat: number,
  lon: number,
): Promise<string | null> => {
  try {
    const url = `https://api.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    return (
      addr?.suburb ??
      addr?.neighbourhood ??
      addr?.village ??
      addr?.town ??
      addr?.city ??
      data.display_name?.split(",")[0] ??
      null
    );
  } catch {
    return null;
  }
};

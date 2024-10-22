import { useState } from "react";
import type { INatObservation } from "~/lib/i-naturalist";
import { fetchObservations, calculateBoundingBox } from "~/lib/i-naturalist";
import LocationPicker from "~/components/LocationPicker.client";

const MAX_RADIUS = 5000; // 5km
const DEFAULT_RADIUS = 1000; // 1km
const PER_PAGE = 200;

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function ObservationsPage() {
  const [username, setUsername] = useState("");
  const [observations, setObservations] = useState<INatObservation[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [page, setPage] = useState(1);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username && !location) return;

    setLoading(true);
    setError(null);
    setPage(1);
    
    try {
      const searchParams: Parameters<typeof fetchObservations>[0] = {
        username,
        searchLocation: location, // For distance calculation
        page: 1
      };
      
      if (location) {
        searchParams.boundingBox = calculateBoundingBox(
          location.lat,
          location.lng,
          radius
        );
      }

      const data = await fetchObservations(searchParams);
      setObservations(data.observations);
      setTotalResults(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch observations');
      setObservations([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }

  async function loadPage(newPage: number) {
    if (loading || (!username && !location)) return;

    setLoading(true);
    setError(null);
    
    try {
      const searchParams: Parameters<typeof fetchObservations>[0] = {
        username,
        searchLocation: location,
        page: newPage
      };
      
      if (location) {
        searchParams.boundingBox = calculateBoundingBox(
          location.lat,
          location.lng,
          radius
        );
      }

      const data = await fetchObservations(searchParams);
      setObservations(data.observations);
      setPage(newPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch observations');
    } finally {
      setLoading(false);
    }
  }

  const handleLocationChange = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) {
      setLocation(null);
    } else {
      setLocation({ lat, lng });
    }
  };

  const totalPages = Math.ceil(totalResults / PER_PAGE);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">iNaturalist Observations</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter iNaturalist username (optional)"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading || (!username && !location)}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700">
            Search Location {location && '(Selected)'}
          </label>
          <LocationPicker onLocationChange={handleLocationChange} />
        </div>

        {location && (
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">
              Search Radius: {formatDistance(radius)}
            </label>
            <input
              type="range"
              min="100"
              max={MAX_RADIUS}
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>100m</span>
              <span>{formatDistance(MAX_RADIUS)}</span>
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="text-red-600 mb-4">
          Error: {error}
        </div>
      )}

      {observations.length > 0 && (
        <>
          <div className="mb-4 text-gray-600">
            Showing {observations.length} of {totalResults} observations
            {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
          </div>

          <div className="space-y-4">
            {observations.map((obs) => (
              <div key={obs.id} className="border rounded-lg p-4">
                <div className="flex gap-4">
                  {obs.photos.length > 0 && (
                    <div className="flex-shrink-0">
                      <img 
                        src={obs.photos[0].medium_url} 
                        alt={obs.species_guess}
                        className="w-48 h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">{obs.species_guess}</h2>
                    <p className="text-gray-600">Observed on: {obs.observed_on}</p>
                    <p className="text-gray-600">Location: {obs.place_guess}</p>
                    {obs.distanceMeters !== undefined && (
                      <p className="text-gray-600">
                        Distance: {formatDistance(obs.distanceMeters)}
                      </p>
                    )}
                    {obs.description && (
                      <p className="text-gray-700 mt-2">{obs.description}</p>
                    )}
                    {obs.photos.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Photo: {obs.photos[0].attribution}
                      </p>
                    )}
                  </div>
                </div>
                {obs.photos.length > 1 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {obs.photos.slice(1).map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.small_url}
                        alt={obs.species_guess}
                        className="h-24 w-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => loadPage(page - 1)}
                disabled={loading || page === 1}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadPage(page + 1)}
                disabled={loading || page === totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !error && observations.length === 0 && (
        <p className="text-gray-600">
          Enter a username and/or select a location to search for observations.
        </p>
      )}
    </div>
  );
}
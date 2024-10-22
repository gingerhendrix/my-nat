import { useState } from "react";
import type { INatObservation } from "~/lib/i-naturalist";
import { fetchUserObservations } from "~/lib/i-naturalist";

export default function ObservationsPage() {
  const [username, setUsername] = useState("");
  const [observations, setObservations] = useState<INatObservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchUserObservations(username);
      setObservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch observations');
      setObservations([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">iNaturalist Observations</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter iNaturalist username"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-600 mb-4">
          Error: {error}
        </div>
      )}

      {observations.length > 0 && (
        <div className="space-y-4">
          {observations.map((obs) => (
            <div key={obs.id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold">{obs.species_guess}</h2>
              <p className="text-gray-600">Observed on: {obs.observed_on}</p>
              <p className="text-gray-600">Location: {obs.place_guess}</p>
              {obs.photos.length > 0 && obs.photos[0].url && (
                <img 
                  src={obs.photos[0].thumbnail_url || obs.photos[0].url} 
                  alt={obs.species_guess}
                  className="mt-2 rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && observations.length === 0 && (
        <p className="text-gray-600">
          Enter a username to see their iNaturalist observations.
        </p>
      )}
    </div>
  );
}
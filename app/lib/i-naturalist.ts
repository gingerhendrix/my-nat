export interface INatPhoto {
  id: number;
  attribution: string;
  license_code: string;
  square_url: string;
  thumb_url: string;
  small_url: string;
  medium_url: string;
  large_url: string;
}

export interface INatObservation {
  id: number;
  species_guess: string;
  observed_on: string;
  description: string;
  uri?: string;
  place_guess: string;
  latitude?: number;
  longitude?: number;
  quality_grade: string;
  photos: INatPhoto[];
}

export interface BoundingBox {
  swlat: number;
  swlng: number;
  nelat: number;
  nelng: number;
}

const BASE_URL = 'https://www.inaturalist.org';

// Convert center point and radius to bounding box
export function calculateBoundingBox(lat: number, lng: number, radiusMeters: number): BoundingBox {
  // Rough approximation: 1 degree of latitude = 111,111 meters
  const latDelta = (radiusMeters / 111111);
  // Longitude degrees per meter varies with latitude
  const lngDelta = (radiusMeters / (111111 * Math.cos(lat * Math.PI / 180)));

  return {
    swlat: lat - latDelta,
    swlng: lng - lngDelta,
    nelat: lat + latDelta,
    nelng: lng + lngDelta
  };
}

export interface SearchParams {
  username?: string;
  boundingBox?: BoundingBox;
}

export async function fetchObservations(params: SearchParams): Promise<INatObservation[]> {
  const searchParams = new URLSearchParams();
  
  if (params.boundingBox) {
    searchParams.append('swlat', params.boundingBox.swlat.toString());
    searchParams.append('swlng', params.boundingBox.swlng.toString());
    searchParams.append('nelat', params.boundingBox.nelat.toString());
    searchParams.append('nelng', params.boundingBox.nelng.toString());
  }

  // Construct the URL based on whether we have a username
  const endpoint = params.username 
    ? `/observations/${params.username}.json` 
    : '/observations.json';
    
  const url = `${BASE_URL}${endpoint}${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Keeping this for backward compatibility
export async function fetchUserObservations(username: string): Promise<INatObservation[]> {
  return fetchObservations({ username });
}
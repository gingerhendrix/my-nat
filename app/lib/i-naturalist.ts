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
  distanceMeters?: number;
}

export interface BoundingBox {
  swlat: number;
  swlng: number;
  nelat: number;
  nelng: number;
}

const BASE_URL = 'https://www.inaturalist.org';
const PER_PAGE = 200;

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
}

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
  searchLocation?: {
    lat: number;
    lng: number;
  };
  page?: number;
}

export interface SearchResponse {
  observations: INatObservation[];
  total: number;
  page: number;
}

export async function fetchObservations(params: SearchParams): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('per_page', PER_PAGE.toString());
  searchParams.append('page', (params.page || 1).toString());
  
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

  const totalCount = Number(response.headers.get('X-Total-Entries') || 0);
  let observations = await response.json();

  // Calculate distances if search location is provided
  if (params.searchLocation) {
    observations = observations
      .map((obs: INatObservation) => {
        if (obs.latitude && obs.longitude) {
          return {
            ...obs,
            distanceMeters: calculateDistance(
              params.searchLocation!.lat,
              params.searchLocation!.lng,
              obs.latitude,
              obs.longitude
            )
          };
        }
        return obs;
      })
      .sort((a: INatObservation, b: INatObservation) => 
        (a.distanceMeters || Infinity) - (b.distanceMeters || Infinity)
      );
  }

  return {
    observations,
    total: totalCount,
    page: params.page || 1
  };
}
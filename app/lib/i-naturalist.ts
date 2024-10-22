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

const BASE_URL = 'https://www.inaturalist.org';

export async function fetchUserObservations(username: string): Promise<INatObservation[]> {
  const response = await fetch(
    `${BASE_URL}/observations/${username}.json`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
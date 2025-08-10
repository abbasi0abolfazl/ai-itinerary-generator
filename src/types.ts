export interface RequestPayload {
  destination: string;
  durationDays: number;
}

export interface Env {
  FIREBASE_API_KEY: string;
  LLM_API_KEY: string;
}

export interface Activity {
  time: 'Morning' | 'Afternoon' | 'Evening';
  description: string;
  location: string;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  activities: Activity[];
}

export interface Itinerary {
  status: 'processing' | 'completed' | 'failed';
  destination: string;
  durationDays: number;
  createdAt: any; // Firestore Timestamp
  completedAt: any | null; // Firestore Timestamp or null
  itinerary: any[];
  error: string | null;
  createdBy: string;
}
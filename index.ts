import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const template = `
You are a professional travel planner AI.
Your task is to generate a JSON itinerary for a trip based on the following input:
- Destination: {destination}
- Duration in days: {durationDays}
The output must be in valid JSON format, structured exactly like this:
[
  {
    "day": 1,
    "theme": "<daily theme>",
    "activities": [
      { "time": "Morning", "description": "<short description>", "location": "<location name>" },
      { "time": "Afternoon", "description": "<short description>", "location": "<location name>" },
      { "time": "Evening", "description": "<short description>", "location": "<location name>" }
    ]
  },
  ...
]
Requirements:
- The number of days must exactly match the durationDays.
- Each day must have a unique theme related to the destination.
- Each day includes three activities: morning, afternoon, evening.
- Activities should reflect local culture, landmarks, cuisine, or nature.
- Do not include flights, hotels, or transportation.
- Output only valid JSON. No explanations.
`;

interface Itinerary {
  status: 'processing' | 'completed' | 'failed';
  destination: string;
  durationDays: number;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  itinerary: any[];
  error: string | null;
}

async function processItinerary(jobId: string, destination: string, durationDays: number, db: any, env: Env) {
  console.log(`Starting itinerary processing for jobId: ${jobId}`);
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', 
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: template
              .replace('{destination}', destination)
              .replace('{durationDays}', durationDays.toString()),
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.LLM_API_KEY}`,
        },
      }
    );

    const itineraryData = JSON.parse(response.data.choices[0].message.content);
    console.log(`Itinerary generated for jobId: ${jobId}`, itineraryData);

    await setDoc(
      doc(collection(db, 'itineraries'), jobId),
      {
        status: 'completed',
        itinerary: itineraryData,
        completedAt: Timestamp.now(),
        error: null,
      },
      { merge: true }
    );
    console.log(`Firestore updated to completed for jobId: ${jobId}`);
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate itinerary';
    console.error(`Error processing itinerary for jobId: ${jobId}`, errorMessage);
    await setDoc(
      doc(collection(db, 'itineraries'), jobId),
      {
        status: 'failed',
        completedAt: Timestamp.now(),
        error: errorMessage,
      },
      { merge: true }
    );
    console.error(`Firestore updated to failed for jobId: ${jobId}`);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { destination, durationDays } = await request.json();
      if (!destination || !Number.isInteger(durationDays) || durationDays < 1) {
        return new Response('Invalid input', { status: 400 });
      }

      const jobId = uuidv4();
      console.log(`Received request for jobId: ${jobId}, destination: ${destination}, durationDays: ${durationDays}`);

      const app = initializeApp({
        apiKey: env.FIREBASE_API_KEY,
        authDomain: 'ai-itinerary-generator-925cc.firebaseapp.com',
        projectId: 'ai-itinerary-generator-925cc',
        storageBucket: 'ai-itinerary-generator-925cc.firebasestorage.app',
        messagingSenderId: '688972929720',
        appId: '1:688972929720:web:f218762da17ec7b3d5b24d',
      });
      const auth = getAuth(app);
      await signInAnonymously(auth);
      const db = getFirestore(app);

      const itinerary: Itinerary = {
        status: 'processing',
        destination,
        durationDays,
        createdAt: Timestamp.now(),
        completedAt: null,
        itinerary: [],
        error: null,
      };
      await setDoc(doc(collection(db, 'itineraries'), jobId), itinerary);
      console.log(`Firestore initial document created for jobId: ${jobId}`);

      ctx.waitUntil(processItinerary(jobId, destination, durationDays, db, env));

      return new Response(JSON.stringify({ jobId }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error in fetch handler:', error.message);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

interface Env {
  FIREBASE_API_KEY: string;
  LLM_API_KEY: string;
}
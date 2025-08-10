import { initializeFirebase } from './firebase';
import { itineraryPrompt } from './prompt';
import { errorResponse, validateEnv } from './utils';
import { RequestPayload, Env, Itinerary } from './types';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { processItinerary } from './itinerary';

interface Itinerary {
  status: 'processing' | 'completed' | 'failed';
  destination: string;
  durationDays: number;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  itinerary: any[];
  error: string | null;
}
export async function validateInput(destination: string, durationDays: number): Promise<string | null> {
  if (typeof destination !== 'string' || destination.trim().length === 0 || destination.length > 100) {
    return 'Destination must be a non-empty string (max 100 characters)';
  }
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 30) {
    return 'DurationDays must be an integer between 1 and 30';
  }
  return null;
}


export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const envError = validateEnv(env);
    if (envError) {
      return errorResponse(`Environment error: ${envError}`, 500);
    }
    if (request.method !== 'POST') {
      return errorResponse('Method Not Allowed', 405);
    }
    try {
      const { destination, durationDays } = (await request.json()) as RequestPayload;
      const validationError = await validateInput(destination, durationDays);
      if (validationError) {
        return errorResponse(validationError, 400);
      }
      const jobId = uuidv4();
      console.log(`Received request for jobId: ${jobId}, destination: ${destination.trim()}, durationDays: ${durationDays}`);
      const { auth, db } = initializeFirebase(env);
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      const itinerary: Itinerary = {
        status: 'processing',
        destination,
        durationDays,
        createdAt: Timestamp.now(),
        completedAt: null,
        itinerary: [],
        error: null,
        createdBy: uid,
      };
      await setDoc(doc(collection(db, 'itineraries'), jobId), itinerary);
      console.log(`Firestore initial document created for jobId: ${jobId}`);
      ctx.waitUntil(processItinerary(jobId, destination, durationDays, db, env, itineraryPrompt));
      return new Response(JSON.stringify({ jobId }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error in fetch handler:', error.message);
      return errorResponse('Internal Server Error', 500);
    }
  },
};
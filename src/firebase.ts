import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Env } from './types';


export function initializeFirebase(env: Env) {
  const app = initializeApp({
    apiKey: env.FIREBASE_API_KEY, 
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    storageBucket: 'your-project.firebasestorage.app',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456',
  });
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
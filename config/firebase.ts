import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyChS5nD2kJE_xaM2JVrim0qn6PFi2o5VZQ',
  authDomain: 'flex-pay-and-meal-swap.firebaseapp.com',
  projectId: 'flex-pay-and-meal-swap',
  storageBucket: 'flex-pay-and-meal-swap.firebasestorage.app',
  messagingSenderId: '869284923376',
  appId: '1:869284923376:web:dd3605fc089b2022217f35',
  measurementId: 'G-JWN5470RJK',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: any;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;

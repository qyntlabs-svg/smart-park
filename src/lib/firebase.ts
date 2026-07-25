import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCMx3r2mxvm4ppsP_WRwQk1wpRdDk9XGK4",
  authDomain: "parking-app-fdd8f.firebaseapp.com",
  projectId: "parking-app-fdd8f",
  storageBucket: "parking-app-fdd8f.firebasestorage.app",
  messagingSenderId: "114804433021",
  appId: "1:114804433021:web:baaba1458e7acaf571d114",
};

// Initialize only once
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messagingInstance: Messaging | null = null;

const getMessagingInstance = async (): Promise<Messaging | null> => {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
};

export { app, getMessagingInstance, getToken, onMessage };

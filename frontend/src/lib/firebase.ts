import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

declare global {
  interface Window {
    __WILDBOOK_CONFIG__?: {
      publicEnv?: Record<string, string>;
    };
  }
}

function readRequiredPublicEnv(name: string): string {
  const value = window.__WILDBOOK_CONFIG__?.publicEnv?.[name]?.trim();
  if (!value) {
    throw new Error(`Missing frontend runtime config: ${name}`);
  }
  return value;
}

function readFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: readRequiredPublicEnv("BUN_PUBLIC_FIREBASE_API_KEY"),
    authDomain: readRequiredPublicEnv("BUN_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: readRequiredPublicEnv("BUN_PUBLIC_FIREBASE_PROJECT_ID"),
    appId: readRequiredPublicEnv("BUN_PUBLIC_FIREBASE_APP_ID"),
  };
}

const firebaseConfig = readFirebaseConfig();

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

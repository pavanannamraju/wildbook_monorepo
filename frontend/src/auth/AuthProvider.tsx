import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  User,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { firebaseAuth, googleAuthProvider } from "../lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  token: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  signupWithEmailPassword: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    return onIdTokenChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const idToken = await nextUser.getIdToken();
        setToken(idToken);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      token,
      loginWithGoogle: async () => {
        await signInWithPopup(firebaseAuth, googleAuthProvider as GoogleAuthProvider);
      },
      loginWithEmailPassword: async (email: string, password: string) => {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      },
      signupWithEmailPassword: async (email: string, password: string, fullName: string) => {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const sanitizedFullName = fullName.trim();
        if (sanitizedFullName.length > 0) {
          await updateProfile(credential.user, { displayName: sanitizedFullName });
          await credential.user.getIdToken(true);
        }
      },
      logout: async () => {
        await signOut(firebaseAuth);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchCurrentUser, type CurrentUser } from "../api/auth";
import { firebaseAuth, googleAuthProvider } from "../lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  token: string | null;
  /** MongoDB user profile (roles, avatar, etc.). Null when logged out or not yet loaded. */
  profile: CurrentUser | null;
  profileLoading: boolean;
  /** Push a freshly saved profile so consumers (navbar, etc.) update immediately. */
  setProfile: (profile: CurrentUser | null) => void;
  /** Re-fetch profile from the API. */
  refreshProfile: () => Promise<void>;
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
  const [profile, setProfileState] = useState<CurrentUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileFetchSeqRef = useRef(0);

  const setProfile = useCallback((next: CurrentUser | null) => {
    // Bump seq so any in-flight AuthProvider fetch cannot overwrite a local update.
    profileFetchSeqRef.current += 1;
    setProfileState(next);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    return onIdTokenChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setToken(null);
        profileFetchSeqRef.current += 1;
        setProfileState(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      try {
        const idToken = await nextUser.getIdToken();
        setToken(idToken);
      } catch {
        setToken(null);
        profileFetchSeqRef.current += 1;
        setProfileState(null);
        setProfileLoading(false);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user || !token) {
      profileFetchSeqRef.current += 1;
      setProfileState(null);
      setProfileLoading(false);
      return;
    }

    const controller = new AbortController();
    const seq = ++profileFetchSeqRef.current;
    setProfileLoading(true);
    fetchCurrentUser(controller.signal)
      .then((current) => {
        if (!controller.signal.aborted && seq === profileFetchSeqRef.current) {
          setProfileState(current);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted && seq === profileFetchSeqRef.current) {
          setProfileState(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && seq === profileFetchSeqRef.current) {
          setProfileLoading(false);
        }
      });

    return () => controller.abort();
  }, [token, user]);

  const refreshProfile = useCallback(async () => {
    if (!user || !token) {
      setProfile(null);
      return;
    }
    const seq = ++profileFetchSeqRef.current;
    setProfileLoading(true);
    try {
      const current = await fetchCurrentUser();
      if (seq === profileFetchSeqRef.current) {
        setProfileState(current);
      }
    } catch {
      if (seq === profileFetchSeqRef.current) {
        setProfileState(null);
      }
    } finally {
      if (seq === profileFetchSeqRef.current) {
        setProfileLoading(false);
      }
    }
  }, [setProfile, token, user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      token,
      profile,
      profileLoading,
      setProfile,
      refreshProfile,
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
        window.location.assign("/");
      },
    }),
    [loading, profile, profileLoading, refreshProfile, setProfile, token, user],
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

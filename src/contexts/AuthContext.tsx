
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, AuthState, AuthUser } from '@/services/authService';
import { userSettingsService } from '@/services/userSettingsService';
import type { Session } from '@supabase/supabase-js';

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: { session: Session | null; user: AuthUser | null } }
  | { type: 'SIGN_OUT' };

interface AuthContextType {
  state: AuthState;
  actions: {
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
  };
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSION':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.user,
        isAuthenticated: !!action.payload.session,
        isLoading: false
      };
    case 'SIGN_OUT':
      return {
        ...state,
        session: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        const user = authService.transformUser(session?.user || null);
        dispatch({ type: 'SET_SESSION', payload: { session, user } });
        
        // Migrate localStorage data when user first logs in
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(() => {
            userSettingsService.migrateLocalStorageToDatabase(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    authService.getCurrentSession().then(({ session }) => {
      const user = authService.transformUser(session?.user || null);
      dispatch({ type: 'SET_SESSION', payload: { session, user } });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { error } = await authService.signUp(email, password);
    if (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { error } = await authService.signIn(email, password);
    if (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
    dispatch({ type: 'SIGN_OUT' });
  };

  const value: AuthContextType = {
    state,
    actions: {
      signUp,
      signIn,
      signOut
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

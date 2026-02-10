import { create } from 'zustand';
import { auth, db, supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  
  initialize: async () => {
    try {
      // Get session from Supabase
      const { data: { session } } = await auth.getSession();
      
      if (session?.user) {
        // Get user data from auth (not from users table)
        const { data: { user } } = await auth.getUser();
        
        // Try to get additional profile data from users table
        let profileData = null;
        try {
          const { data: profile } = await db.getUser(user.id);
          profileData = profile;
        } catch (e) {
          // User doesn't have profile yet, that's OK
          console.log('No profile found, will create on first update');
        }
        
        // Merge auth user with profile data
        set({ 
          session, 
          user: {
            ...user,
            ...profileData,
            user_metadata: {
              ...user.user_metadata,
              ...profileData
            }
          },
          isLoading: false 
        });
      } else {
        set({ session: null, user: null, isLoading: false });
      }
    } catch (error) {
      console.error('Auth init error:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;
      
      // Get full user data
      const { data: { user } } = await auth.getUser();
      
      // Try to get profile
      let profileData = null;
      try {
        const { data: profile } = await db.getUser(user.id);
        profileData = profile;
      } catch (e) {}
      
      const mergedUser = {
        ...user,
        ...profileData,
        user_metadata: {
          ...user.user_metadata,
          ...profileData
        }
      };
      
      set({ user: mergedUser, session: data.session, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  signUp: async (email, password, displayName, botType) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await auth.signUp(email, password, {
        data: {
          display_name: displayName,
          bot_type: botType
        }
      });
      if (error) throw error;
      
      // Get full user data
      const { data: { user } } = await auth.getUser();
      
      set({ user, session: data.session, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  signOut: async () => {
    await auth.signOut();
    set({ user: null, session: null });
  },
  
  updateProfile: async (data) => {
    try {
      const userId = get().user?.id;
      if (!userId) throw new Error('Not authenticated');
      
      // Update in users table
      const { data: updated } = await db.updateUser(userId, data);
      
      // Update local state
      set((state) => ({
        user: {
          ...state.user,
          ...updated,
          user_metadata: {
            ...state.user?.user_metadata,
            ...updated
          }
        }
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  isAuthenticated: () => !!get().session,
  isBot: () => get().user?.user_metadata?.bot_type || get().user?.is_bot || false,
  isHuman: () => !get().user?.user_metadata?.bot_type && !get().user?.is_bot
}));

export default useAuthStore;

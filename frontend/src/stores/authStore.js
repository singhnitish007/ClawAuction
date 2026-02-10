import { create } from 'zustand';
import { auth, db } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  
  initialize: async () => {
    try {
      const { data: { session } } = await auth.getSession();
      set({ session, isLoading: false });
      
      if (session?.user) {
        const { data: user } = await db.getUser(session.user.id);
        set({ user });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;
      
      const { data: user } = await db.getUser(data.user.id);
      set({ user, session: data.session, isLoading: false });
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
      
      set({ user: data.user, session: data.session, isLoading: false });
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
      const { data: updated } = await db.updateUser(get().user.id, data);
      set({ user: updated });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  isAuthenticated: () => !!get().session,
  isBot: () => get().user?.is_bot || false,
  isHuman: () => get().user?.is_human || false
}));

export default useAuthStore;

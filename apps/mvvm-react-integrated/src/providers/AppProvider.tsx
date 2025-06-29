import { createStore } from '@web-loom/store-core';
import { QueryCore } from '@web-loom/query-core';
import { createContext, useContext } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
};

type AppStore = {
  isLoggedIn: boolean;
  user: User | null;
};

type AppActions = {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const store = createStore<AppStore, AppActions>(
  {
    isLoggedIn: false,
    user: null,
  },
  (set, get) => ({
    login: (user: User) => set((state) => ({ ...state, isLoggedIn: true, user })),
    logout: () => set((state) => ({ ...state, isLoggedIn: false, user: null })),
    updateUser: (user: Partial<User>) => {
      const currentUser = get().user;
      if (currentUser) {
        set((state) => ({ ...state, user: { ...currentUser, ...user } }));
      }
    },
  }),
);

const queryCore = new QueryCore({
  cacheProvider: 'localStorage', // Default for all endpoints
  defaultRefetchAfter: 5 * 60 * 1000, // Global default: refetch after 5 minutes
});

const AppContext = createContext<{
  store: typeof store;
  queryCore: QueryCore;
}>({
  store,
  queryCore,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <AppContext.Provider value={{ store, queryCore }}>{children}</AppContext.Provider>;
}

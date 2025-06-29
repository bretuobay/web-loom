import { QueryCore } from '@web-loom/query-core';
import { createStore } from '@web-loom/store-core';

// 1. Define your state interface
// interface CounterState {
//   count: number;
// }

// // 2. Define your actions interface
// interface CounterActions {
//   increment: () => void;
//   decrement: () => void;
//   add: (amount: number) => void;
// }

// // 3. Create the store
// const store = createStore<CounterState, CounterActions>(
//   { count: 0 }, // Initial state
//   (set, get, actions) => ({
//     increment: () => set((state) => ({ ...state, count: state.count + 1 })),
//     decrement: () => set((state) => ({ ...state, count: state.count - 1 })),
//     add: (amount: number) => set((state) => ({ ...state, count: state.count + amount })),
//   }),
// );

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
  updateUser: (user: Partial<User | null>) => void;
};

export const store = createStore<AppStore, AppActions>(
  {
    isLoggedIn: false,
    user: null,
  },
  (set, get, actions) => ({
    login: (user: User) => set({ isLoggedIn: true, user }),
    logout: () => set({ isLoggedIn: false, user: null }),
    updateUser: (user: Partial<User | null>) => {
      const currentUser = get().user;
      set({ user: { ...currentUser, ...user } });
    },
  }),
);

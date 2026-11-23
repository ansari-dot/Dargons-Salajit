import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'order' | 'delivery' | 'customer' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string; // ISO timestamp
  href?: string; // route to open when clicked
}

export interface NotificationsState {
  items: Notification[];
}

// Seed with a few notifications so the bell is immediately workable.
// In production, replace this initial state / add a fetch thunk backed by a notifications API.
const initialState: NotificationsState = {
  items: [
    {
      id: 'n1',
      type: 'order',
      title: 'New Order #ORD-2489',
      body: '$89.00 from Ali Raza · 2m ago',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
      href: '/orders',
    },
    {
      id: 'n2',
      type: 'delivery',
      title: 'Order #ORD-2488 Delivered',
      body: 'Shipped to Sara Khan · 12m ago',
      read: false,
      createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      href: '/orders',
    },
    {
      id: 'n3',
      type: 'customer',
      title: 'New customer registered',
      body: 'Ayesha Khan joined · 25m ago',
      read: true,
      createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
      href: '/customers',
    },
  ],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
    },
    markRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item && !item.read) item.read = true;
    },
    markAllRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  addNotification,
  markRead,
  markAllRead,
  removeNotification,
  clearNotifications,
  setNotifications,
} = notificationsSlice.actions;

export const selectNotifications = (state: { notifications: NotificationsState }) =>
  state.notifications.items;

export const selectUnreadCount = (state: { notifications: NotificationsState }) =>
  state.notifications.items.filter((i) => !i.read).length;

export default notificationsSlice.reducer;

import {configureStore} from '@reduxjs/toolkit';
import threadReducer from './thread/reducer';
import authReducer from './auth/reducer';
import transactionReducer from './transaction/reducer';
import usersReducer from './users/reducer';
import notificationReducer from './notification/reducer';
import profileReducer from './profile/reducer';

export const store = configureStore({
  reducer: {
    thread: threadReducer,
    auth: authReducer,
    transaction: transactionReducer,
    users: usersReducer,
    notification: notificationReducer,
    profile: profileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Increase tolerance thresholds to prevent warnings with large state
      serializableCheck: {
        // Increase the threshold to 200ms to prevent warnings with large state
        warnAfter: 200,
        // Ignore specific Redux paths that might contain large data
        ignoredPaths: ['profile.actions.data'],
      },
      // Increase immutability check threshold
      immutableCheck: {
        warnAfter: 200,
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

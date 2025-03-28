import {configureStore} from '@reduxjs/toolkit';
import threadReducer from './thread/reducer';
import authReducer from './auth/reducer';
import transactionReducer from './transaction/reducer';
import usersReducer from './users/reducer';
import notificationReducer from './notification/reducer';

export const store = configureStore({
  reducer: {
    thread: threadReducer,
    auth: authReducer,
    transaction: transactionReducer,
    users: usersReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

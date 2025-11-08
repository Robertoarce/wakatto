import { createStore, applyMiddleware, combineReducers } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer } from './reducers/authReducer';
import { conversationReducer } from './reducers/conversationReducer';
import { uiReducer } from './reducers/uiReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  conversations: conversationReducer,
  ui: uiReducer,
});

export const store = createStore(rootReducer, applyMiddleware(thunk));

export type RootState = ReturnType<typeof rootReducer>;
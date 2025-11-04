interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
};

export const authReducer = (state = initialState, action: any): AuthState => {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload.session, user: action.payload.user, loading: false };
    case 'SIGN_OUT':
      return { ...state, session: null, user: null, loading: false };
    default:
      return state;
  }
};

import { signOut as supabaseSignOut } from '../../services/supabaseService';

export const SET_SESSION = 'SET_SESSION';
export const SIGN_OUT = 'SIGN_OUT';
export const SET_LOADING = 'SET_LOADING';

export const setSession = (session: any, user: any) => ({
  type: SET_SESSION,
  payload: { session, user },
});

export const signOutAction = () => ({
  type: SIGN_OUT,
});

export const setLoading = (loading: boolean) => ({
  type: SET_LOADING,
  payload: loading,
});

// Async action to handle logout
export const logout = () => async (dispatch: any) => {
  try {
    await supabaseSignOut();
    dispatch(signOutAction());
  } catch (error) {
    console.error('Error signing out:', error);
    // Still dispatch sign out action to clear local state
    dispatch(signOutAction());
  }
};

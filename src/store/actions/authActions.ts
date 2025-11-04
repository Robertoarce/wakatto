export const SET_SESSION = 'SET_SESSION';
export const SIGN_OUT = 'SIGN_OUT';

export const setSession = (session: any, user: any) => ({
  type: SET_SESSION,
  payload: { session, user },
});

export const signOutAction = () => ({
  type: SIGN_OUT,
});

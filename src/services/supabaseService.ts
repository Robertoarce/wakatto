import { supabase, clearInvalidSession, isRefreshTokenError } from '../lib/supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(
  email: string,
  password: string,
  metadata?: { name?: string; phone?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://www.wakatto.com/reset-password',
  });
  if (error) throw error;
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      // Handle invalid refresh token by clearing corrupted session
      if (isRefreshTokenError(error)) {
        console.warn('[Auth] Invalid refresh token detected, clearing session');
        await clearInvalidSession();
        return null;
      }
      throw error;
    }
    return session;
  } catch (error) {
    // Catch any refresh token errors that happen during initialization
    if (isRefreshTokenError(error)) {
      console.warn('[Auth] Refresh token error caught, clearing session');
      await clearInvalidSession();
      return null;
    }
    throw error;
  }
}

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveConversation(userId: string, title: string, messages: any[]) {
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      { user_id: userId, title, messages, timestamp: new Date().toISOString() }
    ]);
  if (error) throw error;
  return data;
}

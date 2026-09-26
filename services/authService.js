import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export const getAuthRedirectUrl = (invitationToken) => Linking.createURL('auth/callback', invitationToken ? {
  queryParams: { invitationToken }
} : undefined);

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
};

export const signUp = async ({ email, password, fullName, whatsappNumber, invitationToken }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(invitationToken),
      data: { full_name: fullName, whatsapp_number: whatsappNumber || null }
    }
  });

  if (error) throw error;
  return data;
};

export const completeEmailConfirmation = async (code) => {
  if (!code) throw new Error('The confirmation link is missing its code');

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (userId, profile) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: profile.fullName,
      whatsapp_number: profile.whatsappNumber || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
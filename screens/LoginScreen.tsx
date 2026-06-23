/**
 * LoginScreen.tsx
 * FR03 — Login with UNT email or EUID + password
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const UNT_GREEN       = '#1A6E44';
const UNT_GREEN_LIGHT = '#E8F4EE';
const UNT_GREEN_DARK  = '#0F4A25';
const ERROR_RED       = '#C0392B';
const ERROR_RED_LIGHT = '#FDECEA';
const GRAY            = '#888888';
const BORDER          = '#C8E2D0';
const BG              = '#F7F9F7';

export default function LoginScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked,   setLocked]   = useState(false);

  async function handleLogin() {
    if (locked) {
      setError('Too many failed attempts. Please wait 5 minutes and try again.');
      return;
    }
    if (!email.trim()) { setError('Email or EUID is required.'); return; }
    if (!password)     { setError('Password is required.'); return; }

    setLoading(true);
    setError('');

    // Support EUID login by converting to UNT email format
    const loginEmail = email.trim().toLowerCase().includes('@')
      ? email.trim().toLowerCase()
      : `${email.trim().toLowerCase()}@my.unt.edu`;

    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
      setAttempts(0);
      navigation.navigate('Home');
    } catch (err: any) {
      console.log('LOGIN ERROR CODE:', err.code);
      console.log('LOGIN ERROR MSG:', err.message);

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Lock after 5 failed attempts (per FR03 / NFR Security)
      if (newAttempts >= 5) {
        setLocked(true);
        setTimeout(() => { setLocked(false); setAttempts(0); }, 5 * 60 * 1000);
        setError('Too many failed attempts. Account temporarily locked for 5 minutes.');
        setLoading(false);
        return;
      }

      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          setError('Invalid credentials. Please check your email/EUID and password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please wait and try again.');
          break;
        case 'auth/network-request-failed':
          setError('No internet connection. Please try again.');
          break;
        default:
          setError(`Error: ${err.code ?? 'unknown'}. Check terminal.`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🦅</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in with your UNT email or EUID.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>⚠ {error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>UNT Email or EUID</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="xyz1234@my.unt.edu or xyz1234"
            placeholderTextColor={GRAY}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Your password"
            placeholderTextColor={GRAY}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, (loading || locked) && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading || locked}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.ghostBtnText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: BG },
  flex:         { flex: 1 },
  scroll:       { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  iconWrap:     { alignItems: 'center', marginBottom: 12 },
  icon:         { fontSize: 56 },
  title:        { fontSize: 26, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 6 },
  subtitle:     { fontSize: 14, color: GRAY, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errorBox:     { backgroundColor: ERROR_RED_LIGHT, borderLeftWidth: 3, borderLeftColor: ERROR_RED, borderRadius: 6, padding: 12, marginBottom: 16 },
  errorBoxText: { fontSize: 13, color: ERROR_RED, lineHeight: 18 },
  label:        { fontSize: 12, color: GRAY, marginBottom: 4, marginTop: 12, fontWeight: '500' },
  input:        { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A', marginBottom: 2 },
  inputError:   { borderColor: ERROR_RED, backgroundColor: ERROR_RED_LIGHT },
  forgotBtn:    { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText:   { fontSize: 13, color: UNT_GREEN, fontWeight: '500' },
  btn:          { backgroundColor: UNT_GREEN, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  ghostBtn:     { borderWidth: 1.5, borderColor: UNT_GREEN, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  ghostBtnText: { color: UNT_GREEN, fontSize: 14, fontWeight: '500' },
});

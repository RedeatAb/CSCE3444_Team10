/**
 * SignUpScreen.tsx
 * FR01 — Registration
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  SignUp: undefined;
  Login: undefined;
  EUIDLinking: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
};

const UNT_GREEN       = '#1A6E44';
const UNT_GREEN_LIGHT = '#E8F4EE';
const UNT_GREEN_DARK  = '#0F4A25';
const ERROR_RED       = '#C0392B';
const ERROR_RED_LIGHT = '#FDECEA';
const GRAY            = '#888888';
const BORDER          = '#C8E2D0';
const BG              = '#F7F9F7';

function validate(fields: {
  firstName: string; lastName: string; email: string;
  password: string; confirmPassword: string;
}) {
  const errors = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };
  if (!fields.firstName.trim()) errors.firstName = 'First name is required.';
  if (!fields.lastName.trim())  errors.lastName  = 'Last name is required.';
  const emailTrimmed = fields.email.trim().toLowerCase();
  if (!emailTrimmed) {
    errors.email = 'Email is required.';
  } else if (!/^[a-z0-9._%+\-]+@my\.unt\.edu$/.test(emailTrimmed)) {
    errors.email = 'Must be a valid UNT email (e.g. xyz1234@my.unt.edu).';
  }
  if (!fields.password) {
    errors.password = 'Password is required.';
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export default function SignUpScreen({ navigation }: Props) {
  const [firstName,       setFirstName]       = useState('');
  const [lastName,        setLastName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  function clearError(field: keyof typeof errors) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  async function handleSignUp() {
    const errs = validate({ firstName, lastName, email, password, confirmPassword });
    setErrors(errs);
    if (Object.values(errs).some(e => e !== '')) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth, email.trim().toLowerCase(), password,
      );
      await updateProfile(cred.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });
      navigation.navigate('EUIDLinking');
    } catch (error: any) {
      // ── DEBUG: see exact Firebase error in Expo terminal ──
      console.log('🔴 SIGNUP ERROR CODE:', error.code);
      console.log('🔴 SIGNUP ERROR MSG:', error.message);

      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists. Try signing in.' }));
          break;
        case 'auth/weak-password':
          setErrors(prev => ({ ...prev, password: 'Password is too weak. Use at least 8 characters.' }));
          break;
        case 'auth/invalid-email':
          setErrors(prev => ({ ...prev, email: 'Email format is invalid.' }));
          break;
        case 'auth/network-request-failed':
          setErrors(prev => ({ ...prev, email: 'No internet connection. Please try again.' }));
          break;
        case 'auth/operation-not-allowed':
          setErrors(prev => ({ ...prev, email: 'Email sign-up is not enabled. Contact support.' }));
          break;
        case 'auth/too-many-requests':
          setErrors(prev => ({ ...prev, email: 'Too many attempts. Please wait and try again.' }));
          break;
        default:
          // Shows the real error code on screen so you can debug faster
          setErrors(prev => ({ ...prev, email: `Error: ${error.code ?? 'unknown'}. Check terminal.` }));
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up with your UNT email to get started.</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Use your <Text style={styles.infoBold}>@my.unt.edu</Text> email address to register.
            </Text>
          </View>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={[styles.input, errors.firstName ? styles.inputError : null]}
            placeholder="John" placeholderTextColor={GRAY}
            value={firstName} onChangeText={t => { setFirstName(t); clearError('firstName'); }}
            autoCapitalize="words" returnKeyType="next"
          />
          {errors.firstName ? <Text style={styles.errorText}>⚠ {errors.firstName}</Text> : null}

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={[styles.input, errors.lastName ? styles.inputError : null]}
            placeholder="Doe" placeholderTextColor={GRAY}
            value={lastName} onChangeText={t => { setLastName(t); clearError('lastName'); }}
            autoCapitalize="words" returnKeyType="next"
          />
          {errors.lastName ? <Text style={styles.errorText}>⚠ {errors.lastName}</Text> : null}

          <Text style={styles.label}>UNT Email Address</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="xyz1234@my.unt.edu" placeholderTextColor={GRAY}
            value={email} onChangeText={t => { setEmail(t); clearError('email'); }}
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="next"
          />
          {errors.email ? <Text style={styles.errorText}>⚠ {errors.email}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder="Min. 8 characters" placeholderTextColor={GRAY}
            value={password} onChangeText={t => { setPassword(t); clearError('password'); }}
            secureTextEntry returnKeyType="next"
          />
          {errors.password ? <Text style={styles.errorText}>⚠ {errors.password}</Text> : null}

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
            placeholder="Re-enter your password" placeholderTextColor={GRAY}
            value={confirmPassword} onChangeText={t => { setConfirmPassword(t); clearError('confirmPassword'); }}
            secureTextEntry returnKeyType="done" onSubmitEditing={handleSignUp}
          />
          {errors.confirmPassword ? <Text style={styles.errorText}>⚠ {errors.confirmPassword}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignUp} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Create account"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.ghostBtnText}>Already have an account? Sign In</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: BG },
  flex:         { flex: 1 },
  scroll:       { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  iconWrap:     { alignItems: 'center', marginBottom: 12 },
  icon:         { fontSize: 48 },
  title:        { fontSize: 24, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 6 },
  subtitle:     { fontSize: 14, color: GRAY, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  infoBox:      { backgroundColor: UNT_GREEN_LIGHT, borderLeftWidth: 3, borderLeftColor: UNT_GREEN, borderRadius: 6, padding: 12, marginBottom: 20 },
  infoText:     { fontSize: 13, color: UNT_GREEN_DARK, lineHeight: 18 },
  infoBold:     { fontWeight: '700' },
  label:        { fontSize: 12, color: GRAY, marginBottom: 4, marginTop: 12, fontWeight: '500' },
  input:        { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A', marginBottom: 2 },
  inputError:   { borderColor: ERROR_RED, backgroundColor: ERROR_RED_LIGHT },
  errorText:    { fontSize: 12, color: ERROR_RED, marginBottom: 4 },
  btn:          { backgroundColor: UNT_GREEN, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  ghostBtn:     { borderWidth: 1.5, borderColor: UNT_GREEN, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  ghostBtnText: { color: UNT_GREEN, fontSize: 14, fontWeight: '500' },
});

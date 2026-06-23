/**
 * ForgotPasswordScreen.tsx
 * FR04 — Forgot Password via EmailJS OTP + Firebase sendPasswordResetEmail
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import emailjs from '@emailjs/react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = { Login: undefined; ForgotPassword: undefined; };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>; };
type ScreenState = 'form' | 'otp' | 'success';

const SERVICE_ID  = 'service_wccm37x';
const TEMPLATE_ID = 'template_202imv3';
const PUBLIC_KEY  = '3BkZQfzyMNpNtRWyL';

const UNT_GREEN       = '#1A6E44';
const UNT_GREEN_LIGHT = '#E8F4EE';
const UNT_GREEN_DARK  = '#0F4A25';
const ERROR_RED       = '#C0392B';
const ERROR_RED_LIGHT = '#FDECEA';
const GRAY            = '#888888';
const BORDER          = '#C8E2D0';
const BG              = '#F7F9F7';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateUNTEmail(email: string): string | null {
  const t = email.trim().toLowerCase();
  if (!t) return 'Email is required.';
  if (!/^[a-z0-9._%+\-]+@my\.unt\.edu$/i.test(t)) return 'Must be a valid UNT email (e.g. xyz1234@my.unt.edu).';
  return null;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email,          setEmail]          = useState('');
  const [emailError,     setEmailError]     = useState('');
  const [otp,            setOtp]            = useState('');
  const [otpError,       setOtpError]       = useState('');
  const [generatedOtp,   setGeneratedOtp]   = useState('');
  const [screenState,    setScreenState]    = useState<ScreenState>('form');
  const [loading,        setLoading]        = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function startCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function sendOTP(toEmail: string): Promise<string> {
    const code = generateOTP();
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        accessToken: process.env.EXPO_PUBLIC_EMAILJS_ACCESS_TOKEN ?? '',
        template_params: {
          to_email: toEmail,
          to_name: toEmail.split('@')[0],
          name: toEmail.split('@')[0],
          otp_code: code,
          email: toEmail,
        },
      }),
    });
    if (response.status !== 200) {
      const text = await response.text();
      throw new Error(text);
    }
    return code;
  }

  async function handleSendOTP() {
    const err = validateUNTEmail(email);
    if (err) { setEmailError(err); return; }
    setLoading(true);
    try {
      const code = await sendOTP(email.trim().toLowerCase());
      setGeneratedOtp(code);
      setScreenState('otp');
      startCooldown();
    } catch (e) {
      Alert.alert('Error', 'Could not send OTP. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otp.trim()) { setOtpError('Please enter the OTP.'); return; }
    if (otp.trim() !== generatedOtp) { setOtpError('Incorrect OTP. Please try again.'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setScreenState('success');
    } catch (e) {
      Alert.alert('Error', 'Could not send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const code = await sendOTP(email.trim().toLowerCase());
      setGeneratedOtp(code);
      setOtp('');
      setOtpError('');
      startCooldown();
    } catch (e) {
      Alert.alert('Error', 'Could not resend OTP.');
    } finally {
      setLoading(false);
    }
  }

  if (screenState === 'form') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Sign In</Text>
            </TouchableOpacity>
            <View style={styles.iconWrap}><Text style={styles.icon}>🔑</Text></View>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>Enter your UNT email and we will send you a 6-digit verification code.</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Must be your <Text style={styles.infoBold}>@my.unt.edu</Text> address.
              </Text>
            </View>
            <Text style={styles.label}>UNT Email Address</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="xyz1234@my.unt.edu" placeholderTextColor={GRAY}
              value={email}
              onChangeText={t => { setEmail(t); if (emailError) setEmailError(''); }}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              returnKeyType="send" onSubmitEditing={handleSendOTP}
            />
            {emailError ? <Text style={styles.errorText}>⚠ {emailError}</Text> : null}
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSendOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Verification Code</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.ghostBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (screenState === 'otp') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.iconWrap}><Text style={styles.icon}>📧</Text></View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to:</Text>
            <Text style={styles.emailDisplay}>{email.trim().toLowerCase()}</Text>
            <Text style={styles.label}>Enter Verification Code</Text>
            <TextInput
              style={[styles.input, styles.otpInput, otpError ? styles.inputError : null]}
              placeholder="000000" placeholderTextColor={GRAY}
              value={otp}
              onChangeText={t => { setOtp(t); if (otpError) setOtpError(''); }}
              keyboardType="number-pad" maxLength={6} returnKeyType="done"
              onSubmitEditing={handleVerifyOTP}
            />
            {otpError ? <Text style={styles.errorText}>⚠ {otpError}</Text> : null}
            <Text style={styles.expiryNote}>Code expires in 10 minutes. Check spam if you do not see it.</Text>
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleVerifyOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Code</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ghostBtn, resendCooldown > 0 && styles.ghostBtnDisabled]}
              onPress={handleResend} disabled={loading || resendCooldown > 0}
            >
              <Text style={[styles.ghostBtnText, resendCooldown > 0 && styles.ghostBtnTextDisabled]}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't receive it? Resend"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => { setScreenState('form'); setOtp(''); setOtpError(''); }}>
              <Text style={styles.linkBtnText}>← Change email</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.successIconWrap}><Text style={styles.successIcon}>✅</Text></View>
        <Text style={styles.title}>Reset link sent!</Text>
        <Text style={styles.subtitle}>We sent a password reset link to:</Text>
        <Text style={styles.emailDisplay}>{email.trim().toLowerCase()}</Text>
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What to do next</Text>
          {[
            'Open the email from UNT FlexPay',
            'Tap the "Reset Password" link',
            'Set your new password',
            'Come back and sign in',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.expiryNote}>Link expires in 1 hour. Check spam if you do not see it.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                 { flex: 1, backgroundColor: BG },
  flex:                 { flex: 1 },
  scroll:               { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  backBtn:              { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 },
  backArrow:            { fontSize: 20, color: UNT_GREEN },
  backText:             { fontSize: 14, color: UNT_GREEN, fontWeight: '500' },
  iconWrap:             { alignItems: 'center', marginBottom: 16 },
  icon:                 { fontSize: 48 },
  title:                { fontSize: 22, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
  subtitle:             { fontSize: 14, color: GRAY, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  infoBox:              { backgroundColor: UNT_GREEN_LIGHT, borderLeftWidth: 3, borderLeftColor: UNT_GREEN, borderRadius: 6, padding: 12, marginBottom: 20 },
  infoText:             { fontSize: 13, color: UNT_GREEN_DARK, lineHeight: 18 },
  infoBold:             { fontWeight: '700' },
  label:                { fontSize: 12, color: GRAY, marginBottom: 6, fontWeight: '500' },
  input:                { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A', marginBottom: 4 },
  otpInput:             { fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 8 },
  inputError:           { borderColor: ERROR_RED, backgroundColor: ERROR_RED_LIGHT },
  errorText:            { fontSize: 12, color: ERROR_RED, marginBottom: 4 },
  btn:                  { backgroundColor: UNT_GREEN, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnDisabled:          { opacity: 0.6 },
  btnText:              { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  ghostBtn:             { borderWidth: 1.5, borderColor: UNT_GREEN, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  ghostBtnDisabled:     { borderColor: BORDER },
  ghostBtnText:         { color: UNT_GREEN, fontSize: 14, fontWeight: '500' },
  ghostBtnTextDisabled: { color: GRAY },
  linkBtn:              { alignItems: 'center', marginTop: 16 },
  linkBtnText:          { color: UNT_GREEN, fontSize: 13 },
  emailDisplay:         { fontSize: 14, fontWeight: '600', color: UNT_GREEN, textAlign: 'center', marginBottom: 20 },
  expiryNote:           { fontSize: 12, color: GRAY, textAlign: 'center', marginBottom: 8, fontStyle: 'italic' },
  successIconWrap:      { alignItems: 'center', marginTop: 40, marginBottom: 16 },
  successIcon:          { fontSize: 56 },
  stepsCard:            { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 0.5, borderColor: BORDER, padding: 16, marginBottom: 16 },
  stepsTitle:           { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 12 },
  stepRow:              { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  stepNum:              { width: 24, height: 24, borderRadius: 12, backgroundColor: UNT_GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  stepNumText:          { fontSize: 12, fontWeight: '700', color: UNT_GREEN },
  stepText:             { fontSize: 13, color: '#444', flex: 1 },
});

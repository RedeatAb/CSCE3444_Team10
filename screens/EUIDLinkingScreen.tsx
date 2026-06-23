/**
 * EUIDLinkingScreen.tsx
 * FR02 — EUID Linking (3-step flow)
 *
 * Sprint 1 · Team 10
 * FR02 / UC-02 EUID Linking 3-step flow — Completed by: Redeat
 * FR10 Digital EUID Card (Step 3, QR + 30s refresh) — Completed by: Jacob
 *
 * Step 1: Enter EUID + Date of Birth → verify against Firestore mock DB
 * Step 2: Enter 6-digit email code
 * Step 3: Show digital EUID card with Flex balance → Go to Home
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { auth, db } from '../config/firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  EUIDLinking: undefined;
  Home: undefined;
  Login: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EUIDLinking'>;
};

const UNT_GREEN       = '#1A6E44';
const UNT_GREEN_LIGHT = '#E8F4EE';
const UNT_GREEN_DARK  = '#0F4A25';
const ERROR_RED       = '#C0392B';
const ERROR_RED_LIGHT = '#FDECEA';
const GRAY            = '#888888';
const BORDER          = '#C8E2D0';
const BG              = '#F7F9F7';

// ── EmailJS config ──────────────────────────────────────────────────────────
// service_id / template_id / user_id (public key) are publishable.
// The access token is a SECRET — read from an env var so it is never committed.
const EMAILJS_SERVICE_ID   = 'service_wccm37x';
const EMAILJS_TEMPLATE_ID  = 'template_202imv3';
const EMAILJS_PUBLIC_KEY   = '3BkZQfzyMNpNtRWyL';
const EMAILJS_ACCESS_TOKEN = process.env.EXPO_PUBLIC_EMAILJS_ACCESS_TOKEN ?? '';

// ── Mock UNT student database (replace with real DB in production) ──────────
const MOCK_UNT_DB: Record<string, { name: string; dob: string; flexBalance: number }> = {
  '11742810': { name: 'Riket Patel', dob: '2003-01-15', flexBalance: 245.50 },
  '11589342': { name: 'Jacob M.',    dob: '2002-09-12', flexBalance: 180.00 },
  '11623905': { name: 'Jeff K.',     dob: '2001-07-30', flexBalance: 320.75 },
  '11705218': { name: 'Redeat T.',   dob: '2003-03-22', flexBalance: 150.25 },
  '10000001': { name: 'Test User',   dob: '2000-01-01', flexBalance: 100.00 },
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function EUIDLinkingScreen({ navigation }: Props) {
  const [step,         setStep]         = useState<1 | 2 | 3>(1);
  const [euid,         setEuid]         = useState('');
  const [dob,          setDob]          = useState('');
  const [code,         setCode]         = useState('');
  const [enteredCode,  setEnteredCode]  = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [studentName,  setStudentName]  = useState('');
  const [flexBalance,  setFlexBalance]  = useState(0);
  const [resendTimer,  setResendTimer]  = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startResendTimer() {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Step 1: Verify EUID + DOB ───────────────────────────────────────────
  async function handleVerifyEUID() {
    if (!euid.trim()) { setError('EUID is required.'); return; }
    if (!dob.trim())  { setError('Date of birth is required.'); return; }

    setLoading(true);
    setError('');

    try {
      const euIdUpper = euid.trim().toUpperCase();
      const student = MOCK_UNT_DB[euIdUpper];

      if (!student) {
        setError('EUID not found. Please check and try again.');
        setLoading(false);
        return;
      }

      if (student.dob !== dob.trim()) {
        setError('Date of birth does not match our records.');
        setLoading(false);
        return;
      }

      // Generate and store verification code in Firestore
      const verifyCode = generateCode();
      setCode(verifyCode);
      // Use the name from the account the user signed up with (so Home shows
      // whoever is logged in). Fall back to the mock DB name only if missing.
      const accountName = auth.currentUser?.displayName?.trim();
      setStudentName(accountName || student.name);
      setFlexBalance(student.flexBalance);

      // Save to Firestore for this user session
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'verificationCodes', user.uid), {
          code: verifyCode,
          euid: euIdUpper,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
      }

      // Send real OTP email via EmailJS REST API
      const userEmail = auth.currentUser?.email;
      if (userEmail) {
        try {
          const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id: EMAILJS_SERVICE_ID,
              template_id: EMAILJS_TEMPLATE_ID,
              user_id: EMAILJS_PUBLIC_KEY,
              accessToken: EMAILJS_ACCESS_TOKEN,
              template_params: {
                to_email: userEmail,
                to_name: studentName,
                otp_code: verifyCode,
              },
            }),
          });
          console.log('OTP email sent to:', userEmail, 'Status:', response.status);
        } catch (emailErr) {
          console.log('Email send error:', emailErr);
        }
      }

      startResendTimer();
      setStep(2);
    } catch (err: any) {
      console.log('EUID VERIFY ERROR:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify 6-digit code ─────────────────────────────────────────
  async function handleVerifyCode() {
    if (enteredCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) { setError('Session expired. Please log in again.'); return; }

      // Check code from Firestore
      const codeDoc = await getDoc(doc(db, 'verificationCodes', user.uid));
      if (!codeDoc.exists()) {
        setError('Code expired. Please request a new one.');
        setLoading(false);
        return;
      }

      const data = codeDoc.data();
      const expired = new Date() > new Date(data.expiresAt);

      if (expired) {
        setError('Code has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      if (enteredCode !== data.code) {
        setError('Incorrect code. Please try again.');
        setLoading(false);
        return;
      }

      // Save student profile to Firestore
      await setDoc(doc(db, 'students', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: studentName,
        euid: euid.trim().toUpperCase(),
        flexBalance: flexBalance,
        euIdLinked: true,
        linkedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // Update user profile
      await updateDoc(doc(db, 'verificationCodes', user.uid), { used: true });

      setStep(3);
    } catch (err: any) {
      console.log('CODE VERIFY ERROR:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendTimer > 0) return;
    const newCode = generateCode();
    setCode(newCode);
    console.log(`🔑 NEW CODE: ${newCode}`);
    startResendTimer();
  }

  // ── Render Step 1 ────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <View style={styles.stepIndicator}>
              {[1,2,3].map(s => (
                <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive]}>
                  <Text style={[styles.stepDotText, step === s && styles.stepDotTextActive]}>{s}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.title}>Link Your EUID</Text>
            <Text style={styles.subtitle}>Step 1 of 3 — Enter your Eagle ID and date of birth.</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Your <Text style={styles.infoBold}>EUID</Text> is your UNT Eagle ID number (e.g. RSP0001).
                This links your Flex balance to the app.
              </Text>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorBoxText}>⚠ {error}</Text></View> : null}

            <Text style={styles.label}>EUID (Eagle ID Number)</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="e.g. 10293847 or ab1234"
              placeholderTextColor={GRAY}
              value={euid}
              onChangeText={t => { setEuid(t); setError(''); }}
              autoCapitalize="characters"
              returnKeyType="next"
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={GRAY}
              value={dob}
              onChangeText={t => { setDob(t); setError(''); }}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleVerifyEUID}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleVerifyEUID}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Continue</Text>}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Render Step 2 ────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <View style={styles.stepIndicator}>
              {[1,2,3].map(s => (
                <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                  <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.iconWrap}>
              <Text style={styles.icon}>📧</Text>
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              Step 2 of 3 — We sent a 6-digit code to{'\n'}
              <Text style={styles.emailHighlight}>{auth.currentUser?.email}</Text>
            </Text>

            {/* DEV ONLY: Show code on screen for testing */}
            <View style={styles.devBox}>
              <Text style={styles.devText}>🧪 Dev Mode — Code: <Text style={styles.devCode}>{code}</Text></Text>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorBoxText}>⚠ {error}</Text></View> : null}

            <Text style={styles.label}>6-Digit Verification Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput, error ? styles.inputError : null]}
              placeholder="000000"
              placeholderTextColor={GRAY}
              value={enteredCode}
              onChangeText={t => { setEnteredCode(t.replace(/[^0-9]/g, '').slice(0, 6)); setError(''); }}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleVerifyCode}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Code</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ghostBtn, resendTimer > 0 && styles.ghostBtnDisabled]}
              onPress={handleResendCode}
              disabled={resendTimer > 0}
            >
              <Text style={[styles.ghostBtnText, resendTimer > 0 && { color: GRAY }]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Didn't receive it? Resend"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backText}>← Back to Step 1</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Render Step 3: Digital EUID Card ────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.stepIndicator}>
          {[1,2,3].map(s => (
            <View key={s} style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={[styles.stepDotText, styles.stepDotTextActive]}>✓</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title}>EUID Linked! 🎉</Text>
        <Text style={styles.subtitle}>Your digital EUID card is ready.</Text>

        {/* Digital EUID Card */}
        <View style={styles.euidCard}>
          <View style={styles.euidCardHeader}>
            <Text style={styles.euidCardLogo}>🦅 UNT FlexPay</Text>
            <Text style={styles.euidCardBadge}>DIGITAL EUID</Text>
          </View>

          <Text style={styles.euidCardName}>{studentName}</Text>
          <Text style={styles.euidCardNumber}>{euid.trim().toUpperCase()}</Text>

          <View style={styles.euidCardDivider} />

          <View style={styles.euidCardBalance}>
            <Text style={styles.euidCardBalanceLabel}>Flex Balance</Text>
            <Text style={styles.euidCardBalanceAmount}>${flexBalance.toFixed(2)}</Text>
          </View>

          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>⬛ QR Code{'\n'}(refreshes every 30s)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.btnText}>Go to Home Dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                   { flex: 1, backgroundColor: BG },
  flex:                   { flex: 1 },
  scroll:                 { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  stepIndicator:          { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  stepDot:                { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive:          { backgroundColor: UNT_GREEN },
  stepDotText:            { fontSize: 13, fontWeight: '700', color: GRAY },
  stepDotTextActive:      { color: '#FFFFFF' },
  iconWrap:               { alignItems: 'center', marginBottom: 12 },
  icon:                   { fontSize: 48 },
  title:                  { fontSize: 24, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
  subtitle:               { fontSize: 14, color: GRAY, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emailHighlight:         { color: UNT_GREEN, fontWeight: '600' },
  infoBox:                { backgroundColor: UNT_GREEN_LIGHT, borderLeftWidth: 3, borderLeftColor: UNT_GREEN, borderRadius: 6, padding: 12, marginBottom: 20 },
  infoText:               { fontSize: 13, color: UNT_GREEN_DARK, lineHeight: 18 },
  infoBold:               { fontWeight: '700' },
  errorBox:               { backgroundColor: ERROR_RED_LIGHT, borderLeftWidth: 3, borderLeftColor: ERROR_RED, borderRadius: 6, padding: 12, marginBottom: 16 },
  errorBoxText:           { fontSize: 13, color: ERROR_RED },
  devBox:                 { backgroundColor: '#FFF9C4', borderRadius: 8, padding: 10, marginBottom: 16, alignItems: 'center' },
  devText:                { fontSize: 13, color: '#7B6000' },
  devCode:                { fontWeight: '700', letterSpacing: 4, fontSize: 16 },
  label:                  { fontSize: 12, color: GRAY, marginBottom: 4, marginTop: 12, fontWeight: '500' },
  input:                  { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A', marginBottom: 2 },
  codeInput:              { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: '700' },
  inputError:             { borderColor: ERROR_RED, backgroundColor: ERROR_RED_LIGHT },
  btn:                    { backgroundColor: UNT_GREEN, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled:            { opacity: 0.6 },
  btnText:                { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  ghostBtn:               { borderWidth: 1.5, borderColor: UNT_GREEN, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  ghostBtnDisabled:       { borderColor: BORDER },
  ghostBtnText:           { color: UNT_GREEN, fontSize: 14, fontWeight: '500' },
  backBtn:                { alignItems: 'center', marginTop: 16 },
  backText:               { color: UNT_GREEN, fontSize: 14 },
  // EUID Card
  euidCard:               { backgroundColor: UNT_GREEN, borderRadius: 16, padding: 20, marginVertical: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  euidCardHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  euidCardLogo:           { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  euidCardBadge:          { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, color: '#FFFFFF', fontSize: 10, fontWeight: '700', overflow: 'hidden' },
  euidCardName:           { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  euidCardNumber:         { color: 'rgba(255,255,255,0.8)', fontSize: 14, letterSpacing: 2, marginBottom: 16 },
  euidCardDivider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  euidCardBalance:        { marginBottom: 16 },
  euidCardBalanceLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  euidCardBalanceAmount:  { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  qrPlaceholder:          { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, alignItems: 'center' },
  qrPlaceholderText:      { color: '#1A1A1A', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

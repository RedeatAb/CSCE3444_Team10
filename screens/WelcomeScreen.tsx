/**
 * WelcomeScreen.tsx
 * Splash / Welcome screen — matches FlexPay sketch design
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Login: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

const UNT_GREEN = '#1A6E44';

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={UNT_GREEN} />
      <View style={styles.container}>

        {/* UNT Logo Box */}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>UNT</Text>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>FlexPay</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Food Delivery · Digital EUID · Meal Swap
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsWrap}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={() => navigation.navigate('SignUp')}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.signInText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#1A6E44' },
  container:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoBox:        { width: 100, height: 100, backgroundColor: '#FFFFFF', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  logoText:       { fontSize: 28, fontWeight: '800', color: '#1A6E44', letterSpacing: 1 },
  appName:        { fontSize: 36, fontWeight: '700', color: '#FFFFFF', marginBottom: 10, letterSpacing: 0.5 },
  subtitle:       { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 60 },
  buttonsWrap:    { width: '100%', gap: 16 },
  getStartedBtn:  { backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  getStartedText: { fontSize: 16, fontWeight: '700', color: '#1A6E44' },
  signInText:     { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', textDecorationLine: 'underline', marginTop: 4 },
});

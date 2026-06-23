import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import EUIDLinkingScreen from './screens/EUIDLinkingScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome"       component={WelcomeScreen}        options={{ headerShown: false }} />
        <Stack.Screen name="SignUp"        component={SignUpScreen}          options={{ headerShown: false }} />
        <Stack.Screen name="Login"         component={LoginScreen}           options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword"component={ForgotPasswordScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="EUIDLinking"   component={EUIDLinkingScreen}     options={{ headerShown: false }} />
        <Stack.Screen name="Home"          component={HomeScreen}            options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

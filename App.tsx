import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { NumberMapScreen } from './src/screens/NumberMapScreen';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#f7f7fb' },
              headerShadowVisible: false,
              tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e4e4ee' },
            }}
          >
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Practice" component={PracticeScreen} />
            <Tab.Screen name="Number Map" component={NumberMapScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

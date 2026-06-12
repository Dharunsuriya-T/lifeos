import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Circle, Rect, Path, Line } from 'react-native-svg';

import { useMobileSync } from './src/hooks/useMobileSync';
import DashboardScreen from './src/screens/DashboardScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import TasksScreen from './src/screens/TasksScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { getAccessToken } from './src/utils/auth';

const Tab = createBottomTabNavigator();

export default function App() {
  const sync = useMobileSync();
  const [loginCount, setLoginCount] = useState(0);

  // Re-run triggers on login state changes
  const handleLoginStateChange = () => {
    setLoginCount(prev => prev + 1);
  };

  if (sync.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarStyle: {
            backgroundColor: '#131b2d',
            borderTopColor: '#1e293b',
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#a855f7',
          tabBarInactiveTintColor: '#94a3b8',
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Dashboard') {
              return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="3" width="7" height="9" rx="1" />
                  <Rect x="14" y="3" width="7" height="5" rx="1" />
                  <Rect x="14" y="12" width="7" height="9" rx="1" />
                  <Rect x="3" y="16" width="7" height="5" rx="1" />
                </Svg>
              );
            } else if (route.name === 'Goals') {
              return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Circle cx="12" cy="12" r="6" />
                  <Circle cx="12" cy="12" r="2" />
                </Svg>
              );
            } else if (route.name === 'Tasks') {
              return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <Path d="m9 16 2 2 4-4" />
                  <Line x1="3" y1="10" x2="21" y2="10" />
                </Svg>
              );
            } else if (route.name === 'Settings') {
              return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="3" />
                  <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </Svg>
              );
            }
            return null;
          },
        })}
      >
        <Tab.Screen name="Dashboard">
          {props => <DashboardScreen {...props} sync={sync} onNavigate={(screen) => props.navigation.navigate(screen)} />}
        </Tab.Screen>
        <Tab.Screen name="Goals">
          {props => <GoalsScreen {...props} sync={sync} />}
        </Tab.Screen>
        <Tab.Screen name="Tasks">
          {props => <TasksScreen {...props} sync={sync} />}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {props => <SettingsScreen {...props} sync={sync} onLoginStateChange={handleLoginStateChange} />}
        </Tab.Screen>
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Colors based on theme
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = isDark ? '#8E8E93' : '#8E8E93';
  const backgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';

  const renderTabIcon = (name: keyof typeof Ionicons.glyphMap, focused: boolean) => (
    <View style={styles.iconContainer}>
      <Ionicons
        size={26}
        name={name}
        color={focused ? activeColor : inactiveColor}
      />
      {focused && <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => renderTabIcon(focused ? 'home' : 'home-outline', focused),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ focused }) => renderTabIcon(focused ? 'bar-chart' : 'bar-chart-outline', focused),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ focused }) => renderTabIcon(focused ? 'star' : 'star-outline', focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
});

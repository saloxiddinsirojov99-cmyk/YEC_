import React from 'react';
import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Asosiy',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🏠' : '🏚️'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Katalog',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '📦' : '🗃️'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="rolls"
        options={{
          title: 'Metraj',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🧵' : '🪡'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Savatcha',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🛒' : '🛍️'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Sevimlilar',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '❤️' : '🤍'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '👤' : '👥'}</Text>
          ),
        }}
      />
    </Tabs>
  );
}

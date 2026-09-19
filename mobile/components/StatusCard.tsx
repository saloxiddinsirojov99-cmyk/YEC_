import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';

interface StatusCardProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function StatusCard({ title, children, style }: StatusCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
});

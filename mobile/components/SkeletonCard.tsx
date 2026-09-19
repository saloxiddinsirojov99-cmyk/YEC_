import React from 'react';
import { StyleSheet, View } from 'react-native';

export const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.imageSkeleton} />
      <View style={styles.content}>
        <View style={styles.titleSkeleton} />
        <View style={styles.subSkeleton} />
        <View style={styles.priceRow}>
          <View style={styles.priceSkeleton} />
          <View style={styles.btnSkeleton} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
    flex: 1,
  },
  imageSkeleton: {
    width: '100%',
    height: 175,
    backgroundColor: '#e2e8f0',
  },
  content: {
    padding: 12,
  },
  titleSkeleton: {
    width: '75%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  subSkeleton: {
    width: '45%',
    height: 11,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSkeleton: {
    width: '50%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  btnSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
});

export default SkeletonCard;

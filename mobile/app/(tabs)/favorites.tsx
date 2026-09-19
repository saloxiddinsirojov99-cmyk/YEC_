import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '@/store/favorites.store';
import CarpetCard from '@/components/CarpetCard';
import EmptyState from '@/components/EmptyState';
import type { Carpet } from '@/types/carpet';

export default function FavoritesScreen() {
  const router = useRouter();
  const favoritesMap = useFavoritesStore((state) => state.favorites);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);

  const items: Carpet[] = Object.values(favoritesMap);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sevimlilar</Text>
          <Text style={styles.subtitle}>
            {items.length > 0
              ? `${items.length} ta saqlangan gilam`
              : "Hozircha saqlangan mahsulotlar yo'q"}
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={clearFavorites}
            activeOpacity={0.7}
          >
            <Text style={styles.clearText}>Tozalash</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          title="Sevimlilar ro'yxati bo'sh"
          message="O'zingizga yoqqan gilamlarni yurakcha tugmasi orqali saqlab qo'yishingiz mumkin"
          actionText="Katalogga o'tish"
          onAction={() => router.push('/(tabs)/catalog')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <CarpetCard
                carpet={item}
                onPress={() => router.push(`/carpet/${item.id}`)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48.5%',
    marginBottom: 12,
  },
});

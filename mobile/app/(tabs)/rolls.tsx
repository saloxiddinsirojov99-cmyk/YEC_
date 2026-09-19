import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteCarpets } from '@/hooks/useCarpetCatalog';
import CarpetCard from '@/components/CarpetCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import type { Carpet } from '@/types/carpet';

export default function RollsScreen() {
  const router = useRouter();
  // Mode: 'collections' (default 17 grouped collections) vs 'all' (raw: true, 2,244 roll products)
  const [mode, setMode] = useState<'collections' | 'all'>('collections');

  const queryParams = {
    kind: 'roll' as const,
    raw: mode === 'all',
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCarpets(queryParams, mode === 'collections' ? 20 : 24);

  // Flatten items across pages
  const items: Carpet[] = data ? data.pages.flatMap((page) => page.items) : [];
  const totalCount = data?.pages[0]?.meta?.total ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Metraj Gilamlar</Text>
          <Text style={styles.subtitle}>
            {mode === 'collections'
              ? `${totalCount} ta kolleksiya guruhi`
              : `${totalCount} ta individual o'lchovli gilam`}
          </Text>
        </View>

        {/* Mode Toggle Switch */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === 'collections' && styles.toggleBtnActive,
            ]}
            onPress={() => setMode('collections')}
          >
            <Text
              style={[
                styles.toggleText,
                mode === 'collections' && styles.toggleTextActive,
              ]}
            >
              Kolleksiyalar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'all' && styles.toggleBtnActive]}
            onPress={() => setMode('all')}
          >
            <Text
              style={[
                styles.toggleText,
                mode === 'all' && styles.toggleTextActive,
              ]}
            >
              Barcha Rollar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>✂️</Text>
        <Text style={styles.infoText}>
          Metraj gilamlar sizning istalgan uzunligingiz bo&apos;yicha kesib
          beriladi. Narxlar m² bo&apos;yicha hisoblanadi.
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skeletonWrapper}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message || "Metraj ma'lumotlarini yuklab bo'lmadi"}
          onRetry={refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Metraj gilamlar topilmadi"
          message="Hozirda metraj bo'limida mos mahsulotlar mavjud emas"
          actionText="Qayta yuklash"
          onAction={() => {
            refetch();
          }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor="#0284c7"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <CarpetCard
                carpet={item}
                onPress={() => {
                  if (mode === 'collections') {
                    // Navigate to catalog filtered by this collection name
                    router.push({
                      pathname: '/(tabs)/catalog',
                      params: { search: item.name },
                    });
                  } else {
                    router.push(`/carpet/${item.id}`);
                  }
                }}
              />
            </View>
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <Text style={styles.loadingMoreText}>Ko&apos;proq yuklanmoqda...</Text>
              </View>
            ) : null
          }
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    marginTop: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#0284c7',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
    fontWeight: '500',
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
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 12,
  },
  skeletonWrapper: {
    width: '48.5%',
    marginBottom: 12,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
    color: '#64748b',
  },
});

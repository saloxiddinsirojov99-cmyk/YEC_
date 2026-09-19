import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useInfiniteCarpets, useDebounce } from '@/hooks/useCarpetCatalog';
import type { Carpet, CarpetKind } from '@/types/carpet';
import { CarpetCard } from '@/components/CarpetCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterModal } from '@/components/FilterModal';

const KIND_TABS: { label: string; kind: CarpetKind }[] = [
  { label: 'Tayyor', kind: 'carpet' },
  { label: 'Metraj', kind: 'roll' },
  { label: 'Joynamoz', kind: 'prayer' },
  { label: 'Oval', kind: 'oval' },
];

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ initialKind?: string }>();

  const [selectedKind, setSelectedKind] = useState<CarpetKind>(
    (params.initialKind as CarpetKind) || 'carpet',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 450);

  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter values
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();

  // Active filter count
  const activeFilterCount =
    (selectedCollection ? 1 : 0) +
    (selectedMaterial ? 1 : 0) +
    (selectedSize ? 1 : 0);

  // Build query
  const queryParams = useMemo(() => {
    const q: any = {
      kind: selectedKind,
    };
    if (debouncedSearch.trim()) {
      q.search = debouncedSearch.trim();
    }
    if (selectedCollection) {
      q.collection = selectedCollection;
    }
    if (selectedMaterial) {
      q.material = selectedMaterial;
    }
    if (selectedSize) {
      q.size = selectedSize;
    }
    return q;
  }, [selectedKind, debouncedSearch, selectedCollection, selectedMaterial, selectedSize]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isRefetching,
  } = useInfiniteCarpets(queryParams, 20);

  // Flatten items from all pages
  const allCarpets = useMemo(() => {
    if (!data?.pages) return [];
    const flattened: Carpet[] = [];
    const seenIds = new Set<string>();

    data.pages.forEach((page) => {
      page.items.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          flattened.push(item);
        }
      });
    });

    // Client-side sort if applied
    if (sortBy === 'price_asc') {
      return [...flattened].sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sortBy === 'price_desc') {
      return [...flattened].sort((a, b) => Number(b.price) - Number(a.price));
    }

    return flattened;
  }, [data, sortBy]);

  const totalCount = data?.pages?.[0]?.meta?.total ?? 0;

  const handleResetFilters = () => {
    setSelectedCollection(undefined);
    setSelectedMaterial(undefined);
    setSelectedSize(undefined);
    setSearchQuery('');
    setSortBy('default');
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Carpet }) => (
      <View style={styles.gridColumn}>
        <CarpetCard carpet={item} />
      </View>
    ),
    [],
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Category Kind Tabs */}
      <View style={styles.kindTabsContainer}>
        {KIND_TABS.map((tab) => {
          const isSelected = selectedKind === tab.kind;
          return (
            <TouchableOpacity
              key={tab.kind}
              style={[styles.kindTab, isSelected && styles.kindTabActive]}
              onPress={() => {
                setSelectedKind(tab.kind);
                handleResetFilters();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.kindTabText,
                  isSelected && styles.kindTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchPrefixIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nomi, kodi yoki o'lchami bo'yicha..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchBtn}
          >
            <Text style={{ color: '#64748b', fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Control Bar: Total Count + Filter & Sort buttons */}
      <View style={styles.controlBar}>
        <Text style={styles.totalCountText}>
          {totalCount.toLocaleString('uz-UZ')} ta mahsulot
        </Text>

        <View style={styles.controlActions}>
          {/* Sort button toggle */}
          <TouchableOpacity
            style={[styles.actionBtn, sortBy !== 'default' && styles.actionBtnActive]}
            activeOpacity={0.7}
            onPress={() => {
              if (sortBy === 'default') setSortBy('price_asc');
              else if (sortBy === 'price_asc') setSortBy('price_desc');
              else setSortBy('default');
            }}
          >
            <Text style={styles.actionBtnIcon}>
              {sortBy === 'price_asc'
                ? '⬆️'
                : sortBy === 'price_desc'
                ? '⬇️'
                : '↕️'}
            </Text>
            <Text style={styles.actionBtnLabel}>
              {sortBy === 'price_asc'
                ? 'Arzonroq'
                : sortBy === 'price_desc'
                ? 'Qimmatroq'
                : 'Saralash'}
            </Text>
          </TouchableOpacity>

          {/* Filter button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              activeFilterCount > 0 && styles.actionBtnActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.actionBtnIcon}>⚙️</Text>
            <Text style={styles.actionBtnLabel}>
              Filtr {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0284c7" />
        <Text style={styles.footerLoaderText}>Keyingi sahifa yuklanmoqda...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {isLoading ? (
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.loadingGrid}>
            <View style={styles.loadingCol}><SkeletonCard /></View>
            <View style={styles.loadingCol}><SkeletonCard /></View>
            <View style={styles.loadingCol}><SkeletonCard /></View>
            <View style={styles.loadingCol}><SkeletonCard /></View>
          </View>
        </View>
      ) : isError ? (
        <View style={styles.container}>
          {renderHeader()}
          <ErrorState onRetry={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={allCarpets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <EmptyState
              title={
                selectedKind === 'prayer' || selectedKind === 'oval'
                  ? 'Ushbu bo‘limda hozircha mahsulot yo‘q'
                  : 'Mahsulot topilmadi'
              }
              message={
                selectedKind === 'prayer' || selectedKind === 'oval'
                  ? 'Tez orada ushbu toifada yangi gilamlar qo‘shiladi.'
                  : "Qidiruv yoki filtr parametrlarini o'zgartirib ko'ring."
              }
              actionText={
                activeFilterCount > 0 || searchQuery.length > 0
                  ? 'Filtrlarni tozalash'
                  : undefined
              }
              onAction={handleResetFilters}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              colors={['#0284c7']}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedCollection={selectedCollection}
        onSelectCollection={setSelectedCollection}
        selectedMaterial={selectedMaterial}
        onSelectMaterial={setSelectedMaterial}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        onReset={handleResetFilters}
        kind={selectedKind}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  kindTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  kindTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  kindTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kindTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  kindTabTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchPrefixIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalCountText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  controlActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  actionBtnIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  gridColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  loadingCol: {
    width: '50%',
    paddingHorizontal: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 13,
    color: '#64748b',
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarpets, useCategories } from '@/hooks/useCarpetCatalog';
import { CarpetCard } from '@/components/CarpetCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const categoriesQuery = useCategories();
  // Fetch popular preview
  const popularCarpetsQuery = useCarpets({ page: 1, limit: 6, kind: 'carpet' });
  // Fetch new collection preview
  const newArrivalsQuery = useCarpets({ page: 2, limit: 6, kind: 'carpet' });

  const categories = [
    { id: 'carpet', name: 'Tayyor gilamlar', icon: '🧶', kind: 'carpet', count: '4,488+' },
    { id: 'roll', name: 'Metraj gilamlar', icon: '🧵', kind: 'roll', count: '17 kolleksiya' },
    { id: 'prayer', name: 'Joynamozlar', icon: '🕌', kind: 'prayer', count: 'Maxsus' },
    { id: 'oval', name: 'Oval gilamlar', icon: '🔄', kind: 'oval', count: 'Shaklli' },
  ];

  const handleCategoryPress = (kind: string) => {
    if (kind === 'roll') {
      router.push('/(tabs)/rolls' as any);
    } else {
      router.push({
        pathname: '/(tabs)/catalog',
        params: { initialKind: kind },
      } as any);
    }
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/catalog' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>YEC MARKET</Text>
          <Text style={styles.brandSubtitle}>Sifatli va nafis gilamlar olami</Text>
        </View>
        <TouchableOpacity
          style={styles.cartIconBtn}
          onPress={() => router.push('/(tabs)/catalog' as any)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 20 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar Input (Mock action -> opens catalog) */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={handleSearchPress}
        >
          <Text style={styles.searchIcon}>🔎</Text>
          <Text style={styles.searchPlaceholder}>
            Gilam nomi, o'lcham yoki kolleksiya qidirish...
          </Text>
        </TouchableOpacity>

        {/* Hero Promo Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>PREMIUM TO'PLAM</Text>
            </View>
            <Text style={styles.heroTitle}>Xonadoningiz uchun mukammal ko'rk</Text>
            <Text style={styles.heroDesc}>
              4,488 dan ortiq eng sara tayyor va metraj gilamlar
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/catalog' as any)}
            >
              <Text style={styles.heroBtnText}>Katalogni ko'rish →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategoriyalar</Text>
        </View>

        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              activeOpacity={0.75}
              onPress={() => handleCategoryPress(cat.kind)}
            >
              <View style={styles.catIconWrap}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
              </View>
              <Text style={styles.catName} numberOfLines={1}>
                {cat.name}
              </Text>
              <Text style={styles.catCount}>{cat.count}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Carpets Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Ommabop gilamlar</Text>
            <Text style={styles.sectionSubtitle}>
              Eng ko'p xarid qilinayotgan sara modellar
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/catalog' as any)}>
            <Text style={styles.seeAllText}>Barchasi →</Text>
          </TouchableOpacity>
        </View>

        {popularCarpetsQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <SkeletonCard />
            <View style={{ width: 12 }} />
            <SkeletonCard />
          </View>
        ) : popularCarpetsQuery.isError ? (
          <ErrorState onRetry={() => popularCarpetsQuery.refetch()} />
        ) : (
          <View style={styles.productGrid}>
            {(popularCarpetsQuery.data?.items ?? []).map((carpet) => (
              <View key={carpet.id} style={styles.gridItem}>
                <CarpetCard carpet={carpet} />
              </View>
            ))}
          </View>
        )}

        {/* New Arrivals Section */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <View>
            <Text style={styles.sectionTitle}>Yangi to'plamlar</Text>
            <Text style={styles.sectionSubtitle}>
              Yangi kelgan gilamlar katalogi
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/catalog' as any)}>
            <Text style={styles.seeAllText}>Barchasi →</Text>
          </TouchableOpacity>
        </View>

        {newArrivalsQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <SkeletonCard />
            <View style={{ width: 12 }} />
            <SkeletonCard />
          </View>
        ) : (
          <View style={styles.productGrid}>
            {(newArrivalsQuery.data?.items ?? []).map((carpet) => (
              <View key={carpet.id} style={styles.gridItem}>
                <CarpetCard carpet={carpet} />
              </View>
            ))}
          </View>
        )}

        {/* Bottom Banner */}
        <View style={styles.bottomBanner}>
          <Text style={styles.bottomBannerTitle}>Metraj gilamlar kerakmi?</Text>
          <Text style={styles.bottomBannerDesc}>
            Xonangiz o'lchamiga mos qilib bichib va chetlarini tikib beramiz.
          </Text>
          <TouchableOpacity
            style={styles.bottomBannerBtn}
            onPress={() => router.push('/(tabs)/rolls' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomBannerBtnText}>Metraj gilamlar bo'limi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cartIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  heroBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    padding: 20,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
  },
  heroDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  categoryCard: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  catIcon: {
    fontSize: 22,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  catCount: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  gridItem: {
    width: '46%',
    marginHorizontal: '2%',
  },
  bottomBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
  },
  bottomBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 6,
  },
  bottomBannerDesc: {
    fontSize: 13,
    color: '#0284c7',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  bottomBannerBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bottomBannerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

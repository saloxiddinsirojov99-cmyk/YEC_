import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, CLIENT_PLATFORM } from '@/constants/config';
import { useCategories, useCarpets } from '@/hooks/useCarpetCatalog';
import { formatPrice } from '@/utils/price';

export default function InitialConnectionScreen() {
  const categoriesQuery = useCategories();
  const carpetsQuery = useCarpets({ page: 1, limit: 2, kind: 'carpet' });

  const isLoading = categoriesQuery.isLoading || carpetsQuery.isLoading;
  const isError = categoriesQuery.isError || carpetsQuery.isError;
  const isConnected =
    categoriesQuery.isSuccess &&
    carpetsQuery.isSuccess &&
    !isLoading &&
    !isError;

  const handleRefresh = () => {
    categoriesQuery.refetch();
    carpetsQuery.refetch();
  };

  const categories = categoriesQuery.data ?? [];
  const carpets = carpetsQuery.data?.items ?? [];
  const carpetsMeta = carpetsQuery.data?.meta;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Badge */}
        <View style={styles.header}>
          <Text style={styles.title}>YEC Market Mobile</Text>
          <Text style={styles.subtitle}>
            Part 1: Foundation & API Connection
          </Text>
        </View>

        {/* Connection Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend Connection Status</Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                isConnected
                  ? styles.statusConnected
                  : isError
                  ? styles.statusFailed
                  : styles.statusLoading,
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected
                ? 'Connected (Production Live)'
                : isError
                ? 'Connection Failed'
                : 'Connecting to Backend...'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API URL:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {API_URL}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Header:</Text>
            <Text style={styles.infoValue}>
              x-client-platform: {CLIENT_PLATFORM}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.refreshButtonText}>Test Again / Refresh</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Real Test 1: Categories */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Test 1: GET /categories</Text>
            {categoriesQuery.isLoading && (
              <ActivityIndicator size="small" color="#2563eb" />
            )}
          </View>

          {categoriesQuery.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Xatolik: {String(categoriesQuery.error?.message)}
              </Text>
            </View>
          )}

          {categoriesQuery.isSuccess && (
            <View>
              <Text style={styles.successText}>
                ✓ Muvaffaqiyatli yuklandi: {categories.length} ta kategoriya
              </Text>
              <View style={styles.tagContainer}>
                {categories.slice(0, 6).map((cat) => (
                  <View key={cat.id} style={styles.tag}>
                    <Text style={styles.tagText}>{cat.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Real Test 2: Carpets */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>
              Test 2: GET /carpets?page=1&limit=2
            </Text>
            {carpetsQuery.isLoading && (
              <ActivityIndicator size="small" color="#2563eb" />
            )}
          </View>

          {carpetsQuery.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Xatolik: {String(carpetsQuery.error?.message)}
              </Text>
            </View>
          )}

          {carpetsQuery.isSuccess && (
            <View>
              <Text style={styles.successText}>
                ✓ Muvaffaqiyatli yuklandi: Jami {carpetsMeta?.total ?? 0} ta gilam
              </Text>

              {carpets.map((carpet) => (
                <View key={carpet.id} style={styles.sampleItem}>
                  <Text style={styles.sampleItemName}>{carpet.name}</Text>
                  <Text style={styles.sampleItemDetails}>
                    O‘lcham: {carpet.size || 'N/A'} | Material:{' '}
                    {carpet.material || 'N/A'}
                  </Text>
                  <Text style={styles.sampleItemPrice}>
                    {formatPrice(carpet.price)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#10b981',
  },
  statusFailed: {
    backgroundColor: '#ef4444',
  },
  statusLoading: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    maxWidth: '70%',
  },
  refreshButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  successText: {
    color: '#059669',
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  sampleItem: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sampleItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  sampleItemDetails: {
    fontSize: 12,
    color: '#64748b',
    marginVertical: 2,
  },
  sampleItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
});

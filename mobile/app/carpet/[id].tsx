import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCarpetDetails } from '@/hooks/useCarpetCatalog';
import { resolveImageUrl } from '@/utils/image';
import { useFavoritesStore } from '@/store/favorites.store';
import ErrorState from '@/components/ErrorState';

const { width } = Dimensions.get('window');

export default function CarpetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: carpet, isLoading, isError, error, refetch } = useCarpetDetails(
    id || '',
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isFavorite = useFavoritesStore((state) => (id ? state.isFavorite(id) : false));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Gilam ma'lumotlari yuklanmoqda...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !carpet) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          message={(error as Error)?.message || "Gilam ma'lumotlarini topib bo'lmadi"}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const images = carpet.images && carpet.images.length > 0 ? carpet.images : [];
  const currentRawImage = images[activeImageIndex];
  const displayImageUrl = resolveImageUrl(currentRawImage);

  const priceNum = Number(carpet.price) || 0;
  const discountPercent = carpet.discountPercent || 0;
  const hasDiscount = discountPercent > 0;
  const finalPrice = hasDiscount
    ? Math.round(priceNum * (1 - discountPercent / 100))
    : priceNum;

  const formattedPrice = new Intl.NumberFormat('uz-UZ').format(finalPrice);
  const formattedOldPrice = new Intl.NumberFormat('uz-UZ').format(priceNum);

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {carpet.name}
        </Text>

        <TouchableOpacity
          style={[styles.navButton, isFavorite && styles.navButtonActive]}
          onPress={() => toggleFavorite(carpet)}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Image Gallery Container */}
        <View style={styles.imageContainer}>
          {displayImageUrl && !imageError ? (
            <Image
              source={{ uri: displayImageUrl }}
              style={styles.mainImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>🧶</Text>
              <Text style={styles.placeholderText}>Rasm mavjud emas</Text>
            </View>
          )}

          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}

          {carpet.type === 'ROLL' && (
            <View style={styles.rollBadge}>
              <Text style={styles.rollBadgeText}>METRAJ · ROLL</Text>
            </View>
          )}
        </View>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailList}
            contentContainerStyle={styles.thumbnailContent}
          >
            {images.map((img, idx) => {
              const thumbUrl = resolveImageUrl(img);
              const isSelected = idx === activeImageIndex;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.thumbWrapper,
                    isSelected && styles.thumbWrapperActive,
                  ]}
                  onPress={() => {
                    setActiveImageIndex(idx);
                    setImageError(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: thumbUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Product Details Section */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{carpet.name}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formattedPrice} so'm</Text>
            {hasDiscount && (
              <Text style={styles.oldPriceText}>{formattedOldPrice} so'm</Text>
            )}
          </View>

          {/* Stock and Category Chips */}
          <View style={styles.metaRow}>
            {carpet.category && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{carpet.category.name}</Text>
              </View>
            )}
            <View
              style={[
                styles.chip,
                carpet.stock > 0 ? styles.inStockChip : styles.outOfStockChip,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  carpet.stock > 0
                    ? styles.inStockText
                    : styles.outOfStockText,
                ]}
              >
                {carpet.stock > 0 ? `Omborda: ${carpet.stock} dona` : "Tugagan"}
              </Text>
            </View>
          </View>

          {/* Specifications Table */}
          <View style={styles.specsCard}>
            <Text style={styles.specsTitle}>Texnik xususiyatlar</Text>

            <View style={styles.specRow}>
              <Text style={styles.specLabel}>O'lchami</Text>
              <Text style={styles.specValue}>{carpet.size || "Aniqlanmagan"}</Text>
            </View>

            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Material</Text>
              <Text style={styles.specValue}>{carpet.material || "Aniqlanmagan"}</Text>
            </View>

            {carpet.designCode && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Dizayn kodi</Text>
                <Text style={styles.specValue}>{carpet.designCode}</Text>
              </View>
            )}

            {carpet.brand && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Brend</Text>
                <Text style={styles.specValue}>{carpet.brand}</Text>
              </View>
            )}

            {carpet.shape && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Shakli</Text>
                <Text style={styles.specValue}>{carpet.shape}</Text>
              </View>
            )}

            {carpet.weightKg && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Og'irligi</Text>
                <Text style={styles.specValue}>{carpet.weightKg} kg</Text>
              </View>
            )}

            {carpet.pileHeight && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Tuk balandligi</Text>
                <Text style={styles.specValue}>{carpet.pileHeight} mm</Text>
              </View>
            )}
          </View>

          {/* Roll Inventories if available */}
          {carpet.rollInventories && carpet.rollInventories.length > 0 && (
            <View style={styles.specsCard}>
              <Text style={styles.specsTitle}>Mavjud Roll Kengliklari</Text>
              {carpet.rollInventories.map((roll, idx) => (
                <View key={roll.id || idx} style={styles.specRow}>
                  <Text style={styles.specLabel}>Kenglik: {roll.widthCm} sm</Text>
                  <Text style={styles.specValue}>
                    {new Intl.NumberFormat('uz-UZ').format(Number(roll.pricePerM2))} so'm / m²
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {carpet.description && (
            <View style={styles.specsCard}>
              <Text style={styles.specsTitle}>Tavsif</Text>
              <Text style={styles.descriptionText}>{carpet.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Umumiy narxi</Text>
          <Text style={styles.bottomPriceValue}>{formattedPrice} so'm</Text>
        </View>

        <TouchableOpacity
          style={[styles.buyBtn, carpet.stock === 0 && styles.buyBtnDisabled]}
          disabled={carpet.stock === 0}
          onPress={() => {
            Alert.alert(
              'Savatchaga qo‘shildi',
              `"${carpet.name}" mahsuloti savatchaga muvaffaqiyatli qo'shildi.`,
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.buyBtnText}>
            {carpet.stock > 0 ? "Savatchaga qo'shish" : "Mavjud emas"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navButtonActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  navButtonText: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: width,
    height: width * 0.85,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rollBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rollBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  thumbnailList: {
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
  },
  thumbWrapperActive: {
    borderColor: '#0284c7',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 10,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0284c7',
  },
  oldPriceText: {
    fontSize: 16,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  inStockChip: {
    backgroundColor: '#ecfdf5',
  },
  inStockText: {
    color: '#059669',
  },
  outOfStockChip: {
    backgroundColor: '#fef2f2',
  },
  outOfStockText: {
    color: '#ef4444',
  },
  specsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  specLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  buyBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buyBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

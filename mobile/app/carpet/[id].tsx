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
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCarpetDetails, useCarpets } from '@/hooks/useCarpetCatalog';
import { resolveImageUrl } from '@/utils/image';
import { useFavoritesStore } from '@/store/favorites.store';
import { useCartStore } from '@/store/cart.store';
import ErrorState from '@/components/ErrorState';

const { width } = Dimensions.get('window');

export default function CarpetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: carpet, isLoading, isError, error, refetch } = useCarpetDetails(
    id || '',
  );

  const { data: relatedData } = useCarpets({
    categoryId: carpet?.categoryId,
    limit: 8,
  });
  const similarCarpets = (relatedData?.items || []).filter((item) => item.id !== carpet?.id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isFavorite = useFavoritesStore((state) => (id ? state.isFavorite(id) : false));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const addItemToCart = useCartStore((state) => state.addItem);

  // Custom Metraj / Roll state
  const [rollModalVisible, setRollModalVisible] = useState(false);
  const [selectedWidthCm, setSelectedWidthCm] = useState<number | null>(null);
  const [customLengthCm, setCustomLengthCm] = useState('');

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

          {/* Variants / Other sizes if available */}
          {carpet.variants && carpet.variants.length > 0 && (
            <View style={styles.specsCard}>
              <Text style={styles.specsTitle}>Boshqa o‘lchamlar</Text>
              <View style={styles.variantsRow}>
                {carpet.variants.map((v) => {
                  const isCurrent = v.id === carpet.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.variantPill,
                        isCurrent && styles.variantPillActive,
                      ]}
                      onPress={() => {
                        if (!isCurrent) router.push(`/carpet/${v.id}`);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.variantPillText,
                          isCurrent && styles.variantPillTextActive,
                        ]}
                      >
                        {v.size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

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

          {/* Similar Products */}
          {similarCarpets.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.similarSectionTitle}>O‘xshash gilamlar</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarList}
              >
                {similarCarpets.map((item) => {
                  const itemImg = item.images?.[0];
                  const itemImgUrl = resolveImageUrl(itemImg);
                  const itemPrice = Number(item.price) || 0;
                  const itemDiscount = item.discountPercent || 0;
                  const itemFinalPrice =
                    itemDiscount > 0
                      ? Math.round(itemPrice * (1 - itemDiscount / 100))
                      : itemPrice;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.similarCard}
                      onPress={() => router.push(`/carpet/${item.id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.similarImageWrapper}>
                        {itemImgUrl ? (
                          <Image
                            source={{ uri: itemImgUrl }}
                            style={styles.similarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.similarPlaceholder}>
                            <Text style={{ fontSize: 24 }}>🧶</Text>
                          </View>
                        )}
                        {itemDiscount > 0 && (
                          <View style={styles.similarDiscountBadge}>
                            <Text style={styles.similarDiscountText}>
                              -{itemDiscount}%
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.similarName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.similarSize} numberOfLines={1}>
                        {item.size} · {item.material}
                      </Text>
                      <Text style={styles.similarPrice}>
                        {new Intl.NumberFormat('uz-UZ').format(itemFinalPrice)} so‘m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
            if (carpet.type === 'ROLL' && carpet.rollInventories && carpet.rollInventories.length > 0) {
              setSelectedWidthCm(carpet.rollInventories[0].widthCm);
              setRollModalVisible(true);
            } else {
              addItemToCart({
                carpetId: carpet.id,
                name: carpet.name,
                price: finalPrice,
                image: currentRawImage,
                size: carpet.size,
                material: carpet.material,
                quantity: 1,
                stock: carpet.stock,
              });
              Alert.alert(
                'Savatchaga qo‘shildi',
                `"${carpet.name}" savatchaga muvaffaqiyatli qo'shildi.`,
                [
                  { text: 'Xaridni davom ettirish' },
                  { text: 'Savatchaga o‘tish', onPress: () => router.push('/(tabs)/cart') },
                ],
              );
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.buyBtnText}>
            {carpet.stock > 0
              ? carpet.type === 'ROLL'
                ? 'O‘lcham tanlash'
                : 'Savatchaga qo‘shish'
              : 'Mavjud emas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Roll Metraj Custom Cut Modal */}
      <Modal
        visible={rollModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRollModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Metraj o‘lchamini tanlang</Text>
              <TouchableOpacity onPress={() => setRollModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Available Width Selector */}
            <Text style={styles.modalLabel}>Kenglik (sm):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.widthOptionsRow}>
              {carpet.rollInventories?.map((inv) => (
                <TouchableOpacity
                  key={inv.id}
                  style={[
                    styles.widthOptionBtn,
                    selectedWidthCm === inv.widthCm && styles.widthOptionBtnActive,
                  ]}
                  onPress={() => setSelectedWidthCm(inv.widthCm)}
                >
                  <Text
                    style={[
                      styles.widthOptionText,
                      selectedWidthCm === inv.widthCm && styles.widthOptionTextActive,
                    ]}
                  >
                    {inv.widthCm} sm
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Length Input */}
            <Text style={styles.modalLabel}>Uzunlik (sm):</Text>
            <TextInput
              style={styles.lengthInput}
              placeholder="Masalan: 350"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={customLengthCm}
              onChangeText={setCustomLengthCm}
            />

            {/* Area and Price Calculation */}
            {(() => {
              const w = selectedWidthCm || 0;
              const l = parseFloat(customLengthCm) || 0;
              const selectedInv = carpet.rollInventories?.find((i) => i.widthCm === w);
              const pPerM2 = selectedInv ? Number(selectedInv.pricePerM2) : 0;
              const area = (w / 100) * (l / 100);
              const calcPrice = Math.round(area * pPerM2);

              return (
                <View style={styles.calcBox}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Hisoblangan maydon:</Text>
                    <Text style={styles.calcValue}>{area > 0 ? area.toFixed(2) : '0.00'} m²</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>m² narxi:</Text>
                    <Text style={styles.calcValue}>
                      {new Intl.NumberFormat('uz-UZ').format(pPerM2)} so‘m
                    </Text>
                  </View>
                  <View style={[styles.calcRow, styles.calcTotalRow]}>
                    <Text style={styles.calcTotalLabel}>Jami narx:</Text>
                    <Text style={styles.calcTotalValue}>
                      {new Intl.NumberFormat('uz-UZ').format(calcPrice)} so‘m
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Add Roll to Cart Button */}
            <TouchableOpacity
              style={styles.confirmRollBtn}
              onPress={() => {
                const w = selectedWidthCm || 0;
                const l = parseFloat(customLengthCm) || 0;
                if (w <= 0 || l <= 0) {
                  Alert.alert('Xatolik', 'Iltimos, to‘g‘ri uzunlik kiriting (kamida 1 sm).');
                  return;
                }
                const selectedInv = carpet.rollInventories?.find((i) => i.widthCm === w);
                const pPerM2 = selectedInv ? Number(selectedInv.pricePerM2) : 0;
                const area = (w / 100) * (l / 100);
                const calcPrice = Math.round(area * pPerM2);

                addItemToCart({
                  carpetId: carpet.id,
                  name: carpet.name,
                  price: calcPrice,
                  image: currentRawImage,
                  size: `${w}sm × ${l}sm`,
                  material: carpet.material,
                  quantity: 1,
                  isRoll: true,
                  widthCm: w,
                  lengthCm: l,
                  areaM2: area,
                  pricePerM2: pPerM2,
                });

                setRollModalVisible(false);
                Alert.alert(
                  'Savatchaga qo‘shildi',
                  `${carpet.name} (${w}sm × ${l}sm) savatchaga qo'shildi.`,
                  [
                    { text: 'Xaridni davom ettirish' },
                    { text: 'Savatchaga o‘tish', onPress: () => router.push('/(tabs)/cart') },
                  ],
                );
              }}
            >
              <Text style={styles.confirmRollBtnText}>Savatchaga qo‘shish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748b',
    padding: 4,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  widthOptionsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  widthOptionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  widthOptionBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  widthOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  widthOptionTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  lengthInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 14,
  },
  calcBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  calcLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  calcTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 6,
    paddingTop: 8,
  },
  calcTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  calcTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
  },
  confirmRollBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRollBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  variantPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  variantPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0284c7',
  },
  variantPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  variantPillTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  similarSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  similarSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  similarList: {
    gap: 12,
    paddingRight: 16,
  },
  similarCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  similarImageWrapper: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 6,
    position: 'relative',
  },
  similarImage: {
    width: '100%',
    height: '100%',
  },
  similarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarDiscountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  similarDiscountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  similarName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  similarSize: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  similarPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
});


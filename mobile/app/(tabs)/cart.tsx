import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore, type CartLineItem } from '@/store/cart.store';
import { resolveImageUrl } from '@/utils/image';
import EmptyState from '@/components/EmptyState';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);

  const subtotal = getSubtotal();
  const formattedSubtotal = new Intl.NumberFormat('uz-UZ').format(subtotal);

  const handleClear = () => {
    Alert.alert(
      'Savatchani tozalash',
      'Haqiqatan ham barcha mahsulotlarni savatchadan o‘chirmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tozalash',
          style: 'destructive',
          onPress: clearCart,
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: CartLineItem }) => {
    const displayImg = resolveImageUrl(item.image);
    const isRoll = item.isRoll;

    let linePrice = item.price * item.quantity;
    if (isRoll && item.pricePerM2 && item.widthCm && item.lengthCm) {
      const areaM2 = (item.widthCm / 100) * (item.lengthCm / 100);
      linePrice = Math.round(areaM2 * item.pricePerM2) * item.quantity;
    }

    const formattedLinePrice = new Intl.NumberFormat('uz-UZ').format(linePrice);

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: displayImg }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        <View style={styles.cardDetails}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeItem(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Roll specs vs Ready carpet specs */}
          {isRoll ? (
            <View style={styles.rollBadgeContainer}>
              <Text style={styles.rollBadgeText}>
                📏 Metraj: {item.widthCm}sm × {item.lengthCm}sm (
                {((item.widthCm! / 100) * (item.lengthCm! / 100)).toFixed(2)} m²)
              </Text>
              <Text style={styles.rollPricePerM2}>
                {new Intl.NumberFormat('uz-UZ').format(item.pricePerM2 || 0)} so‘m / m²
              </Text>
            </View>
          ) : (
            <Text style={styles.cardMeta}>
              {item.size ? `O‘lchami: ${item.size}` : ''}
              {item.material ? ` • ${item.material}` : ''}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.linePrice}>{formattedLinePrice} so‘m</Text>

            {/* Quantity Controller */}
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, -1)}
                activeOpacity={0.7}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Savatcha</Text>
          <Text style={styles.headerSubtitle}>
            {items.length > 0
              ? `${items.length} xil mahsulot tanlandi`
              : 'Savatchangiz bo‘sh'}
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={styles.clearBtnText}>Tozalash</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Savatchangiz bo‘sh"
          message="Siz hali birorta gilam qo‘shmadingiz. Katalogdan o‘zingizga yoqqan gilamni tanlang."
          actionText="Katalogga o‘tish"
          onAction={() => router.push('/(tabs)/catalog')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Sticky Bottom Checkout Summary */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Jami summa:</Text>
            <Text style={styles.summaryTotal}>{formattedSubtotal} so‘m</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push('/checkout')}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Buyurtma berish →</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
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
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  removeIcon: {
    fontSize: 16,
    color: '#94a3b8',
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rollBadgeContainer: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  rollBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  rollPricePerM2: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  linePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284c7',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  qtyValue: {
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0284c7',
  },
  checkoutBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

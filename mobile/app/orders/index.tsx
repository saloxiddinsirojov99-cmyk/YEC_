import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '@/services/order.service';
import { useAuthStore } from '@/store/auth.store';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import type { Order, OrderStatus } from '@/types/order';

const STATUS_LABELS: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Kutilmoqda', bg: '#fef3c7', color: '#b45309' },
  ACCEPTED: { label: 'Qabul qilindi', bg: '#e0f2fe', color: '#0369a1' },
  CUTTING: { label: 'Kesilmoqda', bg: '#f3e8ff', color: '#7e22ce' },
  READY_FOR_DELIVERY: { label: 'Yetkazishga tayyor', bg: '#e0e7ff', color: '#4338ca' },
  ON_WAY: { label: 'Yo‘lda', bg: '#dbeafe', color: '#1d4ed8' },
  DELIVERED: { label: 'Yetkazildi', bg: '#dcfce7', color: '#15803d' },
  COMPLETED: { label: 'Yakunlandi', bg: '#d1fae5', color: '#047857' },
  CANCELLED: { label: 'Bekor qilindi', bg: '#fee2e2', color: '#b91c1c' },
  CANCEL_REQUESTED: { label: 'Bekor so‘ralgan', bg: '#ffedd5', color: '#c2410c' },
  RETURN_REQUESTED: { label: 'Qaytarish so‘ralgan', bg: '#fef9c3', color: '#a16207' },
  RETURN_APPROVED: { label: 'Qaytarish tasdiqlandi', bg: '#dcfce7', color: '#15803d' },
  RETURN_REJECTED: { label: 'Qaytarish rad etildi', bg: '#fee2e2', color: '#b91c1c' },
  REFUNDED: { label: 'Pul qaytarildi', bg: '#f1f5f9', color: '#475569' },
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getMyOrders(),
    enabled: isAuthenticated,
  });

  const orders = data?.items || [];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtmalarim</Text>
        </View>
        <EmptyState
          icon="🔒"
          title="Tizimga kiring"
          message="Buyurtmalaringiz tarixini ko‘rish uchun iltimos akkauntingizga kiring."
          actionText="Kirish"
          onAction={() => router.push('/auth/login')}
        />
      </SafeAreaView>
    );
  }

  const renderOrderCard = ({ item }: { item: Order }) => {
    const statusMeta = STATUS_LABELS[item.status] || {
      label: item.status,
      bg: '#f1f5f9',
      color: '#475569',
    };

    const formattedDate = new Date(item.createdAt).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const totalAmount = item.items?.reduce((sum, line) => {
      return sum + Number(line.price || 0) * (line.quantity || 1);
    }, 0) || 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/orders/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Buyurtma #{item.id.slice(-6)}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDivider} />

        <View style={styles.orderFooter}>
          <Text style={styles.itemCountText}>
            {item.items?.length || 0} xil mahsulot
          </Text>
          <Text style={styles.totalPrice}>
            {new Intl.NumberFormat('uz-UZ').format(totalAmount)} so‘m
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtmalar tarixi</Text>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Buyurtmalar yuklanmoqda...</Text>
        </View>
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message || 'Buyurtmalarni yuklashda xatolik'}
          onRetry={refetch}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Buyurtmalar mavjud emas"
          message="Sizda hali hech qanday buyurtma mavjud emas."
          actionText="Katalogga o‘tish"
          onAction={() => router.push('/(tabs)/catalog')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#0284c7"
            />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 20,
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 13,
    color: '#64748b',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
  },
});

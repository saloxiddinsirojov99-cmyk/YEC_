import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getOrderById } from '@/services/order.service';
import ErrorState from '@/components/ErrorState';
import type { OrderStatus } from '@/types/order';

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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => getOrderById(id || ''),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Buyurtma tafsilotlari yuklanmoqda...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xatolik</Text>
        </View>
        <ErrorState
          message={(error as Error)?.message || 'Buyurtma topilmadi'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const statusMeta = STATUS_LABELS[order.status] || {
    label: order.status,
    bg: '#f1f5f9',
    color: '#475569',
  };

  const totalAmount = order.items?.reduce((sum, line) => {
    return sum + Number(line.price || 0) * (line.quantity || 1);
  }, 0) || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtma #{order.id.slice(-6)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusCardTitle}>Buyurtma holati</Text>
            <Text style={styles.statusCardDate}>
              {new Date(order.createdAt).toLocaleString('uz-UZ')}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {/* Ordered Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mahsulotlar ({order.items?.length || 0})</Text>
          {order.items?.map((item, idx) => {
            const lineTotal = Number(item.price || 0) * (item.quantity || 1);
            return (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.carpetName || item.carpet?.name || 'Gilam'}
                  </Text>
                  {item.selectedWidthCm && item.selectedLengthCm ? (
                    <Text style={styles.itemMeta}>
                      📏 Metraj: {item.selectedWidthCm}sm × {item.selectedLengthCm}sm
                    </Text>
                  ) : null}
                  <Text style={styles.itemQty}>Soni: {item.quantity} dona</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {new Intl.NumberFormat('uz-UZ').format(lineTotal)} so‘m
                </Text>
              </View>
            );
          })}
        </View>

        {/* Delivery & Customer Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Yetkazib berish ma'lumotlari</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Qabul qiluvchi:</Text>
            <Text style={styles.infoValue}>{order.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefon:</Text>
            <Text style={styles.infoValue}>{order.phone}</Text>
          </View>
          {order.phone2 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Qo‘shimcha tel:</Text>
              <Text style={styles.infoValue}>{order.phone2}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Manzil:</Text>
            <Text style={styles.infoValue}>{order.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To‘lov usuli:</Text>
            <Text style={styles.infoValue}>{order.paymentMethod || 'CASH'}</Text>
          </View>
          {order.comment ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Izoh:</Text>
              <Text style={styles.infoValue}>{order.comment}</Text>
            </View>
          ) : null}
        </View>

        {/* Total Summary */}
        <View style={styles.totalCard}>
          <Text style={styles.totalCardLabel}>Jami to‘langan / to‘lanadigan summa:</Text>
          <Text style={styles.totalCardValue}>
            {new Intl.NumberFormat('uz-UZ').format(totalAmount)} so‘m
          </Text>
        </View>
      </ScrollView>
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusCardDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemMeta: {
    fontSize: 12,
    color: '#0284c7',
    marginTop: 2,
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    maxWidth: '65%',
    textAlign: 'right',
  },
  totalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalCardLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  totalCardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0284c7',
  },
});

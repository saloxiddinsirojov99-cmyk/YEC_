import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { createOrder, type CreateOrderPayload } from '@/services/order.service';
import { getErrorMessage } from '@/services/api';
import type { PaymentMethod } from '@/types/order';

export default function CheckoutScreen() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const subtotal = getSubtotal();

  // Form states prefilled if user is logged in
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+998');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [locationText, setLocationText] = useState(user?.address || 'Toshkent shahri');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [loading, setLoading] = useState(false);

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert('Xatolik', 'Iltimos, ismingizni kiriting.');
      return;
    }
    if (!phone.trim() || !/^\+998\d{9}$/.test(phone.trim())) {
      Alert.alert('Xatolik', 'Telefon raqam +998901234567 formatida bo‘lishi kerak.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Xatolik', 'Iltimos, yetkazib berish manzilini kiriting.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Xatolik', 'Savatchangiz bo‘sh.');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Avtorizatsiya talab qilinadi',
        'Buyurtma berish uchun iltimos tizimga kiring.',
        [
          { text: 'Bekor qilish' },
          { text: 'Kirish', onPress: () => router.push('/auth/login') },
        ],
      );
      return;
    }

    try {
      setLoading(true);

      const orderPayload: CreateOrderPayload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        phone2: phone2.trim() ? phone2.trim() : undefined,
        address: address.trim(),
        locationLat: 41.311081, // Default Tashkent coordinates if no map picker
        locationLng: 69.279723,
        locationText: locationText.trim() || address.trim(),
        paymentMethod: paymentMethod,
        comment: comment.trim() || undefined,
        items: items.map((item) => ({
          carpetId: item.carpetId,
          quantity: item.quantity,
          widthCm: item.widthCm,
          lengthCm: item.lengthCm,
        })),
        termsAccepted: true,
      };

      const createdOrder = await createOrder(orderPayload);

      // Successfully created: clear cart and show confirmation
      clearCart();

      Alert.alert(
        'Buyurtma qabul qilindi!',
        `Buyurtmangiz muvaffaqiyatli rasmiylashtirildi.\nBuyurtma raqami: #${createdOrder.id.slice(-6)}`,
        [
          {
            text: 'Buyurtmalar tarixiga o‘tish',
            onPress: () => router.replace('/orders'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Buyurtma berishda xatolik', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtmani rasmiylashtirish</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section: Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ism va Familiya *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ali Valiyev"
                placeholderTextColor="#94a3b8"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asosiy telefon raqam *</Text>
              <TextInput
                style={styles.input}
                placeholder="+998901234567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Qo‘shimcha telefon raqam</Text>
              <TextInput
                style={styles.input}
                placeholder="+998911112233"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone2}
                onChangeText={setPhone2}
              />
            </View>
          </View>

          {/* Section: Delivery Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>To‘liq manzil *</Text>
              <TextInput
                style={styles.input}
                placeholder="Toshkent shahri, Chilonzor tumani, 9-mavze, 12-uy"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mo‘ljal yoki sharh</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Kuryer uchun qo‘shimcha izoh yoki mo‘ljal"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={comment}
                onChangeText={setComment}
              />
            </View>
          </View>

          {/* Section: Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>To‘lov usuli</Text>
            <View style={styles.paymentOptions}>
              {[
                { id: 'CASH', title: 'Naqd pul (Yetkazilganda)', icon: '💵' },
                { id: 'CLICK', title: 'Click orqali to‘lov', icon: '📱' },
                { id: 'PAYME', title: 'Payme orqali to‘lov', icon: '💳' },
                { id: 'CARD', title: 'Bank kartasi orqali', icon: '🏦' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentCard,
                    paymentMethod === method.id && styles.paymentCardActive,
                  ]}
                  onPress={() => setPaymentMethod(method.id as PaymentMethod)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.paymentIcon}>{method.icon}</Text>
                  <Text
                    style={[
                      styles.paymentTitle,
                      paymentMethod === method.id && styles.paymentTitleActive,
                    ]}
                  >
                    {method.title}
                  </Text>
                  <View
                    style={[
                      styles.radioCircle,
                      paymentMethod === method.id && styles.radioCircleActive,
                    ]}
                  >
                    {paymentMethod === method.id && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Buyurtma tafsilotlari</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Mahsulotlar soni:</Text>
              <Text style={styles.summaryValue}>{items.length} ta</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Yetkazib berish:</Text>
              <Text style={styles.summaryValue}>Bepul</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.totalLabel}>To‘lanadigan summa:</Text>
              <Text style={styles.totalValue}>
                {new Intl.NumberFormat('uz-UZ').format(subtotal)} so‘m
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Submit Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitOrderBtn, loading && styles.submitOrderBtnDisabled]}
            onPress={handleSubmitOrder}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitOrderBtnText}>
                Buyurtmani tasdiqlash ({new Intl.NumberFormat('uz-UZ').format(subtotal)} so‘m)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  section: {
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
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  paymentOptions: {
    gap: 8,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0284c7',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  paymentTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  paymentTitleActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0284c7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryText: {
    fontSize: 13,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
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
  },
  submitOrderBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitOrderBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitOrderBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

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
import {
  createOrder,
  previewPromoCode,
  type CreateOrderPayload,
  type PromoPreviewResponse,
} from '@/services/order.service';
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

  // Promo Code States
  const [promoInput, setPromoInput] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoPreview, setPromoPreview] = useState<PromoPreviewResponse | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Delivery and Pricing Calculations
  const promoDiscount = promoPreview?.pricing?.promoDiscountAmount ?? 0;
  const finalTotal =
    promoPreview?.pricing?.totalAfterPromo != null && promoPreview.state === 'valid'
      ? promoPreview.pricing.totalAfterPromo
      : subtotal;
  const isFreeDelivery = subtotal >= 5000000;

  const handleApplyPromo = async () => {
    const trimmed = promoInput.trim().toUpperCase();
    if (!trimmed) {
      setPromoError('Iltimos, promokodni kiriting.');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert(
        'Avtorizatsiya talab qilinadi',
        'Promokoddan foydalanish uchun iltimos profilingizga kiring.',
        [
          { text: 'Bekor qilish' },
          { text: 'Kirish', onPress: () => router.push('/auth/login') },
        ],
      );
      return;
    }

    try {
      setPromoChecking(true);
      setPromoError(null);
      setPromoSuccess(null);

      const res = await previewPromoCode({
        promoCode: trimmed,
        items: items.map((i) => ({ carpetId: i.carpetId, quantity: i.quantity })),
      });

      if (res.state === 'valid') {
        setPromoPreview(res);
        setPromoSuccess(res.message || `"${trimmed}" promokodi muvaffaqiyatli qo‘llandi!`);
      } else {
        setPromoPreview(null);
        setPromoError(res.message || 'Kiritilgan promokod yaroqsiz.');
      }
    } catch (err: any) {
      setPromoPreview(null);
      setPromoError(
        err?.response?.data?.message || err?.message || 'Promokodni tekshirishda xatolik yuz berdi.',
      );
    } finally {
      setPromoChecking(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoInput('');
    setPromoPreview(null);
    setPromoError(null);
    setPromoSuccess(null);
  };

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
        locationLat: 41.311081, // Default Tashkent coordinates
        locationLng: 69.279723,
        locationText: locationText.trim() || address.trim(),
        paymentMethod: paymentMethod,
        comment: comment.trim() || undefined,
        promoCode:
          promoPreview?.state === 'valid' && promoPreview.promo?.code
            ? promoPreview.promo.code
            : promoInput.trim()
            ? promoInput.trim().toUpperCase()
            : undefined,
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

          {/* Section: Promo Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Promokod</Text>
            {promoPreview?.state === 'valid' ? (
              <View style={styles.promoSuccessBox}>
                <View style={styles.promoSuccessInfo}>
                  <Text style={styles.promoSuccessIcon}>🎟️</Text>
                  <View style={styles.promoSuccessTextCol}>
                    <Text style={styles.promoSuccessCode}>
                      {promoPreview.promo?.code || promoInput}
                    </Text>
                    <Text style={styles.promoSuccessDesc}>
                      {promoPreview.promo?.type === 'GIFT'
                        ? `Sovg‘a: ${promoPreview.promo.giftName || 'Gilamcha'}`
                        : promoDiscount > 0
                        ? `-${new Intl.NumberFormat('uz-UZ').format(promoDiscount)} so‘m chegirma`
                        : `-${promoPreview.promo?.discountPercent || 0}% chegirma`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.promoRemoveBtn}
                  onPress={handleRemovePromo}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promoRemoveBtnText}>Bekor qilish</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.promoInputRow}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Promokodni kiriting (masalan: YEC2026)"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    value={promoInput}
                    onChangeText={(text) => {
                      setPromoInput(text);
                      if (promoError) setPromoError(null);
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.promoApplyBtn,
                      (!promoInput.trim() || promoChecking) && styles.promoApplyBtnDisabled,
                    ]}
                    onPress={handleApplyPromo}
                    disabled={!promoInput.trim() || promoChecking}
                    activeOpacity={0.8}
                  >
                    {promoChecking ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.promoApplyBtnText}>Qo‘llash</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {promoError && <Text style={styles.promoErrorText}>{promoError}</Text>}
                {promoSuccess && <Text style={styles.promoSuccessText}>{promoSuccess}</Text>}
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Buyurtma tafsilotlari</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Mahsulotlar soni:</Text>
              <Text style={styles.summaryValue}>{items.length} ta</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Mahsulotlar summasi:</Text>
              <Text style={styles.summaryValue}>
                {new Intl.NumberFormat('uz-UZ').format(subtotal)} so‘m
              </Text>
            </View>
            {promoDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, styles.discountText]}>
                  Promokod chegirmasi:
                </Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{new Intl.NumberFormat('uz-UZ').format(promoDiscount)} so‘m
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Yetkazib berish:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  isFreeDelivery && styles.freeDeliveryValue,
                ]}
              >
                {isFreeDelivery
                  ? 'Bepul (Toshkent bo‘ylab)'
                  : 'Kuryer orqali (5 mln+ bepul)'}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.totalLabel}>To‘lanadigan jami summa:</Text>
              <Text style={styles.totalValue}>
                {new Intl.NumberFormat('uz-UZ').format(finalTotal)} so‘m
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
                Buyurtmani tasdiqlash ({new Intl.NumberFormat('uz-UZ').format(finalTotal)} so‘m)
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
  discountText: {
    color: '#16a34a',
  },
  discountValue: {
    color: '#16a34a',
    fontWeight: '700',
  },
  freeDeliveryValue: {
    color: '#16a34a',
    fontWeight: '700',
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  promoApplyBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  promoApplyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  promoErrorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  promoSuccessText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  promoSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 12,
  },
  promoSuccessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promoSuccessIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  promoSuccessTextCol: {
    flex: 1,
  },
  promoSuccessCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  promoSuccessDesc: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2,
  },
  promoRemoveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  promoRemoveBtnText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
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

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useFavoritesStore } from '@/store/favorites.store';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const cartCount = useCartStore((state) => state.getTotalCount());
  const favoritesCount = useFavoritesStore(
    (state) => Object.keys(state.favorites).length,
  );

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Haqiqatan ham profilingizdan chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'Chiqish',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Alert.alert('Chiqildi', 'Profilingizdan muvaffaqiyatli chiqdingiz.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mening profilim</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isAuthenticated && user ? (
          /* AUTHENTICATED STATE */
          <View>
            {/* User Info Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
                {user.email && (
                  <Text style={styles.userEmail}>{user.email}</Text>
                )}
                {user.address && (
                  <Text style={styles.userAddress}>📍 {user.address}</Text>
                )}
              </View>
            </View>

            {/* Account Navigation Options */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Xaridlar & Buyurtmalar</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/orders')}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>📦</Text>
                  <Text style={styles.menuLabel}>Mening buyurtmalarim</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/cart')}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>🛒</Text>
                  <Text style={styles.menuLabel}>Savatchadagi mahsulotlar</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/favorites')}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>❤️</Text>
                  <Text style={styles.menuLabel}>Sevimlilar ro‘yxati</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{favoritesCount}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Logout Action */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutBtnText}>Tizimdan chiqish (Logout)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* GUEST STATE */
          <View style={styles.guestContainer}>
            <View style={styles.guestIconCircle}>
              <Text style={styles.guestIcon}>👤</Text>
            </View>
            <Text style={styles.guestTitle}>Xush kelibsiz!</Text>
            <Text style={styles.guestSubtitle}>
              Buyurtmalarni boshqarish, yetkazib berish manzillarini saqlash va
              shaxsiy chegirmalardan foydalanish uchun tizimga kiring.
            </Text>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Kirish (Login)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.registerBtnText}>
                Yangi hisob ochish (Ro‘yxatdan o‘tish)
              </Text>
            </TouchableOpacity>

            <View style={styles.guestFeatures}>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Buyurtmalar tarixini kuzatish</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Maxsus metraj gilamlarni buyurtma qilish</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>Tezkor xarid va manzilni saqlash</Text>
              </View>
            </View>
          </View>
        )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0284c7',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  userPhone: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  userAddress: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuArrow: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
  guestContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestIcon: {
    fontSize: 36,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerBtn: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  registerBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  guestFeatures: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
  },
});

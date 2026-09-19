import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { requestRegisterOtp, verifyRegisterOtp } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  // Step 1: Form details, Step 2: OTP verification
  const [step, setStep] = useState<1 | 2>(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Xatolik', 'Iltimos, ism va familiyangizni kiriting.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Xatolik', 'Iltimos, to‘g‘ri email manzil kiriting.');
      return;
    }
    if (!phone.trim() || !/^\+998\d{9}$/.test(phone.trim())) {
      Alert.alert('Xatolik', 'Telefon raqam +998901234567 formatida bo‘lishi kerak.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
      return;
    }

    try {
      setLoading(true);
      await requestRegisterOtp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      Alert.alert(
        'Kod yuborildi',
        `Tasdiqlash kodi ${email.trim()} manziliga yuborildi. Iltimos, emailingizni tekshiring.`,
      );
      setStep(2);
    } catch (error) {
      Alert.alert("Ro'yxatdan o'tishda xatolik", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert('Xatolik', 'Iltimos, 6 xonali tasdiqlash kodini kiriting.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyRegisterOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setUser(res.user);
      Alert.alert("Muvaffaqiyatli!", "Ro'yxatdan o'tish yakunlandi!", [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Tasdiqlashda xatolik', getErrorMessage(error));
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (step === 2 ? setStep(1) : router.back())}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {step === 1 ? "Ro'yxatdan o'tish" : 'Kodni tasdiqlash'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'YEC Market xaridorlar qatoriga qo‘shiling'
                : `${email} ga yuborilgan 6 xonali kodni kiriting`}
            </Text>
          </View>

          {step === 1 ? (
            /* STEP 1: Registration fields */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ism</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ali"
                  placeholderTextColor="#94a3b8"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Familiya</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Valiyev"
                  placeholderTextColor="#94a3b8"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email manzil</Text>
                <TextInput
                  style={styles.input}
                  placeholder="user@example.uz"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefon raqam</Text>
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
                <Text style={styles.label}>Parol</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kamida 6 ta belgi"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Tasdiqlash kodini olish</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Akkauntingiz bormi? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/auth/login')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}>Kirish</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* STEP 2: OTP Verification */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tasdiqlash kodi (6 xonali)</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="123456"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Tasdiqlash va Yakunlash</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                <Text style={styles.resendText}>Kodni qayta yuborish</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 20,
    color: '#0f172a',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0f172a',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284c7',
  },
});

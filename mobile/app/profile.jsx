import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Image, Platform, StatusBar, TextInput, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  User, LogOut, Check, Droplet, Droplets, Circle, Leaf, AlertTriangle, ChevronLeft
} from 'lucide-react-native';
import { theme } from '../src/theme';
import api from '../src/api';
import BottomNav from '../components/BottomNav';

const ICON_MAP = {
  Milk: Droplet, Wheat: Leaf, Nut: Circle,
  Fish: Droplets, Egg: Circle, Apple: Leaf,
  Flame: AlertTriangle, Leaf: Leaf
};

const ALLERGY_CATEGORIES = [
  {
    id: 'dairy', title: 'Süt ve Süt Ürünleri', icon: 'Milk',
    description: 'Laktoz veya kazein içeren tüm ürünler',
    options: [
      { id: 'all_dairy', label: 'Süt ve Tüm Süt Ürünleri (Kazein)' },
      { id: 'lactose', label: 'Laktoz İntoleransı' },
      { id: 'goat_sheep', label: 'Keçi / Koyun Sütü Ürünleri' }
    ]
  },
  {
    id: 'gluten', title: 'Gluten ve Tahıllar', icon: 'Wheat',
    description: 'Çölyak veya çapraz bulaşma riskli tahıllar',
    options: [
      { id: 'celiac', label: 'Gluten Alerjisi / Çölyak' },
      { id: 'oats', label: 'Yulaf (Çapraz Bulaşma)' },
      { id: 'corn', label: 'Mısır ve Mısır Ürünleri' }
    ]
  },
  {
    id: 'nuts', title: 'Kuruyemişler ve Tohumlar', icon: 'Nut',
    description: 'Ağaç yemişleri, yer fıstığı ve tohumlar',
    options: [
      { id: 'all_nuts', label: 'Tüm Kuruyemişler' },
      { id: 'peanut', label: 'Yer Fıstığı' },
      { id: 'almond', label: 'Badem' }
    ]
  },
  {
    id: 'veg_fruits', title: 'Sebze, Meyve ve Çapraz Alerjiler', icon: 'Apple',
    description: 'Patlıcangiller, histamin salgılayan meyveler',
    options: [
      { id: 'nightshades', label: 'Patlıcangiller (Domates, Patates)' },
      { id: 'latex_fruit', label: 'Geç Çiçek Açanlar (Muz, Avokado)' }
    ]
  },
  {
    id: 'special_diets', title: 'Özel Diyetler ve Tıbbi Tercihler', icon: 'Leaf',
    description: 'FODMAP, Keto, Vegan vb.',
    options: [
      { id: 'keto', label: 'Ketojenik (Keto) Diyet' },
      { id: 'vegan', label: 'Vegan / Vejetaryen' }
    ]
  }
];

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Jude', 'Ryker', 'Nolan', 'Oliver', 'Amaya', 'Leo', 'Mia'];
const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/micah/png?seed=${seed}&backgroundColor=transparent`;
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function ProfileScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarSeed, setAvatarSeed] = useState('Felix');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState([]);

  useEffect(() => {
    loadFromCacheThenSync();
  }, []);

  const loadFromCacheThenSync = async () => {
    // 1. Önce cache'den anlık yükle (spinner yok)
    try {
      const cached = await AsyncStorage.getItem('bb_profile_cache');
      const savedAvatar = await AsyncStorage.getItem('bb_avatar');
      if (cached) {
        const data = JSON.parse(cached);
        setUser(data);
        if (data.height_cm) setHeight(String(data.height_cm));
        if (data.weight_kg) setWeight(String(data.weight_kg));
        if (data.dietary_preferences) setAllergies(data.dietary_preferences);
      }
      if (savedAvatar) setAvatarSeed(savedAvatar);
    } catch (_) {}

    // 2. Arka planda API'den güncelle (sessizce)
    try {
      const resp = await api.get('users/me');
      setUser(resp.data);
      if (resp.data.height_cm) setHeight(String(resp.data.height_cm));
      if (resp.data.weight_kg) setWeight(String(resp.data.weight_kg));
      if (resp.data.dietary_preferences) setAllergies(resp.data.dietary_preferences);
      await AsyncStorage.setItem('bb_profile_cache', JSON.stringify(resp.data));
    } catch (err) {
      // Cache varsa sorun yok, sadece stale veri gösterir
      if (!user) Alert.alert('Hata', 'Profil yüklenemedi.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        height_cm: height ? parseFloat(height) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        dietary_preferences: allergies,
      };
      await api.patch('users/me', payload);
      await AsyncStorage.setItem('bb_avatar', avatarSeed);
      setUser(prev => ({ ...prev, ...payload }));
      Alert.alert('✅ Kaydedildi', 'Profil bilgileriniz güncellendi.');
    } catch (err) {
      Alert.alert('Hata', 'Profil kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => {
          if (Platform.OS === 'web') localStorage.removeItem('token');
          else await SecureStore.deleteItemAsync('token');
          router.replace('/login');
        }
      }
    ]);
  };

  const toggleAllergy = (label) => {
    setAllergies(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };


  const bmi = height && weight
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
    : null;

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBg}>
              <User size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Profilim</Text>
              <Text style={styles.headerSub}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={20} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Image source={{ uri: getAvatarUrl(avatarSeed) }} style={styles.avatarBig} />
            <Text style={styles.avatarName}>{user?.full_name || 'Kullanıcı'}</Text>
            {bmi && (
              <View style={styles.bmiBadge}>
                <Text style={styles.bmiText}>VKİ: {bmi}</Text>
              </View>
            )}
          </View>

          {/* Avatar Seçimi */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Avatar Seç</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
              {AVATAR_SEEDS.map(seed => (
                <TouchableOpacity
                  key={seed}
                  onPress={() => setAvatarSeed(seed)}
                  style={[styles.avatarOption, avatarSeed === seed && styles.avatarOptionActive]}
                >
                  <Image source={{ uri: getAvatarUrl(seed) }} style={styles.avatarOptionImg} />
                  {avatarSeed === seed && (
                    <View style={styles.avatarCheck}><Check size={10} color="#FFF" /></View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Boy Kilo */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vücut Ölçüleri</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Boy (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="175"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kilo (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>
          </View>

          {/* Alerji */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Alerji & Diyet Tercihleri</Text>
            <Text style={styles.sectionDesc}>Yemek önerilerini kişiselleştirmek için işaretleyin.</Text>
            {ALLERGY_CATEGORIES.map(category => {
              const Icon = ICON_MAP[category.icon] || Leaf;
              return (
                <View key={category.id} style={styles.allergyCategory}>
                  <View style={styles.allergyCatHeader}>
                    <Icon size={16} color={theme.colors.primary} />
                    <Text style={styles.allergyCatTitle}>{category.title}</Text>
                  </View>
                  <View style={styles.allergyOptions}>
                    {category.options.map(opt => {
                      const active = allergies.includes(opt.label);
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.allergyChip, active && styles.allergyChipActive]}
                          onPress={() => toggleAllergy(opt.label)}
                        >
                          <View style={[styles.checkbox, active && styles.checkboxActive]}>
                            {active && <Check size={10} color="#FFF" />}
                          </View>
                          <Text style={[styles.allergyChipText, active && styles.allergyChipTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Kaydet */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: STATUS_BAR_HEIGHT + 12, paddingBottom: 16,
    backgroundColor: theme.colors.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBg: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.colors.glassBg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  headerSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarBig: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, borderWidth: 3, borderColor: theme.colors.primary },
  avatarName: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  bmiBadge: {
    marginTop: 8, paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: theme.colors.glassBg, borderRadius: 20,
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  bmiText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: theme.colors.glassBorder,
    ...theme.shadows?.small,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 },
  avatarRow: { marginTop: 12 },
  avatarOption: {
    width: 56, height: 56, borderRadius: 28, marginRight: 10,
    borderWidth: 2, borderColor: 'transparent', position: 'relative',
  },
  avatarOptionActive: { borderColor: theme.colors.primary },
  avatarOptionImg: { width: 52, height: 52, borderRadius: 26 },
  avatarCheck: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  inputRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: theme.colors.glassBg, borderRadius: 12,
    borderWidth: 1, borderColor: theme.colors.glassBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: theme.colors.text, fontWeight: '600',
  },
  allergyCategory: { marginTop: 16 },
  allergyCatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  allergyCatTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  allergyOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: theme.colors.glassBg,
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  allergyChipActive: { backgroundColor: `${theme.colors.primary}15`, borderColor: theme.colors.primary },
  checkbox: {
    width: 16, height: 16, borderRadius: 4,
    borderWidth: 1.5, borderColor: theme.colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  allergyChipText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  allergyChipTextActive: { color: theme.colors.primary, fontWeight: '700' },
  saveBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

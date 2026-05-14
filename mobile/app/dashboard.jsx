import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image, Platform, StatusBar, Modal, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, LogOut, Star, ChevronRight, Leaf, X, Check, Droplets, Droplet, Circle, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { theme } from '../src/theme';
import api from '../src/api';

const ICON_MAP = {
  Milk: Droplet,
  Wheat: Leaf,
  Nut: Circle,
  Fish: Droplets,
  Egg: Circle,
  Apple: Leaf,
  Flame: AlertTriangle,
  Leaf: Leaf
};

export const ALLERGY_CATEGORIES = [
  {
    id: "dairy",
    title: "Süt ve Süt Ürünleri",
    icon: "Milk",
    description: "Laktoz veya kazein içeren tüm ürünler",
    options: [
      { id: "all_dairy", label: "Süt ve Tüm Süt Ürünleri (Kazein)" },
      { id: "lactose", label: "Laktoz İntoleransı" },
      { id: "goat_sheep", label: "Keçi / Koyun Sütü Ürünleri" }
    ]
  },
  {
    id: "gluten",
    title: "Gluten ve Tahıllar",
    icon: "Wheat",
    description: "Çölyak veya çapraz bulaşma riskli tahıllar",
    options: [
      { id: "celiac", label: "Gluten Alerjisi / Çölyak" },
      { id: "oats", label: "Yulaf (Çapraz Bulaşma)" },
      { id: "corn", label: "Mısır ve Mısır Ürünleri" }
    ]
  },
  {
    id: "nuts",
    title: "Kuruyemişler ve Tohumlar",
    icon: "Nut",
    description: "Ağaç yemişleri, yer fıstığı ve tohumlar",
    options: [
      { id: "all_nuts", label: "Tüm Kuruyemişler" },
      { id: "peanut", label: "Yer Fıstığı" },
      { id: "almond", label: "Badem" }
    ]
  },
  {
    id: "veg_fruits",
    title: "Sebze, Meyve ve Çapraz Alerjiler",
    icon: "Apple",
    description: "Patlıcangiller, histamin salgılayan meyveler",
    options: [
      { id: "nightshades", label: "Patlıcangiller (Domates, Patates)" },
      { id: "latex_fruit", label: "Geç Çiçek Açanlar (Muz, Avokado)" }
    ]
  },
  {
    id: "special_diets",
    title: "Özel Diyetler ve Tıbbi Tercihler",
    icon: "Leaf",
    description: "FODMAP, Keto, Vegan vb.",
    options: [
      { id: "keto", label: "Ketojenik (Keto) Diyet" },
      { id: "vegan", label: "Vegan / Vejetaryen" }
    ]
  }
];

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Jude', 'Ryker', 'Nolan', 'Oliver', 'Amaya', 'Leo', 'Mia'];
const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/micah/png?seed=${seed}&backgroundColor=transparent`;

import BottomNav from '../components/BottomNav';

import { getMealImage } from '../src/imageMap';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [fetchingInsight, setFetchingInsight] = useState(false);
  const router = useRouter();

  // Profile Modal State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState('Felix');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const resp = await api.get('users/me');
      setUser(resp.data);
      if (resp.data.height_cm) setHeight(String(resp.data.height_cm));
      if (resp.data.weight_kg) setWeight(String(resp.data.weight_kg));
      if (resp.data.dietary_preferences) setAllergies(resp.data.dietary_preferences);
      
      const savedAvatar = await AsyncStorage.getItem('bb_avatar');
      if (savedAvatar) setAvatarSeed(savedAvatar);
    } catch (err) {
      if (Platform.OS === 'web') {
        localStorage.removeItem('token');
      } else {
        await SecureStore.deleteItemAsync('token');
      }
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          if (Platform.OS === 'web') {
            localStorage.removeItem('token');
          } else {
            await SecureStore.deleteItemAsync('token');
          }
          router.replace('/login');
        }
      }
    ]);
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        height_cm: height ? parseFloat(height) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        dietary_preferences: allergies
      };
      await api.patch('users/me', payload);
      await AsyncStorage.setItem('bb_avatar', avatarSeed);
      setUser(prev => ({ ...prev, ...payload }));
      setProfileModalVisible(false);
    } catch (err) {
      Alert.alert('Hata', 'Profil kaydedilemedi.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleUpload(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Hata', 'Dosya seçilemedi');
    }
  };

  const handleUpload = async (fileAsset) => {
    if (!fileAsset) return;
    setUploading(true);
    setInsight(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileAsset.uri,
        name: fileAsset.name || 'test.pdf',
        type: fileAsset.mimeType || 'application/pdf',
      });

      const uploadResp = await api.post('blood-tests/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const testId = uploadResp.data.blood_test_id;

      fetchAIInsight(testId);
    } catch (err) {
      Alert.alert('Hata', err?.response?.data?.detail || 'PDF yükleme sırasında bir sorun oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const fetchAIInsight = async (testId) => {
    setFetchingInsight(true);
    try {
      const resp = await api.post(`blood-tests/${testId}/insights`);
      setInsight(resp.data);
    } catch (err) {
      Alert.alert('Hata', 'AI analizi şu an yapılamıyor. Lütfen tekrar deneyin.');
    } finally {
      setFetchingInsight(false);
    }
  };

  const openRecipe = (meal) => {
    const mealWithLabel = { 
      ...meal, 
      test_label: `Tahlil Sonucu: ${new Date().toLocaleDateString('tr-TR')}` 
    };
    router.push({
      pathname: '/recipe',
      params: { meal: JSON.stringify(mealWithLabel) }
    });
  };

  const saveAllRecipes = async () => {
    if (!insight || !insight.daily_plans) return;
    
    try {
      const storageModule = Platform.OS === 'web' ? window.localStorage : require('@react-native-async-storage/async-storage').default;
      const data = Platform.OS === 'web' ? storageModule.getItem('bb_saved_recipes') : await storageModule.getItem('bb_saved_recipes');
      let list = data ? JSON.parse(data) : [];
      
      const testLabel = `Tahlil Sonucu: ${new Date().toLocaleDateString('tr-TR')}`;
      let addedCount = 0;

      insight.daily_plans.forEach(day => {
        day.meals.forEach(meal => {
          if (!list.some(r => r.food_name === meal.food_name)) {
            list.push({ ...meal, id: Date.now() + Math.random(), test_label: testLabel });
            addedCount++;
          }
        });
      });
      
      if (addedCount > 0) {
        if (Platform.OS === 'web') {
          storageModule.setItem('bb_saved_recipes', JSON.stringify(list));
        } else {
          await storageModule.setItem('bb_saved_recipes', JSON.stringify(list));
        }
        Alert.alert('Başarılı', `Tüm menüdeki ${addedCount} yeni tarif kaydedildi.`);
      } else {
        Alert.alert('Bilgi', 'Menüdeki tüm tarifler zaten kaydedilmiş.');
      }
    } catch (err) {
      Alert.alert('Hata', 'Tarifler kaydedilemedi.');
    }
  };

  // Removed full-screen loading block to fix navigation performance delay

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={() => setProfileModalVisible(true)} activeOpacity={0.8} style={styles.avatarContainer}>
              <Image
                source={{ uri: getAvatarUrl(avatarSeed) }}
                style={styles.avatarNew}
              />
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Merhaba 👋</Text>
              <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.leafAccent}>
            <Leaf size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.mainTitle}>Cook <Text style={styles.titleHighlight}>Special</Text></Text>
          <Text style={styles.mainTitle}>Every Day</Text>
          <Text style={styles.subtitle}>Tahlil sonuçlarına göre kişiselleştirilmiş beslenme planın</Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadBtn, (uploading || fetchingInsight) && styles.uploadBtnDisabled]}
          onPress={pickDocument}
          disabled={uploading || fetchingInsight}
          activeOpacity={0.85}
        >
          {uploading ? (
            <>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={styles.uploadBtnText}>PDF Yükleniyor...</Text>
            </>
          ) : (
            <>
              <View style={styles.uploadIconBg}>
                <Upload size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.uploadBtnText}>E-Nabız Tahlili Yükle</Text>
            </>
          )}
        </TouchableOpacity>

        {/* AI Processing Indicator */}
        {fetchingInsight && (
          <View style={styles.aiLoadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.aiLoadingTitle}>Yapay Zeka Analiz Yapıyor</Text>
            <Text style={styles.aiLoadingSubtitle}>Tahlil sonuçlarına göre 3 günlük menü hazırlanıyor...</Text>
          </View>
        )}

        {/* AI Daily Plans */}
        {insight?.daily_plans && (
          <View style={styles.plansContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Beslenme Planın</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>3 Günlük</Text>
              </View>
            </View>

            {insight.summary ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>{insight.summary}</Text>
              </View>
            ) : null}

            {insight.daily_plans.map((day, dIdx) => (
              <View key={dIdx} style={styles.daySection}>
                <View style={styles.dayHeaderRow}>
                  <View style={styles.dayDot} />
                  <Text style={styles.dayTitle}>{day.day_name}</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mealScroll}
                >
                  {day.meals.map((meal, mIdx) => (
                    <TouchableOpacity
                      key={mIdx}
                      style={styles.mealCard}
                      onPress={() => openRecipe(meal)}
                      activeOpacity={0.88}
                    >
                      <Image source={getMealImage(meal.image_url)} style={styles.mealImage} />
                      <View style={styles.mealContent}>
                        <Text style={styles.mealType}>{meal.meal_type}</Text>
                        <Text style={styles.mealName} numberOfLines={2}>{meal.food_name}</Text>
                        <View style={styles.mealFooter}>
                          <Text style={styles.ingredientsCount}>
                            {meal.ingredients?.length || 0} malzeme
                          </Text>
                          <View style={styles.ratingBadge}>
                            <Star size={13} color={theme.colors.secondary} fill={theme.colors.secondary} />
                            <Text style={styles.ratingText}>{meal.rating || '5.0'}</Text>
                          </View>
                          <View style={styles.goBtn}>
                            <ChevronRight size={15} color="#FFF" />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}

            {/* Save All Button */}
            <TouchableOpacity 
              style={[styles.uploadBtn, { marginBottom: theme.spacing.xl, marginTop: theme.spacing.s, backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.primary }]} 
              onPress={saveAllRecipes}
              activeOpacity={0.85}
            >
              <View style={[styles.uploadIconBg, { backgroundColor: theme.colors.primary }]}>
                <Star size={18} color="#FFF" />
              </View>
              <Text style={[styles.uploadBtnText, { color: theme.colors.primary }]}>Tüm Tarifleri Kaydet</Text>
            </TouchableOpacity>

          </View>
        )}

        {/* Empty State */}
        {!insight && !fetchingInsight && !uploading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Leaf size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Tahlilini Yükle</Text>
            <Text style={styles.emptySubtitle}>
              E-Nabız'dan indirdiğin kan tahlili PDF'ini yükle, yapay zeka sana özel 3 günlük beslenme planı hazırlasın.
            </Text>
          </View>
        )}

        {/* Profile Settings Modal */}
        <Modal visible={profileModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleSaveProfile}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil ve Sağlık Ayarları</Text>
              <TouchableOpacity onPress={handleSaveProfile} style={styles.modalCloseBtn}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Avatarını Seç (Memoji)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
                {AVATAR_SEEDS.map(seed => (
                  <TouchableOpacity
                    key={seed}
                    onPress={() => setAvatarSeed(seed)}
                    style={[styles.avatarOption, avatarSeed === seed && styles.avatarOptionSelected]}
                  >
                    <Image source={{ uri: getAvatarUrl(seed) }} style={styles.avatarOptionImg} />
                    {avatarSeed === seed && (
                      <View style={styles.avatarCheck}>
                        <Check size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Boy Kilo Endeksi İçin Veriler</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputSubLabel}>Boy (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="175"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputSubLabel}>Kilo (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="70"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Ulusal Alerji ve Diyet Anketi</Text>
              <Text style={styles.inputDesc}>Yemek eleme algoritması için sahip olduğunuz alerjileri ve diyetleri işaretleyin.</Text>
              
              <View style={styles.allergiesContainer}>
                {ALLERGY_CATEGORIES.map(category => {
                  const Icon = ICON_MAP[category.icon] || Leaf;
                  return (
                    <View key={category.id} style={styles.allergyCategory}>
                      <View style={styles.allergyCategoryHeader}>
                        <Icon size={18} color={theme.colors.primary} />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.allergyCategoryTitle}>{category.title}</Text>
                          <Text style={styles.allergyCategoryDesc}>{category.description}</Text>
                        </View>
                      </View>
                      <View style={styles.allergyOptions}>
                        {category.options.map(option => {
                          const isSelected = allergies.includes(option.label);
                          return (
                            <TouchableOpacity
                              key={option.id}
                              style={[styles.allergyOption, isSelected && styles.allergyOptionSelected]}
                              activeOpacity={0.7}
                              onPress={() => {
                                if (isSelected) {
                                  setAllergies(allergies.filter(a => a !== option.label));
                                } else {
                                  setAllergies([...allergies, option.label]);
                                }
                              }}
                            >
                              <View style={[styles.allergyCheckbox, isSelected && styles.allergyCheckboxSelected]}>
                                {isSelected && <Check size={12} color="#FFF" />}
                              </View>
                              <Text style={[styles.allergyOptionText, isSelected && styles.allergyOptionTextSelected]}>
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Modal>

      </ScrollView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingTop: STATUS_BAR_HEIGHT + theme.spacing.m,
    paddingBottom: theme.spacing.s,
    backgroundColor: theme.colors.background,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  avatarNew: {
    width: '100%',
    height: '100%',
  },
  greeting: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  heroSection: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.l,
  },
  leafAccent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  mainTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: theme.colors.primary,
  },
  subtitle: {
    marginTop: theme.spacing.s,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  uploadBtn: {
    marginHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.glassBg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.l,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.small,
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  aiLoadingCard: {
    marginHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.glassBg,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.small,
  },
  aiLoadingTitle: {
    marginTop: theme.spacing.m,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  aiLoadingSubtitle: {
    marginTop: theme.spacing.s,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  plansContainer: {
    marginTop: theme.spacing.s,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  planBadge: {
    backgroundColor: theme.colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  summaryCard: {
    marginHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.primaryBg,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  summaryText: {
    fontSize: 13,
    color: theme.colors.primaryHover,
    lineHeight: 20,
    fontWeight: '500',
  },
  daySection: {
    marginBottom: theme.spacing.xl,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.s,
    gap: theme.spacing.s,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  mealScroll: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.s,
    paddingTop: theme.spacing.xxl + 20,
    gap: theme.spacing.m,
  },
  mealCard: {
    width: 230,
    backgroundColor: theme.colors.glassBg,
    borderRadius: theme.borderRadius.l,
    ...theme.shadows.medium,
    marginTop: 0,
    position: 'relative',
    paddingTop: 80,
    paddingBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
  },
  mealImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'absolute',
    top: -60,
    left: (230 - 140) / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...theme.shadows.small,
  },
  mealContent: {},
  mealType: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  mealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientsCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  goBtn: {
    backgroundColor: theme.colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  emptyState: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 20 : 60,
    backgroundColor: theme.colors.glassBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalCloseBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 80,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  inputDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputSubLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.glassBg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: theme.colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    flex: 1,
  },
  avatarScroll: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderColor: theme.colors.primary,
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
  },
  avatarCheck: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 2,
  },
  allergiesContainer: {
    marginTop: 8,
  },
  allergyCategory: {
    backgroundColor: theme.colors.glassBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.small,
  },
  allergyCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  allergyCategoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  allergyCategoryDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  allergyOptions: {
    gap: 8,
  },
  allergyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  allergyOptionSelected: {
    backgroundColor: theme.colors.primaryBg,
    borderColor: theme.colors.primaryLight,
  },
  allergyCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.textMuted,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergyCheckboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  allergyOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  allergyOptionTextSelected: {
    color: theme.colors.primaryHover,
    fontWeight: '600',
  },
});

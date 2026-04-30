import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image, Platform, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, LogOut, Star, ChevronRight, Leaf } from 'lucide-react-native';
import { theme } from '../src/theme';
import api from '../src/api';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [fetchingInsight, setFetchingInsight] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const resp = await api.get('users/me');
      setUser(resp.data);
    } catch (err) {
      await SecureStore.deleteItemAsync('token');
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
          await SecureStore.deleteItemAsync('token');
          router.replace('/login');
        }
      }
    ]);
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
    router.push({
      pathname: '/recipe',
      params: { meal: JSON.stringify(meal) }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Leaf size={36} color={theme.colors.primary} />
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>BioBistro yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=5DBB63&color=fff&rounded=true&bold=true` }}
            style={styles.avatar}
          />
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
                    <Image source={{ uri: meal.image_url }} style={styles.mealImage} />
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
    </ScrollView>
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
});

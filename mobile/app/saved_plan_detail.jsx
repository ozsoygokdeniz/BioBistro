import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar, Image, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash, Calendar, AlertTriangle, ShieldAlert, Heart, Star, Clock, ChefHat } from 'lucide-react-native';
import { theme } from '../src/theme';
import { getMealImage } from '../src/imageMap';
import api from '../src/api';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function SavedPlanDetailScreen() {
  const router = useRouter();
  const { plan: planParam } = useLocalSearchParams();

  let plan = null;
  try {
    if (planParam) plan = JSON.parse(planParam);
  } catch (err) {
    console.error('Failed to parse plan data');
  }

  const handleDelete = () => {
    if (!plan) return;
    Alert.alert(
      'Planı Sil',
      'Bu yemek planını tüm cihazlarınızdan silmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`recipes/${plan.client_id}`);
              Alert.alert('Başarılı', 'Yemek planı silindi.', [
                { text: 'Tamam', onPress: () => router.back() }
              ]);
            } catch (err) {
              console.warn('Error deleting plan', err);
              Alert.alert('Hata', 'Silme işlemi sırasında bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  const openRecipe = (meal) => {
    const mealWithLabel = { 
      ...meal, 
      test_label: `Kayıtlı Plan: ${plan.recipe_data?.pdfName}` 
    };
    router.push({
      pathname: '/recipe',
      params: { meal: JSON.stringify(mealWithLabel) }
    });
  };

  if (!plan || !plan.recipe_data || !plan.recipe_data.insight) {
    return (
      <View style={styles.errorContainer}>
        <ChefHat size={40} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Plan bilgisi bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { pdfName, date, insight } = plan.recipe_data;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{pdfName}</Text>
          <Text style={styles.headerSubtitle}>Kayıt: {date}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, styles.deleteBtn]}>
          <Trash size={20} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Insight Summary */}
        {insight.summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{insight.summary}</Text>
          </View>
        ) : null}

        {/* Potential Deficiencies & Foods to Avoid */}
        <View style={styles.insightSection}>
          {insight.potential_deficiencies?.length > 0 && (
            <View style={[styles.insightCard, styles.deficienciesCard]}>
              <View style={styles.insightCardHeader}>
                <ShieldAlert size={18} color={theme.colors.secondary} />
                <Text style={[styles.insightCardTitle, { color: theme.colors.secondary }]}>Eksiklikler</Text>
              </View>
              {insight.potential_deficiencies.map((d, i) => (
                <Text key={i} style={styles.insightItemText}>• {d}</Text>
              ))}
            </View>
          )}

          {insight.foods_to_avoid?.length > 0 && (
            <View style={[styles.insightCard, styles.avoidCard]}>
              <View style={styles.insightCardHeader}>
                <AlertTriangle size={18} color={theme.colors.danger} />
                <Text style={[styles.insightCardTitle, { color: theme.colors.danger }]}>Uzak Durun</Text>
              </View>
              {insight.foods_to_avoid.map((f, i) => (
                <Text key={i} style={styles.insightItemText}>• {f}</Text>
              ))}
            </View>
          )}
        </View>

        {/* 3 Day Meal Plans */}
        {insight.daily_plans?.map((dayPlan, dayIdx) => (
          <View key={dayIdx} style={styles.daySection}>
            <View style={styles.dayHeaderRow}>
              <View style={styles.dayDot} />
              <Text style={styles.dayTitle}>{dayPlan.day_name || `${dayIdx + 1}. Gün`}</Text>
            </View>

            <View style={styles.mealGrid}>
              {dayPlan.meals?.map((meal, mIdx) => (
                <TouchableOpacity
                  key={mIdx}
                  style={styles.mealCard}
                  onPress={() => openRecipe(meal)}
                  activeOpacity={0.85}
                >
                  <Image source={getMealImage(meal.image_url)} style={styles.mealImage} />
                  <View style={styles.mealContent}>
                    <Text style={styles.mealType}>{meal.meal_type}</Text>
                    <Text style={styles.mealName} numberOfLines={1}>{meal.food_name}</Text>
                    <Text style={styles.mealReason} numberOfLines={2}>{meal.reason}</Text>
                    
                    <View style={styles.mealFooter}>
                      <View style={styles.metaBadge}>
                        <Clock size={12} color={theme.colors.primary} />
                        <Text style={styles.metaText}>{meal.prep_time || '20dk'}</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Star size={12} color={theme.colors.secondary} fill={theme.colors.secondary} />
                        <Text style={styles.metaText}>{meal.rating || '5.0'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.small,
  },
  deleteBtn: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  backBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  summaryCard: {
    backgroundColor: theme.colors.primaryBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.primaryHover,
    lineHeight: 22,
    fontWeight: '500',
  },
  insightSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  insightCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    ...theme.shadows.small,
  },
  deficienciesCard: {
    backgroundColor: theme.colors.secondaryBg,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  avoidCard: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  insightCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightItemText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  mealGrid: {
    gap: 12,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.small,
  },
  mealImage: {
    width: 110,
    height: '100%',
    backgroundColor: theme.colors.primaryBg,
  },
  mealContent: {
    flex: 1,
    padding: 14,
  },
  mealType: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  mealReason: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  mealFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});

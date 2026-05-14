import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Platform, StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, Clock, Zap, Star, ChefHat } from 'lucide-react-native';
import { theme } from '../src/theme';
import { getMealImage } from '../src/imageMap';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const DifficultyColor = (difficulty) => {
  const d = (difficulty || '').toLowerCase();
  if (d === 'easy' || d === 'kolay') return theme.colors.primary;
  if (d === 'medium' || d === 'orta') return theme.colors.secondary;
  return theme.colors.danger;
};

export default function RecipeScreen() {
  const router = useRouter();
  const { meal: mealParam } = useLocalSearchParams();

  const [isSaved, setIsSaved] = React.useState(false);

  let meal = null;
  try {
    if (mealParam) meal = JSON.parse(mealParam);
  } catch (err) {
    console.error('Failed to parse meal data');
  }

  React.useEffect(() => {
    if (meal) checkIfSaved();
  }, [meal?.food_name]);

  const checkIfSaved = async () => {
    try {
      const storageModule = Platform.OS === 'web' ? window.localStorage : require('@react-native-async-storage/async-storage').default;
      const data = Platform.OS === 'web' ? storageModule.getItem('bb_saved_recipes') : await storageModule.getItem('bb_saved_recipes');
      if (data) {
        const list = JSON.parse(data);
        setIsSaved(list.some(r => r.food_name === meal.food_name));
      }
    } catch (err) { }
  };

  const toggleSave = async () => {
    try {
      const storageModule = Platform.OS === 'web' ? window.localStorage : require('@react-native-async-storage/async-storage').default;
      const data = Platform.OS === 'web' ? storageModule.getItem('bb_saved_recipes') : await storageModule.getItem('bb_saved_recipes');
      let list = data ? JSON.parse(data) : [];

      if (isSaved) {
        list = list.filter(r => r.food_name !== meal.food_name);
      } else {
        const newMeal = { ...meal, id: Date.now() };
        list.push(newMeal);
      }

      if (Platform.OS === 'web') {
        storageModule.setItem('bb_saved_recipes', JSON.stringify(list));
      } else {
        await storageModule.setItem('bb_saved_recipes', JSON.stringify(list));
      }
      setIsSaved(!isSaved);
    } catch (err) { }
  };

  if (!meal) {
    return (
      <View style={styles.errorContainer}>
        <ChefHat size={40} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Yemek verisi bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diffColor = DifficultyColor(meal.difficulty);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      <StatusBar barStyle="dark-content" />

      {/* Hero Image */}
      <View style={styles.heroSection}>
        <View style={[styles.imageBg, { backgroundColor: theme.colors.primaryBg }]}>
          <Image source={getMealImage(meal.image_url)} style={styles.heroImage} />
        </View>

        {/* Top Controls */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.heartBtn]} onPress={toggleSave}>
            <Heart size={20} color={theme.colors.danger} fill={isSaved ? theme.colors.danger : "transparent"} />
          </TouchableOpacity>
        </View>

        {/* Curved Bottom */}
        <View style={styles.curvedBottom} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Meal Type Badge */}
        <View style={styles.mealTypeBadge}>
          <Text style={styles.mealTypeBadgeText}>{meal.meal_type}</Text>
        </View>

        <Text style={styles.mealName}>{meal.food_name}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Clock size={18} color={theme.colors.primary} />
            <Text style={styles.statValue}>{meal.prep_time || '20dk'}</Text>
            <Text style={styles.statLabel}>Süre</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Zap size={18} color={diffColor} />
            <Text style={[styles.statValue, { color: diffColor }]}>{meal.difficulty || 'Kolay'}</Text>
            <Text style={styles.statLabel}>Zorluk</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={18} color={theme.colors.secondary} fill={theme.colors.secondary} />
            <Text style={styles.statValue}>{meal.rating || '5.0'}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>

        {/* Reason / About */}
        {meal.reason ? (
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <ChefHat size={16} color={theme.colors.primary} />
              <Text style={styles.reasonHeaderText}>Neden Bu Yemek?</Text>
            </View>
            <Text style={styles.reasonText}>{meal.reason}</Text>
          </View>
        ) : null}

        {/* Ingredients */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Malzemeler</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{meal.ingredients?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.ingredientsList}>
          {meal.ingredients && meal.ingredients.length > 0 ? (
            meal.ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.ingIndex}>
                  <Text style={styles.ingIndexText}>{idx + 1}</Text>
                </View>
                <View style={styles.ingIconWrap}>
                  <Image
                    source={{
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(ing.name)}&background=F0FBF0&color=5DBB63&rounded=true&bold=true&size=64`
                    }}
                    style={styles.ingIcon}
                  />
                </View>
                <Text style={styles.ingName}>{ing.name}</Text>
                <Text style={styles.ingAmount}>{ing.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noIngText}>Malzeme bilgisi bulunamadı.</Text>
          )}
        </View>

        {/* Preparation Note */}
        {meal.preparation_note ? (
          <View style={styles.prepNote}>
            <Text style={styles.prepNoteTitle}>Hazırlık Notu</Text>
            <Text style={styles.prepNoteText}>{meal.preparation_note}</Text>
          </View>
        ) : null}

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.ctaBtn, { flex: 1 }]} activeOpacity={0.85}>
            <ChefHat size={20} color="#FFF" />
            <Text style={styles.ctaBtnText}>Pişirmeye Başla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveActionBtn, isSaved && styles.saveActionBtnActive]} 
            onPress={toggleSave}
            activeOpacity={0.85}
          >
            <Heart size={20} color={isSaved ? "#FFF" : theme.colors.primary} fill={isSaved ? "#FFF" : "transparent"} />
            <Text style={[styles.saveActionText, isSaved && { color: '#FFF' }]}>
              {isSaved ? 'Kaydedildi' : 'Kaydet'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.m,
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  backBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.full,
  },
  heroSection: {
    width: '100%',
    height: 440,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryBg,
  },
  imageBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    ...theme.shadows.medium,
    marginTop: STATUS_BAR_HEIGHT,
  },
  topBar: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  heartBtn: {
    backgroundColor: '#FFEEF0',
  },
  curvedBottom: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  content: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.s,
  },
  mealTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.s,
  },
  mealTypeBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mealName: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.l,
    lineHeight: 34,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    gap: theme.spacing.xs,
    ...theme.shadows.small,
  },
  statCardMiddle: {
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  reasonCard: {
    backgroundColor: theme.colors.primaryBg,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.s,
  },
  reasonHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  reasonText: {
    fontSize: 13,
    color: theme.colors.primaryHover,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  countBadge: {
    backgroundColor: theme.colors.primaryBg,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  ingredientsList: {
    gap: theme.spacing.s,
    marginBottom: theme.spacing.l,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.s,
    gap: theme.spacing.s,
  },
  ingIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  ingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  ingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  ingName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  ingAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  noIngText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.m,
  },
  prepNote: {
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary,
  },
  prepNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  prepNoteText: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  ctaBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.s,
    ...theme.shadows.large,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  saveActionBtn: {
    backgroundColor: theme.colors.primaryBg,
    height: 56,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.s,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  saveActionBtnActive: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  saveActionText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, FlatList, Platform, StatusBar, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bookmark, ChevronRight, Calendar, Utensils } from 'lucide-react-native';
import { theme } from '../src/theme';
import BottomNav from '../components/BottomNav';
import { getMealImage } from '../src/imageMap';
import api from '../src/api';

export default function SavedRecipesScreen() {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' or 'plans'
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadSavedItems();
    }, [])
  );

  const loadSavedItems = async () => {
    try {
      setLoading(true);
      const resp = await api.get('recipes/');
      setSavedItems(resp.data);
    } catch (err) {
      console.warn('Error loading saved items', err);
    } finally {
      setLoading(false);
    }
  };

  const openRecipe = (recipeData) => {
    router.push({
      pathname: '/recipe',
      params: { meal: JSON.stringify(recipeData) }
    });
  };

  const openPlan = (plan) => {
    router.push({
      pathname: '/saved_plan_detail',
      params: { plan: JSON.stringify(plan) }
    });
  };

  // Filter items based on active tab
  const filteredRecipes = savedItems.filter(item => item.recipe_type === 'recipe');
  const filteredPlans = savedItems.filter(item => item.recipe_type === 'plan');

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconBg}>
            <Bookmark size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Kaydedilenler</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'recipes' 
                ? `${filteredRecipes.length} Kayıtlı Tarif` 
                : `${filteredPlans.length} Kayıtlı Plan`}
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'recipes' && styles.tabButtonActive]}
            onPress={() => setActiveTab('recipes')}
            activeOpacity={0.8}
          >
            <Utensils size={16} color={activeTab === 'recipes' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.tabButtonText, activeTab === 'recipes' && styles.tabButtonTextActive]}>
              Tarifler
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'plans' && styles.tabButtonActive]}
            onPress={() => setActiveTab('plans')}
            activeOpacity={0.8}
          >
            <Calendar size={16} color={activeTab === 'plans' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.tabButtonText, activeTab === 'plans' && styles.tabButtonTextActive]}>
              Planlar
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : activeTab === 'recipes' ? (
          /* ── TARİFLER LİSTESİ ── */
          filteredRecipes.length === 0 ? (
            <View style={styles.center}>
              <Bookmark size={48} color={theme.colors.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>Henüz Kayıtlı Tarif Yok</Text>
              <Text style={styles.emptySubtitle}>Yemek planlarınızdan tekil tarifleri kaydederek burada görebilirsiniz.</Text>
            </View>
          ) : (
            <SectionList
              sections={Object.entries(filteredRecipes.reduce((acc, item) => {
                const label = item.recipe_data?.test_label || 'Bireysel Kayıtlar';
                if (!acc[label]) acc[label] = [];
                acc[label].push(item);
                return acc;
              }, {})).map(([title, data]) => ({ title, data }))}
              keyExtractor={(item) => item.client_id}
              contentContainerStyle={styles.scroll}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.groupTitle}>{title}</Text>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => openRecipe(item.recipe_data)}
                >
                  <Image source={getMealImage(item.recipe_data?.image_url)} style={styles.image} />
                  <View style={styles.content}>
                    <Text style={styles.type}>{item.recipe_data?.meal_type}</Text>
                    <Text style={styles.name} numberOfLines={2}>{item.recipe_data?.food_name}</Text>
                    <View style={styles.footer}>
                      <Text style={styles.ingredients}>{item.recipe_data?.ingredients?.length || 0} malzeme</Text>
                      <ChevronRight size={18} color={theme.colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
            />
          )
        ) : (
          /* ── PLANLAR LİSTESİ ── */
          filteredPlans.length === 0 ? (
            <View style={styles.center}>
              <Calendar size={48} color={theme.colors.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>Henüz Kayıtlı Plan Yok</Text>
              <Text style={styles.emptySubtitle}>Web arayüzünden kaydettiğiniz 3 günlük menülere buradan ulaşabilirsiniz.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPlans}
              keyExtractor={(item) => item.client_id}
              contentContainerStyle={styles.scroll}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.planCard}
                  activeOpacity={0.8}
                  onPress={() => openPlan(item)}
                >
                  <View style={styles.planIconBg}>
                    <Calendar size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.planDetails}>
                    <Text style={styles.planTitle}>{item.recipe_data?.pdfName}</Text>
                    <Text style={styles.planDate}>Tarih: {item.recipe_data?.date}</Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          )
        )}
      </View>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerIconBg: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: theme.colors.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.divider,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.cardBg,
    ...theme.shadows.small,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 100,
    height: '100%',
    backgroundColor: '#eee',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  type: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredients: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planDetails: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  planDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});

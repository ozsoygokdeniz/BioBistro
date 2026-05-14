import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, Platform, StatusBar, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../src/theme';
import BottomNav from '../components/BottomNav';
import { getMealImage } from '../src/imageMap';

export default function SavedRecipesScreen() {
  const [recipes, setRecipes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      let data = null;
      if (Platform.OS === 'web') {
        data = localStorage.getItem('bb_saved_recipes');
      } else {
        data = await AsyncStorage.getItem('bb_saved_recipes');
      }

      if (data) {
        const list = JSON.parse(data);
        list.sort((a, b) => b.id - a.id);
        setRecipes(list);
      }
    } catch (err) {
      console.warn('Error loading saved recipes', err);
    }
  };

  const openRecipe = (recipe) => {
    router.push({
      pathname: '/recipe',
      params: { meal: JSON.stringify(recipe) }
    });
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
        <View style={styles.header}>
          <View style={styles.headerIconBg}>
            <Bookmark size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Kaydedilenler</Text>
            <Text style={styles.headerSubtitle}>{recipes.length} Kayıtlı Plan</Text>
          </View>
        </View>

        {recipes.length === 0 ? (
          <View style={styles.center}>
            <Bookmark size={48} color={theme.colors.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Henüz Kayıt Yok</Text>
            <Text style={styles.emptySubtitle}>Yapay zekanın oluşturduğu tarifleri kaydederek buradan hızlıca ulaşabilirsiniz.</Text>
          </View>
        ) : (
          <SectionList
            sections={Object.entries(recipes.reduce((acc, recipe) => {
              const label = recipe.test_label || 'Bireysel Kayıtlar';
              if (!acc[label]) acc[label] = [];
              acc[label].push(recipe);
              return acc;
            }, {})).map(([title, data]) => ({ title, data }))}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.scroll}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.groupTitle}>{title}</Text>
            )}
            renderItem={({ item: recipe }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => openRecipe(recipe)}
              >
                <Image source={getMealImage(recipe.image_url)} style={styles.image} />
                <View style={styles.content}>
                  <Text style={styles.type}>{recipe.meal_type}</Text>
                  <Text style={styles.name} numberOfLines={2}>{recipe.food_name}</Text>
                  <View style={styles.footer}>
                    <Text style={styles.ingredients}>{recipe.ingredients?.length || 0} malzeme</Text>
                    <ChevronRight size={18} color={theme.colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            stickySectionHeadersEnabled={false}
          />
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
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
});



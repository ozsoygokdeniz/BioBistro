import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  ActivityIndicator, Alert, Platform, StatusBar, ActionSheetIOS
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { theme } from '../src/theme';
import api from '../src/api';
import BottomNav from '../components/BottomNav';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function ScanScreen() {
  const [image, setImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async (useCamera = false) => {
    try {
      let pickerResult;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
          return;
        }
        pickerResult = await ImagePicker.launchCameraAsync({
          allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
          return;
        }
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      }

      if (!pickerResult.canceled && pickerResult.assets?.[0]) {
        const asset = pickerResult.assets[0];
        setImage(asset);
        setResult(null);
        await analyzeFood(asset.base64);
      }
    } catch (err) {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir sorun oluştu.');
    }
  };

  const showPickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['İptal', '📷 Kamera', '🖼️ Galeri'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) pickImage(true); else if (idx === 2) pickImage(false); }
      );
    } else {
      Alert.alert('Fotoğraf Seç', 'Kaynak seçin', [
        { text: '📷 Kamera', onPress: () => pickImage(true) },
        { text: '🖼️ Galeri', onPress: () => pickImage(false) },
        { text: 'İptal', style: 'cancel' },
      ]);
    }
  };

  const analyzeFood = async (base64Data) => {
    setScanning(true);
    setResult(null);
    try {
      const response = await api.post('food-scan/analyze', { image_base64: base64Data });
      setResult(response.data);
    } catch (err) {
      Alert.alert('Analiz Başarısız', err?.response?.data?.detail || 'Yemek tanımlanamadı. Lütfen tekrar deneyin.');
    } finally {
      setScanning(false);
    }
  };

  const getAssessmentStyle = (assessment) => {
    switch (assessment) {
      case 'good': return { bg: '#DCFCE7', border: '#16A34A', text: '#15803D', icon: CheckCircle, label: '✅ Kan Değerleriniz İçin İyi' };
      case 'caution': return { bg: '#FEF9C3', border: '#CA8A04', text: '#A16207', icon: Info, label: '⚠️ Dikkatli Tüketin' };
      case 'bad': return { bg: '#FEE2E2', border: '#DC2626', text: '#B91C1C', icon: AlertCircle, label: '❌ Kan Değerlerinize Uygun Değil' };
      default: return { bg: theme.colors.glassBg, border: theme.colors.glassBorder, text: theme.colors.text, icon: Info, label: 'Değerlendirme' };
    }
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconBg}>
            <Camera size={22} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Yemek Tara</Text>
            <Text style={styles.headerSub}>Fotoğrafından kalori & etki analizi</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Image Preview / Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={showPickerOptions} activeOpacity={0.85}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Camera size={48} color={theme.colors.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.placeholderTitle}>Yemek Fotoğrafı Çek</Text>
                <Text style={styles.placeholderSub}>veya galeriden seç</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Seçim Butonları */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.sourceBtn} onPress={() => pickImage(true)}>
              <Camera size={20} color={theme.colors.primary} />
              <Text style={styles.sourceBtnText}>Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sourceBtn} onPress={() => pickImage(false)}>
              <ImageIcon size={20} color={theme.colors.primary} />
              <Text style={styles.sourceBtnText}>Galeri</Text>
            </TouchableOpacity>
          </View>

          {/* Scanning */}
          {scanning && (
            <View style={styles.scanningCard}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.scanningText}>Yapay Zeka analiz ediyor...</Text>
              <Text style={styles.scanningSubText}>Yemek tanımlanıyor ve kan değerlerinizle karşılaştırılıyor</Text>
            </View>
          )}

          {/* Results */}
          {result && !scanning && (
            <View style={styles.resultsContainer}>

              {/* Food Name */}
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Zap size={18} color={theme.colors.primary} />
                  <Text style={styles.resultCardTitle}>Tanımlanan Yemek</Text>
                </View>
                <Text style={styles.foodName}>{result.food_name_tr || result.food_name}</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    Güven: %{Math.round((result.confidence || 0) * 100)}
                  </Text>
                </View>
              </View>

              {/* Calories */}
              <View style={styles.calorieRow}>
                <View style={styles.calorieCard}>
                  <Text style={styles.calorieValue}>{result.calories_per_100g}</Text>
                  <Text style={styles.calorieLabel}>kcal / 100g</Text>
                </View>
                {result.protein_per_100g != null && (
                  <View style={styles.calorieCard}>
                    <Text style={styles.calorieValue}>{result.protein_per_100g}g</Text>
                    <Text style={styles.calorieLabel}>Protein</Text>
                  </View>
                )}
                {result.fat_per_100g != null && (
                  <View style={styles.calorieCard}>
                    <Text style={styles.calorieValue}>{result.fat_per_100g}g</Text>
                    <Text style={styles.calorieLabel}>Yağ</Text>
                  </View>
                )}
                {result.carbs_per_100g != null && (
                  <View style={styles.calorieCard}>
                    <Text style={styles.calorieValue}>{result.carbs_per_100g}g</Text>
                    <Text style={styles.calorieLabel}>Karbonhidrat</Text>
                  </View>
                )}
              </View>

              {/* Blood Assessment */}
              {result.assessment && (() => {
                const style = getAssessmentStyle(result.assessment);
                const AssessmentIcon = style.icon;
                return (
                  <View style={[styles.assessmentCard, { backgroundColor: style.bg, borderColor: style.border }]}>
                    <View style={styles.assessmentHeader}>
                      <AssessmentIcon size={20} color={style.text} />
                      <Text style={[styles.assessmentLabel, { color: style.text }]}>{style.label}</Text>
                    </View>
                    <Text style={[styles.assessmentText, { color: style.text }]}>
                      {result.assessment_reason}
                    </Text>
                  </View>
                );
              })()}

            </View>
          )}

          {/* Placeholder hint */}
          {!image && !scanning && !result && (
            <View style={styles.hintCard}>
              <Info size={18} color={theme.colors.textSecondary} />
              <Text style={styles.hintText}>
                Fotoğraf çektikten sonra yapay zeka yemeği otomatik olarak tanır, kalori bilgisini hesaplar ve son kan tahlilinizdeki değerlerle karşılaştırarak size özel bir değerlendirme sunar.
              </Text>
            </View>
          )}

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
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: STATUS_BAR_HEIGHT + 12, paddingBottom: 16,
  },
  headerIconBg: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.colors.glassBg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  headerSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  imagePicker: {
    width: '100%', height: 240, borderRadius: 24,
    overflow: 'hidden', marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 2, borderColor: theme.colors.glassBorder,
    borderStyle: 'dashed',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholderTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  placeholderSub: { fontSize: 14, color: theme.colors.textSecondary },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sourceBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.colors.surface, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  sourceBtnText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  scanningCard: {
    backgroundColor: theme.colors.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  scanningText: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: 16 },
  scanningSubText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center' },
  resultsContainer: { gap: 12 },
  resultCard: {
    backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultCardTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary, textTransform: 'uppercase' },
  foodName: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 10 },
  confidenceBadge: {
    alignSelf: 'flex-start', backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  confidenceText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  calorieRow: { flexDirection: 'row', gap: 10 },
  calorieCard: {
    flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  calorieValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  calorieLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, fontWeight: '600' },
  assessmentCard: {
    borderRadius: 20, padding: 20, borderWidth: 1.5,
  },
  assessmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  assessmentLabel: { fontSize: 16, fontWeight: '800' },
  assessmentText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  hintCard: {
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 1, borderColor: theme.colors.glassBorder,
  },
  hintText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Platform, StatusBar, Dimensions, TouchableOpacity, InteractionManager
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Minus, Activity, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native';
import { theme } from '../src/theme';
import api from '../src/api';
import BottomNav from '../components/BottomNav';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

function getHealthScore(item) {
  const total = item.result_count || 1;
  return Math.round((item.normal_count / total) * 100);
}

function parseDateSafely(dateString) {
  if (!dateString) return new Date();
  if (dateString.includes('T')) {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  return new Date(dateString);
}

function formatDate(dateString) {
  const d = parseDateSafely(dateString);
  if (isNaN(d.getTime())) return '-';
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

function formatFullDate(dateString) {
  const d = parseDateSafely(dateString);
  if (isNaN(d.getTime())) return 'Bilinmeyen Tarih';
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const chartConfig = {
  backgroundColor: theme.colors.glassBg,
  backgroundGradientFrom: theme.colors.glassBg,
  backgroundGradientTo: theme.colors.glassBg,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(93, 187, 99, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.primary },
  propsForLabels: { fontSize: 10, fontWeight: '500' },
};

function ScoreCard({ label, value, color, icon: Icon }) {
  return (
    <View style={[styles.scoreCard, { borderTopColor: color }]}>
      <Icon size={20} color={color} />
      <Text style={[styles.scoreValue, { color }]}>{value}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

function HistoryCard({ item, index, previous }) {
  const [expanded, setExpanded] = useState(false);
  const score = getHealthScore(item);
  const prevScore = previous ? getHealthScore(previous) : null;
  const diff = prevScore != null ? score - prevScore : null;

  return (
    <View style={styles.historyCard}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8} style={styles.historyCardHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>#{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.historyDate}>{formatFullDate(item.date_taken)}</Text>
          <Text style={styles.historyParams}>{item.result_count} parametre analiz edildi</Text>
        </View>
        <View style={styles.scoreChip}>
          <Text style={[styles.scoreChipText, { color: score >= 70 ? theme.colors.primary : score >= 40 ? theme.colors.secondary : theme.colors.danger }]}>
            %{score}
          </Text>
          {diff != null && (
            <Text style={[styles.diffText, { color: diff > 0 ? theme.colors.primary : diff < 0 ? theme.colors.danger : theme.colors.textSecondary }]}>
              {diff > 0 ? `+${diff}` : diff}
            </Text>
          )}
        </View>
        {expanded ? <ChevronUp size={18} color={theme.colors.textSecondary} /> : <ChevronDown size={18} color={theme.colors.textSecondary} />}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.miniStatsRow}>
            <View style={[styles.miniStat, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.miniStatValue, { color: theme.colors.primary }]}>{item.normal_count}</Text>
              <Text style={styles.miniStatLabel}>Normal</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: theme.colors.dangerBg }]}>
              <Text style={[styles.miniStatValue, { color: theme.colors.danger }]}>{item.high_count}</Text>
              <Text style={styles.miniStatLabel}>Yüksek</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: '#FEF9EC' }]}>
              <Text style={[styles.miniStatValue, { color: theme.colors.secondary }]}>{item.low_count}</Text>
              <Text style={styles.miniStatLabel}>Düşük</Text>
            </View>
          </View>
          <View style={styles.inlineBarBg}>
            <View style={[styles.inlineBarFill, { width: `${score}%`, backgroundColor: score >= 70 ? theme.colors.primary : score >= 40 ? theme.colors.secondary : theme.colors.danger }]} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
      fetchHistory();
    });
  }, []);

  const fetchHistory = async () => {
    try {
      const resp = await api.get('blood-tests/history');
      setHistory(resp.data);
    } catch (err) {
      console.warn('History fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedHistory = [...history].sort((a, b) => new Date(a.date_taken) - new Date(b.date_taken));

  const latestScore = sortedHistory.length > 0 ? getHealthScore(sortedHistory[sortedHistory.length - 1]) : null;
  const firstScore = sortedHistory.length > 1 ? getHealthScore(sortedHistory[0]) : null;
  const improvement = latestScore != null && firstScore != null ? latestScore - firstScore : null;

  // Chart-kit data format
  const lineChartData = sortedHistory.length >= 2 ? {
    labels: sortedHistory.map((_, index) => `T${index + 1}`),
    datasets: [{ data: sortedHistory.map(item => getHealthScore(item)) }],
  } : null;

  const barChartData = sortedHistory.length >= 1 ? {
    labels: sortedHistory.map((_, index) => `T${index + 1}`),
    datasets: [{ data: sortedHistory.map(item => item.normal_count) }],
  } : null;

  // Calculate dynamic width based on number of items to allow scrolling
  const dynamicChartWidth = Math.max(CHART_WIDTH - 32, sortedHistory.length * 38 + 20);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Sağlık{'\n'}<Text style={styles.heroHighlight}>Gelişimim</Text></Text>
            <Text style={styles.heroSub}>PDF yükleme sırası bazlı ilerleme analizi</Text>
          </View>
          <View style={styles.heroBadge}>
            <Activity size={32} color={theme.colors.primary} />
          </View>
        </View>

        {(!isReady || loading) ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>Tahliller yükleniyor...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.center}>
            <Activity size={56} color={theme.colors.primaryLight} />
            <Text style={styles.emptyTitle}>Henüz Tahlil Yok</Text>
            <Text style={styles.emptySubtitle}>Dashboard üzerinden tahlil PDF'i yükleyerek başlayın.</Text>
          </View>
        ) : (
          <>
            {/* Summary Score Cards */}
            <View style={styles.summaryRow}>
              <ScoreCard
                label="Son Skor"
                value={latestScore != null ? `%${latestScore}` : '-'}
                color={theme.colors.primary}
                icon={TrendingUp}
              />
              <ScoreCard
                label="Toplam Tahlil"
                value={history.length}
                color={theme.colors.accent}
                icon={Calendar}
              />
              <ScoreCard
                label="Gelişim"
                value={improvement != null ? (improvement >= 0 ? `+${improvement}` : `${improvement}`) : '-'}
                color={improvement > 0 ? theme.colors.primary : improvement < 0 ? theme.colors.danger : theme.colors.secondary}
                icon={improvement >= 0 ? TrendingUp : TrendingDown}
              />
            </View>

            {/* === CHART 1: Health Score Trend Line === */}
            {lineChartData && (
              <View style={styles.chartSection}>
                <View style={styles.chartTitleRow}>
                  <TrendingUp size={20} color={theme.colors.primary} />
                  <Text style={styles.chartTitle}>Sağlık Skoru Trendi</Text>
                </View>
                <Text style={styles.chartSubtitle}>Normal parametre oranı — PDF yükleme sırasına göre</Text>
                <View style={styles.chartCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart
                      data={lineChartData}
                      width={dynamicChartWidth}
                      height={220}
                      chartConfig={chartConfig}
                      bezier
                      style={{ borderRadius: 12, paddingBottom: 10 }}
                      fromZero={false}
                      yAxisSuffix="%"
                      yAxisSide="right"
                    />
                  </ScrollView>
                </View>
              </View>
            )}

            {/* === CHART 2: Normal count per test (Bar) === */}
            {barChartData && (
              <View style={styles.chartSection}>
                <View style={styles.chartTitleRow}>
                  <Activity size={20} color={theme.colors.accent} />
                  <Text style={styles.chartTitle}>Normal Parametre Sayısı</Text>
                </View>
                <Text style={styles.chartSubtitle}>Her tahlilde normal değer sayısı — PDF yükleme sırasına göre</Text>
                <View style={styles.chartCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <BarChart
                      data={barChartData}
                      width={dynamicChartWidth}
                      height={220}
                      chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(93, 187, 99, ${opacity})`,
                      }}
                      style={{ borderRadius: 12, paddingRight: 32, paddingBottom: 10, paddingLeft: 15 }}
                      fromZero
                      showValuesOnTopOfBars
                    />
                  </ScrollView>
                </View>
              </View>
            )}

            {/* === History Cards === */}
            <View style={styles.chartSection}>
              <View style={styles.chartTitleRow}>
                <Calendar size={20} color={theme.colors.primary} />
                <Text style={styles.chartTitle}>Tahlil Geçmişi</Text>
              </View>
              <Text style={styles.chartSubtitle}>Tüm yüklenen PDF'ler — eskiden yeniye</Text>
              {[...sortedHistory].reverse().map((item, i) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  index={sortedHistory.indexOf(item)}
                  previous={sortedHistory[sortedHistory.indexOf(item) - 1]}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: STATUS_BAR_HEIGHT,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  heroTextBlock: { flex: 1 },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroHighlight: {
    color: theme.colors.primary,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: theme.colors.glassBg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.small,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  chartSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  chartSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 17,
  },
  chartCard: {
    backgroundColor: theme.colors.glassBg,
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.medium,
    overflow: 'hidden',
  },
  historyCard: {
    backgroundColor: theme.colors.glassBg,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  historyParams: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scoreChip: {
    alignItems: 'center',
  },
  scoreChipText: {
    fontSize: 20,
    fontWeight: '800',
  },
  diffText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
    paddingTop: 12,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  miniStat: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  miniStatLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  inlineBarBg: {
    height: 8,
    backgroundColor: theme.colors.glassBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  inlineBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

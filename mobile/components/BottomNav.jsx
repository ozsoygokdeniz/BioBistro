import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { FileUp, History, Bookmark } from 'lucide-react-native';
import { theme } from '../src/theme';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: 'PDF Yükle', path: '/dashboard', icon: FileUp },
    { name: 'Tahliller', path: '/history', icon: History },
    { name: 'Kaydedilenler', path: '/saved', icon: Bookmark },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.replace(tab.path)}
          >
            <Icon
              size={24}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
              style={{ marginBottom: 4 }}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { FileUp, History, Camera, Bookmark, User } from 'lucide-react-native';
import { theme } from '../src/theme';

const TABS = [
  { name: 'PDF', path: '/dashboard', icon: FileUp },
  { name: 'Tahlil', path: '/history', icon: History },
  { name: 'Tara', path: '/scan', icon: Camera },
  { name: 'Kayıtlar', path: '/saved', icon: Bookmark },
  { name: 'Profil', path: '/profile', icon: User },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={80} tint="light" style={styles.dock}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.path}
              style={styles.tab}
              onPress={() => router.replace(tab.path)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon
                  size={22}
                  color={isActive ? theme.colors.primary : '#8E8E93'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 8,
    overflow: 'hidden',
    // Fallback bg for Android where blur may be weaker
    backgroundColor: Platform.OS === 'android'
      ? 'rgba(255,255,255,0.92)'
      : 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: `${theme.colors.primary}18`,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

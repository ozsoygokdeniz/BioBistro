import { Stack } from 'expo-router';
import { theme } from '../src/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.primary,
        contentStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { fontWeight: 'bold' },
        animation: 'none',
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'BioBistro', 
          headerBackVisible: false,
          headerTitleStyle: { fontSize: 28, fontWeight: '900', color: theme.colors.primary }
        }} 
      />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="saved" options={{ headerShown: false }} />
      <Stack.Screen name="recipe" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
    </Stack>
  );
}

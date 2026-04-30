import { Stack } from 'expo-router';
import { theme } from '../src/theme';

export default function Layout() {
  return (
    <Stack 
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.primary,
        contentStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ title: 'BioBistro Panel', headerBackVisible: false }} />
    </Stack>
  );
}

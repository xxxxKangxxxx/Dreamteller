import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

import { colors } from '@/constants/colors';
import { ArchiveScreen } from '@/screens/archive/ArchiveScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { InsightsScreen } from '@/screens/insights/InsightsScreen';
import { InterpretScreen } from '@/screens/interpret/InterpretScreen';

import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<keyof TabParamList, { active: TabIconName; inactive: TabIconName }> = {
  Home: { active: 'moon', inactive: 'moon-outline' },
  Record: { active: 'add-circle', inactive: 'add-circle-outline' },
  Interpret: { active: 'sparkles', inactive: 'sparkles-outline' },
  Archive: { active: 'library', inactive: 'library-outline' },
  Insights: { active: 'bar-chart', inactive: 'bar-chart-outline' },
};

function EmptyTab() {
  return <View style={{ flex: 1, backgroundColor: colors.bgBase }} />;
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icon = ICONS[route.name];
          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen
        name="Record"
        component={EmptyTab}
        options={{ title: '기록' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('RecordChat');
          },
        })}
      />
      <Tab.Screen name="Interpret" component={InterpretScreen} options={{ title: '해몽' }} />
      <Tab.Screen name="Archive" component={ArchiveScreen} options={{ title: '아카이브' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: '분석' }} />
    </Tab.Navigator>
  );
}

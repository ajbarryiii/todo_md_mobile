import './src/global.css';

import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-zinc-100">Todo Mobile</Text>
        <Text className="mt-3 text-center text-zinc-400">
          React Native + Uniwind scaffold ready.
        </Text>
        <Text className="mt-1 text-center text-zinc-500">
          Source markdown repo: ../todo_md
        </Text>
      </View>
    </SafeAreaView>
  );
}

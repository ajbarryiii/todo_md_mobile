import './src/global.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, JetBrainsMono_400Regular, JetBrainsMono_600SemiBold, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import type { TodoItem, ParsedLine } from './src/lib/markdown';
import { generateId, parseFile, serializeFile } from './src/lib/markdown';
import { readTodoFile, writeTodoFile } from './src/lib/storage';
import { loadConfig, loadToken, isConfigured } from './src/lib/config';
import type { AppConfig } from './src/lib/config';
import { fetchTodoFile, pushTodoFile } from './src/lib/github';
import type { GitHubConfig } from './src/lib/github';
import TodoItemRow from './src/components/TodoItem';
import AddTodoInput from './src/components/AddTodoInput';
import SettingsScreen from './src/components/SettingsScreen';
import { colors, fonts } from './src/lib/theme';

type Section = {
  title: string;
  data: TodoItem[];
};

function buildSections(todos: TodoItem[]): Section[] {
  const active = todos.filter(t => !t.done);
  const completed = todos.filter(t => t.done);
  const sections: Section[] = [];
  if (active.length > 0) {
    sections.push({ title: 'Active', data: active });
  }
  if (completed.length > 0) {
    sections.push({ title: 'Completed', data: completed });
  }
  return sections;
}

function buildGitHubConfig(config: AppConfig, token: string): GitHubConfig {
  return { ...config, token };
}

function Main(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [lines, setLines] = useState<ParsedLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [configured, setConfigured] = useState(false);

  const linesRef = useRef<ParsedLine[]>([]);
  const shaRef = useRef<string | null>(null);
  const configRef = useRef<AppConfig | null>(null);
  const tokenRef = useRef('');

  const setLinesAndRef = useCallback((nextLines: ParsedLine[]) => {
    linesRef.current = nextLines;
    setLines(nextLines);
  }, []);

  const loadFromContent = useCallback((content: string) => {
    const parsed = parseFile(content);
    setTodos(parsed.todos);
    setLinesAndRef(parsed.lines);
  }, [setLinesAndRef]);

  const reloadConfig = useCallback(async () => {
    const [config, token] = await Promise.all([loadConfig(), loadToken()]);
    configRef.current = config;
    tokenRef.current = token;
    setConfigured(isConfigured(config, token));
  }, []);

  const persist = useCallback((nextLines: ParsedLine[]) => {
    const content = serializeFile(nextLines);
    writeTodoFile(content);
  }, []);

  const updateFromLines = useCallback((nextLines: ParsedLine[]) => {
    const nextTodos = nextLines
      .filter((l): l is Extract<ParsedLine, { type: 'todo' }> => l.type === 'todo')
      .map(l => l.todo);
    setLinesAndRef(nextLines);
    setTodos(nextTodos);
    persist(nextLines);
  }, [persist, setLinesAndRef]);

  const pushToGitHub = useCallback(async () => {
    if (!configRef.current || !tokenRef.current) return;
    if (!isConfigured(configRef.current, tokenRef.current)) return;

    const ghConfig = buildGitHubConfig(configRef.current, tokenRef.current);
    const content = serializeFile(linesRef.current);
    const newSha = await pushTodoFile(
      ghConfig,
      content,
      shaRef.current,
      'sync todos from mobile',
    );
    shaRef.current = newSha;
  }, []);

  const pullFromGitHub = useCallback(async () => {
    if (!configRef.current || !tokenRef.current) return;
    if (!isConfigured(configRef.current, tokenRef.current)) return;

    const ghConfig = buildGitHubConfig(configRef.current, tokenRef.current);
    const result = await fetchTodoFile(ghConfig);
    shaRef.current = result.sha || null;

    const remote = parseFile(result.content);
    const local = linesRef.current;
    const remoteIds = new Set(remote.todos.map(t => t.id));
    const localOnlyTodos = local
      .filter((l): l is Extract<ParsedLine, { type: 'todo' }> =>
        l.type === 'todo' && !remoteIds.has(l.todo.id))
      .map(l => l.todo);

    if (localOnlyTodos.length > 0) {
      const mergedLines: ParsedLine[] = [
        ...remote.lines,
        ...localOnlyTodos.map(todo => ({ type: 'todo' as const, todo })),
      ];
      const mergedTodos = [...remote.todos, ...localOnlyTodos];
      setLinesAndRef(mergedLines);
      setTodos(mergedTodos);
      const mergedContent = serializeFile(mergedLines);
      writeTodoFile(mergedContent);

      const newSha = await pushTodoFile(
        ghConfig,
        mergedContent,
        shaRef.current,
        'sync todos from mobile',
      );
      shaRef.current = newSha;
    } else {
      loadFromContent(result.content);
      writeTodoFile(result.content);
    }
  }, [loadFromContent, setLinesAndRef]);

  const handleSync = useCallback(async () => {
    if (!configured) {
      setShowSettings(true);
      return;
    }
    setSyncing(true);
    setSyncStatus('Syncing…');
    try {
      await pullFromGitHub();
      setSyncStatus('Synced ✓');
    } catch (e) {
      setSyncStatus(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  }, [configured, pullFromGitHub]);

  const pushAfterEdit = useCallback(async () => {
    if (!configured) return;
    try {
      await pushToGitHub();
    } catch {
      // Silent fail — user can re-sync manually
    }
  }, [configured, pushToGitHub]);

  useEffect(() => {
    (async () => {
      await reloadConfig();
      const localContent = await readTodoFile();
      if (localContent) {
        loadFromContent(localContent);
      }
      setLoaded(true);
    })();
  }, [reloadConfig, loadFromContent]);

  useEffect(() => {
    if (loaded && configured) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, configured]);

  const handleToggle = useCallback(
    (id: string) => {
      const nextLines = linesRef.current.map(line => {
        if (line.type !== 'todo' || line.todo.id !== id) {
          return line;
        }
        return { type: 'todo' as const, todo: { ...line.todo, done: !line.todo.done } };
      });
      updateFromLines(nextLines);
      pushAfterEdit();
    },
    [updateFromLines, pushAfterEdit],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const nextLines = linesRef.current.filter(
        line => !(line.type === 'todo' && line.todo.id === id),
      );
      updateFromLines(nextLines);
      pushAfterEdit();
    },
    [updateFromLines, pushAfterEdit],
  );

  const handleAdd = useCallback(
    (name: string, dueDate?: string) => {
      const todo: TodoItem = {
        id: generateId(),
        name,
        done: false,
        ...(dueDate ? { dueDate } : {}),
      };
      const newLine: ParsedLine = { type: 'todo', todo };
      const nextLines = [...linesRef.current, newLine];
      setLinesAndRef(nextLines);
      setTodos(prev => [...prev, todo]);
      persist(nextLines);
      pushAfterEdit();
    },
    [persist, pushAfterEdit, setLinesAndRef],
  );

  const handleSettingsSave = useCallback(async () => {
    await reloadConfig();
    setShowSettings(false);
    setTimeout(() => handleSync(), 300);
  }, [reloadConfig, handleSync]);

  const sections = buildSections(todos);

  if (!loaded) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.base, paddingTop: insets.top }}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.iris} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.base, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      {syncStatus !== '' && (
        <View className="px-5 py-1">
          <Text
            className="text-xs"
            style={{ color: syncStatus.includes('failed') ? colors.love : colors.foam, fontFamily: fonts.regular }}>
            {syncStatus}
          </Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TodoItemRow todo={item} onToggle={handleToggle} onDelete={handleDelete} />
        )}
        renderSectionHeader={({ section }) => (
          <View className="px-5 pt-4 pb-2" style={{ backgroundColor: colors.base }}>
            <Text
              className="text-xs uppercase tracking-wider"
              style={{ color: colors.subtle, fontFamily: fonts.semiBold }}>
              {section.title}
            </Text>
          </View>
        )}
        style={{ flex: 1 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={handleSync}
            tintColor={colors.iris}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-base" style={{ color: colors.subtle, fontFamily: fonts.regular }}>No todos yet</Text>
            <Text className="text-sm mt-1" style={{ color: colors.muted, fontFamily: fonts.regular }}>
              Tap + to get started
            </Text>
          </View>
        }
      />

      {showAddInput && (
        <AddTodoInput onAdd={handleAdd} />
      )}

      {/* Bottom Tab Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 24,
          paddingTop: 12,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.highlightMed,
          paddingBottom: Math.max(insets.bottom, 12),
        }}>
        <Pressable onPress={() => setShowSettings(true)} style={{ alignItems: 'center' }} hitSlop={8}>
          <Ionicons name="settings-outline" size={24} color={colors.subtle} />
          <Text className="text-xs mt-1" style={{ color: colors.subtle, fontFamily: fonts.regular }}>Settings</Text>
        </Pressable>

        <Pressable onPress={handleSync} disabled={syncing} style={{ alignItems: 'center' }} hitSlop={8}>
          {syncing ? (
            <ActivityIndicator color={colors.iris} size="small" />
          ) : (
            <Ionicons name="sync-outline" size={24} color={colors.subtle} />
          )}
          <Text className="text-xs mt-1" style={{ color: colors.subtle, fontFamily: fonts.regular }}>Sync</Text>
        </Pressable>

        <Pressable onPress={() => setShowAddInput(prev => !prev)} style={{ alignItems: 'center' }}>
          <LinearGradient
            colors={[colors.iris, colors.foam]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name={showAddInput ? 'close' : 'add'} size={28} color={colors.base} />
          </LinearGradient>
        </Pressable>
      </View>

      <SettingsScreen
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
    </View>
  );
}

export default function App(): React.JSX.Element {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#191724' }} />;
  }

  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

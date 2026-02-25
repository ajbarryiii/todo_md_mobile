import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { loadConfig, loadToken, saveConfig, saveToken } from '../lib/config';
import { testConnection } from '../lib/github';
import { colors, fonts } from '../lib/theme';
import type { GitHubConfig } from '../lib/github';
import type { AppConfig } from '../lib/config';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function SettingsScreen({ visible, onClose, onSave }: Props) {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [filePath, setFilePath] = useState('todo.md');
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const [config, savedToken] = await Promise.all([loadConfig(), loadToken()]);
      setOwner(config.owner);
      setRepo(config.repo);
      setBranch(config.branch || 'main');
      setFilePath(config.filePath || 'todo.md');
      setToken(savedToken);
      setStatus('');
    })();
  }, [visible]);

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus('Testing…');
    const config: GitHubConfig = { token, owner, repo, branch, filePath };
    const result = await testConnection(config);
    setStatus(result.ok ? '✓ Connection successful' : `✗ ${result.error}`);
    setTesting(false);
  };

  const handleSave = async () => {
    const config: AppConfig = { owner, repo, branch, filePath };
    await Promise.all([saveConfig(config), saveToken(token)]);
    onSave();
  };

  const statusColor = status.startsWith('✓')
    ? colors.foam
    : status === 'Testing…'
      ? colors.subtle
      : colors.love;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1" style={{ backgroundColor: colors.base }}>
        <Pressable onPress={onClose} className="absolute right-4 top-4 z-10" hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.subtle} />
        </Pressable>

        <ScrollView className="flex-1 px-6 pt-16">
          <Text className="text-2xl mb-8" style={{ color: colors.text, fontFamily: fonts.bold }}>Settings</Text>

          <Text className="text-sm mb-1" style={{ color: colors.subtle, fontFamily: fonts.regular }}>GitHub Token</Text>
          <TextInput
            className="text-base rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: colors.overlay, color: colors.text, borderWidth: 1, borderColor: colors.highlightMed, fontFamily: fonts.regular }}
            value={token}
            onChangeText={setToken}
            placeholder="ghp_…"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text className="text-sm mb-1" style={{ color: colors.subtle, fontFamily: fonts.regular }}>Repository Owner</Text>
          <TextInput
            className="text-base rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: colors.overlay, color: colors.text, borderWidth: 1, borderColor: colors.highlightMed, fontFamily: fonts.regular }}
            value={owner}
            onChangeText={setOwner}
            placeholder="ajbarryiii"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text className="text-sm mb-1" style={{ color: colors.subtle, fontFamily: fonts.regular }}>Repository Name</Text>
          <TextInput
            className="text-base rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: colors.overlay, color: colors.text, borderWidth: 1, borderColor: colors.highlightMed, fontFamily: fonts.regular }}
            value={repo}
            onChangeText={setRepo}
            placeholder="todos"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text className="text-sm mb-1" style={{ color: colors.subtle, fontFamily: fonts.regular }}>Branch</Text>
          <TextInput
            className="text-base rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: colors.overlay, color: colors.text, borderWidth: 1, borderColor: colors.highlightMed, fontFamily: fonts.regular }}
            value={branch}
            onChangeText={setBranch}
            placeholder="main"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text className="text-sm mb-1" style={{ color: colors.subtle, fontFamily: fonts.regular }}>File Path</Text>
          <TextInput
            className="text-base rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: colors.overlay, color: colors.text, borderWidth: 1, borderColor: colors.highlightMed, fontFamily: fonts.regular }}
            value={filePath}
            onChangeText={setFilePath}
            placeholder="todo.md"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            onPress={handleTestConnection}
            disabled={testing}
            className="rounded-xl py-3 items-center mt-2"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.highlightMed }}>
            <Text className="text-base" style={{ color: colors.text, fontFamily: fonts.semiBold }}>
              Test Connection
            </Text>
          </Pressable>

          {status !== '' && (
            <Text className="text-sm mt-2" style={{ color: statusColor, fontFamily: fonts.regular }}>
              {status}
            </Text>
          )}

          <Pressable onPress={handleSave}>
            <LinearGradient
              colors={[colors.iris, colors.foam]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: colors.base, fontFamily: fonts.semiBold, fontSize: 16 }}>Save</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

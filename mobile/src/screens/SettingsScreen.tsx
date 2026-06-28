import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import axios from 'axios';
import { getServerUrl, setServerUrl, setAccessToken, setRefreshToken, clearTokens, getAccessToken } from '../utils/auth';

interface Props {
  sync: any;
  onLoginStateChange: () => void;
}

export default function SettingsScreen({ sync, onLoginStateChange }: Props) {
  const { syncStatus, lastSyncTime, triggerSync } = sync;

  const [serverUrl, setServerUrlState] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const url = await getServerUrl();
      setServerUrlState(url);
      const token = await getAccessToken();
      setIsLoggedIn(!!token);
    };
    loadSettings();
  }, []);

  const handleSaveUrl = async () => {
    if (!serverUrl.trim()) return;
    await setServerUrl(serverUrl.trim());
    Alert.alert('Success', 'Server URL updated successfully.');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      // Make login request
      const response = await axios.post(`${serverUrl}/auth/login`, {
        email: email.trim(),
        password: password,
      });

      const { accessToken, refreshToken } = response.data;
      await setAccessToken(accessToken);
      await setRefreshToken(refreshToken);
      setIsLoggedIn(true);
      setEmail('');
      setPassword('');
      onLoginStateChange();
      Alert.alert('Success', 'Logged in successfully!');
      
      // Auto-trigger sync on login
      setTimeout(() => triggerSync(), 500);
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || 'Check your network connection and server URL.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        await axios.post(`${serverUrl}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error('Logout error on server', e);
    }
    await clearTokens();
    setIsLoggedIn(false);
    onLoginStateChange();
    Alert.alert('Logged Out', 'You have been logged out.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>System Settings</Text>
      
      {/* Synchronization Engine Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sync Engine</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Engine Status:</Text>
          <Text style={[
            styles.infoValue,
            syncStatus === 'synced' && { color: '#10b981' },
            syncStatus === 'syncing' && { color: '#6366f1' },
            syncStatus === 'error' && { color: '#ef4444' }
          ]}>
            {syncStatus.toUpperCase()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Synced:</Text>
          <Text style={styles.infoValue}>
            {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.syncBtn} 
          onPress={triggerSync}
          disabled={syncStatus === 'syncing'}
        >
          <Text style={styles.syncBtnText}>
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Network Configuration Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Network Configuration</Text>
        <Text style={styles.label}>Backend Endpoint URL</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrlState}
          placeholder="http://10.0.2.2:8081/api/v1"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
          <Text style={styles.saveBtnText}>Update URL</Text>
        </TouchableOpacity>
      </View>

      {/* User Session Credentials Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Session</Text>
        {isLoggedIn ? (
          <View style={styles.logoutSection}>
            <Text style={styles.loginSuccessText}>✓ Connected to cloud account</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Logout Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@lifeos.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.loginBtn} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? 'Authenticating...' : 'Login & Sync'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 20,
    paddingTop: 40,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#131b2d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  syncBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  syncBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  input: {
    height: 40,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutSection: {
    gap: 12,
    alignItems: 'center',
  },
  loginSuccessText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loginForm: {
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  loginBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

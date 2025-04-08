// components/User.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const User = () => {
  return (
    <View style={styles.container}>
      {/* User Profile */}
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Công Hiếu</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.buttonText}>Xem trang cá nhân</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Options */}
      <ScrollView style={styles.settingsContainer}>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="cloud" size={24} color="blue" />
          <Text style={styles.settingText}>zCloud</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="color-palette" size={24} color="blue" />
          <Text style={styles.settingText}>zStyle – Nổi bật trên Zalo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="cloud-outline" size={24} color="blue" />
          <Text style={styles.settingText}>Cloud của tôi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="cloud-upload" size={24} color="blue" />
          <Text style={styles.settingText}>Dữ liệu trên máy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="qr-code" size={24} color="blue" />
          <Text style={styles.settingText}>Ví QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="shield" size={24} color="blue" />
          <Text style={styles.settingText}>Tài khoản và bảo mật</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="lock-closed" size={24} color="blue" />
          <Text style={styles.settingText}>Quyền riêng tư</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 10,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileButton: {
    marginTop: 10,
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#007bff',
  },
  settingsContainer: {
    marginTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  settingText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default User;

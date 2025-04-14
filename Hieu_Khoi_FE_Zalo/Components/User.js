import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import Footer from './Footer';
import { API_URL } from '../config';
const User = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          if (Platform.OS === 'web') {
            window.location.href = '/login'; // Chuyển hướng trên web
          } else {
            navigation.navigate('Login');
          }
          return;
        }

        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.status === 200) {
          setProfile(data);
        } else {
          throw new Error(data.message || 'Không thể tải hồ sơ');
        }
      } catch (error) {
        setError(error.message);
        console.error('Fetch profile error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0068FF" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Không thể tải hồ sơ'}</Text>
        <Footer navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cover Photo Section */}
      <View style={styles.coverContainer}>
        <Image
          source={require('../img/unnamed.png')} // Đổi thành ảnh bìa riêng biệt
          style={styles.coverImage}
          onError={() => console.log('Error loading cover image')}
        />
      </View>

      {/* Profile Section */}
      <View style={styles.profileWrapper}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { profile })}>
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              defaultSource={require('../img/unnamed.png')}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{profile.username}</Text>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ChangePassword')} // Điều hướng đến ChangePassword
        >
          <Icon name="pencil" size={16} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Đổi Mật Khẩu</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Section */}
      <View style={styles.footerContainer}>
        <Footer navigation={navigation} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  coverContainer: {
    height: 200,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileWrapper: {
    alignItems: 'center',
    marginTop: -60,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonIcon: {
    marginRight: 8,
    color: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 20,
    flex: 1,
  },
});

export default User;
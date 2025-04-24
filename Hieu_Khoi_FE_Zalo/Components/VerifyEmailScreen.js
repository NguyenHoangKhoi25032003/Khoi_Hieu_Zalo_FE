import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '../config';

export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const { token } = route.params || {};
    console.log('Route params:', route.params);
    console.log('Token:', token);

    if (!token) {
      setMessage('Liên kết không hợp lệ');
      setLoading(false);
      return;
    }

    // Gửi yêu cầu xác minh email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('Verify email response:', data, 'Status:', response.status);

        if (response.status === 200) {
          setMessage('Xác minh email thành công! Bây giờ bạn có thể đăng nhập.');
        } else {
          setMessage(data.message || 'Xác minh email thất bại.');
          Alert.alert('Lỗi', data.message || 'Không thể xác minh email.');
        }
      } catch (error) {
        console.error('Verify email error:', error);
        setMessage('Không thể kết nối đến server. Vui lòng thử lại.');
        Alert.alert('Lỗi', 'Không thể kết nối đến server.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [route.params]);

  const handleGoToLogin = () => {
    navigation.navigate('Login', { successMessage: 'Email đã được xác minh! Vui lòng đăng nhập.' });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0068FF" />
      ) : (
        <>
          <Text style={styles.title}>Xác thực email</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleGoToLogin}>
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0068FF',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#00aeef',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
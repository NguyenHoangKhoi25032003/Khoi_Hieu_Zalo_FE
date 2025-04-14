import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState('');
  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    console.log('ResetPasswordScreen mounted');
    console.log('Full route object:', JSON.stringify(route, null, 2));
    console.log('Route params:', route.params);
    const { token: routeToken } = route.params || {};
    if (routeToken) {
      console.log('Token received:', routeToken);
      setToken(routeToken);
    } else {
      console.log('No token found in route.params');
      setErrorMessage('Liên kết không hợp lệ, vui lòng kiểm tra email hoặc yêu cầu lại.');
      setTimeout(() => {
        navigation.navigate('Login', {
          errorMessage: 'Liên kết đặt lại mật khẩu không hợp lệ.',
        });
      }, 3000);
    }
  }, [route.params, navigation]);

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    if (!token) {
      setErrorMessage('Không tìm thấy token, vui lòng sử dụng liên kết từ email.');
      return;
    }
    if (!validatePassword(newPassword)) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      console.log('Sending reset password request with token:', token);
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }), // Sửa tokenodds thành token
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        console.log('Reset password successful, navigating to Login');
        setErrorMessage('');
        navigation.navigate('Login', {
          successMessage: 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.',
        });
      } else {
        console.log('Reset password failed:', data.message);
        setErrorMessage(data.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setLoading(false);
      setErrorMessage('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>Yalo</Text>
      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập mật khẩu mới để tiếp tục</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={[styles.inputContainer, isNewPasswordFocused && styles.inputContainerFocused]}>
        <TextInput
          style={styles.inputText}
          placeholder="Mật khẩu mới"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setErrorMessage('');
          }}
          secureTextEntry
          onFocus={() => setIsNewPasswordFocused(true)}
          onBlur={() => setIsNewPasswordFocused(false)}
        />
      </View>

      <View style={[styles.inputContainer, isConfirmPasswordFocused && styles.inputContainerFocused]}>
        <TextInput
          style={styles.inputText}
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrorMessage('');
          }}
          secureTextEntry
          onFocus={() => setIsConfirmPasswordFocused(true)}
          onBlur={() => setIsConfirmPasswordFocused(false)}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          loading || !newPassword || !confirmPassword || newPassword !== confirmPassword
            ? styles.disabledButton
            : null,
        ]}
        onPress={handleResetPassword}
        disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>CẬP NHẬT MẬT KHẨU</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#007bff',
    letterSpacing: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0068FF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainerFocused: {
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'solid',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#d1d1d1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
    marginTop: 10,
  },
});

export default ResetPasswordScreen;
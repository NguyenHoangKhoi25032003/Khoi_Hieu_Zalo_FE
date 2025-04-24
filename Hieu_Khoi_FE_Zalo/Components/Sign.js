import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_URL } from '../config';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Validation functions
  const validateUsername = (username) => {
    return username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateUsername(username)) {
        Alert.alert('Lỗi', 'Tên người dùng phải có ít nhất 3 ký tự và chỉ chứa chữ cái, số hoặc dấu gạch dưới.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!validateEmail(email)) {
        Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ.');
        return;
      }
      if (!validatePassword(password)) {
        Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }

      setLoading(true);
      try {
        const requestBody = { username, email, password };
        console.log('Sending registration request:', requestBody);

        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        console.log('API response:', data, 'Status:', response.status);
        setLoading(false);

        if (response.status === 201) {
          setStep(3); // Chuyển sang bước xác nhận email
        } else {
          Alert.alert('Lỗi', data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        setLoading(false);
        console.error('Registration error:', error);
        Alert.alert(
          'Lỗi',
          'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.'
        );
      }
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else if (step === 3) {
      navigation.navigate('Login');
    } else {
      setStep(step - 1);
    }
  };

  const handleGoToLogin = () => {
    console.log('Chuyển qua Login');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {step === 1 && (
        <>
          <Text style={styles.title}>Tên Zalo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên của bạn"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoFocus
            autoCapitalize="none"
          />
          <Text style={styles.note}>
            Lưu ý điều kiện: {'\n'}
            - Không được trùng với tên Zalo khác {'\n'}
            - Bạn có thể dùng tên đó để giúp bạn bè nhận ra bạn
          </Text>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.title}>Thông tin đăng nhập</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.note}>Email và mật khẩu sẽ được dùng để đăng nhập.</Text>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.title}>Vui lòng xác nhận email</Text>
          <Text style={styles.note}>
            Chúng tôi đã gửi một email xác minh đến {email}. Vui lòng kiểm tra hộp thư (bao gồm thư mục spam) và nhấp vào liên kết để kích hoạt tài khoản.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleGoToLogin}>
            <Text style={styles.loginButtonText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </>
      )}

      {step !== 3 && (
        <TouchableOpacity
          style={[
            styles.nextButton,
            (step === 1 && !validateUsername(username)) ||
            (step === 2 && (!validateEmail(email) || !validatePassword(password))) ||
            loading
              ? styles.disabledButton
              : null,
          ]}
          onPress={handleNext}
          disabled={
            (step === 1 && !validateUsername(username)) ||
            (step === 2 && (!validateEmail(email) || !validatePassword(password))) ||
            loading
          }
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>{step === 2 ? '✓' : '→'}</Text>
          )}
        </TouchableOpacity>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0068FF',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  note: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  backButtonText: {
    color: '#00aeef',
    fontSize: 30,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#00aeef',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#d1d1d1',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#00aeef',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
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
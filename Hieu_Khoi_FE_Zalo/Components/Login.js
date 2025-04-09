import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput , StatusBar} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false); // Track focus state for phone
  const [isPasswordFocused, setIsPasswordFocused] = useState(false); // Track focus state for password

  const handleLoginWithPassword = () => {
    console.log('Đăng nhập với:', { phoneNumber, password });
  };

  return (
    <View style={styles.container}>
      {/* Logo Zalo as Text */}
      <Text style={styles.logoText}>Zalo</Text>

      {/* Tabs: Số điện thoại | Quét mã QR */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>SỐ ĐIỆN THOẠI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>QUÉT MÃ QR</Text>
        </TouchableOpacity>
      </View>

      {/* Input: Số điện thoại */}
      <View style={[styles.inputContainer, isPhoneFocused && styles.inputContainerFocused]}>
        <Text style={styles.countryCode}>+84 ~</Text>
        <TextInput
          style={styles.inputText}
          placeholder="Số điện thoại"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          onFocus={() => setIsPhoneFocused(true)}
          onBlur={() => setIsPhoneFocused(false)}
        />
      </View>

      {/* Input: Mật khẩu */}
      <View style={[styles.inputContainer, isPasswordFocused && styles.inputContainerFocused, { marginBottom: 80 }]}>
        <TextInput
          style={styles.inputText}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
        />
      </View>

      {/* Nút: Đăng nhập với mật khẩu */}
      <TouchableOpacity style={styles.button} onPress={handleLoginWithPassword}>
        <Text style={styles.buttonText}>ĐĂNG NHẬP VỚI MẬT KHẨU</Text>
      </TouchableOpacity>

      {/* Nút: Hoặc */}
      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>Hoặc</Text>
        <View style={styles.line} />
      </View>

      {/* Liên kết: Quên mật khẩu và Đăng nhập bằng Facebook */}
      <View style={styles.linkContainer}>
        <TouchableOpacity>
          <Text style={styles.linkText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.linkText}>Đăng nhập bằng Facebook</Text>
        </TouchableOpacity>
      </View>

      {/* Liên kết: Chưa có tài khoản? Đăng ký */}
      <View style={styles.footerLinkContainer}>
        <Text style={styles.footerText}>Chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Sign')}>
          <Text style={[styles.footerText, styles.footerLink]}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    // alignItems: 'center',
    // paddingHorizontal: 20,
    // paddingTop: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 100
  },
  logoText: {
    fontSize: 40, // Adjust size to match the logo
    fontWeight: 'bold', // Make it bold
    color: '#007bff', // Match the blue color used in the app
    letterSpacing: 2, // Add some spacing between letters for a geometric look
    marginBottom: 30,
    fontFamily: 'sans-serif', // Use a sans-serif font (you can replace with a custom font if available)
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#007bff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0, // Ensure no default border
    borderColor: 'transparent', // Explicitly set to transparent to avoid any default color
    borderRadius: 8, // Keep rounded corners
    paddingVertical: 10,
    paddingHorizontal: 10, // Padding inside the border
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#f9f9f9', // Light background for contrast
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Add elevation for Android
    elevation: 3,
  },
  inputContainerFocused: {
    borderWidth: 2, // Add border only when focused
    borderColor: '#007bff', // Blue border on focus
    borderStyle: 'solid', // Ensure the border style is solid
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
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
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 14,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 150,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
  footerLink: {
    color: '#007bff',
    fontWeight: 'bold',
  },
});

export default Login;
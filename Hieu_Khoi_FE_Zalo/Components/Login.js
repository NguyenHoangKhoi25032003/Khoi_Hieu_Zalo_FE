

// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRoute } from '@react-navigation/native';
// import { API_URL } from '../config';

// const Login = ({ navigation }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [isEmailFocused, setIsEmailFocused] = useState(false);
//   const [isPasswordFocused, setIsPasswordFocused] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [successMessage, setSuccessMessage] = useState('');
//   const route = useRoute();

//   useEffect(() => {
//     if (route.params?.successMessage) {
//       setSuccessMessage(route.params.successMessage);
//       const timer = setTimeout(() => setSuccessMessage(''), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [route.params]);

//   const handleLoginWithPassword = async () => {
//     if (!email || !password) {
//       Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`${API_URL}/api/auth/login`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();
//       setLoading(false);

//       if (response.status === 200) {
//         if (!data.token || !data.user?.userId) {
//           console.error('API did not return a token or userId:', data);
//           Alert.alert('Lỗi', 'Server không trả về token hoặc userId. Vui lòng thử lại sau.');
//           return;
//         }

//         try {
//           await AsyncStorage.setItem('token', data.token);
//           await AsyncStorage.setItem('userId', data.user.userId);
//           if (data.refreshToken) {
//             await AsyncStorage.setItem('refreshToken', data.refreshToken);
//             console.log('Stored refreshToken:', data.refreshToken.substring(0, 10) + '...');
//           } else {
//             console.warn('No refreshToken returned from API');
//           }

//           // Xác minh các giá trị đã lưu
//           const storedToken = await AsyncStorage.getItem('token');
//           const storedUserId = await AsyncStorage.getItem('userId');
//           const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
//           console.log('Verified stored token:', storedToken ? storedToken.substring(0, 10) + '...' : 'null');
//           console.log('Verified stored userId:', storedUserId || 'null');
//           console.log('Verified stored refreshToken:', storedRefreshToken ? storedRefreshToken.substring(0, 10) + '...' : 'null');

//           if (!storedToken || !storedUserId) {
//             Alert.alert('Lỗi', 'Không thể lưu thông tin đăng nhập. Vui lòng đăng nhập lại.');
//             return;
//           }

//           navigation.navigate('ChatList', { user: data.user });
//         } catch (storageError) {
//           console.error('AsyncStorage error:', storageError);
//           Alert.alert('Lỗi', 'Không thể lưu thông tin đăng nhập. Vui lòng thử lại.');
//         }
//       } else {
//         Alert.alert('Lỗi', data.message || 'Đăng nhập thất bại');
//       }
//     } catch (error) {
//       setLoading(false);
//       Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
//       console.error('Login error:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.logoText}>Yalo</Text>

//       {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

//       <View style={styles.tabContainer}>
//         <TouchableOpacity style={[styles.tab, styles.activeTab]}>
//           <Text style={[styles.tabText, styles.activeTabText]}>EMAIL</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.tab}>
//           <Text style={styles.tabText}>QUÉT MÃ QR</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={[styles.inputContainer, isEmailFocused && styles.inputContainerFocused]}>
//         <TextInput
//           style={styles.inputText}
//           placeholder="Email"
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//           autoCapitalize="none"
//           onFocus={() => setIsEmailFocused(true)}
//           onBlur={() => setIsEmailFocused(false)}
//         />
//       </View>

//       <View style={[styles.inputContainer, isPasswordFocused && styles.inputContainerFocused, { marginBottom: 80 }]}>
//         <TextInput
//           style={styles.inputText}
//           placeholder="Mật khẩu"
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//           onFocus={() => setIsPasswordFocused(true)}
//           onBlur={() => setIsPasswordFocused(false)}
//         />
//       </View>

//       <TouchableOpacity
//         style={[styles.button, loading && styles.disabledButton]}
//         onPress={handleLoginWithPassword}
//         disabled={loading}
//         accessibilityLabel="Đăng nhập với mật khẩu"
//       >
//         {loading ? (
//           <ActivityIndicator size="small" color="#fff" />
//         ) : (
//           <Text style={styles.buttonText}>ĐĂNG NHẬP VỚI MẬT KHẨU</Text>
//         )}
//       </TouchableOpacity>

//       <View style={styles.orContainer}>
//         <View style={styles.line} />
//         <Text style={styles.orText}>Hoặc</Text>
//         <View style={styles.line} />
//       </View>

//       <View style={styles.linkContainer}>
//         <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
//           <Text style={styles.linkText}>Quên mật khẩu?</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.footerLinkContainer}>
//         <Text style={styles.footerText}>Chưa có tài khoản? </Text>
//         <TouchableOpacity onPress={() => navigation.navigate('Sign')}>
//           <Text style={[styles.footerText, styles.footerLink]}>Đăng ký</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: StatusBar.currentHeight + 100,
//   },
//   logoText: {
//     fontSize: 40,
//     fontWeight: 'bold',
//     color: '#007bff',
//     letterSpacing: 2,
//     marginBottom: 30,
//     fontFamily: 'sans-serif',
//   },
//   successText: {
//     fontSize: 14,
//     color: '#388e3c',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginBottom: 20,
//   },
//   tab: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//   },
//   activeTab: {
//     borderBottomWidth: 2,
//     borderBottomColor: '#007bff',
//   },
//   tabText: {
//     fontSize: 14,
//     color: '#888',
//     fontWeight: 'bold',
//   },
//   activeTabText: {
//     color: '#007bff',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 0,
//     borderColor: 'transparent',
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 10,
//     width: '100%',
//     marginBottom: 20,
//     backgroundColor: '#f9f9f9',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   inputContainerFocused: {
//     borderWidth: 2,
//     borderColor: '#007bff',
//     borderStyle: 'solid',
//   },
//   inputText: {
//     fontSize: 16,
//     color: '#333',
//     flex: 1,
//   },
//   button: {
//     backgroundColor: '#007bff',
//     paddingVertical: 15,
//     borderRadius: 25,
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   disabledButton: {
//     backgroundColor: '#d1d1d1',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   orContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 15,
//     width: '100%',
//   },
//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#ddd',
//   },
//   orText: {
//     marginHorizontal: 10,
//     color: '#888',
//     fontSize: 14,
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginVertical: 20,
//   },
//   linkText: {
//     color: '#007bff',
//     fontSize: 14,
//   },
//   footerLinkContainer: {
//     flexDirection: 'row',
//     position: 'absolute',
//     bottom: 150,
//   },
//   footerText: {
//     fontSize: 14,
//     color: '#888',
//   },
//   footerLink: {
//     color: '#007bff',
//     fontWeight: 'bold',
//   },
// });

// export default Login;



import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { API_URL } from '../config';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const route = useRoute();

  useEffect(() => {
    // Xử lý successMessage từ route.params
    if (route.params?.successMessage) {
      setSuccessMessage(route.params.successMessage);
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }

    // Kiểm tra số lần đăng nhập sai từ AsyncStorage
    const loadLoginAttempts = async () => {
      try {
        const storedAttempts = await AsyncStorage.getItem(`loginAttempts_${email}`);
        if (storedAttempts !== null) {
          const parsedAttempts = parseInt(storedAttempts, 10);
          setLoginAttempts(parsedAttempts);
          if (parsedAttempts >= 3) {
            setIsLocked(true);
            setLockMessage('Bạn bị khóa mỗn 5s do đã nhập sai quá nhiều lần');
            setTimeout(() => {
              setIsLocked(false);
              setLoginAttempts(0);
              setLockMessage('');
              AsyncStorage.removeItem(`loginAttempts_${email}`);
            }, 10000);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải số lần thử đăng nhập:', error);
      }
    };

    loadLoginAttempts();
  }, [route.params, email]);

  const handleLoginWithPassword = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    if (isLocked) {
      Alert.alert('Lỗi', 'Tài khoản bị khóa. Vui lòng thử lại sau.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.status === 200) {
        if (!data.token || !data.user?.userId) {
          console.error('API không trả về token hoặc userId:', data);
          Alert.alert('Lỗi', 'Server không trả về token hoặc userId. Vui lòng thử lại sau.');
          return;
        }

        try {
          // Lưu thông tin đăng nhập vào AsyncStorage
          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('userId', data.user.userId);
          if (data.refreshToken) {
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
            console.log('Stored refreshToken:', data.refreshToken.substring(0, 10) + '...');
          } else {
            console.warn('Không có refreshToken từ API');
          }

          // Xác minh các giá trị đã lưu
          const storedToken = await AsyncStorage.getItem('token');
          const storedUserId = await AsyncStorage.getItem('userId');
          const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
          console.log('Verified stored token:', storedToken ? storedToken.substring(0, 10) + '...' : 'null');
          console.log('Verified stored userId:', storedUserId || 'null');
          console.log('Verified stored refreshToken:', storedRefreshToken ? storedRefreshToken.substring(0, 10) + '...' : 'null');

          if (!storedToken || !storedUserId) {
            Alert.alert('Lỗi', 'Không thể lưu thông tin đăng nhập. Vui lòng đăng nhập lại.');
            return;
          }

          // Reset số lần thử sai sau khi đăng nhập thành công
          setLoginAttempts(0);
          await AsyncStorage.removeItem(`loginAttempts_${email}`);

          navigation.navigate('ChatList', { user: data.user });
        } catch (storageError) {
          console.error('Lỗi AsyncStorage:', storageError);
          Alert.alert('Lỗi', 'Không thể lưu thông tin đăng nhập. Vui lòng thử lại.');
        }
      } else {
        // Tăng số lần thử sai
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        await AsyncStorage.setItem(`loginAttempts_${email}`, newAttempts.toString());

        if (newAttempts >= 3) {
          setIsLocked(true);
          setLockMessage('Bạn bị khóa mỗn 10s do nhập sai nhiều lần');
          setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
            setLockMessage('');
            AsyncStorage.removeItem(`loginAttempts_${email}`);
          }, 10000);
        }

        Alert.alert('Lỗi', data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      console.error('Lỗi đăng nhập:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>Yalo</Text>

      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      {lockMessage ? <Text style={styles.lockMessage}>{lockMessage}</Text> : null}

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>EMAIL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>QUÉT MÃ QR</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.inputContainer, isEmailFocused && styles.inputContainerFocused]}>
        <TextInput
          style={styles.inputText}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setIsEmailFocused(true)}
          onBlur={() => setIsEmailFocused(false)}
        />
      </View>

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

      <TouchableOpacity
        style={[styles.button, (loading || isLocked) && styles.disabledButton]}
        onPress={handleLoginWithPassword}
        disabled={loading || isLocked}
        accessibilityLabel="Đăng nhập với mật khẩu"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>ĐĂNG NHẬP VỚI MẬT KHẨU</Text>
        )}
      </TouchableOpacity>

      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>Hoặc</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.linkContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.linkText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 100,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#007bff',
    letterSpacing: 2,
    marginBottom: 30,
    fontFamily: 'sans-serif',
  },
  successText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  lockMessage: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
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
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#d1d1d1',
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
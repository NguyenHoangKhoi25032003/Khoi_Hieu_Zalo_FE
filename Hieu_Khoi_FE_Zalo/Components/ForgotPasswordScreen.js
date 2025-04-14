import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_URL } from '../config';
const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    const handleResendLink = async () => {
        if (!validateEmail(email)) {
            Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            setLoading(false);
            if (response.status === 200) {
                Alert.alert('Thành công', 'Liên kết đã được gửi lại.');
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể gửi liên kết.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Lỗi', 'Không thể kết nối đến server.');
        }
    };
    const handleForgotPassword = async () => {
        if (!validateEmail(email)) {
            Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            setLoading(false);

            if (response.status === 200) {
                Alert.alert('Thành công', 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (bao gồm thư mục spam).');
                navigation.navigate('Login');
            } else {
                Alert.alert('Lỗi', data.message || 'Không thể gửi email khôi phục. Vui lòng thử lại.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            console.error('Forgot password error:', error);
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.logoText}>Yalo</Text>
            <Text style={styles.title}>Khôi phục mật khẩu</Text>
            <Text style={styles.subtitle}>
                Nhập email của bạn để nhận liên kết đặt lại mật khẩu
            </Text>

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

            <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={handleForgotPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>GỬI LIÊN KẾT</Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendLink} disabled={loading}>
                <Text style={styles.linkText}>Gửi lại liên kết</Text>
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

export default ForgotPasswordScreen;
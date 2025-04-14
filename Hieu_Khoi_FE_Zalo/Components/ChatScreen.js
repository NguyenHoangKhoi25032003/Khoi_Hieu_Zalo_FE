import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Biểu tượng từ MaterialIcons
import Ionicons from 'react-native-vector-icons/Ionicons'; // Biểu tượng từ Ionicons

const ChatScreen = ({ route, navigation }) => {
  const { receiverId, receiverName, currentUserId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!receiverId || !currentUserId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Thiếu thông tin: receiverId hoặc currentUserId không hợp lệ</Text>
      </View>
    );
  }

  const cleanId = (id) => (typeof id === 'string' ? id.trim().replace(/[^a-zA-Z0-9-]/g, '') : '');
  const cleanCurrentUserId = cleanId(currentUserId);
  const cleanReceiverId = cleanId(receiverId);

  if (!cleanCurrentUserId || !cleanReceiverId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>ID người dùng không hợp lệ</Text>
      </View>
    );
  }

  const sortedIds = [cleanCurrentUserId, cleanReceiverId].sort();
  const conversationId = `${sortedIds[0]}#${sortedIds[1]}`;

  console.log('ChatScreen params:', { receiverId, receiverName, currentUserId, conversationId });

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('Không tìm thấy token, chuyển đến màn hình Đăng nhập');
          navigation.navigate('Login');
          return;
        }

        console.log('Đang lấy tin nhắn với:', { conversationId, token });
        const response = await fetch(`${API_URL}/api/messages?conversationId=${encodeURIComponent(conversationId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseText = await response.text();
        console.log('Phản hồi thô:', responseText, 'Trạng thái:', response.status);

        try {
          const data = JSON.parse(responseText);
          console.log('Phản hồi đã phân tích:', data);

          if (response.status === 200) {
            setMessages(data);
            setError('');
          } else {
            setError(data.message || `Lỗi khi tải tin nhắn (Trạng thái: ${response.status})`);
            console.log('Chi tiết lỗi:', data.details || data);
          }
        } catch (parseError) {
          console.error('Lỗi phân tích JSON:', parseError.message, 'Phản hồi:', responseText);
          setError('Lỗi phân tích dữ liệu từ server');
        }
      } catch (err) {
        console.error('Lỗi khi lấy tin nhắn:', err.message, err.stack);
        setError('Không thể kết nối đến server: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, navigation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, navigating to Login');
        navigation.navigate('Login');
        return;
      }

      console.log('Sending message:', { receiverId, content: newMessage });
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId,
          content: newMessage.trim(),
        }),
      });

      const responseText = await response.text();
      console.log('Send message raw response:', responseText, 'Status:', response.status);

      try {
        const data = JSON.parse(responseText);
        console.log('Send message parsed response:', data);
        if (response.status === 201) {
          setMessages([...messages, data.data]);
          setNewMessage('');
          setError('');
        } else {
          setError(data.message || 'Không thể gửi tin nhắn');
        }
      } catch (parseError) {
        console.error('Send message JSON parse error:', parseError.message, 'Response:', responseText);
        setError('Lỗi phân tích dữ liệu gửi tin nhắn');
      }
    } catch (err) {
      console.error('Send message error:', err.message, err.stack);
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0068FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{receiverName || 'Unknown'}</Text>
          <Text style={styles.lastSeen}>Truy cập 14 phút trước</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Icon name="phone" size={24} color="#FFFFFF" style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="videocam" size={24} color="#FFFFFF" style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#FFFFFF" style={styles.headerIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Phần hiển thị tin nhắn (giữ nguyên logic hiện tại) */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.timestamp || Math.random().toString()}
        extraData={messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === currentUserId ? styles.sentMessage : styles.receivedMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.messageTime}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />

      {/* Ô nhập tin nhắn */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.emojiButton}>
          <Icon name="emoji-emotions" size={26} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Tin nhắn"
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity style={styles.micButton} onPress={handleSendMessage}>
          {newMessage.trim() ? (
            <Icon name="send" size={26} color="#40C4FF" />
          ) : (
            <Icon name="mic" size={26} color="#666" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5', // Màu nền giống hình
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40C4FF', // Màu xanh dương nhạt
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: 40, // Dành chỗ cho status bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lastSeen: {
    fontSize: 12,
    color: '#E0E0E0',
    marginTop: 3,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
  },
  // Tin nhắn (giữ nguyên logic hiện tại, không thiết kế lại)
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    margin: 10,
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '70%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0068FF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageText: {
    color: '#000',
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  // Ô nhập tin nhắn Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Tăng padding dọc để ô nhập cao hơn
    paddingHorizontal: 15, // Tăng padding ngang để thoáng hơn
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiButton: {
    padding: 15, // Tăng padding để biểu tượng không bị nhỏ
  },
  input: {
    flex: 1,
    paddingVertical: 18, // Tăng chiều cao ô nhập
    paddingHorizontal: 18, // Tăng chiều rộng bên trong ô nhập
    fontSize: 20, // Tăng kích thước chữ
    color: '#333',
    maxHeight: 140, // Tăng chiều cao tối đa để ô nhập lớn hơn
    borderRadius: 25, // Bo tròn nhiều hơn
    backgroundColor: '#F5F5F5',
  },
  micButton: {
    padding: 10, // Tăng padding để biểu tượng lớn hơn
    marginLeft: 8, // Tăng khoảng cách với ô nhập
  },
});

export default ChatScreen;
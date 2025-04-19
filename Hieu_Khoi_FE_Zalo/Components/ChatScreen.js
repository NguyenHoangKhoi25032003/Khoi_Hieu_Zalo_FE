

import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Modal,
  Alert,
  Linking,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import io from 'socket.io-client';

const ChatScreen = ({ route, navigation }) => {
  const { receiverId, receiverName, currentUserId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [socket, setSocket] = useState(null);
  const flatListRef = useRef(null);

  console.log('ChatScreen params:', { receiverId, receiverName, currentUserId });

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
  console.log('Generated conversationId:', conversationId);

  useEffect(() => {
    const initSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      // Chỉ tạo socket nếu chưa tồn tại
      if (!socket) {
        const socketInstance = io(API_URL, {
          query: { token },
          forceNew: false, // Ngăn tạo nhiều kết nối
        });

        socketInstance.on('connect', () => {
          console.log('Socket connected:', socketInstance.id);
          socketInstance.emit('register', currentUserId);
          console.log('Emitted register event with userId:', currentUserId);
        });

        socketInstance.on('receiveMessage', (message) => {
          console.log('Received message:', message);
          console.log('Comparing conversationId:', message.conversationId, 'with', conversationId);
          if (message.conversationId === conversationId) {
            setMessages((prev) => {
              // Tạo khóa duy nhất để kiểm tra trùng lặp
              const messageKey = `${message.conversationId}-${message.timestamp}-${message.senderId}`;
              const isDuplicate = prev.some(
                (msg) => `${msg.conversationId}-${msg.timestamp}-${msg.senderId}` === messageKey
              );
              if (isDuplicate) {
                console.log('Duplicate message detected, skipping:', message);
                return prev;
              }
              console.log('Adding new message:', message);
              return [...prev, message].filter((item) => item);
            });
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } else {
            console.log('ConversationId mismatch:', message.conversationId, conversationId);
          }
        });

        socketInstance.on('messageRead', (data) => {
          console.log('Message read:', data);
          if (data.conversationId === conversationId && data.updatedMessages) {
            setMessages((prev) =>
              prev.map((msg) => {
                const updatedMsg = data.updatedMessages.find(
                  (updated) => updated.conversationId === msg.conversationId && updated.timestamp === msg.timestamp
                );
                return updatedMsg ? { ...msg, isRead: updatedMsg.isRead, readtime: updatedMsg.readtime } : msg;
              })
            );
          }
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Socket error:', err);
          setError('Socket error: ' + err.message);
        });

        setSocket(socketInstance);
      }
    };

    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('No token found, navigating to Login');
          navigation.navigate('Login');
          return;
        }

        console.log('Fetching messages for conversationId:', conversationId);
        const response = await fetch(`${API_URL}/api/messages?conversationId=${encodeURIComponent(conversationId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log('Messages fetched:', data);
        if (response.status === 200) {
          setMessages((prev) => {
            const existingKeys = new Set(prev.map((msg) => `${msg.conversationId}-${msg.timestamp}-${msg.senderId}`));
            const newMessages = Array.isArray(data)
              ? data.filter((item) => item && !existingKeys.has(`${item.conversationId}-${item.timestamp}-${item.senderId}`))
              : [];
            return [...prev, ...newMessages].filter((item) => item);
          });
          setError('');
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        } else {
          setError(data.message || 'Lỗi khi tải tin nhắn');
        }
      } catch (err) {
        console.error('Fetch messages error:', err);
        setError('Không thể kết nối đến server: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const markMessagesAsRead = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('No token found, navigating to Login');
          navigation.navigate('Login');
          return;
        }

        console.log('Marking messages as read for conversationId:', conversationId);
        const response = await fetch(`${API_URL}/api/messages/mark-read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId }),
        });

        const data = await response.json();
        if (response.status === 200) {
          console.log('Messages marked as read:', data);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.conversationId === conversationId && !msg.isRead && msg.receiverId === currentUserId
                ? { ...msg, isRead: true }
                : msg
            )
          );
          socket?.emit('messageRead', { conversationId, userId: currentUserId });
        } else {
          console.error('Mark messages as read failed:', data);
          setError(data.message || 'Không thể đánh dấu tin nhắn đã xem');
        }
      } catch (err) {
        console.error('Mark messages as read error:', err);
        setError('Không thể đánh dấu tin nhắn đã xem: ' + err.message);
      }
    };

    fetchMessages();
    initSocket();
    markMessagesAsRead();

    return () => {
      socket?.disconnect();
      console.log('Socket disconnected');
    };
  }, [conversationId, currentUserId, navigation]);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return false;
      }

      console.log('Fetching users from /api/user/contacts');
      const response = await fetch(`${API_URL}/api/user/contacts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Lỗi khi tải danh sách người dùng: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched users:', data);

      const filteredUsers = data.filter((user) => user.userId !== currentUserId);
      setUsers(filteredUsers);

      if (filteredUsers.length === 0) {
        Alert.alert('Thông báo', 'Không tìm thấy người dùng nào để chuyển tiếp');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Không thể tải danh sách người dùng: ' + err.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
      return false;
    }
  };

  const handleSendMessage = async (contentType = 'text') => {
    if (!newMessage.trim() && contentType === 'text') return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      console.log('Sending message:', { receiverId, content: newMessage, contentType });
      const body = {
        receiverId,
        content: newMessage.trim(),
        contentType,
      };

      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('Send message response:', data);
      if (response.status === 201 && data.data) {
        setNewMessage('');
        setError('');
        // Không thêm tin nhắn vào messages, để Socket.IO xử lý
      } else {
        setError(data.message || 'Không thể gửi tin nhắn');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  const handleSelectFile = async () => {
    try {
      console.log('Opening document picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });

      console.log('DocumentPicker result:', result);
      if (result.canceled) {
        console.log('User cancelled document picker');
        return;
      }

      if (!result.assets || !result.assets[0]) {
        console.log('No assets found in result');
        setError('Không tìm thấy file được chọn');
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name || `file-${Date.now()}`;
      const fileType = result.assets[0].mimeType || 'application/octet-stream';
      const contentType = fileType.startsWith('image/') ? 'image' : 'file';

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, navigating to Login');
        navigation.navigate('Login');
        return;
      }

      console.log('Preparing to upload file:', { fileUri, fileName, fileType, contentType });
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
      formData.append('receiverId', receiverId);
      formData.append('contentType', contentType);

      console.log('Sending file to server');
      const uploadResponse = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await uploadResponse.json();
      console.log('File upload response:', data);
      if (uploadResponse.status === 201) {
        setError('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log('Upload failed with status:', uploadResponse.status);
        setError(data.message || 'Không thể gửi file');
      }
    } catch (err) {
      console.error('File picker error:', err);
      setError('Lỗi khi chọn file: ' + err.message);
    }
  };

  const handleSelectImage = async () => {
    try {
      console.log('Requesting image picker permissions');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setError('Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      console.log('Opening image picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      console.log('ImagePicker result:', result);
      if (result.canceled) {
        console.log('User cancelled image picker');
        return;
      }

      if (!result.assets || !result.assets[0]) {
        console.log('No assets found in result');
        setError('Không tìm thấy ảnh được chọn');
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileName = `image-${Date.now()}.jpg`;
      const fileType = result.assets[0].mimeType || 'image/jpeg';
      const contentType = 'image';

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, navigating to Login');
        navigation.navigate('Login');
        return;
      }

      console.log('Preparing to upload image:', { fileUri, fileName, fileType, contentType });
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
      formData.append('receiverId', receiverId);
      formData.append('contentType', contentType);

      console.log('Sending image to server');
      const uploadResponse = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await uploadResponse.json();
      console.log('Image upload response:', data);
      if (uploadResponse.status === 201) {
        setError('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log('Upload failed with status:', uploadResponse.status);
        setError(data.message || 'Không thể gửi ảnh');
      }
    } catch (err) {
      console.error('Image picker error:', err);
      setError('Lỗi khi chọn ảnh: ' + err.message);
    }
  };

  const openImageViewer = (url) => {
    setSelectedImage(url);
    setModalVisible(true);
  };

  const handleDeleteMessage = async (conversationId, timestamp) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      console.log('Deleting message:', { conversationId, timestamp });
      const response = await fetch(`${API_URL}/api/messages/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, timestamp }),
      });

      const data = await response.json();
      console.log('Delete message response:', data);
      if (response.status === 200) {
        setMessages((prev) =>
          prev.filter((msg) => !(msg.conversationId === conversationId && msg.timestamp === timestamp))
        );
        setError('');
      } else {
        setError(data.message || 'Không thể xóa tin nhắn');
      }
    } catch (err) {
      console.error('Delete message error:', err);
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  const handleRecallMessage = async (conversationId, timestamp) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      console.log('Recalling message:', { conversationId, timestamp });
      const response = await fetch(`${API_URL}/api/messages/recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, timestamp }),
      });

      const data = await response.json();
      console.log('Recall message response:', data);
      if (response.status === 200) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.conversationId === conversationId && msg.timestamp === timestamp
              ? { ...msg, isRecalled: true, content: 'Tin nhắn đã được thu hồi', fileUrl: null, contentType: 'text' }
              : msg
          )
        );
        setError('');
      } else {
        setError(data.message || 'Không thể thu hồi tin nhắn');
      }
    } catch (err) {
      console.error('Recall message error:', err);
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  const handleForwardMessage = async (newReceiverId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      console.log('Forwarding message:', {
        conversationId: selectedMessage.conversationId,
        timestamp: selectedMessage.timestamp,
        newReceiverId,
      });
      const response = await fetch(`${API_URL}/api/messages/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedMessage.conversationId,
          timestamp: selectedMessage.timestamp,
          newReceiverId,
        }),
      });

      const data = await response.json();
      console.log('Forward message response:', data);
      if (response.status === 201) {
        setForwardModalVisible(false);
        setSelectedMessage(null);
        Alert.alert('Thành công', 'Tin nhắn đã được chuyển tiếp');
      } else {
        setError(data.message || 'Không thể chuyển tiếp tin nhắn');
      }
    } catch (err) {
      console.error('Forward message error:', err);
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  const showMessageOptions = (conversationId, timestamp, senderId, isRecalled) => {
    const options = [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Chuyển tiếp',
        style: 'default',
        onPress: async () => {
          const success = await fetchUsers();
          if (success) {
            setSelectedMessage({ conversationId, timestamp });
            setForwardModalVisible(true);
          }
        },
      },
    ];

    if (senderId === currentUserId && !isRecalled) {
      options.push({
        text: 'Thu hồi',
        style: 'default',
        onPress: () => handleRecallMessage(conversationId, timestamp),
      });
    }

    options.push({
      text: 'Xóa',
      style: 'destructive',
      onPress: () => handleDeleteMessage(conversationId, timestamp),
    });

    Alert.alert('Tùy chọn', 'Chọn hành động', options, { cancelable: true });
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
      style={styles

.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{receiverName || 'Unknown'}</Text>
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

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => `${item?.conversationId || 'unknown'}-${item?.timestamp?.toString() || 'no-timestamp'}-${item?.senderId || 'no-sender'}-${index}`}
        extraData={messages}
        renderItem={({ item }) => {
          if (!item) return null;
          console.log('Rendering message:', {
            conversationId: item.conversationId,
            content: item.content,
            contentType: item.contentType,
            timestamp: item.timestamp,
            senderId: item.senderId,
            receiverId: item.receiverId,
            fileUrl: item.fileUrl,
            isRecalled: item.isRecalled,
            isRead: item.isRead,
            readtime: item.readtime,
          });
          return (
            <TouchableOpacity
              onLongPress={() => showMessageOptions(item.conversationId, item.timestamp, item.senderId, item.isRecalled)}
              style={[
                item.contentType === 'text' ? styles.messageContainer : styles.mediaContainer,
                item.senderId === cleanCurrentUserId ? styles.sentMessage : styles.receivedMessage,
              ]}
            >
              {item.isRecalled ? (
                <Text style={[styles.messageText, styles.recalledText]}>Tin nhắn đã được thu hồi</Text>
              ) : item.contentType === 'image' && item.fileUrl ? (
                <TouchableOpacity onPress={() => openImageViewer(item.fileUrl)}>
                  <Image
                    source={{ uri: item.fileUrl }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                    defaultSource={require('../img/unnamed.png')}
                    onError={(e) => {
                      console.error('Image load error:', e.nativeEvent.error);
                      setError(`Không thể tải ảnh: ${item.fileUrl}`);
                    }}
                  />
                </TouchableOpacity>
              ) : item.contentType === 'file' && item.fileUrl ? (
                <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl)}>
                  <View style={styles.fileContainer}>
                    <Icon name="insert-drive-file" size={24} color="#666" />
                    <Text style={styles.fileText}>{item.content || 'File'}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={styles.messageText}>{item.content || ''}</Text>
              )}
              <View style={styles.messageFooter}>
               
                {item.senderId === cleanCurrentUserId && !item.isRecalled && (
                  <Text style={styles.readStatus}>
                    {item.isRead && item.readtime
                      ? `Đã xem lúc ${new Date(item.readtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Đã gửi'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={[styles.messageList, { paddingBottom: 80 }]}
      />

      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Icon name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <ScrollView
            contentContainerStyle={styles.scrollViewContainer}
            maximumZoomScale={3}
            minimumZoomScale={1}
            pinchGestureEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={forwardModalVisible} transparent={true} onRequestClose={() => setForwardModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.forwardModalContent}>
            <Text style={styles.modalTitle}>Chuyển tiếp tin nhắn</Text>
            {users.length === 0 ? (
              <Text style={styles.noUsersText}>Không tìm thấy người dùng</Text>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item, index) => `${item.userId}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.userItem} onPress={() => handleForwardMessage(item.userId)}>
                    <Text style={styles.userName}>{item.username || 'Unknown'}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setForwardModalVisible(false)}>
              <Text style={styles.closeModalText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.fileButton} onPress={handleSelectFile}>
          <Icon name="attach-file" size={26} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
          <Icon name="photo" size={26} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Tin nhắn"
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity style={styles.micButton} onPress={() => handleSendMessage('text')}>
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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40C4FF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: 40,
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    margin: 10,
  },
  messageList: {
    padding: 10,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '75%',
    marginVertical: 6,
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaContainer: {
    maxWidth: '80%',
    marginVertical: 8,
    padding: 0,
    backgroundColor: 'transparent',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0068FF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'black',
  },
  messageText: {
    color: '#FFF',
    fontSize: 16,
  },
  recalledText: {
    fontStyle: 'italic',
    color: '#888',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  readStatus: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  imagePreview: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#EEE',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    maxWidth: 250,
  },
  fileText: {
    color: '#333',
    fontSize: 15,
    marginLeft: 10,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  fileButton: {
    padding: 10,
  },
  imageButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    maxHeight: 100,
  },
  micButton: {
    padding: 10,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    padding: 12,
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: height * 0.9,
  },
  forwardModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  userItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userName: {
    fontSize: 16,
    color: '#333',
  },
  noUsersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  closeModalButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#40C4FF',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatScreen;
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
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import io from 'socket.io-client';
import { API_URL } from '../config';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
const GroupChatScreen = ({ route, navigation }) => {
  const { groupId, groupName, currentUserId, members, ownerId } = route.params || {};
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);


  // Ngăn thông báo khi ở màn hình nhóm
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const { groupId: notifiedGroupId } = notification.request.content.data || {};
      if (notifiedGroupId === groupId) {
        console.log('Dismissing notification for current group:', groupId);
        Notifications.dismissNotificationAsync(notification.request.identifier);
      }
    });

    return () => subscription.remove();
  }, [groupId]);
  // Hàm sắp xếp tin nhắn theo timestamp tăng dần
  const sortMessages = (msgs) => {
    return msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  // Lấy danh sách tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigation.navigate('Login');
          return;
        }

        const response = await fetch(`${API_URL}/api/group-chat/${groupId}?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.status === 200) {
          setMessages(sortMessages(data.items || []));
          setLastEvaluatedKey(data.lastEvaluatedKey);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          socketRef.current.emit('readGroupMessage', { groupId, userId: currentUserId });
        } else {
          Alert.alert('Lỗi', data.message || 'Không thể lấy tin nhắn.');
        }
      } catch (err) {
        Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
      }
    };

    fetchMessages();
  }, [groupId, navigation]);

  // Tải thêm tin nhắn
  const loadMoreMessages = async () => {
    if (loadingMore || !lastEvaluatedKey) return;
    setLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/group-chat/${groupId}?limit=20&lastEvaluatedKey=${encodeURIComponent(
          JSON.stringify(lastEvaluatedKey)
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.status === 200) {
        setMessages((prev) => sortMessages([...data.items, ...prev]));
        setLastEvaluatedKey(data.lastEvaluatedKey);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Khởi tạo Socket.IO
  useEffect(() => {
    const initSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      socketRef.current = io(API_URL, {
        query: { token },
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinGroup', groupId);
      });

      socketRef.current.on('receiveGroupMessage', (message) => {
        console.log('Received group message:', message);
        // setMessages((prev) => sortMessages([...prev, message]));
        setMessages((prev) => {
          // Kiểm tra xem messageId đã tồn tại chưa
          if (prev.some((msg) => msg.messageId === message.messageId)) {
            console.warn('Duplicate message received via Socket.IO:', message.messageId);
            return prev; // Bỏ qua tin nhắn trùng lặp
          }
          return sortMessages([...prev, message]);
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });

      socketRef.current.on('groupMessageDeleted', ({ groupId: deletedGroupId, timestamp }) => {
        if (deletedGroupId === groupId) {
          setMessages((prev) => prev.filter((msg) => msg.timestamp !== timestamp));
        }
      });

      socketRef.current.on('groupMessageRecalled', (recalledMessage) => {
        setMessages((prev) =>
          sortMessages(
            prev.map((msg) =>
              msg.messageId === recalledMessage.messageId ? recalledMessage : msg
            )
          )
        );
      });

      socketRef.current.on('connect_error', (err) => {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng kiểm tra mạng.');
      });

      return () => {
        socketRef.current?.emit('leaveGroup', groupId);
        socketRef.current?.disconnect();
      };
    };

    initSocket();
  }, [groupId, navigation]);

  // Gửi tin nhắn văn bản
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/api/group-chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          content: newMessage,
          type: 'text',
        }),
      });

      const data = await response.json();
      if (response.status === 201) {
        setNewMessage('');
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi tin nhắn.');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
    }
  };

  // Gửi file/hình ảnh
  const handleSelectFile = async () => {
    try {
      console.log('Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Cho phép chọn mọi loại file
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('User cancelled document picker');
        Alert.alert('Thông báo', 'Bạn đã hủy chọn file.');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.error('No assets returned from document picker');
        Alert.alert('Lỗi', 'Không thể lấy thông tin file. Vui lòng thử lại.');
        return;
      }

      const { uri, name, mimeType, size } = result.assets[0];

      // Kiểm tra kích thước file (giới hạn 10MB)
      if (size && size > 10 * 1024 * 1024) {
        Alert.alert('Lỗi', 'File quá lớn. Vui lòng chọn file dưới 10MB.');
        return;
      }

      const file = {
        uri: uri, // Giữ nguyên uri, FormData sẽ xử lý
        name: name || `file-${Date.now()}.${mimeType ? mimeType.split('/')[1] : 'bin'}`,
        type: mimeType || 'application/octet-stream',
      };

      console.log('File to upload:', file);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', groupId);
      formData.append(
        'type',
        file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file'
      );

      console.log('Sending FormData to backend...');
      const response = await fetch(`${API_URL}/api/group-chat/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Không cần đặt 'Content-Type' vì FormData tự động xử lý
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Backend response:', { status: response.status, data });

      if (response.status === 201) {
      //  Alert.alert('Thành công', 'Đã gửi file.');
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi file.');
      }
    } catch (err) {
      console.error('Error in handleSelectFile:', err);
      Alert.alert('Lỗi', 'Không thể chọn hoặc gửi file: ' + err.message);
    }
  };


  // Chọn và gửi ảnh từ thư viện
  const handleSelectImage = async () => {
    try {
      //if (isSendingImage) return;
      // Yêu cầu quyền truy cập thư viện ảnh
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập bị từ chối',
          'Vui lòng cấp quyền truy cập thư viện ảnh trong cài đặt.'
        );
        return;
      }

      console.log('Opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Chỉ chọn ảnh
        allowsEditing: false, // Không cho phép chỉnh sửa
        quality: 0.8, // Chất lượng ảnh (0.0 - 1.0)
      });

      console.log('Image picker result:', result);

      if (result.canceled) {
        console.log('User cancelled image picker');
        Alert.alert('Thông báo', 'Bạn đã hủy chọn ảnh.');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.error('No assets returned from image picker');
        Alert.alert('Lỗi', 'Không thể lấy thông tin ảnh. Vui lòng thử lại.');
        return;
      }

      const { uri, fileName, mimeType, fileSize } = result.assets[0];

      // Kiểm tra kích thước ảnh (giới hạn 10MB)
      if (fileSize && fileSize > 10 * 1024 * 1024) {
        Alert.alert('Lỗi', 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.');
        return;
      }

      const image = {
        uri: uri,
        name: fileName || `image-${Date.now()}.${mimeType ? mimeType.split('/')[1] : 'jpg'}`,
        type: mimeType || 'image/jpeg',
      };

      console.log('Image to upload:', image);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      const formData = new FormData();
      formData.append('file', image);
      formData.append('groupId', groupId);
      formData.append('type', 'image');

      console.log('Sending image FormData to backend...');
      const response = await fetch(`${API_URL}/api/group-chat/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Backend response:', { status: response.status, data });

      if (response.status === 201) {
       // Alert.alert('Thành công', 'Đã gửi ảnh.');
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi ảnh.');
      }
    } catch (err) {
      console.error('Error in handleSelectImage:', err);
      Alert.alert('Lỗi', 'Không thể chọn hoặc gửi ảnh: ' + err.message);
    }
  };

  // Thu hồi tin nhắn
  const handleRecallMessage = async (messageId) => {
    Alert.alert('Thu hồi tin nhắn', 'Bạn có chắc chắn muốn thu hồi tin nhắn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Thu hồi',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
              navigation.navigate('Login');
              return;
            }

            const response = await fetch(`${API_URL}/api/group-chat/recall`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                messageId,
                senderId: currentUserId,
              }),
            });

            const data = await response.json();
            if (response.status === 200) {
              Alert.alert('Thành công', 'Tin nhắn đã được thu hồi.');
            } else {
              Alert.alert('Lỗi', data.message || 'Không thể thu hồi tin nhắn.');
            }
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
          }
        },
      },
    ]);
  };

  // Xóa tin nhắn
  const handleDeleteMessage = async (messageId, timestamp) => {
    Alert.alert('Xóa tin nhắn', 'Bạn có chắc chắn muốn xóa tin nhắn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
              navigation.navigate('Login');
              return;
            }

            const response = await fetch(`${API_URL}/api/group-chat/`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                groupId,
                timestamp,
              }),
            });

            const data = await response.json();
            if (response.status === 200) {
              Alert.alert('Thành công', 'Tin nhắn đã được xóa.');
            } else {
              Alert.alert('Lỗi', data.message || 'Không thể xóa tin nhắn.');
            }
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
          }
        },
      },
    ]);
  };

  // Render tin nhắn
  const renderMessage = ({ item }) => {
    const isSent = item.senderId === currentUserId;
    const sender = members.find((m) => m.userId === item.senderId) || { username: 'Unknown' };
    return (
      <TouchableOpacity
        style={[
          item.type === 'text' ? styles.messageContainer : styles.mediaContainer,
          isSent ? styles.sentMessage : styles.receivedMessage,
        ]}
        onLongPress={() =>
          isSent &&
          !item.isRecalled &&
          Alert.alert('Tùy chọn', 'Chọn hành động', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Thu hồi', onPress: () => handleRecallMessage(item.messageId) },
            {
              text: 'Xóa',
              onPress: () => handleDeleteMessage(item.messageId, item.timestamp),
            },
          ])
        }
      >
        {!isSent && <Text style={styles.senderName}>{sender.username}</Text>}
        {item.isRecalled ? (
          <Text style={[styles.messageText, { fontStyle: 'italic' }]}>
            Tin nhắn đã được thu hồi
          </Text>
        ) : item.type === 'text' ? (
          <Text style={styles.messageText}>{item.content}</Text>
        ) : item.type === 'image' ? (
          item.fileUrl ? (
            <Image
              source={{ uri: item.fileUrl }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.messageText}>[Hình ảnh không khả dụng]</Text>
          )
        ) : (
          <Text style={styles.messageText}>
            [File: {item.fileUrl ? item.fileUrl.split('/').pop() : 'Không khả dụng'}]
          </Text>
        )}
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </TouchableOpacity>
    );
  };

  // Chuyển đến màn hình thông tin nhóm
  const handleGroupNamePress = () => {
    navigation.navigate('GroupInfoScreen', {
      groupId,
      groupName,
      members,
      ownerId,
      currentUserId,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGroupNamePress} style={styles.headerContent}>
          <Text style={styles.headerTitle}>{groupName || 'Nhóm'}</Text>
        </TouchableOpacity>
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

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={[styles.messageList, { paddingBottom: 80 }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#0068FF" /> : null}
      />

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

const { width } = Dimensions.get('window');

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
    backgroundColor: '#333',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    color: '#FFF',
    fontSize: 16,
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
  timestamp: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
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
});

export default GroupChatScreen;
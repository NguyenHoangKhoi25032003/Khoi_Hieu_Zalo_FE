// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Image,
//   Modal,
//   Alert,
//   Linking,
//   ScrollView,
//   Dimensions,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as DocumentPicker from 'expo-document-picker';
// import * as ImagePicker from 'expo-image-picker';
// import { API_URL, MAX_FILE_SIZE, VALID_EXTENSIONS } from '../config';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import io from 'socket.io-client';

// const ChatScreen = ({ route, navigation }) => {
//   const { receiverId, receiverName, currentUserId } = route.params || {};
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [forwardModalVisible, setForwardModalVisible] = useState(false);
//   const [friends, setFriends] = useState([]);
//   const [selectedMessage, setSelectedMessage] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const flatListRef = useRef(null);
//   const retryCountRef = useRef(0);
//   const maxRetries = 3;

//   // Kiểm tra tham số đầu vào
//   if (!receiverId || !currentUserId) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.errorText}>Thiếu thông tin: receiverId hoặc currentUserId không hợp lệ</Text>
//       </View>
//     );
//   }

//   // Làm sạch ID
//   const cleanId = (id) => (typeof id === 'string' ? id.trim().replace(/[^a-zA-Z0-9-]/g, '') : '');
//   const cleanCurrentUserId = cleanId(currentUserId);
//   const cleanReceiverId = cleanId(receiverId);

//   if (!cleanCurrentUserId || !cleanReceiverId) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.errorText}>ID người dùng không hợp lệ</Text>
//       </View>
//     );
//   }

//   // Tạo conversationId
//   const sortedIds = [cleanCurrentUserId, cleanReceiverId].sort();
//   const conversationId = `${sortedIds[0]}#${sortedIds[1]}`;

//   // Định dạng thời gian
//   const formatTimestamp = (timestamp) => {
//     try {
//       const date = new Date(timestamp);
//       if (isNaN(date.getTime())) return 'Không rõ';
//       const today = new Date();
//       const isToday = date.toDateString() === today.toDateString();
//       const hours = date.getHours().toString().padStart(2, '0');
//       const minutes = date.getMinutes().toString().padStart(2, '0');
//       if (isToday) return `Hôm nay, ${hours}:${minutes}`;
//       return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${hours}:${minutes}`;
//     } catch (error) {
//       console.error('Lỗi định dạng timestamp:', error);
//       return 'Không rõ';
//     }
//   };

//   // Làm mới token
//   const refreshToken = async () => {
//     try {
//       const refreshToken = await AsyncStorage.getItem('refreshToken');
//       if (!refreshToken) throw new Error('Không có refresh token');

//       const response = await fetch(`${API_URL}/api/auth/refresh`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ refreshToken }),
//       });

//       const data = await response.json();
//       if (response.status === 200 && data.accessToken) {
//         await AsyncStorage.setItem('token', data.accessToken);
//         if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
//         return data.accessToken;
//       }
//       throw new Error(data.message || 'Không thể làm mới token');
//     } catch (err) {
//       console.error('Refresh token error:', err);
//       await AsyncStorage.removeItem('token');
//       await AsyncStorage.removeItem('refreshToken');
//       navigation.navigate('Login');
//       Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//       return null;
//     }
//   };

//   // Lấy danh sách tin nhắn
//   const fetchMessages = async () => {
//     try {
//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return;
//       }

//       const response = await fetch(`${API_URL}/api/chat/messages/${cleanReceiverId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await response.json();
//       if (response.status === 200) {
//         if (Array.isArray(data)) {
//           setMessages((prev) => {
//             const messageIds = new Set(prev.map((msg) => msg.messageId));
//             const filteredMessages = data.filter(
//               (msg) => msg && msg.conversationId && msg.messageId && !messageIds.has(msg.messageId)
//             );
//             const updatedMessages = [...prev, ...filteredMessages].sort(
//               (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//             );
//             return updatedMessages;
//           });
//           setError('');
//           retryCountRef.current = 0;
//           setTimeout(() => {
//             flatListRef.current?.scrollToEnd({ animated: false });
//           }, 100);
//         } else {
//           throw new Error('Dữ liệu tin nhắn không hợp lệ');
//         }
//       } else if (response.status === 401) {
//         token = await refreshToken();
//         if (token) {
//           retryCountRef.current = 0;
//           fetchMessages();
//         }
//       } else {
//         throw new Error(data.message || `Lỗi ${response.status}: Không thể tải tin nhắn`);
//       }
//     } catch (err) {
//       console.error('Fetch messages error:', err);
//       if (retryCountRef.current < maxRetries && (err.message.includes('Lỗi máy chủ') || err.message.includes('Không thể kết nối'))) {
//         retryCountRef.current += 1;
//         setTimeout(fetchMessages, 2000);
//       } else {
//         setError(`Không thể tải lịch sử tin nhắn: ${err.message}`);
//         retryCountRef.current = 0;
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Khởi tạo và xử lý Socket.IO
//   useEffect(() => {
//     let socketInstance = null;

//     const initSocket = async () => {
//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) {
//           setError('Vui lòng đăng nhập lại để tiếp tục trò chuyện');
//           return;
//         }
//       }

//       socketInstance = io(API_URL, {
//         auth: { token },
//         transports: ['websocket'],
//         reconnection: true,
//         reconnectionAttempts: 15,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         timeout: 15000,
//       });

//       socketInstance.on('connect', () => {
//         socketInstance.emit('join', cleanCurrentUserId);
//         setError('');
//       });

//       socketInstance.on(`receiveMessage_${cleanCurrentUserId}`, (message) => {
//         if (
//           message &&
//           message.conversationId === conversationId &&
//           message.messageId &&
//           message.senderId !== cleanCurrentUserId
//         ) {
//           setMessages((prev) => {
//             if (prev.some((msg) => msg.messageId === message.messageId)) return prev;
//             const updatedMessages = [...prev, message].sort(
//               (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//             );
//             return updatedMessages;
//           });
//           setTimeout(() => {
//             flatListRef.current?.scrollToEnd({ animated: true });
//           }, 100);
//         }
//       });

      
//       socketInstance.on('connect_error', async (err) => {
//         console.error('Socket connect error:', err.message);
//         if (err.message.includes('Token không hợp lệ')) {
//           const newToken = await refreshToken();
//           if (newToken) {
//             socketInstance.auth.token = newToken;
//             socketInstance.connect();
//           }
//         } else {
//           setError(`Không thể kết nối Socket: ${err.message}`);
//         }
//       });

//       socketInstance.on('disconnect', (reason) => {
//         setError(`Socket ngắt kết nối: ${reason}. Đang thử kết nối lại...`);
//       });

//       setSocket(socketInstance);
//     };

//     // Đánh dấu tin nhắn đã đọc
//     const markMessagesAsRead = async () => {
//       let retries = 0;
//       while (retries < maxRetries) {
//         try {
//           let token = await AsyncStorage.getItem('token');
//           if (!token) {
//             token = await refreshToken();
//             if (!token) return;
//           }

//           const response = await fetch(`${API_URL}/api/chat/mark-read`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               Authorization: `Bearer ${token}`,
//             },
//             body: JSON.stringify({ conversationId, userId: cleanCurrentUserId }),
//           });

//           if (response.status === 200) {
//             setMessages((prev) =>
//               prev.map((msg) =>
//                 msg.conversationId === conversationId && !msg.isRead && msg.receiverId === cleanCurrentUserId
//                   ? { ...msg, isRead: true }
//                   : msg
//               )
//             );
//             socketInstance?.emit('markMessagesAsRead', { conversationId, userId: cleanCurrentUserId });
//             return;
//           } else if (response.status === 401) {
//             token = await refreshToken();
//             if (!token) return;
//           } else {
//             throw new Error('Mark messages as read failed');
//           }
//         } catch (err) {
//           console.error('Mark messages as read error:', err);
//           retries++;
//           if (retries === maxRetries) {
//             setError('Không thể đánh dấu tin nhắn đã đọc');
//           }
//           await new Promise((resolve) => setTimeout(resolve, 2000));
//         }
//       }
//     };

//     // Khởi tạo
//     fetchMessages();
//     initSocket();
//     markMessagesAsRead();

//     // Cleanup
//     return () => {
//       socketInstance?.disconnect();
//     };
//   }, [conversationId, cleanCurrentUserId, cleanReceiverId, navigation]);

//   // Lấy danh sách bạn bè
//   const fetchFriends = async () => {
//     try {
//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return false;
//       }

//       const response = await fetch(`${API_URL}/api/friend/list`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `Lỗi khi tải danh sách bạn bè: ${response.status}`);
//       }

//       const data = await response.json();
//       const filteredFriends = data.friends.filter((friend) => friend.userId !== cleanCurrentUserId);
//       setFriends(filteredFriends);

//       if (filteredFriends.length === 0) {
//         Alert.alert('Thông báo', 'Không tìm thấy bạn bè nào để chuyển tiếp');
//         return false;
//       }
//       return true;
//     } catch (err) {
//       console.error('Fetch friends error:', err);
//       setError('Không thể tải danh sách bạn bè: ' + err.message);
//       Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè');
//       return false;
//     }
//   };

//   // Gửi tin nhắn văn bản
//   const handleSendMessage = async () => {
//     if (!newMessage.trim()) return;

//     try {
//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return;
//       }

//       const body = {
//         senderId: cleanCurrentUserId,
//         receiverId: cleanReceiverId,
//         content: newMessage.trim(),
//         type: 'text',
//         timestamp: new Date().toISOString(),
//       };

//       const response = await fetch(`${API_URL}/api/chat`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(body),
//       });

//       const data = await response.json();
//       if (response.status === 201) {
//         const newMessageObj = {
//           ...data,
//           senderId: cleanCurrentUserId,
//           receiverId: cleanReceiverId,
//           content: newMessage.trim(),
//           type: 'text',
//           isRead: false,
//           isRecalled: false,
//           conversationId,
//           timestamp: data.timestamp || new Date().toISOString(),
//           messageId: data.messageId,
//         };
//         setMessages((prev) => {
//           if (prev.some((msg) => msg.messageId === newMessageObj.messageId)) return prev;
//           const updatedMessages = [...prev, newMessageObj].sort(
//             (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//           );
//           return updatedMessages;
//         });
//         setNewMessage('');
//         setError('');
//         setTimeout(() => {
//           flatListRef.current?.scrollToEnd({ animated: true });
//         }, 100);
//         if (socket?.connected) {
//           socket.emit('sendMessage', newMessageObj);
//         }
//       } else if (response.status === 401) {
//         token = await refreshToken();
//         if (token) handleSendMessage();
//       } else {
//         setError(data.message || 'Không thể gửi tin nhắn');
//       }
//     } catch (err) {
//       console.error('Send message error:', err);
//       setError('Không thể gửi tin nhắn: ' + err.message);
//     }
//   };

//   // Gửi file
//   const handleSelectFile = async () => {
//     try {
//       const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
//       if (result.canceled) return;

//       if (!result.assets || !result.assets[0]) {
//         setError('Không tìm thấy file được chọn');
//         return;
//       }

//       const fileUri = result.assets[0].uri;
//       const fileName = result.assets[0].name || `file-${Date.now()}`;
//       const fileType = result.assets[0].mimeType || 'application/octet-stream';
//       const fileSize = result.assets[0].size || 0;

//       if (fileSize > MAX_FILE_SIZE) {
//         setError('File quá lớn, tối đa 10MB');
//         return;
//       }

//       const extension = fileName.split('.').pop().toLowerCase();
//       if (!VALID_EXTENSIONS.includes(extension)) {
//         setError('Định dạng file không được hỗ trợ');
//         return;
//       }

//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return;
//       }

//       const formData = new FormData();
//       formData.append('file', { uri: fileUri, name: fileName, type: fileType });
//       formData.append('senderId', cleanCurrentUserId);
//       formData.append('receiverId', cleanReceiverId);
//       formData.append('type', fileType.startsWith('image/') ? 'image' : 'file');

//       const uploadResponse = await fetch(`${API_URL}/api/chat`, {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       const data = await uploadResponse.json();
//       if (uploadResponse.status === 201) {
//         const newMessageObj = {
//           ...data,
//           senderId: cleanCurrentUserId,
//           receiverId: cleanReceiverId,
//           content: fileName,
//           isRead: false,
//           isRecalled: false,
//           conversationId,
//           timestamp: data.timestamp || new Date().toISOString(),
//           messageId: data.messageId,
//         };
//         setMessages((prev) => {
//           if (prev.some((msg) => msg.messageId === newMessageObj.messageId)) return prev;
//           const updatedMessages = [...prev, newMessageObj].sort(
//             (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//           );
//           return updatedMessages;
//         });
//         setError('');
//         setTimeout(() => {
//           flatListRef.current?.scrollToEnd({ animated: true });
//         }, 100);
//         if (socket?.connected) {
//           socket.emit('sendMessage', newMessageObj);
//         }
//       } else if (uploadResponse.status === 401) {
//         token = await refreshToken();
//         if (token) handleSelectFile();
//       } else {
//         setError(data.message || 'Không thể gửi file');
//       }
//     } catch (err) {
//       console.error('File picker error:', err);
//       setError('Lỗi khi chọn file: ' + err.message);
//     }
//   };

//   // Gửi hình ảnh
//   const handleSelectImage = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permissionResult.granted) {
//         setError('Cần cấp quyền truy cập thư viện ảnh');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: false,
//         quality: 1,
//       });

//       if (result.canceled) return;

//       if (!result.assets || !result.assets[0]) {
//         setError('Không tìm thấy ảnh được chọn');
//         return;
//       }

//       const fileUri = result.assets[0].uri;
//       const fileName = `image-${Date.now()}.jpg`;
//       const fileType = result.assets[0].mimeType || 'image/jpeg';
//       const fileSize = result.assets[0].size || 0;

//       if (fileSize > MAX_FILE_SIZE) {
//         setError('Ảnh quá lớn, tối đa 10MB');
//         return;
//       }

//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return;
//       }

//       const formData = new FormData();
//       formData.append('file', { uri: fileUri, name: fileName, type: fileType });
//       formData.append('senderId', cleanCurrentUserId);
//       formData.append('receiverId', cleanReceiverId);
//       formData.append('type', 'image');

//       const uploadResponse = await fetch(`${API_URL}/api/chat`, {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });

//       const data = await uploadResponse.json();
//       if (uploadResponse.status === 201) {
//         const newMessageObj = {
//           ...data,
//           senderId: cleanCurrentUserId,
//           receiverId: cleanReceiverId,
//           content: fileName,
//           isRead: false,
//           isRecalled: false,
//           conversationId,
//           timestamp: data.timestamp || new Date().toISOString(),
//           messageId: data.messageId,
//         };
//         setMessages((prev) => {
//           if (prev.some((msg) => msg.messageId === newMessageObj.messageId)) return prev;
//           const updatedMessages = [...prev, newMessageObj].sort(
//             (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//           );
//           return updatedMessages;
//         });
//         setError('');
//         setTimeout(() => {
//           flatListRef.current?.scrollToEnd({ animated: true });
//         }, 100);
//         if (socket?.connected) {
//           socket.emit('sendMessage', newMessageObj);
//         }
//       } else if (uploadResponse.status === 401) {
//         token = await refreshToken();
//         if (token) handleSelectImage();
//       } else {
//         setError(data.message || 'Không thể gửi ảnh');
//       }
//     } catch (err) {
//       console.error('Image picker error:', err);
//       setError('Lỗi khi chọn ảnh: ' + err.message);
//     }
//   };

//   // Mở xem ảnh
//   const openImageViewer = (url) => {
//     setSelectedImage(url);
//     setModalVisible(true);
//   };

//   // Xóa tin nhắn
//   const handleDeleteMessage = async (conversationId, timestamp) => {
//     try {
//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return;
//       }

//       const response = await fetch(`${API_URL}/api/chat/delete`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ conversationId, timestamp }),
//       });

//       const data = await response.json();
//       if (response.status === 200) {
//         setMessages((prev) =>
//           prev.filter((msg) => !(msg.conversationId === conversationId && msg.timestamp === timestamp))
//         );
//         setError('');
//       } else if (response.status === 401) {
//         token = await refreshToken();
//         if (token) handleDeleteMessage(conversationId, timestamp);
//       } else {
//         setError(data.message || 'Không thể xóa tin nhắn');
//         if (response.status === 403) {
//           Alert.alert('Lỗi', 'Bạn không có quyền xóa tin nhắn này');
//         }
//       }
//     } catch (err) {
//       console.error('Delete message error:', err);
//       setError('Không thể xóa tin nhắn: ' + err.message);
//     }
//   };

//   // Thu hồi tin nhắn
//   const handleRecallMessage = async (conversationId, timestamp) => {
//     try {
//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return;
//       }

//       const response = await fetch(`${API_URL}/api/chat/recall`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ conversationId, timestamp }),
//       });

//       const data = await response.json();
//       if (response.status === 200) {
//         setMessages((prev) =>
//           prev.map((msg) =>
//             msg.conversationId === conversationId && msg.timestamp === timestamp
//               ? { ...msg, isRecalled: true, content: 'Tin nhắn đã được thu hồi', fileUrl: null, type: 'text' }
//               : msg
//           )
//         );
//         setError('');
//       } else if (response.status === 401) {
//         token = await refreshToken();
//         if (token) handleRecallMessage(conversationId, timestamp);
//       } else {
//         setError(data.message || 'Không thể thu hồi tin nhắn');
//         if (response.status === 403) {
//           Alert.alert('Lỗi', 'Bạn không có quyền thu hồi tin nhắn này');
//         } else if (response.status === 400 && data.message.includes('5 phút')) {
//           Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn sau 5 phút');
//         }
//       }
//     } catch (err) {
//       console.error('Recall message error:', err);
//       setError('Không thể thu hồi tin nhắn: ' + err.message);
//     }
//   };

//   // Chuyển tiếp tin nhắn
//   const handleForwardMessage = async (newReceiverId) => {
//     try {
//       let token = await AsyncStorage.getItem('token');
//       if (!token) {
//         token = await refreshToken();
//         if (!token) return;
//       }

//       const response = await fetch(`${API_URL}/api/chat/forward`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           conversationId: selectedMessage.conversationId,
//           timestamp: selectedMessage.timestamp,
//           newReceiverId,
//         }),
//       });

//       const data = await response.json();
//       if (response.status === 201) {
//         setForwardModalVisible(false);
//         setSelectedMessage(null);
//         Alert.alert('Thành công', 'Tin nhắn đã được chuyển tiếp');
//       } else if (response.status === 401) {
//         token = await refreshToken();
//         if (token) handleForwardMessage(newReceiverId);
//       } else {
//         setError(data.message || 'Không thể chuyển tiếp tin nhắn');
//         if (response.status === 404) {
//           Alert.alert('Lỗi', 'Người nhận hoặc tin nhắn không tồn tại');
//         }
//       }
//     } catch (err) {
//       console.error('Forward message error:', err);
//       setError('Không thể chuyển tiếp tin nhắn: ' + err.message);
//     }
//   };

//   // Hiển thị tùy chọn tin nhắn
//   const showMessageOptions = (conversationId, timestamp, senderId, isRecalled) => {
//     const options = [
//       { text: 'Hủy', style: 'cancel' },
//       {
//         text: 'Chuyển tiếp',
//         style: 'default',
//         onPress: async () => {
//           const success = await fetchFriends();
//           if (success) {
//             setSelectedMessage({ conversationId, timestamp });
//             setForwardModalVisible(true);
//           }
//         },
//       },
//     ];

//     if (senderId === cleanCurrentUserId && !isRecalled) {
//       options.push({
//         text: 'Thu hồi',
//         style: 'default',
//         onPress: () => handleRecallMessage(conversationId, timestamp),
//       });
//     }

//     options.push({
//       text: 'Xóa',
//       style: 'destructive',
//       onPress: () => handleDeleteMessage(conversationId, timestamp),
//     });

//     Alert.alert('Tùy chọn', 'Chọn hành động', options, { cancelable: true });
//   };

//   // Thử lại khi có lỗi
//   const handleRetry = () => {
//     setError('');
//     setLoading(true);
//     fetchMessages();
//   };

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#0068FF" />
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
//     >
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
//         </TouchableOpacity>
//         <View style={styles.headerContent}>
//           <Text style={styles.headerTitle}>{receiverName || 'Unknown'}</Text>
//         </View>
//         <View style={styles.headerIcons}>
//           <TouchableOpacity>
//             <Icon name="phone" size={24} color="#FFFFFF" style={styles.headerIcon} />
//           </TouchableOpacity>
//           <TouchableOpacity>
//             <Icon name="videocam" size={24} color="#FFFFFF" style={styles.headerIcon} />
//           </TouchableOpacity>
//           <TouchableOpacity>
//             <Ionicons name="menu" size={24} color="#FFFFFF" style={styles.headerIcon} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {error && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
//             <Text style={styles.retryButtonText}>Thử lại</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {messages.length === 0 && !error && (
//         <View style={styles.emptyContainer}>
//           <Text style={styles.emptyText}>Không có tin nhắn nào</Text>
//         </View>
//       )}

//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         keyExtractor={(item) => item.messageId || `${item.conversationId}-${item.timestamp}`}
//         renderItem={({ item }) => {
//           if (!item || !item.conversationId || !item.messageId) return null;
//           return (
//             <TouchableOpacity
//               onLongPress={() => showMessageOptions(item.conversationId, item.timestamp, item.senderId, item.isRecalled)}
//               style={[
//                 item.type === 'text' ? styles.messageContainer : styles.mediaContainer,
//                 item.senderId === cleanCurrentUserId ? styles.sentMessage : styles.receivedMessage,
//               ]}
//             >
//               {item.isRecalled ? (
//                 <Text style={[styles.messageText, styles.recalledText]}>Tin nhắn đã được thu hồi</Text>
//               ) : item.type === 'image' && item.fileUrl ? (
//                 <TouchableOpacity onPress={() => openImageViewer(item.fileUrl)}>
//                   <Image
//                     source={{ uri: item.fileUrl }}
//                     style={styles.imagePreview}
//                     resizeMode="contain"
//                     defaultSource={require('../img/unnamed.png')}
//                     onError={(e) => {
//                       console.error('Image load error:', e.nativeEvent.error);
//                       setError(`Không thể tải ảnh: ${item.fileUrl}`);
//                     }}
//                   />
//                 </TouchableOpacity>
//               ) : item.type === 'file' && item.fileUrl ? (
//                 <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl)}>
//                   <View style={styles.fileContainer}>
//                     <Icon name="insert-drive-file" size={24} color="#666" />
//                     <Text style={styles.fileText}>{item.content || 'File'}</Text>
//                   </View>
//                 </TouchableOpacity>
//               ) : (
//                 <Text style={styles.messageText}>{item.content || ''}</Text>
//               )}
//               <View style={styles.messageFooter}>
//                 <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
//                 {item.senderId === cleanCurrentUserId && !item.isRecalled && (
//                   <Text style={styles.readStatus}>{item.isRead ? 'Đã xem' : 'Đã gửi'}</Text>
//                 )}
//               </View>
//             </TouchableOpacity>
//           );
//         }}
//         contentContainerStyle={[styles.messageList, { paddingBottom: 80 }]}
//         initialNumToRender={20}
//         windowSize={10}
//         getItemLayout={(data, index) => ({
//           length: 80,
//           offset: 80 * index,
//           index,
//         })}
//       />

//       <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
//         <View style={styles.modalContainer}>
//           <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
//             <Icon name="close" size={30} color="#FFF" />
//           </TouchableOpacity>
//           <ScrollView
//             contentContainerStyle={styles.scrollViewContainer}
//             maximumZoomScale={3}
//             minimumZoomScale={1}
//             pinchGestureEnabled={true}
//             showsHorizontalScrollIndicator={false}
//             showsVerticalScrollIndicator={false}
//           >
//             <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
//           </ScrollView>
//         </View>
//       </Modal>

//       <Modal visible={forwardModalVisible} transparent={true} onRequestClose={() => setForwardModalVisible(false)}>
//         <View style={styles.modalContainer}>
//           <View style={styles.forwardModalContent}>
//             <Text style={styles.modalTitle}>Chuyển tiếp tin nhắn</Text>
//             {friends.length === 0 ? (
//               <Text style={styles.noUsersText}>Không tìm thấy bạn bè</Text>
//             ) : (
//               <FlatList
//                 data={friends}
//                 keyExtractor={(item) => item.userId}
//                 renderItem={({ item }) => (
//                   <TouchableOpacity style={styles.userItem} onPress={() => handleForwardMessage(item.userId)}>
//                     <Text style={styles.userName}>{item.username || 'Unknown'}</Text>
//                   </TouchableOpacity>
//                 )}
//               />
//             )}
//             <TouchableOpacity style={styles.closeModalButton} onPress={() => setForwardModalVisible(false)}>
//               <Text style={styles.closeModalText}>Đóng</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       <View style={styles.inputContainer}>
//         <TouchableOpacity style={styles.fileButton} onPress={handleSelectFile}>
//           <Icon name="attach-file" size={26} color="#666" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
//           <Icon name="photo" size={26} color="#666" />
//         </TouchableOpacity>
//         <TextInput
//           style={styles.input}
//           value={newMessage}
//           onChangeText={setNewMessage}
//           placeholder="Tin nhắn"
//           placeholderTextColor="#999"
//           multiline
//         />
//         <TouchableOpacity style={styles.micButton} onPress={handleSendMessage}>
//           {newMessage.trim() ? (
//             <Icon name="send" size={26} color="#40C4FF" />
//           ) : (
//             <Icon name="mic" size={26} color="#666" />
//           )}
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const { width, height } = Dimensions.get('window');

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F4F4F8',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#40C4FF',
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//     paddingTop: 40,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     marginRight: 20,
//   },
//   headerContent: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   headerIcons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerIcon: {
//     marginLeft: 20,
//   },
//   errorContainer: {
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: '#FFF',
//   },
//   errorText: {
//     color: '#d32f2f',
//     textAlign: 'center',
//     marginBottom: 10,
//     fontSize: 16,
//   },
//   retryButton: {
//     backgroundColor: '#40C4FF',
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//   },
//   retryButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyText: {
//     color: '#666',
//     fontSize: 16,
//   },
//   messageList: {
//     padding: 10,
//     flexGrow: 1,
//   },
//   messageContainer: {
//     maxWidth: '75%',
//     marginVertical: 6,
//     padding: 12,
//     borderRadius: 18,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   mediaContainer: {
//     maxWidth: '80%',
//     marginVertical: 8,
//     padding: 0,
//     backgroundColor: 'transparent',
//   },
//   sentMessage: {
//     alignSelf: 'flex-end',
//     backgroundColor: '#0068FF',
//   },
//   receivedMessage: {
//     alignSelf: 'flex-start',
//     backgroundColor: '#333',
//   },
//   messageText: {
//     color: '#FFF',
//     fontSize: 16,
//   },
//   recalledText: {
//     fontStyle: 'italic',
//     color: '#888',
//   },
//   messageFooter: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//     marginTop: 4,
//   },
//   timestamp: {
//     fontSize: 12,
//     color: '#999',
//     marginRight: 6,
//   },
//   readStatus: {
//     fontSize: 12,
//     color: '#999',
//   },
//   imagePreview: {
//     width: 250,
//     height: 250,
//     borderRadius: 12,
//     marginBottom: 4,
//     backgroundColor: '#EEE',
//     borderWidth: 1,
//     borderColor: '#DDD',
//   },
//   fileContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: '#F1F1F1',
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#DDD',
//     maxWidth: 250,
//   },
//   fileText: {
//     color: '#333',
//     fontSize: 15,
//     marginLeft: 10,
//     flex: 1,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 50,
//     right: 20,
//     zIndex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     borderRadius: 24,
//     padding: 12,
//   },
//   scrollViewContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalImage: {
//     width: width,
//     height: height * 0.9,
//   },
//   forwardModalContent: {
//     backgroundColor: '#FFF',
//     borderRadius: 10,
//     padding: 20,
//     width: '80%',
//     maxHeight: '80%',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   userItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   userName: {
//     fontSize: 16,
//     color: '#333',
//   },
//   noUsersText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 15,
//   },
//   closeModalButton: {
//     marginTop: 15,
//     padding: 10,
//     backgroundColor: '#40C4FF',
//     borderRadius: 5,
//     alignItems: 'center',
//   },
//   closeModalText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: '#FFF',
//     borderTopWidth: 1,
//     borderTopColor: '#E0E0E0',
//   },
//   fileButton: {
//     padding: 10,
//   },
//   imageButton: {
//     padding: 10,
//   },
//   input: {
//     flex: 1,
//     backgroundColor: '#F1F1F1',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     fontSize: 16,
//     maxHeight: 100,
//     color: '#333',
//   },
//   micButton: {
//     padding: 10,
//   },
// });

// export default ChatScreen;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Alert,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { API_URL, MAX_FILE_SIZE, VALID_EXTENSIONS } from '../config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import io from 'socket.io-client';

const ChatScreen = ({ route, navigation }) => {
  const { receiverId, receiverName, currentUserId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [deletedMessageIds, setDeletedMessageIds] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const flatListRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Kiểm tra tham số đầu vào
  if (!receiverId || !currentUserId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Thiếu thông tin: receiverId hoặc currentUserId không hợp lệ</Text>
      </View>
    );
  }

  // Làm sạch ID
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

  // Tạo conversationId
  const sortedIds = [cleanCurrentUserId, cleanReceiverId].sort();
  const conversationId = `${sortedIds[0]}#${sortedIds[1]}`;

  // Tải danh sách tin nhắn đã xóa
  useEffect(() => {
    const loadDeletedMessages = async () => {
      try {
        const storedDeletedMessages = await AsyncStorage.getItem(`deletedMessages_${conversationId}_${cleanCurrentUserId}`);
        if (storedDeletedMessages) {
          setDeletedMessageIds(JSON.parse(storedDeletedMessages));
        }
      } catch (err) {
        console.error('Load deleted messages error:', err);
      }
    };
    loadDeletedMessages();
  }, [conversationId, cleanCurrentUserId]);

  // Lưu danh sách tin nhắn đã xóa
  const saveDeletedMessages = useCallback(async (ids) => {
    try {
      await AsyncStorage.setItem(`deletedMessages_${conversationId}_${cleanCurrentUserId}`, JSON.stringify(ids));
    } catch (err) {
      console.error('Save deleted messages error:', err);
    }
  }, [conversationId, cleanCurrentUserId]);

  // Định dạng thời gian
  const formatTimestamp = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error('Lỗi định dạng thời gian:', err);
      return 'N/A';
    }
  }, []);

  // Làm mới token
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('Không có refresh token');

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (response.status === 200 && data.accessToken) {
        await AsyncStorage.setItem('token', data.accessToken);
        if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
        return data.accessToken;
      }
      throw new Error(data.message || 'Không thể làm mới token');
    } catch (err) {
      console.error('Refresh token error:', err);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      navigation.navigate('Login');
      Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return null;
    }
  }, [navigation]);

  // Lấy danh sách tin nhắn
  const fetchMessages = useCallback(async () => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await refreshToken();
        if (!token) return;
      }

      const response = await fetch(`${API_URL}/api/chat/messages/${cleanReceiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.status === 200) {
        if (Array.isArray(data)) {
          setMessages(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
          setError('');
          retryCountRef.current = 0;
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
          }, 100);
        } else {
          throw new Error('Dữ liệu tin nhắn không hợp lệ');
        }
      } else if (response.status === 401) {
        token = await refreshToken();
        if (token) {
          retryCountRef.current = 0;
          fetchMessages();
        }
      } else {
        throw new Error(data.message || `Lỗi ${response.status}: Không thể tải tin nhắn`);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      if (retryCountRef.current < maxRetries && (err.message.includes('Lỗi máy chủ') || err.message.includes('Không thể kết nối'))) {
        retryCountRef.current += 1;
        setTimeout(fetchMessages, 2000);
      } else {
        setError(`Không thể tải lịch sử tin nhắn: ${err.message}`);
        retryCountRef.current = 0;
      }
    } finally {
      setLoading(false);
    }
  }, [cleanReceiverId, refreshToken, maxRetries]);

  // Khởi tạo và xử lý Socket.IO
  useEffect(() => {
    let socketInstance = null;

    const initSocket = async () => {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await refreshToken();
        if (!token) {
          setError('Vui lòng đăng nhập lại để tiếp tục trò chuyện');
          return;
        }
      }

      socketInstance = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('join', cleanCurrentUserId);
        setError('');
      });

      socketInstance.on(`receiveMessage_${cleanCurrentUserId}`, (message) => {
        if (
          message &&
          message.conversationId === conversationId &&
          message.messageId &&
          message.senderId !== cleanCurrentUserId
        ) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.messageId === message.messageId)) return prev;
            const updatedMessages = [message, ...prev].sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );
            return updatedMessages;
          });
        }
      });

      socketInstance.on('connect_error', async (err) => {
        console.error('Socket connect error:', err.message);
        if (err.message.includes('Token không hợp lệ')) {
          const newToken = await refreshToken();
          if (newToken) {
            socketInstance.auth.token = newToken;
            socketInstance.connect();
          }
        } else {
          setError(`Không thể kết nối Socket: ${err.message}`);
        }
      });

      socketInstance.on('disconnect', (reason) => {
        setError(`Socket ngắt kết nối: ${reason}. Đang thử kết nối lại...`);
      });

      setSocket(socketInstance);
    };

    // Đánh dấu tin nhắn đã đọc
    const markMessagesAsRead = async () => {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          let token = await AsyncStorage.getItem('token');
          if (!token) {
            token = await refreshToken();
            if (!token) return;
          }

          const response = await fetch(`${API_URL}/api/chat/mark-read`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ conversationId, userId: cleanCurrentUserId }),
          });

          if (response.status === 200) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.conversationId === conversationId && !msg.isRead && msg.receiverId === cleanCurrentUserId
                  ? { ...msg, isRead: true }
                  : msg
              )
            );
            socketInstance?.emit('markMessagesAsRead', { conversationId, userId: cleanCurrentUserId });
            return;
          } else if (response.status === 401) {
            token = await refreshToken();
            if (!token) return;
          } else {
            throw new Error('Mark messages as read failed');
          }
        } catch (err) {
          console.error('Mark messages as read error:', err);
          retries++;
          if (retries === maxRetries) {
            setError('Không thể đánh dấu tin nhắn đã đọc');
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    };

    fetchMessages();
    initSocket();
    markMessagesAsRead();

    return () => {
      socketInstance?.disconnect();
    };
  }, [conversationId, cleanCurrentUserId, cleanReceiverId, navigation, fetchMessages, refreshToken, maxRetries]);

  // Gửi tin nhắn văn bản
  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await refreshToken();
        if (!token) return;
      }

      const body = {
        senderId: cleanCurrentUserId,
        receiverId: cleanReceiverId,
        content: inputText.trim(),
        type: 'text',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.status === 201) {
        const newMessageObj = {
          ...data,
          senderId: cleanCurrentUserId,
          receiverId: cleanReceiverId,
          content: inputText.trim(),
          type: 'text',
          isRead: false,
          isRecalled: false,
          conversationId,
          timestamp: data.timestamp || new Date().toISOString(),
          messageId: data.messageId,
        };
        setMessages((prev) => {
          if (prev.some((msg) => msg.messageId === newMessageObj.messageId)) return prev;
          const updatedMessages = [newMessageObj, ...prev].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
          return updatedMessages;
        });
        setInputText('');
        Keyboard.dismiss();
        if (socket?.connected) {
          socket.emit('sendMessage', newMessageObj);
        }
      } else if (response.status === 401) {
        token = await refreshToken();
        if (token) sendMessage();
      } else {
        setError(data.message || 'Không thể gửi tin nhắn');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('Không thể gửi tin nhắn: ' + err.message);
    }
  }, [inputText, cleanCurrentUserId, cleanReceiverId, conversationId, socket, refreshToken]);

  // Gửi file hoặc ảnh
  const sendFile = useCallback(async (type = 'file') => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await refreshToken();
        if (!token) return;
      }

      let result;
      if (type === 'image') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Cần cấp quyền truy cập thư viện ảnh.');
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
      }

      if (result.canceled) return;

      const file = result.assets[0];
      const fileSize = file.size || 0;
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error('File quá lớn, tối đa 10MB.');
      }

      let extension = '';
      if (file.name && typeof file.name === 'string' && file.name.includes('.')) {
        extension = file.name.split('.').pop().toLowerCase();
      }

      // Kiểm tra định dạng file nếu không phải ảnh
      const validExtensions = VALID_EXTENSIONS || ['pdf', 'doc', 'docx', 'txt', 'zip']; // Giá trị mặc định nếu VALID_EXTENSIONS undefined
      if (type !== 'image' && extension && !validExtensions.includes(extension)) {
        throw new Error('Định dạng file không được hỗ trợ.');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || `file_${Date.now()}${type === 'image' ? '.jpg' : extension ? `.${extension}` : ''}`,
        type: file.mimeType || (type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
      });
      formData.append('senderId', cleanCurrentUserId);
      formData.append('receiverId', cleanReceiverId);
      formData.append('type', type);

      const uploadResponse = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await uploadResponse.json();
      if (uploadResponse.status === 201) {
        const newMessageObj = {
          ...data,
          senderId: cleanCurrentUserId,
          receiverId: cleanReceiverId,
          content: file.name || 'File',
          type: type,
          fileUrl: data.fileUrl,
          isRead: false,
          isRecalled: false,
          conversationId,
          timestamp: data.timestamp || new Date().toISOString(),
          messageId: data.messageId,
        };
        setMessages((prev) => {
          if (prev.some((msg) => msg.messageId === newMessageObj.messageId)) return prev;
          const updatedMessages = [newMessageObj, ...prev].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
          return updatedMessages;
        });
        if (socket?.connected) {
          socket.emit('sendMessage', newMessageObj);
        }
      } else if (uploadResponse.status === 401) {
        token = await refreshToken();
        if (token) sendFile(type);
      } else {
        setError(data.message || 'Không thể gửi file');
      }
    } catch (err) {
      console.error('Send file error:', err);
      setError('Không thể gửi file: ' + err.message);
      Alert.alert('Lỗi', err.message);
    }
  }, [cleanCurrentUserId, cleanReceiverId, conversationId, socket, refreshToken]);

  // Xóa tin nhắn cục bộ
  const deleteMessage = useCallback(
    async (messageId) => {
      setDeletedMessageIds((prev) => {
        const newIds = [...prev, messageId];
        saveDeletedMessages(newIds);
        return newIds;
      });
    },
    [saveDeletedMessages]
  );

  // Thu hồi tin nhắn
  const recallMessage = useCallback(
    async (conversationId, timestamp) => {
      try {
        let token = await AsyncStorage.getItem('token');
        if (!token) {
          token = await refreshToken();
          if (!token) return;
        }

        const response = await fetch(`${API_URL}/api/chat/recall`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId, timestamp }),
        });

        const data = await response.json();
        if (response.status === 200) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.conversationId === conversationId && msg.timestamp === timestamp
                ? { ...msg, isRecalled: true, content: 'Tin nhắn đã được thu hồi', fileUrl: null, type: 'text' }
                : msg
            )
          );
        } else if (response.status === 401) {
          token = await refreshToken();
          if (token) recallMessage(conversationId, timestamp);
        } else {
          setError(data.message || 'Không thể thu hồi tin nhắn');
          if (response.status === 403) {
            Alert.alert('Lỗi', 'Bạn không có quyền thu hồi tin nhắn này');
          } else if (response.status === 400 && data.message.includes('5 phút')) {
            Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn sau 5 phút');
          }
        }
      } catch (err) {
        console.error('Recall message error:', err);
        setError('Không thể thu hồi tin nhắn: ' + err.message);
        Alert.alert('Lỗi', err.message);
      }
    },
    [refreshToken]
  );

  // Render tin nhắn
  const renderMessage = useCallback(
    ({ item }) => {
      const isOwnMessage = item.senderId === cleanCurrentUserId;

      const handleLongPress = () => {
        if (item.isRecalled) return;

        const messageTime = new Date(item.timestamp).getTime();
        const currentTime = new Date().getTime();
        const canRecall = isOwnMessage && currentTime - messageTime <= 5 * 60 * 1000;

        const options = [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            onPress: () => deleteMessage(item.messageId),
            style: 'destructive',
          },
        ];

        if (canRecall) {
          options.push({
            text: 'Thu hồi',
            onPress: () => recallMessage(item.conversationId, item.timestamp),
            style: 'destructive',
          });
        }

        Alert.alert('Tùy chọn', 'Chọn hành động cho tin nhắn này:', options, { cancelable: true });
      };

      return (
        <TouchableOpacity
          onLongPress={handleLongPress}
          style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}
          disabled={item.isRecalled}
        >
          <View
            style={[
              styles.messageContent,
              item.isRecalled ? styles.recalledMessageContent : isOwnMessage ? styles.ownMessageContent : {},
            ]}
          >
            {item.isRecalled ? (
              <Text style={styles.recalledMessage}>[Tin nhắn đã được thu hồi]</Text>
            ) : item.type === 'image' ? (
              <Image source={{ uri: item.fileUrl }} style={styles.messageImage} />
            ) : item.type === 'file' ? (
              <TouchableOpacity onPress={() => console.log('Open file:', item.fileUrl)}>
                <Text style={styles.messageFile}>[Tệp: {item.content}]</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.messageText}>{item.content}</Text>
            )}
            <Text style={styles.messageTime}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [cleanCurrentUserId, deleteMessage, recallMessage, formatTimestamp]
  );

  // Memoize FlatList data
  const flatListData = useMemo(() => {
    return messages.filter((msg) => !deletedMessageIds.includes(msg.messageId));
  }, [messages, deletedMessageIds]);

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{receiverName || 'Unknown'}</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        ref={flatListRef}
        data={flatListData}
        keyExtractor={(item) => item.messageId || `${item.conversationId}-${item.timestamp}`}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.fileButton} onPress={() => sendFile('file')}>
          <Icon name="attach-file" size={24} color="#40C4FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fileButton} onPress={() => sendFile('image')}>
          <Icon name="image" size={24} color="#40C4FF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageList: {
    padding: 10,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageContent: {
    maxWidth: '70%',
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 10,
  },
  ownMessageContent: {
    backgroundColor: '#DCF8C6',
  },
  recalledMessageContent: {
    backgroundColor: '#F5F5F5',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  messageFile: {
    fontSize: 16,
    color: '#0068FF',
    textDecorationLine: 'underline',
  },
  recalledMessage: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  fileButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#40C4FF',
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
    color: '#d32f2f',
  },
});

export default ChatScreen;
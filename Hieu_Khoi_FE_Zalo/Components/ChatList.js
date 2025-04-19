



// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   TextInput,
//   ActivityIndicator,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { API_URL } from '../config';
// import io from 'socket.io-client';
// import Footer from './Footer';

// const ChatList = ({ navigation }) => {
//   const [searchText, setSearchText] = useState('');
//   const [conversations, setConversations] = useState([]);
//   const [contacts, setContacts] = useState({});
//   const [searchResults, setSearchResults] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [searchError, setSearchError] = useState('');
//   const [currentUserId, setCurrentUserId] = useState('');
//   const [socket, setSocket] = useState(null);
//   const [onlineUsers, setOnlineUsers] = useState(new Set());
//   const [newMessages, setNewMessages] = useState(new Set());

//   // URL ảnh đại diện mặc định
//   const DEFAULT_AVATAR = 'https://via.placeholder.com/50'; // Thay bằng URL ảnh mặc định hợp lệ nếu cần

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         if (!token) {
//           navigation.navigate('Login');
//           return;
//         }

//         const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const profileData = await profileResponse.json();
//         if (profileResponse.status === 200) {
//           console.log('Profile data:', profileData);
//           if (!profileData.userId) {
//             throw new Error('Không tìm thấy userId trong profile');
//           }
//           setCurrentUserId(profileData.userId);
//         } else {
//           throw new Error(profileData.message || 'Không thể lấy thông tin người dùng');
//         }

//         const contactsResponse = await fetch(`${API_URL}/api/user/contacts`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const contactsData = await contactsResponse.json();
//         console.log('Contacts data:', contactsData);
//         if (contactsResponse.status === 200) {
//           const contactsMap = {};
//           contactsData.forEach((contact) => {
//             contactsMap[contact.userId] = contact;
//           });
//           setContacts(contactsMap);
//         } else {
//           throw new Error(contactsData.message || 'Không thể tải danh sách liên hệ');
//         }

//         const conversationsResponse = await fetch(`${API_URL}/api/messages/conversations`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const conversationsData = await conversationsResponse.json();
//         console.log('Initial conversations:', conversationsData);
//         if (conversationsResponse.status === 200) {
//           setConversations(conversationsData);
//         } else {
//           throw new Error(conversationsData.message || 'Không thể tải danh sách cuộc trò chuyện');
//         }
//       } catch (err) {
//         setSearchError(err.message);
//         console.error('Fetch data error:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     const initSocket = async () => {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         navigation.navigate('Login');
//         return;
//       }

//       const socketInstance = io(API_URL, {
//         query: { token },
//         transports: ['websocket'],
//         reconnectionAttempts: 5,
//       });

//       socketInstance.on('connect', () => {
//         console.log('Socket connected:', socketInstance.id);
//         if (currentUserId) {
//           socketInstance.emit('register', currentUserId);
//         }
//       });

//       socketInstance.on('updateChatList', (data) => {
//         console.log('Received updateChatList:', data);
//         setConversations((prev) => {
//           const otherUserId = data.senderId === currentUserId ? data.receiverId : data.senderId;
//           const existingConv = prev.find((conv) => conv.conversationId === data.conversationId);
//           let updatedConversations;

//           if (existingConv) {
//             updatedConversations = prev.map((conv) =>
//               conv.conversationId === data.conversationId
//                 ? {
//                     ...conv,
//                     lastMessage: {
//                       content: data.lastMessage.content || 'File',
//                       contentType: data.lastMessage.contentType || 'text',
//                       fileUrl: data.lastMessage.fileUrl,
//                       timestamp: data.lastMessage.timestamp,
//                       senderId: data.lastMessage.senderId,
//                       isRecalled: data.lastMessage.isRecalled || false,
//                       isRead: data.lastMessage.isRead || false,
//                       readtime: data.lastMessage.readtime || null,
//                     },
//                     unreadCount:
//                       data.receiverId === currentUserId
//                         ? (conv.unreadCount || 0) + 1
//                         : conv.unreadCount,
//                     otherUserId,
//                   }
//                 : conv
//             );
//           } else {
//             updatedConversations = [
//               {
//                 conversationId: data.conversationId,
//                 otherUserId,
//                 lastMessage: {
//                   content: data.lastMessage.content || 'File',
//                   contentType: data.lastMessage.contentType || 'text',
//                   fileUrl: data.lastMessage.fileUrl,
//                   timestamp: data.lastMessage.timestamp,
//                   senderId: data.lastMessage.senderId,
//                   isRecalled: data.lastMessage.isRecalled || false,
//                   isRead: data.lastMessage.isRead || false,
//                   readtime: data.lastMessage.readtime || null,
//                 },
//                 unreadCount: data.receiverId === currentUserId ? 1 : 0,
//               },
//               ...prev,
//             ];
//           }

//           if (data.receiverId === currentUserId) {
//             setNewMessages((prev) => new Set(prev).add(data.conversationId));
//           }

//           console.log('Updated conversations:', updatedConversations);
//           return updatedConversations.sort(
//             (a, b) => new Date(b.lastMessage.timestamp.split('-')[0]) - new Date(a.lastMessage.timestamp.split('-')[0])
//           );
//         });
//       });

//       socketInstance.on('userStatus', ({ userId, status }) => {
//         console.log('User status:', { userId, status });
//         setOnlineUsers((prev) => {
//           const updated = new Set(prev);
//           if (status === 'online') {
//             updated.add(userId);
//           } else {
//             updated.delete(userId);
//           }
//           return updated;
//         });
//       });

//       socketInstance.on('connect_error', (err) => {
//         console.error('Socket error:', err);
//         setSearchError('Socket error: ' + err.message);
//       });

//       socketInstance.on('reconnect', (attempt) => {
//         console.log('Socket reconnected after attempt:', attempt);
//         if (currentUserId) {
//           socketInstance.emit('register', currentUserId);
//         }
//       });

//       setSocket(socketInstance);

//       return () => {
//         socketInstance.disconnect();
//         console.log('Socket disconnected');
//       };
//     };

//     fetchData();
//     if (currentUserId) {
//       initSocket();
//     }

//     return () => {
//       if (socket) {
//         socket.disconnect();
//       }
//     };
//   }, [currentUserId, navigation]);

//   useEffect(() => {
//     if (socket && currentUserId) {
//       socket.emit('register', currentUserId);
//     }
//   }, [socket, currentUserId]);

//   // Hàm tìm kiếm người dùng bằng email
//   const handleSearch = async (text) => {
//     setSearchText(text);
//     setSearchError('');
//     setSearchLoading(true);
//     setSearchResults([]); // Xóa kết quả cũ

//     if (text.length > 2) {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         if (!token) {
//           navigation.navigate('Login');
//           return;
//         }

//         // Gọi API /api/user/search
//         const searchResponse = await fetch(`${API_URL}/api/user/search?email=${encodeURIComponent(text)}`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         const searchData = await searchResponse.json();
//         console.log('Search result from /api/user/search:', searchData);

//         if (searchResponse.status === 200) {
//           // Chuẩn hóa dữ liệu thành mảng
//           const users = Array.isArray(searchData) ? searchData : searchData.userId ? [searchData] : [];
//           if (users.length > 0) {
//             // Loại bỏ người dùng hiện tại và trùng lặp
//             const uniqueUsers = [...new Map(users.map((user) => [user.userId, user])).values()].filter(
//               (user) => user.userId !== currentUserId
//             );

//             // Lấy thông tin chi tiết cho từng người dùng
//             const detailedUsers = await Promise.all(
//               uniqueUsers.map(async (user) => {
//                 console.log('Processing user from search:', user);
//                 // Luôn gọi /api/user/profile để đảm bảo dữ liệu mới nhất
//                 try {
//                   const profileResponse = await fetch(`${API_URL}/api/user/profile?userId=${user.userId}`, {
//                     headers: {
//                       Authorization: `Bearer ${token}`,
//                     },
//                   });
//                   const profileData = await profileResponse.json();
//                   console.log(`Profile data for user ${user.userId}:`, profileData);

//                   if (profileResponse.status === 200) {
//                     return {
//                       userId: user.userId,
//                       username: profileData.username || user.email,
//                       email: user.email || text,
//                       avatarUrl: profileData.avatarUrl || DEFAULT_AVATAR,
//                     };
//                   }
//                 } catch (profileErr) {
//                   console.error(`Profile fetch error for user ${user.userId}:`, profileErr);
//                 }
//                 // Dự phòng nếu /api/user/profile thất bại
//                 return {
//                   userId: user.userId,
//                   username: user.email || text,
//                   email: user.email || text,
//                   avatarUrl: DEFAULT_AVATAR,
//                 };
//               })
//             );

//             const filteredResults = detailedUsers.filter((user) => user);
//             console.log('Final searchResults:', filteredResults);
//             setSearchResults(filteredResults);
//           } else {
//             setSearchResults([]);
//             setSearchError('Không tìm thấy người dùng');
//           }
//         } else {
//           setSearchResults([]);
//           setSearchError(searchData.message || 'Không tìm thấy người dùng');
//         }
//       } catch (err) {
//         console.error('Search error:', err);
//         setSearchError('Không thể tìm kiếm: ' + err.message);
//         setSearchResults([]);
//       } finally {
//         setSearchLoading(false);
//       }
//     } else {
//       setSearchResults([]);
//       setSearchError('');
//       setSearchLoading(false);
//     }
//   };

//   // Hiển thị searchResults nếu đang tìm kiếm, nếu không thì hiển thị conversations
//   const filteredData = searchText.length > 2 ? searchResults : conversations;
//   console.log('Filtered data for FlatList:', filteredData);

//   const handlePlusClick = () => {
//     navigation.navigate('NewPage');
//   };

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#0068FF" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.searchBar}>
//         <View style={styles.searchInputContainer}>
//           <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Tìm kiếm bằng email"
//             value={searchText}
//             onChangeText={handleSearch}
//             autoCapitalize="none"
//           />
//         </View>
//         <TouchableOpacity onPress={() => console.log('QR Code')}>
//           <Icon name="qr-code-scanner" size="24" color="#FFFFFF" style={styles.headerIcon} />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={handlePlusClick}>
//           <Icon name="add" size="24" color="#FFFFFF" style={styles.headerIcon} />
//         </TouchableOpacity>
//       </View>

//       {searchLoading && searchText.length > 2 && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="small" color="#0068FF" />
//           <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
//         </View>
//       )}

//       {searchError && searchText.length > 2 && !searchLoading && (
//         <Text style={styles.noResultsText}>{searchError}</Text>
//       )}

//       <FlatList
//         data={filteredData}
//         keyExtractor={(item) => item.conversationId || item.userId}
//         renderItem={({ item }) => {
//           const isSearchResult = !!item.userId;
//           // Chỉ sử dụng contacts cho conversations, không dùng cho searchResults
//           const contact = isSearchResult
//             ? item
//             : contacts[item.otherUserId] || {
//                 username: 'Unknown',
//                 email: 'Unknown',
//                 avatarUrl: DEFAULT_AVATAR,
//               };
//           const isNewMessage = !isSearchResult && newMessages.has(item.conversationId);

//           console.log('Rendering item:', {
//             isSearchResult,
//             userId: isSearchResult ? item.userId : item.otherUserId,
//             username: contact.username,
//             email: contact.email,
//             avatarUrl: contact.avatarUrl,
//           });

//           return (
//             <TouchableOpacity
//               style={styles.chatItem}
//               onPress={() => {
//                 console.log('Navigating to ChatScreen with:', {
//                   receiverId: isSearchResult ? item.userId : item.otherUserId,
//                   receiverName: contact.username || contact.email,
//                   currentUserId,
//                 });
//                 if (!currentUserId || !(isSearchResult ? item.userId : item.otherUserId)) {
//                   setSearchError('Thiếu ID người dùng');
//                   return;
//                 }
//                 if (!isSearchResult) {
//                   setNewMessages((prev) => {
//                     const updated = new Set(prev);
//                     updated.delete(item.conversationId);
//                     return updated;
//                   });
//                 }
//                 navigation.navigate('ChatScreen', {
//                   receiverId: isSearchResult ? item.userId : item.otherUserId,
//                   receiverName: contact.username || contact.email || 'Unknown',
//                   currentUserId,
//                 });
//               }}
//             >
//               <View style={styles.avatarContainer}>
//                 <Image
//                   source={{
//                     uri: contact.avatarUrl || DEFAULT_AVATAR,
//                   }}
//                   style={styles.avatar}
//                   defaultSource={{ uri: DEFAULT_AVATAR }}
//                   onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
//                 />
//                 {onlineUsers.has(isSearchResult ? item.userId : item.otherUserId) && <View style={styles.onlineBadge} />}
//               </View>
//               <View style={styles.chatInfo}>
//                 <Text style={styles.chatName}>{contact.username || contact.email || 'Unknown'}</Text>
//                 {isSearchResult ? (
//                   <Text style={styles.chatMessage}>{contact.email}</Text>
//                 ) : (
//                   <Text
//                     style={[
//                       styles.chatMessage,
//                       isNewMessage || item.unreadCount > 0 ? styles.boldMessage : null,
//                     ]}
//                     numberOfLines={1}
//                   >
//                     {item.lastMessage?.isRecalled
//                       ? 'Tin nhắn đã được thu hồi'
//                       : item.lastMessage?.isRead && item.lastMessage?.readtime && item.lastMessage.senderId === currentUserId
//                       ? `Đã xem`
//                       : item.lastMessage?.contentType === 'file'
//                       ? 'File'
//                       : item.lastMessage?.content || 'Bạn có tin nhắn mới'}
//                   </Text>
//                 )}
//               </View>
//               {!isSearchResult && (
//                 <View style={styles.chatMeta}>
//                   <Text style={styles.chatTime}>
//                     {item.lastMessage?.timestamp
//                       ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
//                           hour: '2-digit',
//                           minute: '2-digit',
//                         })
//                       : ''}
//                   </Text>
//                   {item.unreadCount > 0 && (
//                     <View style={styles.unreadBadge}>
//                       <Text style={styles.unreadCount}>{item.unreadCount}</Text>
//                     </View>
//                   )}
//                 </View>
//               )}
//             </TouchableOpacity>
//           );
//         }}
//       />

//       <Footer navigation={navigation} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#40C4FF',
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//     paddingTop: 65,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#E0E0E0',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     marginRight: 15,
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//     paddingVertical: 8,
//   },
//   headerIcon: {
//     marginLeft: 15,
//   },
//   chatItem: {
//     flexDirection: 'row',
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     position: 'relative',
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
//   },
//   onlineBadge: {
//     position: 'absolute',
//     bottom: 0,
//     right: 15,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#00FF00',
//     borderWidth: 2,
//     borderColor: '#FFF',
//   },
//   chatInfo: {
//     flex: 1,
//   },
//   chatName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   chatMessage: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 3,
//   },
//   boldMessage: {
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   chatMeta: {
//     alignItems: 'flex-end',
//   },
//   chatTime: {
//     fontSize: 12,
//     color: '#999',
//   },
//   unreadBadge: {
//     backgroundColor: '#40C4FF',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     marginTop: 4,
//   },
//   unreadCount: {
//     color: '#FFF',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   noResultsText: {
//     textAlign: 'center',
//     marginTop: 20,
//     fontSize: 16,
//     color: '#666',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   loadingText: {
//     marginLeft: 10,
//     fontSize: 16,
//     color: '#666',
//   },
// });

// export default ChatList;



import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { debounce } from 'lodash'; // Cần cài đặt: npm install lodash
import { API_URL } from '../config';
import io from 'socket.io-client';
import Footer from './Footer';

// URL ảnh đại diện mặc định
const DEFAULT_AVATAR = 'https://via.placeholder.com/50';

const ChatList = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [newMessages, setNewMessages] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.navigate('Login');
          return;
        }

        const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileResponse.json();
        if (profileResponse.status === 200) {
          console.log('Profile data:', profileData);
          if (!profileData.userId) {
            throw new Error('Không tìm thấy userId trong profile');
          }
          setCurrentUserId(profileData.userId);
        } else {
          throw new Error(profileData.message || 'Không thể lấy thông tin người dùng');
        }

        const contactsResponse = await fetch(`${API_URL}/api/user/contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contactsData = await contactsResponse.json();
        console.log('Contacts data:', contactsData);
        if (contactsResponse.status === 200) {
          const contactsMap = {};
          contactsData.forEach((contact) => {
            contactsMap[contact.userId] = contact;
          });
          setContacts(contactsMap);
        } else {
          throw new Error(contactsData.message || 'Không thể tải danh sách liên hệ');
        }

        const conversationsResponse = await fetch(`${API_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const conversationsData = await conversationsResponse.json();
        console.log('Initial conversations:', conversationsData);
        if (conversationsResponse.status === 200) {
          setConversations(conversationsData);
        } else {
          throw new Error(conversationsData.message || 'Không thể tải danh sách cuộc trò chuyện');
        }
      } catch (err) {
        setSearchError(err.message);
        console.error('Fetch data error:', err);
      } finally {
        setLoading(false);
      }
    };

    const initSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const socketInstance = io(API_URL, {
        query: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        if (currentUserId) {
          socketInstance.emit('register', currentUserId);
        }
      });

      socketInstance.on('updateChatList', (data) => {
        console.log('Received updateChatList:', data);
        setConversations((prev) => {
          const otherUserId = data.senderId === currentUserId ? data.receiverId : data.senderId;
          const existingConv = prev.find((conv) => conv.conversationId === data.conversationId);
          let updatedConversations;

          if (existingConv) {
            updatedConversations = prev.map((conv) =>
              conv.conversationId === data.conversationId
                ? {
                    ...conv,
                    lastMessage: {
                      content: data.lastMessage.content || 'File',
                      contentType: data.lastMessage.contentType || 'text',
                      fileUrl: data.lastMessage.fileUrl,
                      timestamp: data.lastMessage.timestamp,
                      senderId: data.lastMessage.senderId,
                      isRecalled: data.lastMessage.isRecalled || false,
                      isRead: data.lastMessage.isRead || false,
                      readtime: data.lastMessage.readtime || null,
                    },
                    unreadCount:
                      data.receiverId === currentUserId
                        ? (conv.unreadCount || 0) + 1
                        : conv.unreadCount,
                    otherUserId,
                  }
                : conv
            );
          } else {
            updatedConversations = [
              {
                conversationId: data.conversationId,
                otherUserId,
                lastMessage: {
                  content: data.lastMessage.content || 'File',
                  contentType: data.lastMessage.contentType || 'text',
                  fileUrl: data.lastMessage.fileUrl,
                  timestamp: data.lastMessage.timestamp,
                  senderId: data.lastMessage.senderId,
                  isRecalled: data.lastMessage.isRecalled || false,
                  isRead: data.lastMessage.isRead || false,
                  readtime: data.lastMessage.readtime || null,
                },
                unreadCount: data.receiverId === currentUserId ? 1 : 0,
              },
              ...prev,
            ];
          }

          if (data.receiverId === currentUserId) {
            setNewMessages((prev) => new Set(prev).add(data.conversationId));
          }

          console.log('Updated conversations:', updatedConversations);
          return updatedConversations.sort(
            (a, b) => new Date(b.lastMessage.timestamp.split('-')[0]) - new Date(a.lastMessage.timestamp.split('-')[0])
          );
        });
      });

      socketInstance.on('userStatus', ({ userId, status }) => {
        console.log('User status:', { userId, status });
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (status === 'online') {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket error:', err);
        setSearchError('Socket error: ' + err.message);
      });

      socketInstance.on('reconnect', (attempt) => {
        console.log('Socket reconnected after attempt:', attempt);
        if (currentUserId) {
          socketInstance.emit('register', currentUserId);
        }
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        console.log('Socket disconnected');
      };
    };

    fetchData();
    if (currentUserId) {
      initSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUserId, navigation]);

  useEffect(() => {
    if (socket && currentUserId) {
      socket.emit('register', currentUserId);
    }
  }, [socket, currentUserId]);

  // Hàm kiểm tra định dạng email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Hàm tìm kiếm người dùng bằng email
  const handleSearch = async (text) => {
    setSearchText(text);
    setSearchError('');
    setSearchLoading(true);
    setSearchResults([]);
  
    if (text.length > 2) {
      if (!isValidEmail(text)) {
        setSearchError('Vui lòng nhập email hợp lệ');
        setSearchLoading(false);
        setSearchResults([]);
        return;
      }
  
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.navigate('Login');
          return;
        }
  
        const searchResponse = await fetch(`${API_URL}/api/user/search?email=${encodeURIComponent(text)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const searchData = await searchResponse.json();
        console.log('Search result from /api/user/search:', searchData);
  
        if (searchResponse.status === 200) {
          const users = Array.isArray(searchData) ? searchData : searchData.userId ? [searchData] : [];
          if (users.length > 0) {
            const uniqueUsers = [...new Map(users.map((user) => [user.userId, user])).values()].filter(
              (user) => user.userId !== currentUserId
            );
  
            const detailedUsers = await Promise.all(
              uniqueUsers.map(async (user) => {
                console.log('Processing user from search:', user);
                try {
                  const profileResponse = await fetch(`${API_URL}/api/user/profile?userId=${user.userId}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  const profileData = await profileResponse.json();
                  console.log(`Profile data for user ${user.userId}:`, profileData);
  
                  if (profileResponse.status === 200) {
                    return {
                      userId: user.userId,
                      username: profileData.username || user.email || text,
                      email: profileData.email || text,
                      avatarUrl: profileData.avatarUrl || DEFAULT_AVATAR,
                    };
                  } else {
                    console.error(`Profile fetch error for user ${user.userId}:`, profileData.message);
                    return null;
                  }
                } catch (profileErr) {
                  console.error(`Profile fetch error for user ${user.userId}:`, profileErr);
                  return null;
                }
              })
            );
  
            const filteredResults = detailedUsers.filter((user) => user);
            console.log('Final searchResults:', filteredResults);
            setSearchResults(filteredResults);
            if (filteredResults.length === 0) {
              setSearchError('Không tìm thấy người dùng');
            }
          } else {
            setSearchResults([]);
            setSearchError('Không tìm thấy người dùng');
          }
        } else {
          setSearchResults([]);
          setSearchError(searchData.message || 'Không tìm thấy người dùng');
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchError('Không thể tìm kiếm: ' + err.message);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
    }
  };

  // Debounce tìm kiếm để tránh gọi API quá thường xuyên
  const debouncedSearch = debounce(handleSearch, 500);

  const filteredData = searchText.length > 2 ? searchResults : conversations;
  console.log('Filtered data for FlatList:', filteredData);

  const handlePlusClick = () => {
    navigation.navigate('NewPage');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0068FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bằng email"
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              debouncedSearch(text);
            }}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity onPress={() => console.log('QR Code')}>
          <Icon name="qr-code-scanner" size={24} color="#FFFFFF" style={styles.headerIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlusClick}>
          <Icon name="add" size={24} color="#FFFFFF" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      {searchLoading && searchText.length > 2 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0068FF" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      )}

      {searchError && searchText.length > 2 && !searchLoading && (
        <Text style={styles.noResultsText}>{searchError}</Text>
      )}

      {filteredData.length === 0 && !searchLoading && !searchError && (
        <Text style={styles.noResultsText}>
          {searchText.length > 2 ? 'Không tìm thấy người dùng' : 'Chưa có cuộc hội thoại nào'}
        </Text>
      )}

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.conversationId || item.userId}
        renderItem={({ item }) => {
          const isSearchResult = !!item.userId;
          const contact = isSearchResult
            ? item
            : contacts[item.otherUserId] || {
                username: 'Unknown',
                email: 'Unknown',
                avatarUrl: DEFAULT_AVATAR,
              };
          const isNewMessage = !isSearchResult && newMessages.has(item.conversationId);

          console.log('Rendering item:', {
            isSearchResult,
            userId: isSearchResult ? item.userId : item.otherUserId,
            username: contact.username,
            email: contact.email,
            avatarUrl: contact.avatarUrl,
          });

          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => {
                console.log('Navigating to ChatScreen with:', {
                  receiverId: isSearchResult ? item.userId : item.otherUserId,
                  receiverName: contact.username || contact.email,
                  currentUserId,
                });
                if (!currentUserId || !(isSearchResult ? item.userId : item.otherUserId)) {
                  setSearchError('Thiếu ID người dùng');
                  return;
                }
                if (!isSearchResult) {
                  setNewMessages((prev) => {
                    const updated = new Set(prev);
                    updated.delete(item.conversationId);
                    return updated;
                  });
                }
                navigation.navigate('ChatScreen', {
                  receiverId: isSearchResult ? item.userId : item.otherUserId,
                  receiverName: contact.username || contact.email || 'Unknown',
                  currentUserId,
                });
              }}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: contact.avatarUrl || DEFAULT_AVATAR,
                  }}
                  style={styles.avatar}
                  defaultSource={{ uri: DEFAULT_AVATAR }}
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
                {onlineUsers.has(isSearchResult ? item.userId : item.otherUserId) && <View style={styles.onlineBadge} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{contact.username || contact.email || 'Unknown'}</Text>
                {isSearchResult ? (
                  <Text style={styles.chatMessage}>{contact.email}</Text>
                ) : (
                  <Text
                    style={[
                      styles.chatMessage,
                      isNewMessage || item.unreadCount > 0 ? styles.boldMessage : null,
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage?.isRecalled
                      ? 'Tin nhắn đã được thu hồi'
                      : item.lastMessage?.isRead && item.lastMessage?.readtime && item.lastMessage.senderId === currentUserId
                      ? `Đã xem`
                      : item.lastMessage?.contentType === 'file'
                      ? 'File'
                      : item.lastMessage?.content || 'Bạn có tin nhắn mới'}
                  </Text>
                )}
              </View>
              {!isSearchResult && (
                <View style={styles.chatMeta}>
                  <Text style={styles.chatTime}>
                    {item.lastMessage?.timestamp
                      ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40C4FF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: 65,
    shadowColor: '#000',
    shadowOFFSET: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  headerIcon: {
    marginLeft: 15,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF00',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  boldMessage: {
    fontWeight: 'bold',
    color: '#000',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadBadge: {
    backgroundColor: '#40C4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ChatList;
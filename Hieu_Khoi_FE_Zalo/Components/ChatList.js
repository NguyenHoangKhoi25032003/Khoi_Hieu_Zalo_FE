

// // import React, { useState, useEffect } from 'react';
// // import {
// //   View,
// //   Text,
// //   FlatList,
// //   StyleSheet,
// //   TouchableOpacity,
// //   Image,
// //   TextInput,
// //   ActivityIndicator,
// // } from 'react-native';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import Icon from 'react-native-vector-icons/MaterialIcons';
// // import Ionicons from 'react-native-vector-icons/Ionicons';
// // import { API_URL } from '../config';
// // import io from 'socket.io-client';
// // import Footer from './Footer';

// // const ChatList = ({ navigation }) => {
// //   const [searchText, setSearchText] = useState('');
// //   const [conversations, setConversations] = useState([]);
// //   const [contacts, setContacts] = useState({});
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [currentUserId, setCurrentUserId] = useState('');
// //   const [socket, setSocket] = useState(null);
// //   const [onlineUsers, setOnlineUsers] = useState(new Set());
// //   const [newMessages, setNewMessages] = useState(new Set()); // Trạng thái để theo dõi tin nhắn mới

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       try {
// //         const token = await AsyncStorage.getItem('token');
// //         if (!token) {
// //           navigation.navigate('Login');
// //           return;
// //         }

// //         // Lấy currentUserId
// //         const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         const profileData = await profileResponse.json();
// //         if (profileResponse.status === 200) {
// //           console.log('Profile data:', profileData);
// //           if (!profileData.userId) {
// //             throw new Error('Không tìm thấy userId trong profile');
// //           }
// //           setCurrentUserId(profileData.userId);
// //         } else {
// //           throw new Error(profileData.message || 'Không thể lấy thông tin người dùng');
// //         }

// //         // Lấy danh sách contacts
// //         const contactsResponse = await fetch(`${API_URL}/api/user/contacts`, {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         const contactsData = await contactsResponse.json();
// //         console.log('Contacts data:', contactsData);
// //         if (contactsResponse.status === 200) {
// //           const contactsMap = {};
// //           contactsData.forEach((contact) => {
// //             contactsMap[contact.userId] = contact;
// //           });
// //           setContacts(contactsMap);
// //         } else {
// //           throw new Error(contactsData.message || 'Không thể tải danh sách liên hệ');
// //         }

// //         // Lấy danh sách conversations
// //         const conversationsResponse = await fetch(`${API_URL}/api/messages/conversations`, {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         const conversationsData = await conversationsResponse.json();
// //         console.log('Initial conversations:', conversationsData);
// //         if (conversationsResponse.status === 200) {
// //           setConversations(conversationsData);
// //         } else {
// //           throw new Error(conversationsData.message || 'Không thể tải danh sách cuộc trò chuyện');
// //         }
// //       } catch (err) {
// //         setError(err.message);
// //         console.error('Fetch data error:', err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     const initSocket = async () => {
// //       const token = await AsyncStorage.getItem('token');
// //       if (!token) {
// //         navigation.navigate('Login');
// //         return;
// //       }

// //       const socketInstance = io(API_URL, {
// //         query: { token },
// //         transports: ['websocket'],
// //         reconnectionAttempts: 5,
// //       });

// //       socketInstance.on('connect', () => {
// //         console.log('Socket connected:', socketInstance.id);
// //         if (currentUserId) {
// //           socketInstance.emit('register', currentUserId);
// //         }
// //       });

// //       socketInstance.on('updateChatList', (data) => {
// //         console.log('Received updateChatList:', data);
// //         setConversations((prev) => {
// //           const otherUserId = data.senderId === currentUserId ? data.receiverId : data.senderId;
// //           const existingConv = prev.find((conv) => conv.conversationId === data.conversationId);
// //           let updatedConversations;

// //           if (existingConv) {
// //             updatedConversations = prev.map((conv) =>
// //               conv.conversationId === data.conversationId
// //                 ? {
// //                     ...conv,
// //                     lastMessage: {
// //                       content: data.lastMessage.content || 'File',
// //                       contentType: data.lastMessage.contentType || 'text',
// //                       fileUrl: data.lastMessage.fileUrl,
// //                       timestamp: data.lastMessage.timestamp,
// //                       senderId: data.lastMessage.senderId,
// //                       isRecalled: data.lastMessage.isRecalled || false,
// //                     },
// //                     unreadCount:
// //                       data.receiverId === currentUserId
// //                         ? (conv.unreadCount || 0) + 1
// //                         : conv.unreadCount,
// //                     otherUserId,
// //                   }
// //                 : conv
// //             );
// //           } else {
// //             updatedConversations = [
// //               {
// //                 conversationId: data.conversationId,
// //                 otherUserId,
// //                 lastMessage: {
// //                   content: data.lastMessage.content || 'File',
// //                   contentType: data.lastMessage.contentType || 'text',
// //                   fileUrl: data.lastMessage.fileUrl,
// //                   timestamp: data.lastMessage.timestamp,
// //                   senderId: data.lastMessage.senderId,
// //                   isRecalled: data.lastMessage.isRecalled || false,
// //                 },
// //                 unreadCount: data.receiverId === currentUserId ? 1 : 0,
// //               },
// //               ...prev,
// //             ];
// //           }

// //           // Đánh dấu tin nhắn mới để in đậm
// //           if (data.receiverId === currentUserId) {
// //             setNewMessages((prev) => new Set(prev).add(data.conversationId));
// //           }

// //           console.log('Updated conversations:', updatedConversations);
// //           return updatedConversations.sort(
// //             (a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
// //           );
// //         });
// //       });

// //       socketInstance.on('userStatus', ({ userId, status }) => {
// //         console.log('User status:', { userId, status });
// //         setOnlineUsers((prev) => {
// //           const updated = new Set(prev);
// //           if (status === 'online') {
// //             updated.add(userId);
// //           } else {
// //             updated.delete(userId);
// //           }
// //           return updated;
// //         });
// //       });

// //       socketInstance.on('connect_error', (err) => {
// //         console.error('Socket error:', err);
// //         setError('Socket error: ' + err.message);
// //       });

// //       socketInstance.on('reconnect', (attempt) => {
// //         console.log('Socket reconnected after attempt:', attempt);
// //         if (currentUserId) {
// //           socketInstance.emit('register', currentUserId);
// //         }
// //       });

// //       setSocket(socketInstance);

// //       return () => {
// //         socketInstance.disconnect();
// //         console.log('Socket disconnected');
// //       };
// //     };

// //     fetchData();
// //     if (currentUserId) {
// //       initSocket();
// //     }

// //     return () => {
// //       if (socket) {
// //         socket.disconnect();
// //       }
// //     };
// //   }, [currentUserId, navigation]);

// //   useEffect(() => {
// //     if (socket && currentUserId) {
// //       socket.emit('register', currentUserId);
// //     }
// //   }, [socket, currentUserId]);

// //   const filteredData = conversations.filter((item) => {
// //     const contact = contacts[item.otherUserId];
// //     return (
// //       contact &&
// //       (contact.username.toLowerCase().includes(searchText.toLowerCase()) ||
// //         contact.email.toLowerCase().includes(searchText.toLowerCase()))
// //     );
// //   });

// //   const handlePlusClick = () => {
// //     navigation.navigate('NewPage');
// //   };

// //   if (loading) {
// //     return (
// //       <View style={styles.container}>
// //         <ActivityIndicator size="large" color="#0068FF" />
// //       </View>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <View style={styles.container}>
// //         <Text style={styles.errorText}>{error}</Text>
// //         <Footer navigation={navigation} />
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <View style={styles.searchBar}>
// //         <View style={styles.searchInputContainer}>
// //           <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
// //           <TextInput
// //             style={styles.searchInput}
// //             placeholder="Tìm kiếm"
// //             value={searchText}
// //             onChangeText={setSearchText}
// //           />
// //         </View>
// //         <TouchableOpacity onPress={() => console.log('QR Code')}>
// //           <Icon name="qr-code-scanner" size={24} color="#FFFFFF" style={styles.headerIcon} />
// //         </TouchableOpacity>
// //         <TouchableOpacity onPress={handlePlusClick}>
// //           <Icon name="add" size={24} color="#FFFFFF" style={styles.headerIcon} />
// //         </TouchableOpacity>
// //       </View>

// //       <FlatList
// //         data={filteredData}
// //         keyExtractor={(item) => item.conversationId}
// //         renderItem={({ item }) => {
// //           const contact = contacts[item.otherUserId] || {};
// //           const isNewMessage = newMessages.has(item.conversationId);
// //           return (
// //             <TouchableOpacity
// //               style={styles.chatItem}
// //               onPress={() => {
// //                 console.log('Navigating to ChatScreen with:', {
// //                   receiverId: item.otherUserId,
// //                   receiverName: contact.username,
// //                   currentUserId,
// //                 });
// //                 if (!currentUserId || !item.otherUserId) {
// //                   setError('Thiếu ID người dùng');
// //                   return;
// //                 }
// //                 // Xóa tin nhắn khỏi danh sách tin nhắn mới khi người dùng nhấp vào
// //                 setNewMessages((prev) => {
// //                   const updated = new Set(prev);
// //                   updated.delete(item.conversationId);
// //                   return updated;
// //                 });
// //                 navigation.navigate('ChatScreen', {
// //                   receiverId: item.otherUserId,
// //                   receiverName: contact.username,
// //                   currentUserId,
// //                 });
// //               }}
// //             >
// //               <View style={styles.avatarContainer}>
// //                 <Image
// //                   source={{
// //                     uri: contact.avatarUrl || 'https://up-load-file-tranquocanh.s3.amazonaws.com/default-avatar.png',
// //                   }}
// //                   style={styles.avatar}
// //                   defaultSource={require('../img/unnamed.png')}
// //                 />
// //                 {onlineUsers.has(item.otherUserId) && <View style={styles.onlineBadge} />}
// //               </View>
// //               <View style={styles.chatInfo}>
// //                 <Text style={styles.chatName}>{contact.username || 'Unknown'}</Text>
// //                 <Text
// //                   style={[
// //                     styles.chatMessage,
// //                     isNewMessage || item.unreadCount > 0 ? styles.boldMessage : null,
// //                   ]}
// //                   numberOfLines={1}
// //                 >
// //                   {item.lastMessage?.isRecalled
// //                     ? 'Tin nhắn đã được thu hồi'
// //                     : item.lastMessage?.contentType === 'file'
// //                     ? 'File'
// //                     : item.lastMessage?.content || 'Chưa có tin nhắn'}
// //                 </Text>
// //               </View>
// //               <View style={styles.chatMeta}>
// //                 <Text style={styles.chatTime}>
// //                   {item.lastMessage?.timestamp
// //                     ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
// //                         hour: '2-digit',
// //                         minute: '2-digit',
// //                       })
// //                     : ''}
// //                 </Text>
// //                 {item.unreadCount > 0 && (
// //                   <View style={styles.unreadBadge}>
// //                     <Text style={styles.unreadCount}>{item.unreadCount}</Text>
// //                   </View>
// //                 )}
// //               </View>
// //             </TouchableOpacity>
// //           );
// //         }}
// //       />

// //       <Footer navigation={navigation} />
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#fff',
// //   },
// //   searchBar: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: '#40C4FF',
// //     paddingVertical: 15,
// //     paddingHorizontal: 15,
// //     paddingTop: 65,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 4,
// //     elevation: 3,
// //   },
// //   searchInputContainer: {
// //     flex: 1,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: '#E0E0E0',
// //     borderRadius: 20,
// //     paddingHorizontal: 15,
// //     marginRight: 15,
// //   },
// //   searchIcon: {
// //     marginRight: 10,
// //   },
// //   searchInput: {
// //     flex: 1,
// //     fontSize: 16,
// //     color: '#333',
// //     paddingVertical: 8,
// //   },
// //   headerIcon: {
// //     marginLeft: 15,
// //   },
// //   chatItem: {
// //     flexDirection: 'row',
// //     padding: 15,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#E0E0E0',
// //     alignItems: 'center',
// //   },
// //   avatarContainer: {
// //     position: 'relative',
// //   },
// //   avatar: {
// //     width: 50,
// //     height: 50,
// //     borderRadius: 25,
// //     marginRight: 15,
// //   },
// //   onlineBadge: {
// //     position: 'absolute',
// //     bottom: 0,
// //     right: 15,
// //     width: 12,
// //     height: 12,
// //     borderRadius: 6,
// //     backgroundColor: '#00FF00',
// //     borderWidth: 2,
// //     borderColor: '#FFF',
// //   },
// //   chatInfo: {
// //     flex: 1,
// //   },
// //   chatName: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#333',
// //   },
// //   chatMessage: {
// //     fontSize: 14,
// //     color: '#666',
// //     marginTop: 3,
// //   },
// //   boldMessage: {
// //     fontWeight: 'bold',
// //     color: '#000',
// //   },
// //   chatMeta: {
// //     alignItems: 'flex-end',
// //   },
// //   chatTime: {
// //     fontSize: 12,
// //     color: '#999',
// //   },
// //   unreadBadge: {
// //     backgroundColor: '#40C4FF',
// //     borderRadius: 12,
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //     marginTop: 4,
// //   },
// //   unreadCount: {
// //     color: '#FFF',
// //     fontSize: 12,
// //     fontWeight: 'bold',
// //   },
// //   errorText: {
// //     color: '#d32f2f',
// //     textAlign: 'center',
// //     margin: 20,
// //     fontSize: 16,
// //   },
// // });

// // export default ChatList;


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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../config';
import io from 'socket.io-client';
import Footer from './Footer';

const ChatList = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        setError(err.message);
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
        setError('Socket error: ' + err.message);
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

  const filteredData = conversations.filter((item) => {
    const contact = contacts[item.otherUserId];
    return (
      contact &&
      (contact.username.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchText.toLowerCase()))
    );
  });

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

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Footer navigation={navigation} />
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
            placeholder="Tìm kiếm"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity onPress={() => console.log('QR Code')}>
          <Icon name="qr-code-scanner" size={24} color="#FFFFFF" style={styles.headerIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlusClick}>
          <Icon name="add" size={24} color="#FFFFFF" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.conversationId}
        renderItem={({ item }) => {
          const contact = contacts[item.otherUserId] || {};
          const isNewMessage = newMessages.has(item.conversationId);
          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => {
                console.log('Navigating to ChatScreen with:', {
                  receiverId: item.otherUserId,
                  receiverName: contact.username,
                  currentUserId,
                });
                if (!currentUserId || !item.otherUserId) {
                  setError('Thiếu ID người dùng');
                  return;
                }
                setNewMessages((prev) => {
                  const updated = new Set(prev);
                  updated.delete(item.conversationId);
                  return updated;
                });
                navigation.navigate('ChatScreen', {
                  receiverId: item.otherUserId,
                  receiverName: contact.username,
                  currentUserId,
                });
              }}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: contact.avatarUrl || 'https://up-load-file-tranquocanh.s3.amazonaws.com/default-avatar.png',
                  }}
                  style={styles.avatar}
                  defaultSource={require('../img/unnamed.png')}
                />
                {onlineUsers.has(item.otherUserId) && <View style={styles.onlineBadge} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{contact.username || 'Unknown'}</Text>
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
                    ? `Bạn có tin nhắn mới`
                    : item.lastMessage?.contentType === 'file'
                    ? 'File'
                    : `Bạn có tin nhắn mới`
                    }
                </Text>
              </View>
              <View style={styles.chatMeta}>
                <Text style={styles.chatTime}>
                  
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
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
    shadowOffset: { width: 0, height: 2 },
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
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
});

export default ChatList;





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
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [currentUserId, setCurrentUserId] = useState('');
//   const [socket, setSocket] = useState(null);
//   const [onlineUsers, setOnlineUsers] = useState(new Set());

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         if (!token) {
//           navigation.navigate('Login');
//           return;
//         }

//         // Lấy currentUserId
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

//         // Lấy danh sách contacts
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

//         // Lấy danh sách conversations
//         const conversationsResponse = await fetch(`${API_URL}/api/messages/conversations`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const conversationsData = await conversationsResponse.json();
//         console.log('Conversations data:', conversationsData);
//         if (conversationsResponse.status === 200) {
//           setConversations(conversationsData);
//         } else {
//           throw new Error(conversationsData.message || 'Không thể tải danh sách cuộc trò chuyện');
//         }
//       } catch (err) {
//         setError(err.message);
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
//       });

//       socketInstance.on('connect', () => {
//         console.log('Socket connected:', socketInstance.id);
//         socketInstance.emit('register', currentUserId);
//       });

//       socketInstance.on('updateChatList', (data) => {
//         console.log('Received updateChatList:', data);
//         setConversations((prev) => {
//           const updated = prev.filter((conv) => conv.otherUserId !== data.senderId);
//           return [
//             {
//               conversationId: data.conversationId,
//               otherUserId: data.senderId,
//               lastMessage: data.lastMessage,
//               unreadCount: data.unreadCount,
//             },
//             ...updated,
//           ].sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
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
//         setError('Socket error: ' + err.message);
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
//   }, [currentUserId, navigation]);

//   const filteredData = conversations.filter((item) => {
//     const contact = contacts[item.otherUserId];
//     return (
//       contact &&
//       (contact.username.toLowerCase().includes(searchText.toLowerCase()) ||
//         contact.email.toLowerCase().includes(searchText.toLowerCase()))
//     );
//   });

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

//   if (error) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Footer navigation={navigation} />
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
//             placeholder="Tìm kiếm"
//             value={searchText}
//             onChangeText={setSearchText}
//           />
//         </View>
//         <TouchableOpacity onPress={() => console.log('QR Code')}>
//           <Icon name="qr-code-scanner" size={24} color="#FFFFFF" style={styles.headerIcon} />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={handlePlusClick}>
//           <Icon name="add" size={24} color="#FFFFFF" style={styles.headerIcon} />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={filteredData}
//         keyExtractor={(item) => item.conversationId}
//         renderItem={({ item }) => {
//           const contact = contacts[item.otherUserId] || {};
//           return (
//             <TouchableOpacity
//               style={styles.chatItem}
//               onPress={() => {
//                 console.log('Navigating to ChatScreen with:', {
//                   receiverId: item.otherUserId,
//                   receiverName: contact.username,
//                   currentUserId,
//                 });
//                 if (!currentUserId || !item.otherUserId) {
//                   setError('Thiếu ID người dùng');
//                   return;
//                 }
//                 navigation.navigate('ChatScreen', {
//                   receiverId: item.otherUserId,
//                   receiverName: contact.username,
//                   currentUserId,
//                 });
//               }}
//             >
//               <View style={styles.avatarContainer}>
//                 <Image
//                   source={{
//                     uri: contact.avatarUrl || 'https://up-load-file-tranquocanh.s3.amazonaws.com/default-avatar.png',
//                   }}
//                   style={styles.avatar}
//                   defaultSource={require('../img/unnamed.png')}
//                 />
//                 {onlineUsers.has(item.otherUserId) && <View style={styles.onlineBadge} />}
//               </View>
//               <View style={styles.chatInfo}>
//                 <Text style={styles.chatName}>{contact.username || 'Unknown'}</Text>
//                 <Text style={styles.chatMessage}>
//                   {item.lastMessage?.isRecalled
//                     ? 'Tin nhắn đã được thu hồi'
//                     : item.lastMessage?.content || 'File'}
//                 </Text>
//               </View>
//               <View style={styles.chatMeta}>
//                 <Text style={styles.chatTime}>
//                   {item.lastMessage?.timestamp
//                     ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
//                         hour: '2-digit',
//                         minute: '2-digit',
//                       })
//                     : ''}
//                 </Text>
//                 {item.unreadCount > 0 && (
//                   <View style={styles.unreadBadge}>
//                     <Text style={styles.unreadCount}>{item.unreadCount}</Text>
//                   </View>
//                 )}
//               </View>
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
//   errorText: {
//     color: '#d32f2f',
//     textAlign: 'center',
//     margin: 20,
//     fontSize: 16,
//   },
// });

// export default ChatList;
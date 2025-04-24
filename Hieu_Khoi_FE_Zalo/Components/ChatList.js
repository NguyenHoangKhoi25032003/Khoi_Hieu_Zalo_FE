
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
import { debounce } from 'lodash';
import { API_URL } from '../config';
import io from 'socket.io-client';
import Footer from './Footer';

const DEFAULT_AVATAR = 'https://via.placeholder.com/50';

const ChatList = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [contacts, setContacts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [newMessages, setNewMessages] = useState(new Set());

  // Hàm định dạng thời gian
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', timestamp);
        return 'N/A';
      }
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error('Error formatting timestamp:', timestamp, err);
      return 'N/A';
    }
  };

  // Hàm lấy danh sách cuộc trò chuyện
  const fetchConversations = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.status === 200) {
        console.log('Fetched conversations:', JSON.stringify(data, null, 2));
        setConversations(data);
      } else {
        throw new Error(data.message || 'Không thể tải danh sách cuộc trò chuyện');
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
      setSearchError(err.message);
    }
  };

  // Hàm lấy danh sách nhóm
  const fetchGroups = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/groups/my-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.status === 200) {
        console.log('Fetched groups:', JSON.stringify(data, null, 2));
        setGroups(data);
      } else {
        throw new Error(data.message || 'Không thể tải danh sách nhóm');
      }
    } catch (err) {
      console.error('Fetch groups error:', err);
      setSearchError(err.message);
    }
  };

  // Hàm lấy danh sách bạn bè
  const fetchFriends = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.status === 200) {
        console.log('Fetched friends:', JSON.stringify(data, null, 2));
        setFriends(data.friends || []);
      } else {
        throw new Error(data.message || 'Không thể tải danh sách bạn bè');
      }
    } catch (err) {
      console.error('Fetch friends error:', err);
      setSearchError(err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('No token found, navigating to Login');
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

        await Promise.all([
          fetchConversations(token),
          fetchGroups(token),
          fetchFriends(token),
        ]);
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
        console.log('No token for socket, navigating to Login');
        navigation.navigate('Login');
        return;
      }

      const socketInstance = io(API_URL, {
        query: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        if (currentUserId) {
          socketInstance.emit('register', currentUserId);
          console.log('Emitted register with userId:', currentUserId);
        }
      });

      socketInstance.on('updateChatList', (data) => {
        console.log('Received updateChatList:', JSON.stringify(data, null, 2));
        if (!data || !data.conversationId || !data.lastMessage || !data.senderId || !data.receiverId) {
          console.error('Invalid updateChatList data:', data);
          return;
        }

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
            setNewMessages((prev) => {
              const updated = new Set(prev);
              updated.add(data.conversationId);
              return updated;
            });
          }

          console.log('Updated conversations:', JSON.stringify(updatedConversations, null, 2));
          return updatedConversations.sort(
            (a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
          );
        });
      });

      socketInstance.on(`newGroup_${currentUserId}`, (data) => {
        console.log(`Received newGroup_${currentUserId}:`, JSON.stringify(data, null, 2));
        setGroups((prev) => {
          if (!prev.some((group) => group.groupId === data.groupId)) {
            return [
              {
                ...data,
                lastMessage: null,
                unreadCount: 0,
              },
              ...prev,
            ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          }
          return prev;
        });
      });

      socketInstance.on('receiveGroupMessage', (data) => {
        console.log('Received receiveGroupMessage:', JSON.stringify(data, null, 2));
        setGroups((prev) => {
          const existingGroup = prev.find((group) => group.groupId === data.groupId);
          if (existingGroup) {
            return prev.map((group) =>
              group.groupId === data.groupId
                ? {
                    ...group,
                    lastMessage: {
                      content: data.content || 'File',
                      contentType: data.contentType || 'text',
                      fileUrl: data.fileUrl,
                      timestamp: data.timestamp,
                      senderId: data.senderId,
                      senderName: data.senderName,
                      readBy: data.readBy || {},
                      isRecalled: data.isRecalled || false,
                    },
                    unreadCount: (group.unreadCount || 0) + 1,
                  }
                : group
            ).sort((a, b) => new Date(b.lastMessage?.timestamp || b.createdAt || 0) - new Date(a.lastMessage?.timestamp || a.createdAt || 0));
          }
          return prev;
        });
        setNewMessages((prev) => new Set(prev).add(data.groupId));
      });

      socketInstance.on(`groupDisbanded_${currentUserId}`, ({ groupId }) => {
        console.log(`Received groupDisbanded_${currentUserId}:`, groupId);
        setGroups((prev) => prev.filter((group) => group.groupId !== groupId));
      });

      socketInstance.on('messageRead', (data) => {
        console.log('Received messageRead:', JSON.stringify(data, null, 2));
        setConversations((prev) =>
          prev.map((conv) =>
            conv.conversationId === data.conversationId
              ? {
                  ...conv,
                  unreadCount: 0,
                  lastMessage: {
                    ...conv.lastMessage,
                    isRead: true,
                    readtime: data.readtime || new Date().toISOString(),
                  },
                }
              : conv
          )
        );
        setNewMessages((prev) => {
          const updated = new Set(prev);
          updated.delete(data.conversationId);
          return updated;
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
        console.error('Socket connect_error:', err.message);
        setSearchError('Socket error: ' + err.message);
      });

      socketInstance.on('reconnect', (attempt) => {
        console.log('Socket reconnected after attempt:', attempt);
        if (currentUserId) {
          socketInstance.emit('register', currentUserId);
          console.log('Re-emitted register with userId:', currentUserId);
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        console.log('Socket disconnected');
      };
    };

    fetchData();
    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [navigation]);

  useEffect(() => {
    if (socket && currentUserId) {
      socket.emit('register', currentUserId);
      console.log('Re-registered socket with userId:', currentUserId);
    }
  }, [socket, currentUserId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        console.log('Auto-reloading conversations...');
        await fetchConversations(token);
      }
    }, 10000000); // Mỗi 10 giây
    return () => clearInterval(interval);
  }, []);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendFriendRequest = async (email) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setSearchResults((prev) =>
          prev.map((user) =>
            user.email === email ? { ...user, friendRequestSent: true } : user
          )
        );
        setSearchError('');
        alert('Lời mời kết bạn đã được gửi');
      } else {
        setSearchError(data.message || 'Không thể gửi lời mời kết bạn');
      }
    } catch (err) {
      setSearchError('Không thể kết nối đến server: ' + err.message);
    }
  };

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
                      friendRequestSent: false,
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

  const debouncedSearch = debounce(handleSearch, 500);

  const filteredData = searchText.length > 2 ? searchResults : [...conversations, ...groups];

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
        <TouchableOpacity
          onPress={() => {
            console.log('Create group button pressed', { friends });
            if (!friends || !Array.isArray(friends)) {
              setSearchError('Danh sách bạn bè không hợp lệ');
              return;
            }
            navigation.navigate('CreateGroupScreen', { friends });
          }}
        >
          <Icon name="group-add" size={24} color="#FFFFFF" style={styles.headerIcon} />
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
          {searchText.length > 2 ? 'Không tìm thấy người dùng' : 'Chưa có cuộc hội thoại hoặc nhóm nào'}
        </Text>
      )}

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.conversationId || item.groupId || item.userId}
        renderItem={({ item }) => {
          const isSearchResult = !!item.userId;
          const isGroup = !!item.groupId;
          const contact = isSearchResult
            ? item
            : isGroup
              ? { username: item.name, email: item.name, avatarUrl: item.avatarUrl || DEFAULT_AVATAR }
              : contacts[item.otherUserId] || {
                  username: 'Unknown',
                  email: 'Unknown',
                  avatarUrl: DEFAULT_AVATAR,
                };
          const isNewMessage = !isSearchResult && newMessages.has(item.conversationId || item.groupId);

          // Làm giàu dữ liệu members với username từ contacts hoặc friends
          const enrichedMembers = isGroup
            ? item.members.map((member) => {
                const contactInfo = contacts[member.userId] || friends.find((f) => f.userId === member.userId);
                return {
                  ...member,
                  username: contactInfo?.username || 'Unknown',
                };
              })
            : item.members;

          console.log('Rendering item:', {
            isSearchResult,
            isGroup,
            id: isSearchResult ? item.userId : item.groupId || item.otherUserId,
            username: contact.username,
            email: contact.email,
            avatarUrl: contact.avatarUrl,
            unreadCount: isSearchResult ? null : item.unreadCount,
            lastMessage: isSearchResult ? null : item.lastMessage,
            members: isGroup ? enrichedMembers : null,
          });

          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => {
                console.log('Navigating to:', {
                  isGroup,
                  id: isSearchResult ? item.userId : item.groupId || item.otherUserId,
                  name: contact.username || contact.email,
                  currentUserId,
                });
                if (!currentUserId || !(isSearchResult ? item.userId : item.groupId || item.otherUserId)) {
                  setSearchError('Thiếu ID người dùng hoặc nhóm');
                  return;
                }
                if (!isSearchResult) {
                  setNewMessages((prev) => {
                    const updated = new Set(prev);
                    updated.delete(item.conversationId || item.groupId);
                    return updated;
                  });
                  if (isGroup) {
                    setGroups((prev) =>
                      prev.map((group) =>
                        group.groupId === item.groupId
                          ? { ...group, unreadCount: 0 }
                          : group
                      )
                    );
                  } else {
                    setConversations((prev) =>
                      prev.map((conv) =>
                        conv.conversationId === item.conversationId
                          ? {
                              ...conv,
                              unreadCount: 0,
                              lastMessage: { ...conv.lastMessage, isRead: true },
                            }
                          : conv
                      )
                    );
                  }
                }
                if (isGroup) {
                  navigation.navigate('GroupChatScreen', {
                    groupId: item.groupId,
                    groupName: item.name,
                    currentUserId,
                    members: enrichedMembers, // Truyền members đã làm giàu
                    ownerId: item.ownerId,
                  });
                } else {
                  navigation.navigate('ChatScreen', {
                    receiverId: isSearchResult ? item.userId : item.otherUserId,
                    receiverName: contact.username || contact.email || 'Unknown',
                    currentUserId,
                  });
                }
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
                {!isGroup && onlineUsers.has(isSearchResult ? item.userId : item.otherUserId) && (
                  <View style={styles.onlineBadge} />
                )}
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatNameContainer}>
                  <Text style={styles.chatName}>{contact.username || contact.email || 'Unknown'}</Text>
                  {isGroup && (
                    <Icon name="group" size={18} color="#40C4FF" style={styles.groupIcon} />
                  )}
                </View>
                {isSearchResult ? (
                  <View style={styles.searchResultContainer}>
                    <Text style={styles.chatMessage}>{contact.email}</Text>
                    <TouchableOpacity
                      style={[styles.friendButton, item.friendRequestSent ? styles.disabledButton : null]}
                      onPress={() => handleSendFriendRequest(contact.email)}
                      disabled={item.friendRequestSent}
                    >
                      <Text style={styles.friendButtonText}>
                        {item.friendRequestSent ? 'Đã gửi' : 'Kết bạn'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.chatMessage,
                      isNewMessage || item.unreadCount > 0 ? styles.boldMessage : null,
                    ]}
                    numberOfLines={1}
                  >
                    {isGroup
                      ? item.lastMessage
                        ? item.lastMessage.isRecalled
                          ? 'Tin nhắn đã được thu hồi'
                          : item.lastMessage.contentType === 'file'
                            ? '[Tệp]'
                            : item.lastMessage.contentType === 'image'
                              ? '[Hình ảnh]'
                              : `${item.lastMessage.senderName}: ${item.lastMessage.content || 'Tin nhắn mới'}`
                        : 'Nhóm mới được tạo'
                      : item.lastMessage?.isRecalled
                        ? 'Tin nhắn đã được thu hồi'
                        : item.lastMessage?.contentType === 'image'
                          ? '[Hình ảnh]'
                          : item.lastMessage?.contentType === 'file'
                            ? '[Tệp]'
                            : item.lastMessage?.content || 'Bạn có tin nhắn mới'}
                  </Text>
                )}
              </View>
              {!isSearchResult && (
                <View style={styles.chatMeta}>
                  <Text style={styles.chatTime}>
                    {isGroup
                      ? item.lastMessage?.timestamp
                        ? formatTimestamp(item.lastMessage.timestamp)
                        : formatTimestamp(item.createdAt)
                      : item.lastMessage?.readtime
                        ? formatTimestamp(item.lastMessage.readtime)
                        : formatTimestamp(item.lastMessage?.timestamp)}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {item.unreadCount > 9 ? '9+' : item.unreadCount}
                      </Text>
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
  chatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  groupIcon: {
    marginLeft: 5,
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
    marginTop: 3,
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
  searchResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendButton: {
    backgroundColor: '#0068FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  friendButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default ChatList;

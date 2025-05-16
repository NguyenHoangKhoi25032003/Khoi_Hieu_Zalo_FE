


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { debounce } from 'lodash';
import io from 'socket.io-client';
import { API_URL, DEFAULT_AVATAR } from '../config';
import Footer from './Footer';
import { showLocalNotification, setupNotificationListener } from './NotificationHandler';

const ChatList = ({ route, navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [contacts, setContacts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [newMessages, setNewMessages] = useState(new Set());
  const [currentScreen, setCurrentScreen] = useState(null);
  const [pendingMessages, setPendingMessages] = useState({});

  const socketRef = useRef(null);
  const registeredGroups = useRef(new Set());

  const refreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('Không có refresh token');

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await checkResponse(response, '/api/auth/refresh');
      await AsyncStorage.setItem('token', data.accessToken);
      if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    } catch (err) {
      console.error('Lỗi khi làm mới token:', err);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userId');
      navigation.replace('Login');
      Alert.alert('Lỗi', 'Phiên hết hạn. Vui lòng đăng nhập lại.');
      return null;
    }
  };

  const checkResponse = async (response, apiName) => {
    if (!response.ok) {
      const text = await response.text();
      console.error(`${apiName} lỗi: Trạng thái ${response.status}, Phản hồi: ${text}`);
      if (response.status === 404 && apiName === '/api/groups/my-groups') {
        return [];
      }
      throw new Error(`API ${apiName} trả về lỗi: ${response.status} ${response.statusText}`);
    }
    try {
      return await response.json();
    } catch (err) {
      console.error(`${apiName} lỗi phân tích JSON: ${err.message}`);
      throw new Error(`Không thể phân tích JSON từ ${apiName}: ${err.message}`);
    }
  };

  const fetchUserInfo = async (userId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/user/getUserById/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await checkResponse(response, '/api/user/getUserById');
      return {
        userId: data.userId,
        username: data.username || data.email || `User_${data.userId}`,
        email: data.email || 'Không rõ',
        avatarUrl: data.avatarUrl || DEFAULT_AVATAR,
      };
    } catch (err) {
      console.error(`Lỗi khi lấy thông tin người dùng cho userId ${userId}:`, err);
      return {
        userId,
        username: `User_${userId}`,
        email: 'Không rõ',
        avatarUrl: DEFAULT_AVATAR,
      };
    }
  };

  const fetchLastMessage = async (userId, currentUserId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const messages = await checkResponse(response, `/api/chat/messages/${userId}`);
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      return lastMessage
        ? {
            content: lastMessage.content || '[Tin nhắn trống]',
            type: lastMessage.type || 'text',
            isRecalled: lastMessage.isRecalled || false,
            messageId: lastMessage.messageId || `msg_${Date.now()}`,
            timestamp: lastMessage.timestamp || new Date().toISOString(),
            fileUrl: lastMessage.fileUrl || null,
          }
        : null;
    } catch (err) {
      console.error(`Lỗi khi lấy tin nhắn cuối cùng cho userId ${userId}:`, err);
      return null;
    }
  };

  const fetchLastGroupMessage = async (groupId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/group-chat/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await checkResponse(response, `/api/group-chat/${groupId}`);
      const lastMessage = result.items && result.items.length > 0 ? result.items[0] : null;
      return lastMessage
        ? {
            content: lastMessage.content || '[Tin nhắn trống]',
            type: lastMessage.type || 'text',
            fileUrl: lastMessage.fileUrl || null,
            timestamp: lastMessage.timestamp || new Date().toISOString(),
            senderId: lastMessage.senderId || null,
            senderName: lastMessage.senderName || null, // API có thể không trả về senderName
            isRecalled: lastMessage.isRecalled || false,
            messageId: lastMessage.messageId || `msg_${Date.now()}`,
          }
        : null;
    } catch (err) {
      console.error(`Lỗi khi lấy tin nhắn cuối cùng cho groupId ${groupId}:`, err);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      let token = await AsyncStorage.getItem('token');
      let userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        token = await refreshToken();
        userId = await AsyncStorage.getItem('userId');
        if (!token || !userId) return navigation.replace('Login');
      }
      setCurrentUserId(userId);

      const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await checkResponse(profileResponse, '/api/user/profile');
      if (profileData.userId) {
        setCurrentUserId(profileData.userId);
        await AsyncStorage.setItem('userId', profileData.userId);
      } else {
        throw new Error('Không tìm thấy userId trong dữ liệu hồ sơ');
      }

      // Lấy danh sách bạn bè
      const friendsResponse = await fetch(`${API_URL}/api/friend/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const friendsData = await checkResponse(friendsResponse, '/api/friend/list');
      const contactsMap = {};
      friendsData.friends.forEach((friend) => {
        contactsMap[friend.userId] = {
          userId: friend.userId,
          username: friend.username || friend.email || `User_${friend.userId}`,
          email: friend.email,
          avatarUrl: friend.avatarUrl || DEFAULT_AVATAR,
        };
      });
      setFriends(friendsData.friends || []);
      setContacts(contactsMap);

      // Lấy danh sách cuộc trò chuyện
      const convResponse = await fetch(`${API_URL}/api/chat/${profileData.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const convData = await checkResponse(convResponse, '/api/chat/:userId');

      // Lấy thông tin người dùng cho tất cả userId trong cuộc trò chuyện
      const userIds = [...new Set(convData.map((conv) => conv.userId))];
      const userInfoPromises = userIds.map(async (userId) => {
        if (!contactsMap[userId]) {
          const userInfo = await fetchUserInfo(userId, token);
          contactsMap[userId] = userInfo;
        }
      });
      await Promise.all(userInfoPromises);
      setContacts(contactsMap);

      const formattedConversations = await Promise.all(
        convData.map(async (conv) => {
          const lastMessage = await fetchLastMessage(conv.userId, profileData.userId, token);
          return {
            conversationId: conv.conversationId || `${profileData.userId}#${conv.userId}`,
            userId: conv.userId,
            username: contactsMap[conv.userId]?.username || 'Không rõ',
            avatarUrl: contactsMap[conv.userId]?.avatarUrl || DEFAULT_AVATAR,
            lastMessage: lastMessage || {
              content: '[Chưa có tin nhắn]',
              type: 'text',
              isRecalled: false,
              messageId: `empty_${conv.conversationId}`,
              timestamp: conv.time || new Date().toISOString(),
              fileUrl: null,
            },
            time: lastMessage?.timestamp || conv.time || new Date().toISOString(),
            unread: conv.unread || 0,
          };
        })
      );

      const convWithPending = formattedConversations.map((conv) => {
        const pending = pendingMessages[conv.conversationId];
        if (pending && (!conv.lastMessage || new Date(pending.timestamp) > new Date(conv.lastMessage.timestamp))) {
          return { ...conv, lastMessage: pending, time: pending.timestamp };
        }
        return conv;
      });
      setConversations(convWithPending);

      // Lấy danh sách nhóm
      const groupResponse = await fetch(`${API_URL}/api/groups/my-groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const groupData = await checkResponse(groupResponse, '/api/groups/my-groups');

      // Lấy thông tin người dùng cho tất cả thành viên nhóm
      const groupUserIds = [...new Set(groupData.flatMap((group) => group.members.map((m) => m.userId)))];
      const groupUserInfoPromises = groupUserIds.map(async (userId) => {
        if (!contactsMap[userId]) {
          const userInfo = await fetchUserInfo(userId, token);
          contactsMap[userId] = userInfo;
        }
      });
      await Promise.all(groupUserInfoPromises);

      // Lấy tin nhắn cuối cùng cho các nhóm và cập nhật contacts cho senderId
      const formattedGroups = await Promise.all(
        groupData.map(async (group) => {
          const lastMessage = await fetchLastGroupMessage(group.groupId, token);
          if (lastMessage && lastMessage.senderId && !contactsMap[lastMessage.senderId]) {
            const userInfo = await fetchUserInfo(lastMessage.senderId, token);
            contactsMap[lastMessage.senderId] = userInfo;
          }
          return {
            groupId: group.groupId,
            name: group.name || 'Nhóm không tên',
            avatarUrl: group.avatarUrl || DEFAULT_AVATAR,
            lastMessage: lastMessage || {
              content: '[Chưa có tin nhắn]',
              type: 'text',
              fileUrl: null,
              timestamp: group.createdAt || new Date().toISOString(),
              senderId: null,
              senderName: 'Hệ thống',
              isRecalled: false,
              messageId: `empty_${group.groupId}`,
            },
            unreadCount: group.unreadCount || 0,
            members: group.members.map((member) => ({
              userId: member.userId,
              username: contactsMap[member.userId]?.username || `User_${member.userId}`,
              role: member.role || 'member',
            })),
            ownerId: group.ownerId,
            createdAt: group.createdAt || new Date().toISOString(),
          };
        })
      );

      setContacts(contactsMap); // Cập nhật contacts sau khi lấy thông tin người dùng
      const groupsWithPending = formattedGroups.map((group) => {
        const pending = pendingMessages[group.groupId];
        if (pending && (!group.lastMessage || new Date(pending.timestamp) > new Date(group.lastMessage.timestamp))) {
          return { ...group, lastMessage: pending, createdAt: pending.timestamp };
        }
        return group;
      });
      setGroups(groupsWithPending);
    } catch (err) {
      setError(`Lỗi khi tải dữ liệu: ${err.message}`);
      console.error('Lỗi khi lấy dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSessionAndNavigate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert(
          'Phiên hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục.',
          [{ text: 'OK', onPress: () => navigation.replace('Login') }],
          { cancelable: false }
        );
        return;
      }
      navigation.navigate('CreateGroupScreen', { friends });
    } catch (err) {
      console.error('Lỗi khi kiểm tra phiên:', err);
      Alert.alert('Lỗi', 'Không thể xác minh phiên: ' + err.message);
    }
  };

  useEffect(() => {
    if (route.params?.newMessage) {
      const { conversationId, content, type, timestamp, messageId, receiverId } = route.params.newMessage;
      const otherUserId = receiverId;

      setConversations((prev) => {
        const existingConv = prev.find(
          (conv) =>
            conv.conversationId === conversationId ||
            (conv.userId === otherUserId && conv.userId !== currentUserId)
        );

        const newMessage = {
          content: content || '[Tin nhắn trống]',
          type: type || 'text',
          isRecalled: false,
          messageId,
          timestamp: timestamp || new Date().toISOString(),
          fileUrl: null,
        };

        let updatedConversations;

        if (existingConv) {
          updatedConversations = prev.map((conv) =>
            conv.conversationId === conversationId ||
            (conv.userId === otherUserId && conv.userId !== currentUserId)
              ? {
                  ...conv,
                  conversationId,
                  lastMessage: newMessage,
                  time: newMessage.timestamp,
                  unread: 0,
                }
              : conv
          );
        } else {
          updatedConversations = [
            {
              conversationId,
              userId: otherUserId,
              username: contacts[otherUserId]?.username || 'Không rõ',
              avatarUrl: contacts[otherUserId]?.avatarUrl || DEFAULT_AVATAR,
              lastMessage: newMessage,
              time: newMessage.timestamp,
              unread: 0,
            },
            ...prev,
          ];
        }

        setPendingMessages((prev) => ({
          ...prev,
          [conversationId]: newMessage,
        }));

        return updatedConversations.sort((a, b) => new Date(b.time) - new Date(a.time));
      });

      navigation.setParams({ newMessage: undefined });
    }
  }, [route.params, contacts, navigation]);

  useEffect(() => {
    const loadData = async () => {
      setConversations([]);
      setGroups([]);
      await fetchData();
    };

    loadData();
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      if (!currentUserId) return;

      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await refreshToken();
        if (!token) return navigation.replace('Login');
      }

      socketRef.current = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 30,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        console.log(`Socket kết nối: ${socketRef.current.id}, userId: ${currentUserId}`);
        socketRef.current.emit('register', currentUserId);
        groups.forEach((group) => {
          socketRef.current.emit('joinGroup', group.groupId);
          console.log(`Đã tham gia nhóm: ${group.groupId}`);
        });
      });

      socketRef.current.on('connect_error', async (err) => {
        console.error('Lỗi kết nối socket:', err.message, err.stack);
        if (err.message.includes('Invalid token')) {
          const newToken = await refreshToken();
          if (newToken) {
            socketRef.current.auth.token = newToken;
            socketRef.current.connect();
            console.log('Kết nối lại với token mới');
          }
        } else if (isMounted) {
          setError('Không thể kết nối với server: ' + err.message);
        }
      });

      socketRef.current.on('reconnect', () => {
        console.log('Socket kết nối lại');
        socketRef.current.emit('register', currentUserId);
        groups.forEach((group) => {
          socketRef.current.emit('joinGroup', group.groupId);
          console.log(`Đã tham gia lại nhóm: ${group.groupId}`);
        });
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log(`Socket ngắt kết nối: ${reason}`);
        if (isMounted) setError(`Socket ngắt kết nối: ${reason}. Đang kết nối lại...`);
      });

      socketRef.current.on(`receiveMessage_${currentUserId}`, async (data) => {
        console.log(`Nhận được receiveMessage_${currentUserId}:`, JSON.stringify(data, null, 2));
        if (!data || !data.conversationId || !data.messageId) return;

        const otherUserId = data.senderId === currentUserId ? data.receiverId : data.senderId;
        let updatedContacts = { ...contacts };

        if (!contacts[otherUserId]) {
          const userInfo = await fetchUserInfo(otherUserId, token);
          if (userInfo) updatedContacts[otherUserId] = userInfo;
          if (isMounted) setContacts(updatedContacts);
        }

        const newMessage = {
          content: data.content || '[Tin nhắn trống]',
          type: data.type || 'text',
          isRecalled: data.isRecalled || false,
          messageId: data.messageId,
          timestamp: data.timestamp || new Date().toISOString(),
          fileUrl: data.fileUrl || null,
        };

        setPendingMessages((prev) => ({
          ...prev,
          [data.conversationId]: newMessage,
        }));

        setConversations((prev) => {
          const existingConv = prev.find(
            (conv) => conv.conversationId === data.conversationId || conv.userId === otherUserId
          );

          let updatedConversations;

          if (existingConv) {
            if (
              existingConv.lastMessage?.messageId === data.messageId ||
              new Date(existingConv.lastMessage?.timestamp) > new Date(newMessage.timestamp)
            )
              return prev;
            updatedConversations = prev.map((conv) =>
              conv.conversationId === data.conversationId || conv.userId === otherUserId
                ? {
                    ...conv,
                    conversationId: data.conversationId,
                    userId: otherUserId,
                    username: updatedContacts[otherUserId]?.username || 'Không rõ',
                    avatarUrl: updatedContacts[otherUserId]?.avatarUrl || DEFAULT_AVATAR,
                    lastMessage: newMessage,
                    time: newMessage.timestamp,
                    unread: data.isRead ? conv.unread : (conv.unread || 0) + 1,
                  }
                : conv
          );
          } else {
            updatedConversations = [
              {
                conversationId: data.conversationId,
                userId: otherUserId,
                username: updatedContacts[otherUserId]?.username || 'Không rõ',
                avatarUrl: updatedContacts[otherUserId]?.avatarUrl || DEFAULT_AVATAR,
                lastMessage: newMessage,
                time: newMessage.timestamp,
                unread: data.isRead ? 0 : 1,
              },
              ...prev,
            ];
          }

          if (data.receiverId === currentUserId && currentScreen !== 'ChatScreen') {
            setNewMessages((prev) => new Set(prev).add(data.conversationId));
            showLocalNotification({
              title: `Tin nhắn từ ${updatedContacts[data.senderId]?.username || 'Không rõ'}`,
              body: data.content || data.fileUrl || '[Media]',
              data: { conversationId: data.conversationId },
            });
          }

          return updatedConversations.sort((a, b) => new Date(b.time) - new Date(a.time));
        });
      });

      socketRef.current.on('receiveGroupMessage', async (data) => {
        console.log('Nhận được receiveGroupMessage:', JSON.stringify(data, null, 2));
        if (!data || !data.groupId || !data.messageId) return;

        let token = await AsyncStorage.getItem('token');
        let updatedContacts = { ...contacts };
        if (data.senderId && !contacts[data.senderId]) {
          const userInfo = await fetchUserInfo(data.senderId, token);
          updatedContacts[data.senderId] = userInfo;
          if (isMounted) setContacts(updatedContacts);
        }

        const newMessage = {
          content: data.content || '[Tin nhắn trống]',
          type: data.type || 'text',
          fileUrl: data.fileUrl || null,
          timestamp: data.timestamp || new Date().toISOString(),
          senderId: data.senderId,
          senderName: data.senderName || updatedContacts[data.senderId]?.username || 'Không rõ',
          isRecalled: data.isRecalled || false,
          messageId: data.messageId,
        };

        setPendingMessages((prev) => ({
          ...prev,
          [data.groupId]: newMessage,
        }));

        setGroups((prev) => {
          const existingGroup = prev.find((group) => group.groupId === data.groupId);
          if (!existingGroup) return prev;

          if (
            existingGroup.lastMessage?.messageId === data.messageId ||
            new Date(existingGroup.lastMessage?.timestamp) > new Date(newMessage.timestamp)
          )
            return prev;

          const updatedGroups = prev.map((group) =>
            group.groupId === data.groupId
              ? {
                  ...group,
                  lastMessage: newMessage,
                  unreadCount:
                    data.senderId !== currentUserId && currentScreen !== 'GroupChatScreen'
                      ? (group.unreadCount || 0) + 1
                      : group.unreadCount,
                }
              : group
          );

          if (data.senderId !== currentUserId && currentScreen !== 'GroupChatScreen') {
            setNewMessages((prev) => new Set(prev).add(data.groupId));
            const group = updatedGroups.find((g) => g.groupId === data.groupId);
            if (group) {
              const notificationContent =
                data.type === 'image'
                  ? '[Hình ảnh]'
                  : data.type === 'file'
                  ? '[Tệp]'
                  : data.content || '[Media]';
              showLocalNotification({
                title: `Tin nhắn từ ${group.name}`,
                body: `${newMessage.senderName}: ${notificationContent}`,
                data: { groupId: data.groupId },
              });
            }
          }

          return updatedGroups.sort(
            (a, b) =>
              new Date(b.lastMessage?.timestamp || b.createdAt || 0) -
              new Date(a.lastMessage?.timestamp || a.createdAt || 0)
          );
        });
      });

      socketRef.current.on(`newGroup_${currentUserId}`, async (data) => {
        console.log(`Nhận được newGroup_${currentUserId}:`, JSON.stringify(data, null, 2));
        if (!data || !data.groupId || !data.members || !Array.isArray(data.members)) return;

        let token = await AsyncStorage.getItem('token');
        let updatedContacts = { ...contacts };
        for (const member of data.members) {
          if (!contacts[member.userId]) {
            const userInfo = await fetchUserInfo(member.userId, token);
            updatedContacts[member.userId] = userInfo;
          }
        }
        if (isMounted) setContacts(updatedContacts);

        setGroups((prev) => {
          if (prev.some((group) => group.groupId === data.groupId)) return prev;

          const ownerName =
            updatedContacts[data.ownerId]?.username ||
            data.members.find((m) => m.userId === data.ownerId)?.username ||
            `User_${data.ownerId}`;

          const newGroup = {
            groupId: data.groupId,
            name: data.name || 'Nhóm không tên',
            avatarUrl: data.avatarUrl || DEFAULT_AVATAR,
            lastMessage: {
              content: `${ownerName} đã tạo nhóm`,
              type: 'system',
              timestamp: data.createdAt || new Date().toISOString(),
              senderId: data.ownerId,
              senderName: ownerName,
              isRecalled: false,
              messageId: `system_${data.groupId}_${Date.now()}`,
            },
            unreadCount: 0,
            members: data.members.map((member) => ({
              userId: member.userId,
              username: updatedContacts[member.userId]?.username || `User_${member.userId}`,
              role: member.role || 'member',
            })),
            ownerId: data.ownerId,
            createdAt: data.createdAt || new Date().toISOString(),
          };

          socketRef.current.emit('joinGroup', newGroup.groupId);
          console.log(`Đã tham gia nhóm mới: ${newGroup.groupId}`);
          return [newGroup, ...prev].sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
        });
      });

      socketRef.current.on(`groupDisbanded_${currentUserId}`, ({ groupId, groupName }) => {
        console.log(`Nhận được groupDisbanded_${currentUserId}:`, { groupId, groupName });
        setGroups((prev) => prev.filter((group) => group.groupId !== groupId));
        setNewMessages((prev) => {
          const updated = new Set(prev);
          updated.delete(groupId);
          return updated;
        });
        showLocalNotification({
          title: `Nhóm "${groupName}" đã giải tán`,
          body: `Nhóm "${groupName}" không còn tồn tại.`,
          data: { groupId },
        });
      });

      socketRef.current.on('messagesRead', ({ conversationId }) => {
        console.log('Nhận được messagesRead:', { conversationId });
        setConversations((prev) =>
          prev.map((conv) =>
            conv.conversationId === conversationId ? { ...conv, unread: 0 } : conv
          )
        );
        setNewMessages((prev) => {
          const updated = new Set(prev);
          updated.delete(conversationId);
          return updated;
        });
      });

      socketRef.current.on('groupMessagesRead', ({ groupId }) => {
        console.log('Nhận được groupMessagesRead:', { groupId });
        setGroups((prev) =>
          prev.map((group) =>
            group.groupId === groupId ? { ...group, unreadCount: 0 } : group
          )
        );
        setNewMessages((prev) => {
          const updated = new Set(prev);
          updated.delete(groupId);
          return updated;
        });
      });

      socketRef.current.on(`addedToGroup_${currentUserId}`, async ({ groupId, groupName, members, ownerId, createdAt }) => {
        console.log(`Nhận được addedToGroup_${currentUserId}:`, { groupId, groupName, members, ownerId, createdAt });
        try {
          let token = await AsyncStorage.getItem('token');
          if (!token) {
            token = await refreshToken();
            if (!token) return navigation.replace('Login');
          }

          let updatedContacts = { ...contacts };
          if (members && Array.isArray(members)) {
            for (const member of members) {
              if (!contacts[member.userId]) {
                const userInfo = await fetchUserInfo(member.userId, token);
                updatedContacts[member.userId] = userInfo;
              }
            }
          }
          if (isMounted) setContacts(updatedContacts);

          setGroups((prev) => {
            if (prev.some((group) => group.groupId === groupId)) return prev;

            const newGroup = {
              groupId,
              name: groupName || 'Nhóm không tên',
              avatarUrl: DEFAULT_AVATAR,
              lastMessage: {
                content: `Bạn đã được thêm vào nhóm`,
                type: 'system',
                timestamp: new Date().toISOString(),
                senderId: currentUserId,
                senderName: updatedContacts[currentUserId]?.username || 'Hệ thống',
                isRecalled: false,
                messageId: `system_${groupId}_${Date.now()}`,
              },
              unreadCount: 0,
              members: members && Array.isArray(members)
                ? members.map((member) => ({
                    userId: member.userId,
                    username: updatedContacts[member.userId]?.username || `User_${member.userId}`,
                    role: member.role || 'member',
                  }))
                : [],
              ownerId: ownerId || currentUserId,
              createdAt: createdAt || new Date().toISOString(),
            };

            socketRef.current.emit('joinGroup', newGroup.groupId);
            showLocalNotification({
              title: `Nhóm mới: ${groupName}`,
              body: `Bạn đã được thêm vào nhóm "${groupName}".`,
              data: { groupId },
            });

            return [newGroup, ...prev].sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );
          });
        } catch (err) {
          console.error('Lỗi khi xử lý addedToGroup:', err);
          Alert.alert('Lỗi', 'Không thể tải thông tin nhóm mới: ' + err.message);
        }
      });

      groups.forEach((group) => {
        if (!registeredGroups.current.has(group.groupId)) {
          socketRef.current.on(`groupMemberUpdated_${group.groupId}`, ({ groupId, type, userId, userEmail, group }) => {
            console.log(`Nhận được groupMemberUpdated_${group.groupId}:`, { groupId, type, userId, userEmail, group });
            setGroups((prev) =>
              prev.map((g) =>
                g.groupId === groupId
                  ? {
                      ...g,
                      members: group.members && Array.isArray(group.members)
                        ? group.members.map((member) => ({
                            userId: member.userId,
                            username: contacts[member.userId]?.username || member.username || `User_${member.userId}`,
                            role: member.role || 'member',
                          }))
                        : g.members,
                      lastMessage:
                        type === 'member_added'
                          ? {
                              content: `${userEmail} đã được thêm vào nhóm`,
                              type: 'system',
                              timestamp: new Date().toISOString(),
                              senderId: userId,
                              senderName: contacts[userId]?.username || 'Hệ thống',
                              isRecalled: false,
                              messageId: `system_${groupId}_${Date.now()}`,
                            }
                          : type === 'member_removed'
                          ? {
                              content: `${userEmail} đã rời nhóm`,
                              type: 'system',
                              timestamp: new Date().toISOString(),
                              senderId: userId,
                              senderName: contacts[userId]?.username || 'Hệ thống',
                              isRecalled: false,
                              messageId: `system_${groupId}_${Date.now()}`,
                            }
                          : g.lastMessage,
                    }
                  : g
              )
            );
          });
          registeredGroups.current.add(group.groupId);
        }
      });

      socketRef.current.on(`removedFromGroup_${currentUserId}`, ({ groupId, groupName }) => {
        console.log(`Nhận được removedFromGroup_${currentUserId}:`, { groupId, groupName });
        setGroups((prev) => prev.filter((group) => group.groupId !== groupId));
        setNewMessages((prev) => {
          const updated = new Set(prev);
          updated.delete(groupId);
          return updated;
        });
        registeredGroups.current.delete(groupId);
        showLocalNotification({
          title: `Rời nhóm "${groupName}"`,
          body: `Bạn đã bị xóa khỏi nhóm "${groupName}".`,
          data: { groupId },
        });
      });
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('receiveGroupMessage');
        socketRef.current.off(`newGroup_${currentUserId}`);
        socketRef.current.off(`groupDisbanded_${currentUserId}`);
        socketRef.current.off(`addedToGroup_${currentUserId}`);
        socketRef.current.off(`receiveMessage_${currentUserId}`);
        socketRef.current.off('messagesRead');
        socketRef.current.off('groupMessagesRead');
        socketRef.current.off(`removedFromGroup_${currentUserId}`);
        registeredGroups.current.forEach((groupId) => {
          socketRef.current.off(`groupMemberUpdated_${groupId}`);
        });
        registeredGroups.current.clear();
        socketRef.current.disconnect();
        console.log('Socket đã ngắt kết nối');
      }
    };
  }, [currentUserId, groups, navigation]);

  useEffect(() => {
    if (route.params?.reload) {
      setLoading(true);
      fetchData().then(() => {
        navigation.setParams({ reload: undefined });
      });
    }
  }, [route.params?.reload, navigation]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setCurrentScreen('ChatList');
      setConversations([]);
      setGroups([]);
      fetchData();
    });
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setCurrentScreen(null);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = setupNotificationListener((content) => {
      const { groupId, conversationId } = content.data || {};
      if (groupId) {
        const group = groups.find((g) => g.groupId === groupId);
        if (group) {
          navigation.navigate('GroupChatScreen', {
            groupId: group.groupId,
            groupName: group.name,
            currentUserId,
            members: group.members,
            ownerId: group.ownerId,
            friends: Object.values(contacts),
          });
          setGroups((prev) =>
            prev.map((g) => (g.groupId === groupId ? { ...g, unreadCount: 0 } : g))
          );
          socketRef.current?.emit('readGroupMessage', { groupId, userId: currentUserId });
          setNewMessages((prev) => {
            const updated = new Set(prev);
            updated.delete(groupId);
            return updated;
          });
        }
      } else if (conversationId) {
        const conversation = conversations.find((c) => c.conversationId === conversationId);
        if (conversation) {
          navigation.navigate('ChatScreen', {
            receiverId: conversation.userId,
            receiverName: conversation.username,
            currentUserId,
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.conversationId === conversationId ? { ...c, unread: 0 } : c
            )
          );
          setNewMessages((prev) => {
            const updated = new Set(prev);
            updated.delete(conversationId);
            return updated;
          });
        }
      }
    });

    return unsubscribe;
  }, [groups, conversations, currentUserId, navigation]);

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendFriendRequest = async (email) => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await refreshToken();
        if (!token) return navigation.replace('Login');
      }

      const response = await fetch(`${API_URL}/api/friend/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await checkResponse(response, '/api/friend/request');
      setSearchResults((prev) =>
        prev.map((user) =>
          user.email === email ? { ...user, friendRequestSent: true } : user
        )
      );
      Alert.alert('Thành công', 'Yêu cầu kết bạn đã được gửi');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu kết bạn');
      console.error('Lỗi khi gửi yêu cầu kết bạn:', err);
    }
  };

  const checkSentRequests = async (email, token) => {
    try {
      const response = await fetch(`${API_URL}/api/friend/requests/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await checkResponse(response, '/api/friend/requests/sent');
      return data.requests.some((req) => req.toEmail === email && req.status === 'pending');
    } catch (err) {
      console.error('Lỗi khi kiểm tra yêu cầu đã gửi:', err);
      return false;
    }
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    setError('');
    setSearchLoading(true);
    setSearchResults([]);

    if (text.length > 2) {
      if (!isValidEmail(text)) {
        setError('Vui lòng nhập email hợp lệ');
        setSearchLoading(false);
        return;
      }

      try {
        let token = await AsyncStorage.getItem('token');
        if (!token) {
          token = await refreshToken();
          if (!token) return navigation.replace('Login');
        }

        const response = await fetch(`${API_URL}/api/user/search/${encodeURIComponent(text)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
          setError('Không tìm thấy người dùng với email này');
          setSearchLoading(false);
          return;
        }

        const data = await checkResponse(response, '/api/user/search');
        const user = data.userId ? { userId: data.userId } : null;
        if (user && user.userId !== currentUserId) {
          const profileResponse = await fetch(`${API_URL}/api/user/getUserById/${user.userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const profileData = await checkResponse(profileResponse, '/api/user/getUserById');

          const isFriend = friends.some((friend) => friend.email === profileData.email);
          const friendRequestSent = isFriend ? false : await checkSentRequests(profileData.email, token);

          setSearchResults([
            {
              userId: profileData.userId,
              username: profileData.username || text,
              email: profileData.email || text,
              avatarUrl: profileData.avatarUrl || DEFAULT_AVATAR,
              friendRequestSent,
              isFriend,
            },
          ]);
        } else {
          setError('Không tìm thấy người dùng hoặc không thể gửi yêu cầu đến chính bạn');
        }
      } catch (err) {
        setError(
          err.message.includes('404') ? 'Không tìm thấy người dùng với email này' : `Tìm kiếm thất bại: ${err.message}`
        );
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResults([]);
      setError('');
      setSearchLoading(false);
    }
  };

  const debouncedSearch = debounce(handleSearch, 500);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error('Lỗi khi định dạng thời gian:', err);
      return 'N/A';
    }
  };

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
            placeholder="Tìm kiếm theo email"
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
        <TouchableOpacity onPress={checkSessionAndNavigate}>
          <Icon name="group-add" size={24} color="#FFFFFF" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      {searchLoading && searchText.length > 2 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0068FF" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {filteredData.length === 0 && !searchLoading && !error && (
        <Text style={styles.noResultsText}>
          {searchText.length > 2 ? 'Không tìm thấy người dùng' : 'Chưa có cuộc trò chuyện hoặc nhóm nào'}
        </Text>
      )}

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.conversationId || item.groupId || item.userId}
        renderItem={({ item }) => {
          const isSearchResult = !!item.userId && !item.conversationId && !item.groupId;
          const isGroup = !!item.groupId;
          const contact = isSearchResult
            ? item
            : isGroup
            ? { username: item.name, email: item.name, avatarUrl: item.avatarUrl || DEFAULT_AVATAR }
            : contacts[item.userId] || {
                username: item.username || 'Không rõ',
                email: 'Không rõ',
                avatarUrl: DEFAULT_AVATAR,
              };
          const isNewMessage = !isSearchResult && newMessages.has(item.conversationId || item.groupId);
          const hasUnread = !isSearchResult && (item.unread > 0 || item.unreadCount > 0);

          const enrichedMembers = isGroup
            ? item.members.map((member) => {
                const contactInfo =
                  contacts[member.userId] || friends.find((f) => f.userId === member.userId);
                return {
                  ...member,
                  username: contactInfo?.username || member.username || 'Không rõ',
                };
              })
            : item.members;

          return (
            <View style={styles.chatItem}>
              <TouchableOpacity
                style={styles.chatContent}
                onPress={async () => {
                  if (isSearchResult) {
                    if (item.isFriend) {
                      navigation.navigate('ChatScreen', {
                        receiverId: item.userId,
                        receiverName: item.username || item.email || 'Không rõ',
                        currentUserId,
                      });
                    }
                    return;
                  }

                  setNewMessages((prev) => {
                    const updated = new Set(prev);
                    updated.delete(item.conversationId || item.groupId);
                    return updated;
                  });

                  if (isGroup) {
                    navigation.navigate('GroupChatScreen', {
                      groupId: item.groupId,
                      groupName: item.name,
                      currentUserId,
                      members: enrichedMembers,
                      ownerId: item.ownerId,
                      friends: Object.values(contacts),
                    });
                    setGroups((prev) =>
                      prev.map((group) =>
                        group.groupId === item.groupId ? { ...group, unreadCount: 0 } : group
                      )
                    );
                    socketRef.current?.emit('readGroupMessage', { groupId: item.groupId, userId: currentUserId });
                  } else {
                    navigation.navigate('ChatScreen', {
                      receiverId: item.userId,
                      receiverName: contact.username || 'Không rõ',
                      currentUserId,
                    });
                    setConversations((prev) =>
                      prev.map((conv) =>
                        conv.conversationId === item.conversationId ? { ...conv, unread: 0 } : conv
                      )
                    );
                  }
                }}
              >
                <Image
                  source={{ uri: contact.avatarUrl }}
                  style={styles.avatar}
                  defaultSource={{ uri: DEFAULT_AVATAR }}
                />
                <View style={styles.chatInfo}>
                  <View style={styles.chatNameContainer}>
                    <Text
                      style={[
                        styles.chatName,
                        isNewMessage && styles.boldChatName,
                      ]}
                    >
                      {contact.username}
                    </Text>
                    {isGroup && (
                      <Icon name="group" size={18} color="#40C4FF" style={styles.groupIcon} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.chatMessage,
                      hasUnread && styles.boldMessage,
                      isGroup && item.lastMessage?.type === 'system' && styles.systemMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {isSearchResult
                      ? contact.email
                      : item.lastMessage
                      ? item.lastMessage.isRecalled
                        ? '[Tin nhắn đã thu hồi]'
                        : item.lastMessage.type === 'image'
                        ? '[Hình ảnh]'
                        : item.lastMessage.type === 'file'
                        ? '[Tệp]'
                        : item.lastMessage.type === 'system'
                        ? item.lastMessage.content
                        : isGroup
                        ? `${item.lastMessage.senderName || contacts[item.lastMessage.senderId]?.username || 'Không rõ'}: ${item.lastMessage.content}`
                        : item.lastMessage.content
                      : '[Chưa có tin nhắn]'}
                  </Text>
                </View>
                {!isSearchResult && (
                  <View style={styles.chatMeta}>
                    <Text style={styles.chatTime}>
                      {isGroup
                        ? item.lastMessage?.timestamp
                          ? formatTimestamp(item.lastMessage.timestamp)
                          : formatTimestamp(item.createdAt)
                        : item.lastMessage?.timestamp
                        ? formatTimestamp(item.lastMessage.timestamp)
                        : formatTimestamp(item.time)}
                    </Text>
                    {hasUnread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {(item.unread || item.unreadCount) > 9 ? '9+' : (item.unread || item.unreadCount)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
              {isSearchResult && !item.isFriend && (
                <TouchableOpacity
                  style={[
                    styles.friendRequestButton,
                    item.friendRequestSent && styles.friendRequestSentButton,
                  ]}
                  onPress={() => handleSendFriendRequest(item.email)}
                  disabled={item.friendRequestSent}
                >
                  <Text
                    style={[
                      styles.friendRequestButtonText,
                      item.friendRequestSent && styles.friendRequestSentButtonText,
                    ]}
                  >
                    {item.friendRequestSent ? 'Đã gửi' : 'Thêm bạn'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />
      <View style={styles.footerContainer}>
        <Footer navigation={navigation} />
      </View>
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
  chatContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  chatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  boldChatName: {
    fontWeight: 'bold',
  },
  groupIcon: {
    marginLeft: 5,
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
  },
  boldMessage: {
    fontWeight: 'bold',
    color: '#000',
  },
  systemMessage: {
    fontStyle: 'italic',
    color: '#888',
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
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#d32f2f',
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
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  friendRequestButton: {
    backgroundColor: '#40C4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  friendRequestSentButton: {
    backgroundColor: '#E0E0E0',
  },
  friendRequestButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  friendRequestSentButtonText: {
    color: '#666',
  },
});

export default ChatList;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../config';
import io from 'socket.io-client';

const CreateGroupScreen = ({ route, navigation }) => {
  const friends = route.params?.friends || [];
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Khởi tạo Socket.IO
  useEffect(() => {
    let socketInstance = null;
    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigation.navigate('Login');
          return;
        }

        socketInstance = io(API_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 15,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 15000,
        });

        socketInstance.on('connect', () => {
          console.log('Socket connected for CreateGroupScreen');
          setIsSocketConnected(true);
        });

        socketInstance.on('groupCreated', (data) => {
          setLoading(false);
          Alert.alert('Thành công', data.message || 'Nhóm đã được tạo thành công');
          navigation.navigate('ChatList');
        });

        socketInstance.on('error', (data) => {
          setLoading(false);
          Alert.alert('Lỗi', data.message || 'Không thể tạo nhóm');
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Socket connect_error:', err.message);
          setIsSocketConnected(false);
          setLoading(false);
          Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setIsSocketConnected(false);
        });

        setSocket(socketInstance);
      } catch (err) {
        console.error('Socket initialization error:', err);
        Alert.alert('Lỗi', 'Không thể khởi tạo kết nối: ' + err.message);
      }
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        console.log('Socket disconnected from CreateGroupScreen');
      }
    };
  }, [navigation]);

  const toggleFriendSelection = (userId) => {
    setSelectedFriends((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    console.log('handleCreateGroup called', { groupName, selectedFriends, loading, isSocketConnected });

    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một người bạn');
      return;
    }
    if (!socket || !isSocketConnected) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng thử lại sau.');
      return;
    }

    setLoading(true);
    try {
      socket.emit('createGroup', {
        name: groupName.trim(),
        memberIds: selectedFriends,
        avatarUrl: null, // Có thể thêm logic chọn ảnh đại diện sau
      });
    } catch (err) {
      setLoading(false);
      console.error('Error sending createGroup event:', err);
      Alert.alert('Lỗi', 'Không thể tạo nhóm: ' + err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo nhóm mới</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Nhập tên nhóm"
          value={groupName}
          onChangeText={setGroupName}
          autoCapitalize="none"
          editable={!loading}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Chọn bạn bè ({selectedFriends.length}/{friends.length})
          </Text>
        </View>

        {friends.length > 0 ? (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.friendItem}
                onPress={() => toggleFriendSelection(item.userId)}
                disabled={loading}
              >
                <View style={styles.friendInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.username || item.email)?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.friendName}>{item.username || item.email || 'Unknown'}</Text>
                    <Text style={styles.friendEmail}>{item.email || 'No email'}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    selectedFriends.includes(item.userId) && styles.checkboxSelected,
                  ]}
                >
                  {selectedFriends.includes(item.userId) && (
                    <Icon name="check" size={16} color="#FFF" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            style={styles.friendList}
          />
        ) : (
          <View style={styles.noFriendsContainer}>
            <Text style={styles.noFriends}>Không có bạn bè để tạo nhóm</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            (!groupName.trim() || selectedFriends.length === 0 || loading || !isSocketConnected) &&
              styles.disabledButton,
          ]}
          onPress={() => {
            console.log('Create group button pressed');
            handleCreateGroup();
          }}
          disabled={!groupName.trim() || selectedFriends.length === 0 || loading || !isSocketConnected}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>Tạo nhóm</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#40C4FF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  groupNameInput: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#40C4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#40C4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#40C4FF',
    borderColor: '#40C4FF',
  },
  noFriendsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFriends: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#40C4FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateGroupScreen;
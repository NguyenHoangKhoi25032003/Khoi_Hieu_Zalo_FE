import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../config';
import Footer from './Footer';

const DEFAULT_AVATAR = 'https://via.placeholder.com/50';

const FriendScreen = ({ navigation }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

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
          setCurrentUserEmail(profileData.email);
          setCurrentUserId(profileData.userId);
        } else {
          throw new Error(profileData.message || 'Không thể lấy thông tin người dùng');
        }

        const friendsResponse = await fetch(`${API_URL}/api/friends/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const friendsData = await friendsResponse.json();
        if (friendsResponse.status === 200) {
          setFriends(friendsData.friends || []);
        } else {
          throw new Error(friendsData.message || 'Không thể tải danh sách bạn bè');
        }

        const requestsResponse = await fetch(
          `${API_URL}/api/friends/requests?email=${encodeURIComponent(profileData.email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const requestsData = await requestsResponse.json();
        if (requestsResponse.status === 200) {
          setFriendRequests(requestsData || []);
        } else {
          throw new Error(requestsData.message || 'Không thể tải danh sách lời mời');
        }
      } catch (err) {
        setError(err.message);
        console.error('Fetch data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigation]);

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setFriendRequests((prev) => prev.filter((req) => req.requestId !== requestId));
        const friendsResponse = await fetch(`${API_URL}/api/friends/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const friendsData = await friendsResponse.json();
        if (friendsResponse.status === 200) {
          setFriends(friendsData.friends || []);
        }
        setError('');
      } else {
        setError(data.message || 'Không thể chấp nhận lời mời');
      }
    } catch (err) {
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setFriendRequests((prev) => prev.filter((req) => req.requestId !== requestId));
        setError('');
      } else {
        setError(data.message || 'Không thể từ chối lời mời');
      }
    } catch (err) {
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  const handleRemoveFriend = async (friendEmail) => {
    Alert.alert(
      'Xóa bạn',
      `Bạn có chắc muốn xóa ${friendEmail} khỏi danh sách bạn bè?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                navigation.navigate('Login');
                return;
              }

              const response = await fetch(`${API_URL}/api/friends/remove`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: friendEmail }), // Đảm bảo key là 'email'
              });

              const data = await response.json();
              if (response.status === 200) {
                setFriends((prev) => prev.filter((friend) => friend.email !== friendEmail));
                setError('');
                Alert.alert('Thành công', 'Đã xóa bạn bè.');
              } else {
                setError(data.message || 'Không thể xóa bạn bè');
              }
            } catch (err) {
              setError('Không thể kết nối đến server: ' + err.message);
              console.error('Remove friend client error:', err);
            }
          },
        },
      ]
    );
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý bạn bè</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lời mời kết bạn ({friendRequests.length})</Text>
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.requestId}
          renderItem={({ item }) => (
            <View style={styles.requestItem}>
              <Text style={styles.requestEmail}>{item.fromEmail}</Text>
              
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  activeOpacity={0.7}
                  onPress={() => handleAcceptRequest(item.requestId)}
                >
                  <Icon name="check" size={24} color="#0068FF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIcon}
                  activeOpacity={0.7}
                  onPress={() => handleDeclineRequest(item.requestId)}
                >
                  <Icon name="close" size={24} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noDataText}>Không có lời mời kết bạn</Text>}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh sách bạn bè ({friends.length})</Text>
        <FlatList
          data={friends}
          keyExtractor={(item) => item.email}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.friendItem}
              activeOpacity={0.7}
              onPress={() => {
                console.log('Navigating to ChatScreen with:', {
                  receiverId: item.userId,
                  receiverName: item.username || item.email,
                  currentUserId: currentUserId,
                });
                navigation.navigate('ChatScreen', {
                  receiverId: item.userId,
                  receiverName: item.username || item.email,
                  currentUserId: currentUserId,
                });
              }}
            >
              <Image
                source={{ uri: item.avatarUrl || DEFAULT_AVATAR }}
                style={styles.avatar}
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.username || item.email}</Text>
                <Text style={styles.friendEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFriend(item.email)}
              >
                <Icon name="delete" size={20} color="#d32f2f" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.noDataText}>Chưa có bạn bè</Text>}
        />
      </View>

      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F6F5',
    },
    header: {
      backgroundColor: '#40C4FF',
      paddingVertical: 15,
      paddingHorizontal: 15,
      paddingTop: 40,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    errorText: {
      color: '#d32f2f',
      textAlign: 'center',
      margin: 10,
      fontSize: 14,
    },
    section: {
      flex: 1,
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 10,
    },
    requestItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    requestInfo: {
      flex: 1,
      marginRight: 10,
    },
    requestEmail: {
      fontSize: 13,
      color: '#666',
      marginTop: 2,
    },
    requestActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionIcon: {
      padding: 8,
      marginLeft: 8,
    },
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    friendInfo: {
      flex: 1,
      marginLeft: 12,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    friendEmail: {
      fontSize: 13,
      color: '#666',
      marginTop: 2,
    },
    removeButton: {
      padding: 8,
    },
    noDataText: {
      textAlign: 'center',
      color: '#666',
      fontSize: 14,
      marginTop: 20,
    },
  });

export default FriendScreen;
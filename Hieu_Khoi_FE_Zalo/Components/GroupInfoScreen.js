



import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import io from 'socket.io-client';
import { API_URL } from '../config';

const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId, groupName, members, ownerId, currentUserId, friends } = route.params || {};

  // State để quản lý danh sách thành viên
  const [groupMembers, setGroupMembers] = useState(members || []);

  // Kiểm tra vai trò của người dùng hiện tại
  const currentUserRole = groupMembers.find(member => member.userId === currentUserId)?.role || 'member';

  // Khởi tạo Socket.IO
  useEffect(() => {
    const fetchTokenAndInitSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      const socket = io(API_URL, {
        query: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      // Lắng nghe sự kiện cập nhật thành viên
      socket.on(`groupMemberUpdated_${groupId}`, ({ type, userId, group }) => {
        console.log('Received groupMemberUpdated:', { type, userId, group });
        if (type === 'member_removed' || type === 'role_updated') {
          setGroupMembers(group.members || []);
        }
      });

      // Lắng nghe sự kiện nhóm bị giải tán
      socket.on(`groupDisbanded_${currentUserId}`, ({ groupId: disbandedGroupId, groupName }) => {
        console.log('Received groupDisbanded:', { disbandedGroupId, groupName });
        if (disbandedGroupId === groupId) {
          Alert.alert('Thông báo', `Nhóm "${groupName}" đã bị giải tán.`);
          navigation.goBack();
        }
      });

      // Lắng nghe sự kiện bị xóa khỏi nhóm (bao gồm tự rời)
      socket.on(`removedFromGroup_${currentUserId}`, ({ groupId: removedGroupId, groupName }) => {
        console.log('Received removedFromGroup:', { removedGroupId, groupName });
        if (removedGroupId === groupId) {
          Alert.alert('Thông báo', `Bạn đã rời khỏi nhóm "${groupName}".`);
          navigation.goBack();
        }
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connect_error:', err.message);
      });

      return () => {
        socket.disconnect();
        console.log('Socket disconnected');
      };
    };

    fetchTokenAndInitSocket();
  }, [groupId, currentUserId, navigation]);

  // Thông tin nhóm từ route.params
  const groupInfo = {
    name: groupName || 'Nhóm không tên',
    members: groupMembers,
  };

  // Xử lý giải tán nhóm
  const handleDeleteGroup = async () => {
    Alert.alert(
      'Giải tán nhóm',
      'Bạn có chắc chắn muốn giải tán nhóm này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Giải tán',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                navigation.navigate('Login');
                return;
              }

              const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();
              if (response.status === 200) {
                Alert.alert('Thành công', 'Nhóm đã được giải tán.');
                navigation.goBack();
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể giải tán nhóm.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
            }
          },
        },
      ]
    );
  };

  // Xử lý rời nhóm
  const handleLeaveGroup = async () => {
    Alert.alert(
      'Rời nhóm',
      'Bạn có chắc chắn muốn rời khỏi nhóm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                navigation.navigate('Login');
                return;
              }

              const response = await fetch(`${API_URL}/api/groups/${groupId}/members/${currentUserId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();
              if (response.status === 200) {
                Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm.');
                navigation.goBack();
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể rời nhóm.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
            }
          },
        },
      ]
    );
  };

  // Xử lý thêm thành viên
  const handleAddMember = () => {
    navigation.navigate('AddMemberScreen', {
      groupId,
      groupName,
      currentMembers: groupMembers,
      friends,
      currentUserId,
    });
  };

  // Xử lý xóa thành viên
  const handleRemoveMember = async (userIdToRemove, username) => {
    Alert.alert(
      'Xóa thành viên',
      `Bạn có chắc chắn muốn xóa ${username || 'thành viên này'} khỏi nhóm?`,
      [
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

              const response = await fetch(`${API_URL}/api/groups/${groupId}/members/${userIdToRemove}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();
              if (response.status === 200) {
                setGroupMembers(prev => prev.filter(member => member.userId !== userIdToRemove));
                Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm.');
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể xóa thành viên.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
            }
          },
        },
      ]
    );
  };

  // Xử lý gán quyền co-admin
  const handleAssignAdmin = async (userIdToAssign, username) => {
    Alert.alert(
      'Gán quyền quản trị',
      `Bạn có chắc chắn muốn gán ${username || 'thành viên này'} làm phó nhóm?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gán',
          style: 'default',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                navigation.navigate('Login');
                return;
              }

              const response = await fetch(`${API_URL}/api/groups/${groupId}/admins/${userIdToAssign}`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();
              if (response.status === 200) {
                setGroupMembers(prev =>
                  prev.map(member =>
                    member.userId === userIdToAssign ? { ...member, role: 'co-admin' } : member
                  )
                );
                Alert.alert('Thành công', 'Đã gán quyền quản trị.');
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể gán quyền quản trị.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
            }
          },
        },
      ]
    );
  };

  // Render item thành viên
  const renderMember = ({ item }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.username || item.userId)?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View>
          <Text style={styles.memberName}>
            {item.username || 'Unknown'} {item.userId === currentUserId ? '(Bạn)' : ''}
          </Text>
          <Text style={styles.memberRole}>
            {item.role === 'admin' ? 'Trưởng nhóm' : item.role === 'co-admin' ? 'Phó nhóm' : 'Thành viên'}
          </Text>
        </View>
      </View>
      <View style={styles.memberActions}>
        {/* Nút gán quyền */}
        {currentUserId === ownerId && 
         item.userId !== currentUserId && 
         item.role === 'member' && (
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => handleAssignAdmin(item.userId, item.username)}
          >
            <Icon name="star" size={20} color="#FFC107" />
          </TouchableOpacity>
        )}
        {/* Nút xóa thành viên */}
        {['admin', 'co-admin'].includes(currentUserRole) && 
         item.userId !== currentUserId && 
         item.userId !== ownerId && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.userId, item.username)}
          >
            <Icon name="delete" size={20} color="#FF5252" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin nhóm</Text>
        <View style={styles.headerActions}>
          {currentUserId === ownerId ? (
            <TouchableOpacity onPress={handleDeleteGroup} style={styles.headerIcon}>
              <Icon name="delete" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleLeaveGroup} style={styles.headerIcon}>
              <Icon name="logout" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Thông tin nhóm */}
      <View style={styles.groupInfoContainer}>
        <View style={styles.groupCard}>
          <Text style={styles.groupName}>{groupInfo.name}</Text>
        </View>

        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>Thành viên ({groupInfo.members.length})</Text>
          <TouchableOpacity onPress={handleAddMember} style={styles.addButton}>
            <Icon name="person-add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={groupInfo.members}
          keyExtractor={(item) => item.userId}
          renderItem={renderMember}
          style={styles.memberList}
          ListEmptyComponent={<Text style={styles.noMembersText}>Không có thành viên</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerIcon: {
    padding: 5,
  },
  groupInfoContainer: {
    flex: 1,
    padding: 20,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#40C4FF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  memberList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignButton: {
    padding: 5,
    marginRight: 5,
  },
  removeButton: {
    padding: 5,
  },
  noMembersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default GroupInfoScreen;

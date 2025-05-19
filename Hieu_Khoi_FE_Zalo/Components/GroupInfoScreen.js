
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   Alert,
//   Modal,
//   TextInput,
//   ActivityIndicator,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import io from 'socket.io-client';
// import { API_URL } from '../config';

// const GroupInfoScreen = ({ route, navigation }) => {
//   const { groupId, groupName, members = [], ownerId, currentUserId, friends = [] } = route.params || {};

//   // State
//   const [groupMembers, setGroupMembers] = useState(members);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [email, setEmail] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const currentUserRole = groupMembers.find((member) => member.userId === currentUserId)?.role || 'member';
//   const socketRef = useRef(null);

//   // Đảm bảo kết nối socket
//   const ensureSocketConnection = useCallback(async () => {
//     const token = await AsyncStorage.getItem('token');
//     if (!token) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//     if (!socketRef.current) throw new Error('Socket không được khởi tạo.');
//     if (!socketRef.current.connected) {
//       console.log('Socket not connected, attempting to reconnect...');
//       socketRef.current.connect();
//       let attempts = 0;
//       const maxAttempts = 3;
//       while (attempts < maxAttempts && !socketRef.current.connected) {
//         await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
//         attempts++;
//       }
//       if (!socketRef.current.connected) {
//         throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
//       }
//       console.log('Socket reconnected successfully');
//       socketRef.current.emit('joinGroup', groupId);
//     }
//   }, [groupId]);

//   // Lấy thông tin nhóm
//   const fetchGroupInfo = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         navigation.navigate('Login');
//         return;
//       }
//       const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await response.json();
//       console.log('Fetched group info:', data);
//       if (response.status === 200) {
//         setGroupMembers(data.members || []);
//       } else if (response.status === 401) {
//         Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//         await AsyncStorage.removeItem('token');
//         navigation.navigate('Login');
//       } else {
//         Alert.alert('Lỗi', data.message || 'Không thể tải thông tin nhóm.');
//       }
//     } catch (err) {
//       console.error('Error fetching group info:', err);
//       Alert.alert('Lỗi', 'Không thể kết nối đến server: ' + err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [groupId, navigation]);

//   // Thêm thành viên
//   const handleAddMember = useCallback(async () => {
//     if (!email) {
//       Alert.alert('Lỗi', 'Vui lòng nhập email.');
//       return;
//     }
//     setIsLoading(true);
//     try {
//       await ensureSocketConnection();
//       console.log('Emitting group:join:', { groupId, userEmail: email, addedBy: currentUserId });
//       socketRef.current.emit('group:join', { groupId, userEmail: email, addedBy: currentUserId });
//     } catch (err) {
//       console.error('Error adding member:', err);
//       Alert.alert('Lỗi', err.message || 'Không thể thêm thành viên.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [email, groupId, currentUserId, ensureSocketConnection]);

//   // Xóa thành viên
//   const handleRemoveMember = useCallback(
//     async (userIdToRemove, username) => {
//       Alert.alert(
//         'Xóa thành viên',
//         `Bạn có chắc chắn muốn xóa ${username || 'thành viên này'} khỏi nhóm?`,
//         [
//           { text: 'Hủy', style: 'cancel' },
//           {
//             text: 'Xóa',
//             style: 'destructive',
//             onPress: async () => {
//               try {
//                 await ensureSocketConnection();
//                 console.log('Emitting removeMember:', { groupId, userId: currentUserId, memberIdToRemove: userIdToRemove });
//                 socketRef.current.emit('removeMember', {
//                   groupId,
//                   userId: currentUserId,
//                   memberIdToRemove: userIdToRemove,
//                 });
//               } catch (err) {
//                 console.error('Error removing member:', err);
//                 Alert.alert('Lỗi', err.message);
//               }
//             },
//           },
//         ]
//       );
//     },
//     [groupId, currentUserId, ensureSocketConnection]
//   );

//   // Gán phó nhóm
//   const handleAssignCoAdmin = useCallback(
//     async (userIdToAssign, username) => {
//       Alert.alert(
//         'Gán phó nhóm',
//         `Bạn có chắc chắn muốn gán ${username || 'thành viên này'} làm phó nhóm?`,
//         [
//           { text: 'Hủy', style: 'cancel' },
//           {
//             text: 'Gán',
//             onPress: async () => {
//               try {
//                 await ensureSocketConnection();
//                 console.log('Emitting assignCoAdmin:', { groupId, userId: currentUserId, newAdminId: userIdToAssign });
//                 socketRef.current.emit('assignCoAdmin', {
//                   groupId,
//                   userId: currentUserId,
//                   newAdminId: userIdToAssign,
//                 });
//               } catch (err) {
//                 console.error('Error assigning co-admin:', err);
//                 Alert.alert('Lỗi', err.message);
//               }
//             },
//           },
//         ]
//       );
//     },
//     [groupId, currentUserId, ensureSocketConnection]
//   );

//   // Rời nhóm
//   const handleLeaveGroup = useCallback(async () => {
//     Alert.alert(
//       'Rời nhóm',
//       currentUserId === ownerId
//         ? 'Bạn là trưởng nhóm. Nếu rời nhóm, quyền trưởng nhóm sẽ được chuyển cho phó nhóm hoặc một thành viên ngẫu nhiên. Bạn có muốn tiếp tục?'
//         : 'Bạn có chắc chắn muốn rời khỏi nhóm này?',
//       [
//         { text: 'Hủy', style: 'cancel' },
//         {
//           text: 'Rời',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await ensureSocketConnection();
//               console.log('Emitting group:leave:', { groupId, userId: currentUserId });
//               socketRef.current.emit('group:leave', { groupId, userId: currentUserId });
//             } catch (err) {
//               console.error('Error leaving group:', err);
//               Alert.alert('Lỗi', err.message);
//             }
//           },
//         },
//       ]
//     );
//   }, [groupId, currentUserId, ownerId, ensureSocketConnection]);

//   // Giải tán nhóm
//   const handleDisbandGroup = useCallback(async () => {
//     if (currentUserId !== ownerId) {
//       Alert.alert('Lỗi', 'Chỉ trưởng nhóm mới có quyền giải tán nhóm.');
//       return;
//     }
//     Alert.alert(
//       'Giải tán nhóm',
//       'Bạn có chắc chắn muốn giải tán nhóm này? Hành động này không thể hoàn tác.',
//       [
//         { text: 'Hủy', style: 'cancel' },
//         {
//           text: 'Giải tán',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await ensureSocketConnection();
//               console.log('Emitting group:disband:', { groupId, userId: currentUserId });
//               socketRef.current.emit('group:disband', { groupId, userId: currentUserId });
//             } catch (err) {
//               console.error('Error disbanding group:', err);
//               Alert.alert('Lỗi', err.message);
//             }
//           },
//         },
//       ]
//     );
//   }, [groupId, currentUserId, ownerId, ensureSocketConnection]);

//   // Khởi tạo socket và lắng nghe sự kiện
//   useEffect(() => {
//     let isMounted = true;

//     const initSocket = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         if (!token || !currentUserId) {
//           if (isMounted) {
//             Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//             navigation.navigate('Login');
//           }
//           return;
//         }

//         socketRef.current = io(API_URL, {
//           auth: { token },
//           transports: ['websocket'],
//           reconnection: true,
//           reconnectionAttempts: 5,
//           reconnectionDelay: 1000,
//         });

//         socketRef.current.on('connect', () => {
//           console.log('Socket connected:', socketRef.current.id);
//           socketRef.current.emit('joinGroup', groupId);
//           console.log(`Joined group_${groupId} with userId: ${currentUserId}`);
//         });

//         socketRef.current.on('connect_error', (err) => {
//           console.error('Socket connect_error:', err.message);
//           if (isMounted) {
//             Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server: ' + err.message);
//           }
//         });

//         socketRef.current.onAny((event, ...args) => {
//           console.log(`Received socket event: ${event}`, args);
//         });

//         socketRef.current.on(`groupMemberUpdated_${groupId}`, ({ type, userId, userEmail, group }) => {
//           console.log('Received groupMemberUpdated:', { type, userId, userEmail, group });
//           if (isMounted && ['member_added', 'member_removed', 'role_updated', 'owner_changed'].includes(type)) {
//             setGroupMembers(group.members || []);
//             if (type === 'member_added') {
//               Alert.alert('Thông báo', `Thành viên mới "${userEmail}" đã được thêm vào nhóm.`);
//             } else if (type === 'member_removed') {
//               Alert.alert('Thông báo', `Thành viên "${userEmail}" đã rời nhóm.`);
//             } else if (type === 'role_updated') {
//               Alert.alert('Thông báo', `"${userEmail}" đã được cập nhật vai trò.`);
//             } else if (type === 'owner_changed') {
//               Alert.alert('Thông báo', `Trưởng nhóm mới là "${userEmail}".`);
//             }
//           }
//         });

//         socketRef.current.on('group:joinSuccess', ({ message }) => {
//           console.log('Received group:joinSuccess:', { message });
//           if (isMounted) {
//             Alert.alert('Thành công', message);
//             setEmail('');
//             setModalVisible(false);
//             fetchGroupInfo();
//           }
//         });

//         socketRef.current.on('group:leaveSuccess', ({ message, groupId: leftGroupId }) => {
//           console.log('Received group:leaveSuccess:', { message, leftGroupId });
//           if (isMounted && leftGroupId === groupId) {
//             Alert.alert('Thành công', message);
//             setGroupMembers([]);
//             navigation.navigate('ChatList', { reload: true });
//           }
//         });

//         socketRef.current.on(`removedFromGroup_${currentUserId}`, ({ groupId: removedGroupId, groupName }) => {
//           console.log('Received removedFromGroup:', { removedGroupId, groupName });
//           if (isMounted && removedGroupId === groupId) {
//             Alert.alert('Thông báo', `Bạn đã rời khỏi nhóm "${groupName}".`);
//             setGroupMembers([]);
//             navigation.navigate('ChatList', { reload: true });
//           }
//         });

//         socketRef.current.on(`addedToGroup_${currentUserId}`, ({ groupId: addedGroupId, groupName }) => {
//           console.log('Received addedToGroup:', { addedGroupId, groupName });
//           if (isMounted && addedGroupId === groupId) {
//             Alert.alert('Thông báo', `Bạn đã được thêm vào nhóm "${groupName}".`);
//             fetchGroupInfo();
//           }
//         });

//         socketRef.current.on(`groupOwnerChanged_${currentUserId}`, ({ groupId: changedGroupId, groupName }) => {
//           console.log('Received groupOwnerChanged:', { changedGroupId, groupName });
//           if (isMounted && changedGroupId === groupId) {
//             Alert.alert('Thông báo', `Bạn đã được chỉ định làm trưởng nhóm của "${groupName}".`);
//             fetchGroupInfo();
//           }
//         });

//         socketRef.current.on(`groupDisbanded_${currentUserId}`, ({ groupId: disbandedGroupId, groupName }) => {
//           console.log('Received groupDisbanded:', { disbandedGroupId, groupName });
//           if (isMounted && disbandedGroupId === groupId) {
//             Alert.alert('Thông báo', `Nhóm "${groupName}" đã bị giải tán.`);
//             setGroupMembers([]);
//             navigation.navigate('ChatList', { reload: true });
//           }
//         });

//         socketRef.current.on('coAdminAssigned', ({ message, userId }) => {
//           console.log('Received coAdminAssigned:', { message, userId });
//           if (isMounted) {
//             Alert.alert('Thành công', message);
//             fetchGroupInfo();
//           }
//         });

//         socketRef.current.on('memberRemoved', ({ message, userId }) => {
//           console.log('Received memberRemoved:', { message, userId });
//           if (isMounted) {
//             Alert.alert('Thành công', message);
//             fetchGroupInfo();
//           }
//         });

//         socketRef.current.on('error', (error) => {
//           console.error('Socket error:', error);
//           if (isMounted) {
//             if (error.status === 401) {
//               Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
//               AsyncStorage.removeItem('token');
//               navigation.navigate('Login');
//             } else {
//               Alert.alert('Lỗi', error.message || 'Lỗi không xác định từ server.');
//             }
//           }
//         });

//         fetchGroupInfo();
//       } catch (error) {
//         console.error('Error initializing socket:', error);
//         if (isMounted) {
//           Alert.alert('Lỗi', 'Lỗi khởi tạo: ' + error.message);
//         }
//       }
//     };

//     initSocket();

//     return () => {
//       isMounted = false;
//       if (socketRef.current) {
//         socketRef.current.emit('leaveGroup', groupId);
//         socketRef.current.offAny();
//         socketRef.current.off(`groupMemberUpdated_${groupId}`);
//         socketRef.current.off('group:joinSuccess');
//         socketRef.current.off('group:leaveSuccess');
//         socketRef.current.off(`removedFromGroup_${currentUserId}`);
//         socketRef.current.off(`addedToGroup_${currentUserId}`);
//         socketRef.current.off(`groupOwnerChanged_${currentUserId}`);
//         socketRef.current.off(`groupDisbanded_${currentUserId}`);
//         socketRef.current.off('coAdminAssigned');
//         socketRef.current.off('memberRemoved');
//         socketRef.current.off('error');
//         socketRef.current.disconnect();
//         console.log('Socket disconnected and listeners removed');
//       }
//     };
//   }, [groupId, currentUserId, navigation, fetchGroupInfo]);

//   // Chọn bạn từ danh sách
//   const handleSelectFriend = useCallback((friendEmail) => {
//     setEmail(friendEmail);
//   }, []);

//   // Render thành viên
//   const renderMember = useCallback(
//     ({ item }) => (
//       <View style={styles.memberItem}>
//         <View style={styles.memberInfo}>
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>
//               {(item.username || item.email || item.userId)?.charAt(0)?.toUpperCase() || '?'}
//             </Text>
//           </View>
//           <View>
//             <Text style={styles.memberName}>
//               {item.username || item.email || 'Unknown'} {item.userId === currentUserId ? '(Bạn)' : ''}
//             </Text>
//             <Text style={styles.memberRole}>
//               {item.role === 'admin' ? 'Trưởng nhóm' : item.role === 'co-admin' ? 'Phó nhóm' : 'Thành viên'}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.memberActions}>
//           {currentUserId === ownerId && item.userId !== currentUserId && item.role === 'member' && (
//             <TouchableOpacity
//               style={styles.assignButton}
//               onPress={() => handleAssignCoAdmin(item.userId, item.username)}
//             >
//               <Icon name="star" size={20} color="#FFC107" />
//             </TouchableOpacity>
//           )}
//           {['admin', 'co-admin'].includes(currentUserRole) && item.userId !== currentUserId && item.userId !== ownerId && (
//             <TouchableOpacity
//               style={styles.removeButton}
//               onPress={() => handleRemoveMember(item.userId, item.username)}
//             >
//               <Icon name="delete" size={20} color="#FF5252" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     ),
//     [currentUserId, ownerId, currentUserRole, handleAssignCoAdmin, handleRemoveMember]
//   );

//   // Render bạn bè
//   const renderFriend = useCallback(
//     ({ item }) => (
//       <TouchableOpacity style={styles.friendItem} onPress={() => handleSelectFriend(item.email)}>
//         <View style={styles.friendInfo}>
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>
//               {(item.username || item.email)?.charAt(0)?.toUpperCase() || '?'}
//             </Text>
//           </View>
//           <View>
//             <Text style={styles.friendName}>{item.username || item.email || 'Unknown'}</Text>
//             <Text style={styles.friendEmail}>{item.email}</Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     ),
//     [handleSelectFriend]
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Thông tin nhóm</Text>
//         <View style={styles.headerActions}>
//           {currentUserId === ownerId ? (
//             <>
//               <TouchableOpacity onPress={handleDisbandGroup} style={styles.headerIcon}>
//                 <Icon name="delete" size={24} color="#FFFFFF" />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={handleLeaveGroup} style={styles.headerIcon}>
//                 <Icon name="logout" size={24} color="#FFFFFF" />
//               </TouchableOpacity>
//             </>
//           ) : (
//             <TouchableOpacity onPress={handleLeaveGroup} style={styles.headerIcon}>
//               <Icon name="logout" size={24} color="#FFFFFF" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Nội dung nhóm */}
//       <View style={styles.groupInfoContainer}>
//         <View style={styles.groupCard}>
//           <Text style={styles.groupName}>{groupName || 'Nhóm không tên'}</Text>
//         </View>

//         <View style={styles.membersHeader}>
//           <Text style={styles.membersTitle}>Thành viên ({groupMembers.length})</Text>
//           {['admin', 'co-admin'].includes(currentUserRole) && (
//             <TouchableOpacity
//               onPress={() => setModalVisible(true)}
//               style={styles.addButton}
//             >
//               <Icon name="person-add" size={20} color="#FFFFFF" />
//             </TouchableOpacity>
//           )}
//         </View>

//         {isLoading ? (
//           <ActivityIndicator size="large" color="#40C4FF" style={styles.loading} />
//         ) : (
//           <FlatList
//             data={groupMembers}
//             keyExtractor={(item) => item.userId}
//             renderItem={renderMember}
//             style={styles.memberList}
//             ListEmptyComponent={<Text style={styles.noMembersText}>Không có thành viên</Text>}
//           />
//         )}
//       </View>

//       {/* Modal thêm thành viên */}
//       <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Thêm thành viên</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Nhập email"
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />
//             <Text style={styles.friendsTitle}>Danh sách bạn bè</Text>
//             <FlatList
//               data={friends}
//               keyExtractor={(item) => item.userId || item.email}
//               renderItem={renderFriend}
//               style={styles.friendList}
//               ListEmptyComponent={<Text style={styles.noFriendsText}>Không có bạn bè</Text>}
//             />
//             {isLoading && <ActivityIndicator size="small" color="#40C4FF" style={styles.modalLoading} />}
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setModalVisible(false)}
//                 disabled={isLoading}
//               >
//                 <Text style={styles.modalButtonText}>Hủy</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.submitButton]}
//                 onPress={handleAddMember}
//                 disabled={isLoading}
//               >
//                 <Text style={styles.modalButtonText}>Thêm</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

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
//   headerTitle: {
//     flex: 1,
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   headerActions: {
//     flexDirection: 'row',
//   },
//   headerIcon: {
//     padding: 5,
//   },
//   groupInfoContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   groupCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   groupName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#333',
//     textAlign: 'center',
//   },
//   membersHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   membersTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   addButton: {
//     backgroundColor: '#40C4FF',
//     borderRadius: 20,
//     padding: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   memberList: {
//     flex: 1,
//   },
//   memberItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   memberInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#40C4FF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   avatarText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   memberName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   memberRole: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 2,
//   },
//   memberActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   assignButton: {
//     padding: 5,
//     marginRight: 5,
//   },
//   removeButton: {
//     padding: 5,
//   },
//   noMembersText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 20,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 20,
//     width: '80%',
//     maxHeight: '80%',
//     alignItems: 'center',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 15,
//   },
//   input: {
//     width: '100%',
//     borderWidth: 1,
//     borderColor: '#DDD',
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 15,
//   },
//   friendsTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     alignSelf: 'flex-start',
//     marginBottom: 10,
//   },
//   friendList: {
//     width: '100%',
//     maxHeight: 200,
//     marginBottom: 15,
//   },
//   friendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F9F9F9',
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 8,
//   },
//   friendInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   friendName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   friendEmail: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 2,
//   },
//   noFriendsText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//   },
//   modalButton: {
//     flex: 1,
//     padding: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginHorizontal: 5,
//   },
//   cancelButton: {
//     backgroundColor: '#FF5252',
//   },
//   submitButton: {
//     backgroundColor: '#40C4FF',
//   },
//   modalButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loading: {
//     marginVertical: 20,
//   },
//   modalLoading: {
//     marginVertical: 10,
//   },
// });

// export default GroupInfoScreen;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import io from 'socket.io-client';
import { API_URL } from '../config';

const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId, groupName, members = [], ownerId, currentUserId, friends = [] } = route.params || {};

  // State
  const [groupMembers, setGroupMembers] = useState(members); // Khởi tạo với members từ route.params
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentUserRole = groupMembers.find((member) => member.userId === currentUserId)?.role || 'member';
  const socketRef = useRef(null);

  // Đảm bảo kết nối socket
  const ensureSocketConnection = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    if (!socketRef.current) throw new Error('Socket không được khởi tạo.');
    if (!socketRef.current.connected) {
      console.log('Socket không kết nối, đang thử kết nối lại...');
      socketRef.current.connect();
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts && !socketRef.current.connected) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        attempts++;
      }
      if (!socketRef.current.connected) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      }
      console.log('Socket đã kết nối lại thành công');
      socketRef.current.emit('joinGroup', groupId);
    }
  }, [groupId]);

  // Thêm thành viên
  const handleAddMember = useCallback(async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email.');
      return;
    }
    setIsLoading(true);
    try {
      await ensureSocketConnection();
      console.log('Gửi sự kiện group:join:', { groupId, userEmail: email, addedBy: currentUserId });
      socketRef.current.emit('group:join', { groupId, userEmail: email, addedBy: currentUserId });
    } catch (err) {
      console.error('Lỗi thêm thành viên:', err);
      Alert.alert('Lỗi', err.message || 'Không thể thêm thành viên.');
    } finally {
      setIsLoading(false);
    }
  }, [email, groupId, currentUserId, ensureSocketConnection]);

  // Xóa thành viên
  const handleRemoveMember = useCallback(
    async (userIdToRemove, username) => {
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
                await ensureSocketConnection();
                console.log('Gửi sự kiện removeMember:', { groupId, userId: currentUserId, memberIdToRemove: userIdToRemove });
                socketRef.current.emit('removeMember', {
                  groupId,
                  userId: currentUserId,
                  memberIdToRemove: userIdToRemove,
                });
              } catch (err) {
                console.error('Lỗi xóa thành viên:', err);
                Alert.alert('Lỗi', err.message);
              }
            },
          },
        ]
      );
    },
    [groupId, currentUserId, ensureSocketConnection]
  );

  // Gán phó nhóm
  const handleAssignCoAdmin = useCallback(
    async (userIdToAssign, username) => {
      Alert.alert(
        'Gán phó nhóm',
        `Bạn có chắc chắn muốn gán ${username || 'thành viên này'} làm phó nhóm?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Gán',
            onPress: async () => {
              try {
                await ensureSocketConnection();
                console.log('Gửi sự kiện assignCoAdmin:', { groupId, userId: currentUserId, newAdminId: userIdToAssign });
                socketRef.current.emit('assignCoAdmin', {
                  groupId,
                  userId: currentUserId,
                  newAdminId: userIdToAssign,
                });
              } catch (err) {
                console.error('Lỗi gán phó nhóm:', err);
                Alert.alert('Lỗi', err.message);
              }
            },
          },
        ]
      );
    },
    [groupId, currentUserId, ensureSocketConnection]
  );

  // Rời nhóm
  const handleLeaveGroup = useCallback(async () => {
    Alert.alert(
      'Rời nhóm',
      currentUserId === ownerId
        ? 'Bạn là trưởng nhóm. Nếu rời nhóm, quyền trưởng nhóm sẽ được chuyển cho phó nhóm hoặc một thành viên ngẫu nhiên. Bạn có muốn tiếp tục?'
        : 'Bạn có chắc chắn muốn rời khỏi nhóm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời',
          style: 'destructive',
          onPress: async () => {
            try {
              await ensureSocketConnection();
              console.log('Gửi sự kiện group:leave:', { groupId, userId: currentUserId });
              socketRef.current.emit('group:leave', { groupId, userId: currentUserId });
            } catch (err) {
              console.error('Lỗi rời nhóm:', err);
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  }, [groupId, currentUserId, ownerId, ensureSocketConnection]);

  // Giải tán nhóm
  const handleDisbandGroup = useCallback(async () => {
    if (currentUserId !== ownerId) {
      Alert.alert('Lỗi', 'Chỉ trưởng nhóm mới có quyền giải tán nhóm.');
      return;
    }
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
              await ensureSocketConnection();
              console.log('Gửi sự kiện group:disband:', { groupId, userId: currentUserId });
              socketRef.current.emit('group:disband', { groupId, userId: currentUserId });
            } catch (err) {
              console.error('Lỗi giải tán nhóm:', err);
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  }, [groupId, currentUserId, ownerId, ensureSocketConnection]);

  // Khởi tạo socket và lắng nghe sự kiện
  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token || !currentUserId) {
          if (isMounted) {
            Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            navigation.navigate('Login');
          }
          return;
        }

        socketRef.current = io(API_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
          console.log('Socket đã kết nối:', socketRef.current.id);
          socketRef.current.emit('joinGroup', groupId);
          console.log(`Đã tham gia group_${groupId} với userId: ${currentUserId}`);
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Lỗi kết nối socket:', err.message);
          if (isMounted) {
            Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server: ' + err.message);
          }
        });

        socketRef.current.onAny((event, ...args) => {
          console.log(`Nhận sự kiện socket: ${event}`, args);
        });

        socketRef.current.on(`groupMemberUpdated_${groupId}`, ({ type, userId, userEmail, group }) => {
          console.log('Nhận groupMemberUpdated:', { type, userId, userEmail, group });
          if (isMounted && ['member_added', 'member_removed', 'role_updated', 'owner_changed'].includes(type)) {
            setGroupMembers(group.members || []); // Cập nhật danh sách thành viên từ server
            if (type === 'member_added') {
              Alert.alert('Thông báo', `Thành viên mới "${userEmail}" đã được thêm vào nhóm.`);
            } else if (type === 'member_removed') {
              Alert.alert('Thông báo', `Thành viên "${userEmail}" đã rời nhóm.`);
            } else if (type === 'role_updated') {
              Alert.alert('Thông báo', `"${userEmail}" đã được cập nhật vai trò.`);
            } else if (type === 'owner_changed') {
              Alert.alert('Thông báo', `Trưởng nhóm mới là "${userEmail}".`);
            }
          }
        });

        socketRef.current.on('group:joinSuccess', ({ message }) => {
          console.log('Nhận group:joinSuccess:', { message });
          if (isMounted) {
            Alert.alert('Thành công', message);
            setEmail('');
            setModalVisible(false);
          }
        });

        socketRef.current.on('group:leaveSuccess', ({ message, groupId: leftGroupId }) => {
          console.log('Nhận group:leaveSuccess:', { message, leftGroupId });
          if (isMounted && leftGroupId === groupId) {
            Alert.alert('Thành công', message);
            setGroupMembers([]);
            navigation.navigate('ChatList', { reload: true });
          }
        });

        socketRef.current.on(`removedFromGroup_${currentUserId}`, ({ groupId: removedGroupId, groupName }) => {
          console.log('Nhận removedFromGroup:', { removedGroupId, groupName });
          if (isMounted && removedGroupId === groupId) {
            Alert.alert('Thông báo', `Bạn đã rời khỏi nhóm "${groupName}".`);
            setGroupMembers([]);
            navigation.navigate('ChatList', { reload: true });
          }
        });

        socketRef.current.on(`addedToGroup_${currentUserId}`, ({ groupId: addedGroupId, groupName }) => {
          console.log('Nhận addedToGroup:', { addedGroupId, groupName });
          if (isMounted && addedGroupId === groupId) {
            Alert.alert('Thông báo', `Bạn đã được thêm vào nhóm "${groupName}".`);
            // Có thể cần tải lại dữ liệu nhóm tại đây nếu cần
          }
        });

        socketRef.current.on(`groupOwnerChanged_${currentUserId}`, ({ groupId: changedGroupId, groupName }) => {
          console.log('Nhận groupOwnerChanged:', { changedGroupId, groupName });
          if (isMounted && changedGroupId === groupId) {
            Alert.alert('Thông báo', `Bạn đã được chỉ định làm trưởng nhóm của "${groupName}".`);
            // Có thể cần tải lại dữ liệu nhóm tại đây nếu cần
          }
        });

        socketRef.current.on(`groupDisbanded_${currentUserId}`, ({ groupId: disbandedGroupId, groupName }) => {
          console.log('Nhận groupDisbanded:', { disbandedGroupId, groupName });
          if (isMounted && disbandedGroupId === groupId) {
            Alert.alert('Thông báo', `Nhóm "${groupName}" đã bị giải tán.`);
            setGroupMembers([]);
            navigation.navigate('ChatList', { reload: true });
          }
        });

        socketRef.current.on('coAdminAssigned', ({ message, userId }) => {
          console.log('Nhận coAdminAssigned:', { message, userId });
          if (isMounted) {
            Alert.alert('Thành công', message);
          }
        });

        socketRef.current.on('memberRemoved', ({ message, userId }) => {
          console.log('Nhận memberRemoved:', { message, userId });
          if (isMounted) {
            Alert.alert('Thành công', message);
          }
        });

        socketRef.current.on('error', (error) => {
          console.error('Lỗi socket:', error);
          if (isMounted) {
            if (error.status === 401) {
              Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
              AsyncStorage.removeItem('token');
              navigation.navigate('Login');
            } else {
              Alert.alert('Lỗi', error.message || 'Lỗi không xác định từ server.');
            }
          }
        });
      } catch (error) {
        console.error('Lỗi khởi tạo socket:', error);
        if (isMounted) {
          Alert.alert('Lỗi', 'Lỗi khởi tạo: ' + error.message);
        }
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.emit('leaveGroup', groupId);
        socketRef.current.offAny();
        socketRef.current.off(`groupMemberUpdated_${groupId}`);
        socketRef.current.off('group:joinSuccess');
        socketRef.current.off('group:leaveSuccess');
        socketRef.current.off(`removedFromGroup_${currentUserId}`);
        socketRef.current.off(`addedToGroup_${currentUserId}`);
        socketRef.current.off(`groupOwnerChanged_${currentUserId}`);
        socketRef.current.off(`groupDisbanded_${currentUserId}`);
        socketRef.current.off('coAdminAssigned');
        socketRef.current.off('memberRemoved');
        socketRef.current.off('error');
        socketRef.current.disconnect();
        console.log('Socket đã ngắt kết nối và các listener đã bị xóa');
      }
    };
  }, [groupId, currentUserId, navigation]);

  // Chọn bạn từ danh sách
  const handleSelectFriend = useCallback((friendEmail) => {
    setEmail(friendEmail);
  }, []);

  // Render thành viên
  const renderMember = useCallback(
    ({ item }) => (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.username || item.email || item.userId)?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.memberName}>
              {item.username || item.email || 'Unknown'} {item.userId === currentUserId ? '(Bạn)' : ''}
            </Text>
            <Text style={styles.memberRole}>
              {item.role === 'admin' ? 'Trưởng nhóm' : item.role === 'co-admin' ? 'Phó nhóm' : 'Thành viên'}
            </Text>
          </View>
        </View>
        <View style={styles.memberActions}>
          {currentUserId === ownerId && item.userId !== currentUserId && item.role === 'member' && (
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => handleAssignCoAdmin(item.userId, item.username)}
            >
              <Icon name="star" size={20} color="#FFC107" />
            </TouchableOpacity>
          )}
          {['admin', 'co-admin'].includes(currentUserRole) && item.userId !== currentUserId && item.userId !== ownerId && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMember(item.userId, item.username)}
            >
              <Icon name="delete" size={20} color="#FF5252" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [currentUserId, ownerId, currentUserRole, handleAssignCoAdmin, handleRemoveMember]
  );

  // Render bạn bè
  const renderFriend = useCallback(
    ({ item }) => (
      <TouchableOpacity style={styles.friendItem} onPress={() => handleSelectFriend(item.email)}>
        <View style={styles.friendInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.username || item.email)?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.friendName}>{item.username || item.email || 'Unknown'}</Text>
            <Text style={styles.friendEmail}>{item.email}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleSelectFriend]
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
            <>
              <TouchableOpacity onPress={handleDisbandGroup} style={styles.headerIcon}>
                <Icon name="delete" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLeaveGroup} style={styles.headerIcon}>
                <Icon name="logout" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={handleLeaveGroup} style={styles.headerIcon}>
              <Icon name="logout" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Nội dung nhóm */}
      <View style={styles.groupInfoContainer}>
        <View style={styles.groupCard}>
          <Text style={styles.groupName}>{groupName || 'Nhóm không tên'}</Text>
        </View>

        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>Thành viên ({groupMembers.length})</Text>
          {['admin', 'co-admin'].includes(currentUserRole) && (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.addButton}
            >
              <Icon name="person-add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#40C4FF" style={styles.loading} />
        ) : (
          <FlatList
            data={groupMembers}
            keyExtractor={(item) => item.userId}
            renderItem={renderMember}
            style={styles.memberList}
            ListEmptyComponent={<Text style={styles.noMembersText}>Không có thành viên</Text>}
          />
        )}
      </View>

      {/* Modal thêm thành viên */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm thành viên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.friendsTitle}>Danh sách bạn bè</Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.userId || item.email}
              renderItem={renderFriend}
              style={styles.friendList}
              ListEmptyComponent={<Text style={styles.noFriendsText}>Không có bạn bè</Text>}
            />
            {isLoading && <ActivityIndicator size="small" color="#40C4FF" style={styles.modalLoading} />}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddMember}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  friendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  friendList: {
    width: '100%',
    maxHeight: 200,
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noFriendsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
  },
  submitButton: {
    backgroundColor: '#40C4FF',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginVertical: 20,
  },
  modalLoading: {
    marginVertical: 10,
  },
});

export default GroupInfoScreen;
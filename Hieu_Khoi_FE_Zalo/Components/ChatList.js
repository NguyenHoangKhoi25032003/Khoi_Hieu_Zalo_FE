// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Footer from './Footer';
// import { API_URL } from '../config';

// const ChatList = ({ navigation }) => {
//   const [searchText, setSearchText] = useState('');
//   const [contacts, setContacts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [currentUserId, setCurrentUserId] = useState('');

//   useEffect(() => {
//     const fetchContacts = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         if (!token) {
//           navigation.navigate('Login');
//           return;
//         }

//         // Lấy currentUserId
//         const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
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
//         const response = await fetch(`${API_URL}/api/user/contacts`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const data = await response.json();
//         console.log('Contacts data:', data);
//         if (response.status === 200) {
//           setContacts(data);
//         } else {
//           throw new Error(data.message || 'Không thể tải danh sách liên hệ');
//         }
//       } catch (err) {
//         setError(err.message);
//         console.error('Fetch contacts error:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchContacts();
//   }, []);

//   const filteredData = contacts.filter(
//     (item) =>
//       item.username.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.email.toLowerCase().includes(searchText.toLowerCase())
//   );

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
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Tìm kiếm"
//             value={searchText}
//             onChangeText={setSearchText}
//           />
//         </View>
//         <TouchableOpacity onPress={handlePlusClick}>
//           <Text style={styles.plusIcon}>+</Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={filteredData}
//         keyExtractor={(item) => item.userId}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.chatItem}
//             onPress={() => {
//               console.log('Navigating to ChatScreen with:', {
//                 receiverId: item.userId,
//                 receiverName: item.username,
//                 currentUserId,
//               });
//               if (!currentUserId) {
//                 setError('Không thể mở chat: Thiếu ID người dùng hiện tại');
//                 return;
//               }
//               if (!item.userId) {
//                 setError('Không thể mở chat: Thiếu ID người nhận');
//                 return;
//               }
//               navigation.navigate('ChatScreen', {
//                 receiverId: item.userId,
//                 receiverName: item.username,
//                 currentUserId,
//               });
//             }}
//           >
//             <Image
//               source={{ uri: item.avatarUrl }}
//               style={styles.avatar}
//               defaultSource={require('../img/unnamed.png')}
//             />
//             <View style={styles.chatInfo}>
//               <Text style={styles.chatName}>{item.username}</Text>
//               <Text style={styles.chatMessage}>{item.email}</Text>
//             </View>
//             <Text style={styles.chatTime}>T5</Text>
//           </TouchableOpacity>
//         )}
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
//   // Header (Thanh tìm kiếm)
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#40C4FF', // Màu xanh dương nhạt
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//     paddingTop: 65, // Dành chỗ cho status bar
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
//     backgroundColor: '#E0E0E0', // Màu xám nhạt
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     marginRight: 15,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//     paddingVertical: 8,
//     paddingLeft: 30, // Dành chỗ cho kính lúp (dùng padding vì không sửa logic)
//   },
//   plusIcon: {
//     fontSize: 24,
//     color: '#FFFFFF', // Màu trắng
//     marginLeft: 15,
//   },
//   // Danh sách users
//   chatItem: {
//     flexDirection: 'row',
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
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
//   chatTime: {
//     fontSize: 12,
//     color: '#999',
//   },
//   errorText: {
//     color: '#d32f2f',
//     textAlign: 'center',
//     margin: 20,
//     fontSize: 16,
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
import Icon from 'react-native-vector-icons/MaterialIcons'; // Biểu tượng từ MaterialIcons
import Ionicons from 'react-native-vector-icons/Ionicons'; // Biểu tượng từ Ionicons
import { API_URL } from '../config';
import Footer from './Footer';

const ChatList = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.navigate('Login');
          return;
        }

        // Lấy currentUserId
        const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

        // Lấy danh sách contacts
        const response = await fetch(`${API_URL}/api/user/contacts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log('Contacts data:', data);
        if (response.status === 200) {
          setContacts(data);
        } else {
          throw new Error(data.message || 'Không thể tải danh sách liên hệ');
        }
      } catch (err) {
        setError(err.message);
        console.error('Fetch contacts error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const filteredData = contacts.filter(
    (item) =>
      item.username.toLowerCase().includes(searchText.toLowerCase()) ||
      item.email.toLowerCase().includes(searchText.toLowerCase())
  );

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
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerItem}>
            <Icon name="chat" size={24} color="#40C4FF" />
            <Text style={[styles.footerText, { color: '#40C4FF' }]}>Tin nhắn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem}>
            <Icon name="contacts" size={24} color="#999" />
            <Text style={styles.footerText}>Danh bạ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem}>
            <Icon name="explore" size={24} color="#999" />
            <Text style={styles.footerText}>Khám phá</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem}>
            <Ionicons name="time-outline" size={24} color="#999" />
            <Text style={styles.footerText}>Nhật ký</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem}>
            <Icon name="person" size={24} color="#999" />
            <Text style={styles.footerText}>Cá nhân</Text>
          </TouchableOpacity>
        </View>
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
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => {
              console.log('Navigating to ChatScreen with:', {
                receiverId: item.userId,
                 receiverName: item.username,
                currentUserId,
              });
              if (!currentUserId) {
                setError('Không thể mở chat: Thiếu ID người dùng hiện tại');
                return;
              }
              if (!item.userId) {
                setError('Không thể mở chat: Thiếu ID người nhận');
                return;
              }
              navigation.navigate('ChatScreen', {
                receiverId: item.userId,
                receiverName: item.username,
                currentUserId,
              });
            }}
          >
            <Image
              source={{ uri: item.avatarUrl }}
              style={styles.avatar}
              defaultSource={require('../img/unnamed.png')}
            />
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{item.username}</Text>
              <Text style={styles.chatMessage}>{item.email}    </Text>
              {/* {item.email} */}
            </View>
            {/* <Text style={styles.chatTime}>T5</Text> */}
          </TouchableOpacity>
        )}
      />

      <Footer navigation={navigation}/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Header (Thanh tìm kiếm)
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40C4FF', // Màu xanh dương nhạt
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: 65, // Dành chỗ cho status bar
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
    backgroundColor: '#E0E0E0', // Màu xám nhạt
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
  // Danh sách users
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  // Footer (Thanh điều hướng)
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerItem: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
});

export default ChatList;
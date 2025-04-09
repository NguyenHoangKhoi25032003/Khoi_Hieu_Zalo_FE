import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { FaSearch, FaQrcode, FaPlus } from 'react-icons/fa'; // Thêm FaPlus cho dấu +

import Footer from './Footer'; // Import Footer component

// Giả sử bạn có ảnh trong thư mục img
import zalo from '../img/unnamed.png';  // Thay đường dẫn và tên file của bạn

const data = [
  { 
    id: '1', 
    name: 'KTTKPM_Nhóm 369', 
    message: 'Anh Rẻ', 
    time: 'T5', 
    avatar: zalo  // Dùng ảnh đã import
  },
  { 
    id: '2', 
    name: 'Hieu', 
    message: 'Anh Rẻ', 
    time: 'T5', 
    avatar: zalo  // Dùng ảnh đã import
  },
  { 
    id: '3', 
    name: 'Khoi', 
    message: 'Anh Rẻ', 
    time: 'T5', 
    avatar: zalo  // Dùng ảnh đã import
  },
  { 
    id: '4', 
    name: 'Duy', 
    message: 'Anh Rẻ', 
    time: 'T5', 
    avatar: zalo  // Dùng ảnh đã import
  },
  { 
    id: '5', 
    name: 'Anh', 
    message: 'Anh Rẻ', 
    time: 'T5', 
    avatar: zalo  // Dùng ảnh đã import
  },
  // Thêm dữ liệu nếu cần
];

const ChatList = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');

  // Hàm lọc dữ liệu dựa trên từ khóa tìm kiếm
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.message.toLowerCase().includes(searchText.toLowerCase())
  );

  // Điều hướng khi nhấn vào nút "+"
  const handlePlusClick = () => {
    navigation.navigate('NewPage'); // Thay 'NewPage' bằng tên màn hình mà bạn muốn điều hướng đến
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <FaSearch style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm"
            value={searchText}
            onChangeText={setSearchText}  // Cập nhật từ khóa tìm kiếm
          />
        </View>
        <FaQrcode style={styles.qrIcon} />
        <TouchableOpacity onPress={handlePlusClick}>
          <FaPlus style={styles.plusIcon} />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem}>
            <Image source={item.avatar} style={styles.avatar} /> {/* Chèn ảnh đã import */}
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatMessage}>{item.message}</Text>
            </View>
            <Text style={styles.chatTime}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Footer */}
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
    backgroundColor: 'transparent',
    color: '#333',
  },
  searchIcon: {
    color: '#333',
    fontSize: 18,
  },
  qrIcon: {
    fontSize: 22,
    marginLeft: 15,
    color: '#333',
  },
  plusIcon: {
    fontSize: 22,
    marginLeft: 15,
    color: '#333',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
    fontWeight: 'bold',
  },
  chatMessage: {
    color: 'gray',
  },
  chatTime: {
    color: 'gray',
  },
});

export default ChatList;

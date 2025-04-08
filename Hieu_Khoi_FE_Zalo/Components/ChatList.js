// components/ChatList.js
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Footer from './Footer'; // Import Footer component

const data = [
  { id: '1', name: 'KTTKPM_Nhóm 369', message: 'Anh Rẻ', time: 'T5', avatar: 'https://via.placeholder.com/50' },
  // Thêm dữ liệu nếu cần
];

const ChatList = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchText}>Tìm kiếm</Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate('User')}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
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
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'gray',
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


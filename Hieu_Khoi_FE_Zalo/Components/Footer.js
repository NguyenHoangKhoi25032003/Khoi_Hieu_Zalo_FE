import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Footer = ({ navigation }) => {
  const tabs = [
    { name: 'ChatList', icon: 'chatbubbles', label: 'Tin nhắn', route: 'ChatList' },
    { name: 'Friends', icon: 'people', label: 'Danh bạ', route: 'FriendScreen' },
    { name: 'Explore', icon: 'search', label: 'Khám phá', route: 'Explore' },
    { name: 'Diary', icon: 'book', label: 'Nhật ký', route: 'Diary' },
    { name: 'User', icon: 'person', label: 'Cá nhân', route: 'User' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.icon}
          onPress={() => navigation.navigate(tab.route)}
        >
          <Ionicons name={tab.icon} size={24} color="#999" />
          <Text style={styles.iconText}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  icon: {
    alignItems: 'center',
  },
  iconText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});

export default Footer;
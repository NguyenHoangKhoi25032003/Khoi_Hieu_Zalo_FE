// components/Footer.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Footer = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.icon}>
        <Ionicons name="chatbubbles" size={24} color="black" />
        <Text>Messages</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.icon}>
        <Ionicons name="people" size={24} color="black" />
        <Text>Contacts</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.icon}>
        <Ionicons name="search" size={24} color="black" />
        <Text>Explore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.icon} onPress={() => navigation.navigate('User')}>
        <Ionicons name="person" size={24} color="black" />
        <Text>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  icon: {
    alignItems: 'center',
  },
});

export default Footer;

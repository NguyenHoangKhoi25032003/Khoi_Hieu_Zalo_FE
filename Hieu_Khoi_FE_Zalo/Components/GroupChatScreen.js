import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GroupChatScreen = ({ route, navigation }) => {
  const { groupId, groupName, currentUserId, members, ownerId } = route.params || {};
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef(null);

  // Dữ liệu giả lập cho danh sách tin nhắn
  const messages = [
    {
      id: '1',
      senderId: 'user1',
      content: 'Chào mọi người!',
      contentType: 'text',
      timestamp: '2023-10-01T10:00:00Z',
    },
    {
      id: '2',
      senderId: currentUserId,
      content: 'Xin chào nhóm!',
      contentType: 'text',
      timestamp: '2023-10-01T10:01:00Z',
    },
    {
      id: '3',
      senderId: 'user2',
      content: 'https://example.com/image.jpg',
      contentType: 'image',
      timestamp: '2023-10-01T10:02:00Z',
    },
  ];

  // Xử lý khi nhấn vào tên nhóm
  const handleGroupNamePress = () => {
    navigation.navigate('GroupInfoScreen', {
      groupId,
      groupName,
      members,
      ownerId,
      currentUserId,
    });
  };

  // Xử lý gửi tin nhắn (giả lập)
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setNewMessage('');
      // Có thể thêm logic gửi tin nhắn nếu tích hợp API
    }
  };

  // Render tin nhắn
  const renderMessage = ({ item }) => {
    const isSent = item.senderId === currentUserId;
    return (
      <View
        style={[
          item.contentType === 'text' ? styles.messageContainer : styles.mediaContainer,
          isSent ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        {item.contentType === 'text' ? (
          <Text style={styles.messageText}>{item.content}</Text>
        ) : item.contentType === 'image' ? (
          <Image source={{ uri: item.content }} style={styles.imagePreview} resizeMode="contain" />
        ) : (
          <Text style={styles.messageText}>[File]</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#FFFFFF" style={styles.backButton} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGroupNamePress} style={styles.headerContent}>
          <Text style={styles.headerTitle}>{groupName || 'Nhóm'}</Text>
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Icon name="phone" size={24} color="#FFFFFF" style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="videocam" size={24} color="#FFFFFF" style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#FFFFFF" style={styles.headerIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách tin nhắn */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messageList, { paddingBottom: 80 }]}
      />

      {/* Input gửi tin nhắn */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.fileButton}>
          <Icon name="attach-file" size={26} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageButton}>
          <Icon name="photo" size={26} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Tin nhắn"
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity style={styles.micButton} onPress={handleSendMessage}>
          {newMessage.trim() ? (
            <Icon name="send" size={26} color="#40C4FF" />
          ) : (
            <Icon name="mic" size={26} color="#666" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');

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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
  },
  messageList: {
    padding: 10,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '75%',
    marginVertical: 6,
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaContainer: {
    maxWidth: '80%',
    marginVertical: 8,
    padding: 0,
    backgroundColor: 'transparent',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0068FF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'black',
  },
  messageText: {
    color: '#FFF',
    fontSize: 16,
  },
  imagePreview: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#EEE',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fileButton: {
    padding: 10,
  },
  imageButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    maxHeight: 100,
  },
  micButton: {
    padding: 10,
    marginLeft: 10,
  },
});

export default GroupChatScreen;
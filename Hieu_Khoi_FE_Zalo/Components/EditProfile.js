// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import * as ImageManipulator from 'expo-image-manipulator';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_URL } from '../config';

// const EditProfile = ({ navigation, route }) => {
//   const [avatarUri, setAvatarUri] = useState(route.params?.profile?.avatarUrl || '');
//   const [loading, setLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [uploadingAvatar, setUploadingAvatar] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         setErrorMessage('Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện');
//       }
//     })();
//   }, []);

//   const pickImage = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       let uri = result.assets[0].uri;
//       const fileSize = result.assets[0].fileSize || (await fetch(uri).then(res => res.blob())).size;
//       if (fileSize > 5 * 1024 * 1024) {
//         setErrorMessage('Ảnh phải nhỏ hơn 5MB');
//         return;
//       }

//       // Cố gắng lấy mimetype
//       const response = await fetch(uri);
//       const blob = await response.blob();
//       const mimeType = blob.type;

//       // Nếu là HEIC, chuyển đổi sang JPEG
//       if (mimeType === 'image/heic' || mimeType === 'image/heif') {
//         const manipulatedImage = await ImageManipulator.manipulateAsync(
//           uri,
//           [],
//           { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
//         );
//         uri = manipulatedImage.uri;
//       }

//       // Kiểm tra mimetype hoặc phần mở rộng
//       if (
//         mimeType.match(/image\/(jpeg|png|jpg)/) ||
//         uri.match(/\.(jpeg|jpg|png)$/i)
//       ) {
//         setAvatarUri(uri);
//         setErrorMessage('');
//       } else {
//         setErrorMessage('Chỉ hỗ trợ ảnh JPEG hoặc PNG. Định dạng hiện tại không được hỗ trợ.');
//       }
//     }
//   };
  
//   const handleSave = async () => {
//     if (!avatarUri || avatarUri.startsWith('https://')) {
//       setErrorMessage('Vui lòng chọn ảnh mới để cập nhật');
//       return;
//     }
  
//     setLoading(true);
//     setUploadingAvatar(true);
//     setErrorMessage('');
  
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         navigation.navigate('Login');
//         return;
//       }
  
//       // Lấy dữ liệu file từ uri
//       const response = await fetch(avatarUri);
//       const blob = await response.blob();
//       const mimeType = blob.type;
//       if (!mimeType.match(/image\/(jpeg|png|jpg)/)) {
//         setErrorMessage('File không hợp lệ, chỉ hỗ trợ JPEG hoặc PNG');
//         setLoading(false);
//         setUploadingAvatar(false);
//         return;
//       }
  
//       // Kiểm tra kích thước blob
//       if (blob.size === 0) {
//         setErrorMessage('Dữ liệu ảnh rỗng, vui lòng chọn ảnh khác');
//         setLoading(false);
//         setUploadingAvatar(false);
//         return;
//       }
  
//       console.log('Sending avatar update request:', { uri: avatarUri, mimeType, blobSize: blob.size });
  
//       const formData = new FormData();
//       formData.append('avatar', blob, `avatar.${mimeType.split('/')[1]}`);
  
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 10000);
  
//       const responseFetch = await fetch(`${API_URL}/api/user/update-avatar`, {
//         method: 'PUT',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: formData,
//         signal: controller.signal,
//       });
  
//       clearTimeout(timeoutId);
//       const data = await responseFetch.json();
//       setLoading(false);
//       setUploadingAvatar(false);
  
//       if (responseFetch.status === 200) {
//         // Cập nhật avatarUri với URL mới từ server
//         setAvatarUri(data.avatarUrl);
//         // Thông báo cho màn hình trước đó
//         route.params?.onUpdateAvatar?.(data.avatarUrl);
//         navigation.goBack();
//       } else {
//         setErrorMessage(data.message || 'Không thể cập nhật ảnh đại diện');
//       }
//     } catch (error) {
//       setLoading(false);
//       setUploadingAvatar(false);
//       if (error.name === 'AbortError') {
//         setErrorMessage('Yêu cầu quá thời gian, vui lòng thử lại');
//       } else {
//         setErrorMessage(error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
//       }
//       console.error('Update avatar error:', error);
//     }
//   };

  
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Đổi ảnh đại diện</Text>

//       {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

//       <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
//         <Image
//           source={{ uri: avatarUri }}
//           style={styles.avatar}
//           defaultSource={require('../img/unnamed.png')}
//         />
//         {uploadingAvatar && <ActivityIndicator size="small" color="#0068FF" style={styles.avatarLoading} />}
//         <Text style={styles.changeAvatarText}>Chọn ảnh mới</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={[styles.button, loading && styles.disabledButton]}
//         onPress={handleSave}
//         disabled={loading}
//         accessibilityLabel="Lưu thay đổi ảnh đại diện"
//       >
//         {loading ? (
//           <ActivityIndicator size="small" color="#fff" />
//         ) : (
//           <Text style={styles.buttonText}>LƯU THAY ĐỔI</Text>
//         )}
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => navigation.goBack()}>
//         <Text style={styles.linkText}>Hủy</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 100,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#0068FF',
//     marginBottom: 20,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#d32f2f',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   avatarContainer: {
//     alignItems: 'center',
//     marginBottom: 40,
//     position: 'relative',
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 10,
//   },
//   avatarLoading: {
//     position: 'absolute',
//     top: 50,
//   },
//   changeAvatarText: {
//     fontSize: 16,
//     color: '#007bff',
//   },
//   button: {
//     backgroundColor: '#007bff',
//     paddingVertical: 15,
//     borderRadius: 25,
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   disabledButton: {
//     backgroundColor: '#d1d1d1',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   linkText: {
//     color: '#007bff',
//     fontSize: 14,
//     marginTop: 10,
//   },
// });

// export default EditProfile;



import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const EditProfile = ({ navigation, route }) => {
  const [avatarUri, setAvatarUri] = useState(route.params?.profile?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        let uri = result.assets[0].uri;
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const fileSize = fileInfo.size;
        if (!fileInfo.exists || fileSize > 5 * 1024 * 1024) {
          setErrorMessage(fileInfo.exists ? 'Ảnh phải nhỏ hơn 5MB' : 'File ảnh không hợp lệ');
          return;
        }

        let mimeType = 'image/jpeg'; // Mặc định
        if (uri.match(/\.png$/i)) {
          mimeType = 'image/png';
        } else if (uri.match(/\.(heic|heif)$/i)) {
          try {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              uri,
              [],
              { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
            );
            uri = manipulatedImage.uri;
            mimeType = 'image/jpeg';
            const convertedInfo = await FileSystem.getInfoAsync(uri);
            if (!convertedInfo.exists || convertedInfo.size === 0) {
              setErrorMessage('Chuyển đổi ảnh thất bại, vui lòng chọn ảnh khác');
              return;
            }
          } catch (error) {
            console.error('Image conversion error:', error);
            setErrorMessage('Không thể chuyển đổi ảnh HEIC, vui lòng chọn ảnh khác');
            return;
          }
        }

        if (mimeType.match(/image\/(jpeg|png|jpg)/)) {
          console.log('Selected avatarUri:', uri, 'Size:', fileSize);
          setAvatarUri(uri);
          setErrorMessage('');
        } else {
          setErrorMessage('Chỉ hỗ trợ ảnh JPEG hoặc PNG.');
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      setErrorMessage('Không thể chọn ảnh, vui lòng thử lại.');
    }
  };

  const handleSave = async () => {
    if (!avatarUri || avatarUri.startsWith('https://')) {
      setErrorMessage('Vui lòng chọn ảnh mới để cập nhật');
      return;
    }

    setLoading(true);
    setUploadingAvatar(true);
    setErrorMessage('');

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      // Kiểm tra file
      const fileInfo = await FileSystem.getInfoAsync(avatarUri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        setErrorMessage('File ảnh không hợp lệ, vui lòng chọn lại');
        setLoading(false);
        setUploadingAvatar(false);
        return;
      }

      // Đọc file thành base64
      const fileData = await FileSystem.readAsStringAsync(avatarUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Xác định mimetype
      let mimeType = avatarUri.match(/\.png$/i) ? 'image/png' : 'image/jpeg';

      // Tạo blob từ base64 với cấu trúc đúng
      const response = await fetch(`data:${mimeType};base64,${fileData}`);
      const blob = await response.blob();

      console.log('Blob size:', blob.size, 'MIME type:', mimeType);
      if (blob.size === 0) {
        setErrorMessage('Dữ liệu ảnh rỗng, vui lòng chọn ảnh khác');
        setLoading(false);
        setUploadingAvatar(false);
        return;
      }

      // Tạo FormData
      const formData = new FormData();
      formData.append('avatar', {
        uri: avatarUri,
        name: `avatar.${mimeType.split('/')[1]}`,
        type: mimeType,
      });

      console.log('Sending avatar update request:', { uri: avatarUri, mimeType, blobSize: blob.size });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Tăng timeout lên 20s

      const responseFetch = await fetch(`${API_URL}/api/user/update-avatar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          // Không set Content-Type, để browser tự set multipart/form-data
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await responseFetch.json();
      setLoading(false);
      setUploadingAvatar(false);

      if (responseFetch.status === 200) {
        setAvatarUri(data.avatarUrl);
        route.params?.onUpdateAvatar?.(data.avatarUrl);
        navigation.goBack();
      } else {
        setErrorMessage(data.message || 'Không thể cập nhật ảnh đại diện');
      }
    } catch (error) {
      setLoading(false);
      setUploadingAvatar(false);
      if (error.name === 'AbortError') {
        setErrorMessage('Yêu cầu quá thời gian, vui lòng thử lại');
      } else {
        setErrorMessage(error.message || 'Không thể kết nối đến server.');
      }
      console.error('Update avatar error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đổi ảnh đại diện</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} disabled={loading}>
        <Image
          source={{ uri: avatarUri || 'https://via.placeholder.com/120' }}
          style={styles.avatar}
          defaultSource={require('../img/unnamed.png')}
        />
        {uploadingAvatar && <ActivityIndicator size="small" color="#0068FF" style={styles.avatarLoading} />}
        <Text style={styles.changeAvatarText}>Chọn ảnh mới</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleSave}
        disabled={loading}
        accessibilityLabel="Lưu thay đổi ảnh đại diện"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>LƯU THAY ĐỔI</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.linkText}>Hủy</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0068FF',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  avatarLoading: {
    position: 'absolute',
    top: 50,
  },
  changeAvatarText: {
    fontSize: 16,
    color: '#007bff',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#d1d1d1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
    marginTop: 10,
  },
});

export default EditProfile;
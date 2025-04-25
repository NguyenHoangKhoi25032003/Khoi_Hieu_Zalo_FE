import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Cấu hình thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Yêu cầu quyền thông báo
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Hiển thị thông báo cục bộ
export const showLocalNotification = async ({ title, body, data }) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Hiển thị ngay lập tức
    });
    console.log('Scheduled local notification:', { title, body, data });
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
};

// Lắng nghe tương tác với thông báo
export const setupNotificationListener = (onNotificationResponse) => {
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response received:', response);
    onNotificationResponse(response.notification.request.content);
  });

  return () => responseSubscription.remove();
};
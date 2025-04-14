// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import ChatList from './Components/ChatList';
// import User from './Components/User';
// import Login from './Components/Login';
// import Sign from './Components/Sign';
// import VerifyEmail from './Components/VerifyEmailScreen';
// import ForgotPassword from './Components/ForgotPasswordScreen';
// import ResetPassword from './Components/ResetPasswordScreen';
// import EditProfile from './Components/EditProfile';
// import ChangePassword from './Components/ChangePassword';

// const Stack = createStackNavigator();

// const linking = {
//   prefixes: ['exp://192.168.1.140:8081', 'http://192.168.1.140:5000', 'http://localhost:5000'],
//   config: {
//     screens: {
//       Login: 'login',
//       Sign: 'sign',
//       VerifyEmail: {
//         path: 'api/auth/verify-email',
//         parse: {
//           token: (token) => token,
//         },
//       },
//       ForgotPassword: 'forgot-password',
//       ResetPassword: {
//         path: 'reset-password/:token', // Sửa để khớp với link trong email
//         parse: {
//           token: (token) => token,
//         },
//       },
//       ChatList: 'chat',
//       User: 'user',
//       EditProfile: 'edit-profile',
//       ChangePassword: 'change-password',
//     },
//   },
// };

// const App = () => {
//   return (
//     <NavigationContainer
//       linking={linking}
//       onReady={() => console.log('NavigationContainer ready')}
//       onStateChange={(state) => console.log('Navigation state changed:', state)}
//     >
//       <Stack.Navigator initialRouteName="Login">
//         <Stack.Screen name="Login" component={Login} options={{ title: false, headerShown: false }} />
//         <Stack.Screen name="Sign" component={Sign} options={{ title: false, headerShown: false }} />
//         <Stack.Screen name="VerifyEmail" component={VerifyEmail} options={{ headerShown: false }} />
//         <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
//         <Stack.Screen name="reset-password/:token" component={ResetPassword} options={{ headerShown: false }} />
//         <Stack.Screen name="ChatList" component={ChatList} />
//         <Stack.Screen name="User" component={User} options={{ headerShown: false }} />
//         <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
//         <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;



import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Linking } from 'react-native';
import ChatList from './Components/ChatList';
import User from './Components/User';
import Login from './Components/Login';
import Sign from './Components/Sign';
import VerifyEmail from './Components/VerifyEmailScreen';
import ForgotPassword from './Components/ForgotPasswordScreen';
import ResetPassword from './Components/ResetPasswordScreen';
import EditProfile from './Components/EditProfile';
import ChangePassword from './Components/ChangePassword';
import { NETWORK_CONFIG } from './config';
import ChatScreen from './Components/ChatScreen';
const Stack = createStackNavigator();

const linking = {
  prefixes: [NETWORK_CONFIG.EXPO_URL],
  config: {
    screens: {
      Login: 'login',
      Sign: 'sign',
      VerifyEmail: {
        path: 'api/auth/verify-email',
        parse: {
          token: (token) => token,
        },
      },
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token) => decodeURIComponent(token),
        },
      },
      ChatList: 'chat',
      User: 'user',
      EditProfile: 'edit-profile',
      ChangePassword: 'change-password',
    },
  },
};

const App = () => {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      console.log('Deep link received:', url);
      if (url && url.includes('reset-password')) {
        try {
          const urlObj = new URL(url.replace('exp://', 'http://'));
          const path = urlObj.pathname.replace(/^\/--\//, '').replace(/^\//, '');
          const token = urlObj.searchParams.get('token');
          console.log('Parsed path:', path);
          console.log('Parsed token:', token);
          if (path === 'reset-password' && token) {
            console.log('Navigating to ResetPassword with token:', token);
            navigationRef.current?.navigate('ResetPassword', { token: decodeURIComponent(token) });
          } else {
            console.log('No valid reset-password route found');
          }
        } catch (error) {
          console.error('Error parsing deep link:', error);
        }
      } else {
        console.log('Ignoring invalid or empty deep link:', url);
      }
    };

    // Đăng ký sự kiện Linking
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Xử lý deep link khi ứng dụng khởi động
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('reset-password')) {
        console.log('Initial deep link:', url);
        handleDeepLink({ url });
      } else {
        console.log('No valid initial deep link:', url);
      }
    });

    // Gỡ bỏ sự kiện
    return () => {
      subscription.remove();
    };
  }, [navigationRef]);

  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      onReady={() => console.log('NavigationContainer ready')}
      onStateChange={(state) => console.log('Navigation state changed:', JSON.stringify(state, null, 2))}
    >
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ title: false, headerShown: false }} />
        <Stack.Screen name="Sign" component={Sign} options={{ title: false, headerShown: false }} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmail} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="ChatList" component={ChatList} options={{ headerShown: false }} />
        <Stack.Screen name="User" component={User} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen}  options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
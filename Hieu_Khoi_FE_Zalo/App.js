// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ChatList from './Components/ChatList'; // Import màn hình ChatList
import User from './Components/User'; // Import màn hình User
import Login from'./Components/Login';
import Sign from './Components/Sign'
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="ChatList" component={ChatList} />
        <Stack.Screen name="User" component={User} />
        <Stack.Screen name="Login" component={Login} options={{ title: false, headerShown: false }}/>
        <Stack.Screen name="Sign" component={Sign} options={{ title: false, headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;


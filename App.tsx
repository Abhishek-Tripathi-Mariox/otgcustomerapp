import './src/styles/global.css';

import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {store} from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import {AlertProvider} from './src/components/AlertProvider';
import {setupNotificationTapHandling} from './src/services/pushNotifications';

function App() {
  useEffect(() => {
    StatusBar.setHidden(true, 'none');
    setupNotificationTapHandling();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AlertProvider>
          <AppNavigator />
        </AlertProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;

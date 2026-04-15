import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useState } from 'react';

const WEB_APP_URL = 'https://jobapp.multivohub.com';

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  // Inject CSS overrides for native feel
  const injectCss = `
    (function() {
      var style = document.createElement('style');
      style.textContent = \`
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        body { overscroll-behavior: none; }
      \`;
      document.head.appendChild(style);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#020617" />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}

      <WebView
        ref={webviewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        injectedJavaScript={injectCss}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Allow Clerk OAuth redirects
        onNavigationStateChange={(navState) => {
          // Let all navigation within the app proceed
          return;
        }}
        userAgent={
          Platform.OS === 'ios'
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 MultivoHub/1.0'
            : 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 MultivoHub/1.0'
        }
        pullToRefreshEnabled
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    zIndex: 10,
  },
});

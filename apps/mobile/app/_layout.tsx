import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  const startedRef = useRef(false);

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslate = useRef(new Animated.Value(8)).current;
  const logoScale = useRef(new Animated.Value(0.98)).current;
  const introOpacity = useRef(new Animated.Value(1)).current;

  async function startIntro() {
    if (startedRef.current) return;
    startedRef.current = true;

    // Intro ekranı native splash'in arkasında hazır olsun.
    // Native splash kalkmadan animasyon saatini başlatmıyoruz.
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Splash zaten kapanmışsa intro yine devam etsin.
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslate, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(900),
      Animated.timing(introOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setShowIntro(false));
  }

  if (showIntro) {
    return (
      <Animated.View
        onLayout={startIntro}
        style={[styles.intro, { opacity: introOpacity }]}
      >
        <StatusBar style="light" />

        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: brandOpacity,
              transform: [
                { translateY: brandTranslate },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <Image
            source={require('../assets/brand/guvencheck-lockup-tagline-800.png')}
            resizeMode="contain"
            style={styles.lockup}
          />
          <Text style={styles.lab}>KARAASLAN LABS</Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#071D18' },
          animation: 'fade',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#071D18',
  },
  intro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071D18',
  },
  lockup: {
    width: 248,
    height: 93,
  },
  brandBlock: {
    alignItems: 'center',
  },
  lab: {
    marginTop: 14,
    color: '#557A6D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
});

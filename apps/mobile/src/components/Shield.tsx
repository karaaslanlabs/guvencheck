import { Image, StyleSheet } from 'react-native';

const shieldSource = require('../../assets/brand/guvencheck-mark.png');

export function Shield({ size = 48 }: { size?: number }) {
  return (
    <Image
      source={shieldSource}
      resizeMode="contain"
      style={[styles.logo, { width: size, height: size }]}
      accessibilityLabel="GüvenCheck"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    flexShrink: 0,
  },
});

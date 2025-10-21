import React from 'react';
import { View, StyleSheet } from 'react-native';

export const AD_BANNER_HEIGHT = 50;

export default function AdBanner() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    height: AD_BANNER_HEIGHT,
    backgroundColor: 'transparent',
  },
});

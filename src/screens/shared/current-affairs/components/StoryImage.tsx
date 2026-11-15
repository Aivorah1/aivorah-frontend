import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const HEIGHT = 190;

/** An https picture an editor added, with its source as caption. Hidden when missing, not https, or it fails to load. */
export default function StoryImage({ url, source, captionColor, frameColor }: {
  url?: string | null; source: string; captionColor: string; frameColor: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!url || !/^https:\/\/\S+$/i.test(url.trim()) || failed) return null;
  return (
    <View style={styles.wrap} testID="story-image">
      {/* Fixed height from the start, so the text below does not jump when the picture arrives. */}
      <View style={[styles.frame, { backgroundColor: frameColor }]}>
        <Image
          source={{ uri: url.trim() }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`Picture for this story. Source: ${source}`}
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text style={[styles.caption, { color: captionColor }]}>Source: {source}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, gap: 6 },
  frame: { height: HEIGHT, width: '100%', borderRadius: 12, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  caption: { fontSize: 11.5 },
});

import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Current Affairs is reachable only through The World & You → Current Affairs
// tab, where the daily digest and the weekly quiz live. This route (the old
// stand-alone page, /current-affairs) stays registered so old links and saved
// navigation states still work: it just opens that tab.
export default function DigestScreen({ navigation }: any) {
  useFocusEffect(useCallback(() => {
    navigation.navigate('WorldAndYou', { tab: 'news' });
  }, [navigation]));
  return null;
}

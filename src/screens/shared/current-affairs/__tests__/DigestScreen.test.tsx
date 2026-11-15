import React from 'react';
import { render } from '@testing-library/react-native';
import DigestScreen from '../DigestScreen';

jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void) => ReactActual.useEffect(effect, [effect]) };
});

// The old stand-alone page (/current-affairs) is gone: Current Affairs lives
// only in The World & You → Current Affairs tab.
test('the old Current Affairs route opens The World & You on its Current Affairs tab', async () => {
  const navigation = { navigate: jest.fn() };
  const view = await render(<DigestScreen navigation={navigation} />);
  expect(navigation.navigate).toHaveBeenCalledWith('WorldAndYou', { tab: 'news' });
  expect(view.toJSON()).toBeNull();
});

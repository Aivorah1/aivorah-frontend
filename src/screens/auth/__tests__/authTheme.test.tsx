// Shared look of the signed-out pages (Website Redesign, Phase 2):
// homepage palette, text-only wordmark, one sun/moon switch, role tiles
// whose active choice is filled and checked.
import React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import {
  HOME_TOKENS, HomeThemeProvider, BrandMark, ThemeSwitch, RoleTile, useHomeTheme, PrimaryButton,
} from '../authTheme';

describe('palette', () => {
  it.each([
    ['bg', '#F7F3E9', '#101827'],
    ['card', '#FFFCF6', '#1C2A40'],
    ['input', '#F9F5ED', '#162238'],
    ['heading', '#302117', '#FFF3DC'],
    ['text', '#4F4035', '#DCE6F4'],
    ['line', '#D5C6B3', '#425775'],
    ['primary', '#B84312', '#A9D5FF'],
    ['onPrimary', '#FFFFFF', '#101827'],
    ['focus', '#1D5DB5', '#8DD1FF'],
    ['green', '#77B742', '#6A9F3E'],
    ['yellow', '#F6C931', '#DCA928'],
    ['orange', '#F58B3A', '#C85F24'],
    ['blue', '#61ABD7', '#477EAB'],
  ] as const)('%s is %s in Light and %s in Dark', (key, light, dark) => {
    expect(HOME_TOKENS.light[key]).toBe(light);
    expect(HOME_TOKENS.dark[key]).toBe(dark);
  });
});

function ModeProbe() {
  const { mode } = useHomeTheme();
  return <Text testID="mode">{mode}</Text>;
}

describe('shared controls', () => {
  it('shows a text-only Aivorah wordmark (no Æ monogram)', async () => {
    await render(<HomeThemeProvider><BrandMark /></HomeThemeProvider>);
    expect(screen.getByText('Aivorah')).toBeTruthy();
    expect(screen.queryByText(/Æ/)).toBeNull();
  });

  it('switches between Light and Dark with one sun/moon switch, keeping state', async () => {
    const user = userEvent.setup();
    await render(
      <HomeThemeProvider>
        <ThemeSwitch />
        <ModeProbe />
      </HomeThemeProvider>,
    );
    const sw = screen.getByRole('switch', { name: 'Dark mode' });
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(sw.props.accessibilityState).toMatchObject({ checked: false });
    await user.press(sw);
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByRole('switch', { name: 'Dark mode' }).props.accessibilityState).toMatchObject({ checked: true });
  });

  it('marks the active role tile as selected and adds a checkmark', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(
      <HomeThemeProvider><RoleTile label="Student" selected={false} onPress={onPress} /></HomeThemeProvider>,
    );
    expect(screen.getByRole('radio', { name: 'Student' }).props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.queryByTestId('role-tile-check')).toBeNull();
    await rerender(<HomeThemeProvider><RoleTile label="Student" selected onPress={onPress} /></HomeThemeProvider>);
    expect(screen.getByRole('radio', { name: 'Student' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId('role-tile-check')).toBeTruthy();
  });

  it('keeps primary buttons pressable and reports busy while loading', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    const { rerender } = await render(<HomeThemeProvider><PrimaryButton label="Sign In" onPress={onPress} /></HomeThemeProvider>);
    await user.press(screen.getByRole('button', { name: 'Sign In' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    await rerender(<HomeThemeProvider><PrimaryButton label="Sign In" onPress={onPress} loading /></HomeThemeProvider>);
    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  });
});

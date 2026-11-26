// Reset Password (opened from the reset email), restyled with the shared
// sign-in design in Website Redesign, Phase 2. Same steps and messages.
import React from 'react';
import { Platform } from 'react-native';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

const mockVerify = jest.fn();
const mockConfirm = jest.fn();
jest.mock('firebase/auth', () => ({
  verifyPasswordResetCode: (...a: any[]) => mockVerify(...a),
  confirmPasswordReset: (...a: any[]) => mockConfirm(...a),
}));
jest.mock('../../../config/firebase', () => ({ auth: {} }));

import ResetPasswordScreen from '../ResetPasswordScreen';

const originalOS = Platform.OS;
const g = globalThis as any;
const originalWindow = g.window;

function openAsWeb(search: string) {
  (Platform as any).OS = 'web';
  g.window = { ...(originalWindow || {}), location: { search, replace: jest.fn(), origin: 'http://localhost' } };
}

afterEach(() => {
  (Platform as any).OS = originalOS;
  g.window = originalWindow;
  jest.clearAllMocks();
});

it('explains that the page needs a browser outside the web app', async () => {
  await render(<ResetPasswordScreen />);
  expect(await screen.findByText('Link Expired')).toBeTruthy();
  expect(screen.getByText('This page must be opened in a browser.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Back to App' })).toBeTruthy();
});

it('shows the expired-link state when the code is rejected', async () => {
  openAsWeb('?oobCode=old');
  mockVerify.mockRejectedValueOnce(new Error('expired'));
  await render(<ResetPasswordScreen />);
  expect(await screen.findByText('This link has expired or already been used. Please request a new one.')).toBeTruthy();
});

it('checks the new password, saves it and confirms', async () => {
  openAsWeb('?oobCode=abc');
  mockVerify.mockResolvedValueOnce('kid@example.com');
  mockConfirm.mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  await render(<ResetPasswordScreen />);

  expect(await screen.findByText('Reset Password')).toBeTruthy();
  expect(screen.getByText('kid@example.com')).toBeTruthy();

  await user.type(screen.getByLabelText('New Password'), 'secret1');
  await user.type(screen.getByLabelText('Confirm Password'), 'secret2');
  await user.press(screen.getByRole('button', { name: 'Save New Password' }));
  expect(screen.getByText('Passwords do not match.')).toBeTruthy();
  expect(mockConfirm).not.toHaveBeenCalled();

  await user.clear(screen.getByLabelText('Confirm Password'));
  await user.type(screen.getByLabelText('Confirm Password'), 'secret1');
  await user.press(screen.getByRole('button', { name: 'Save New Password' }));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith({}, 'abc', 'secret1'));
  expect(await screen.findByText('Password Updated!')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Back to Sign In' })).toBeTruthy();
});

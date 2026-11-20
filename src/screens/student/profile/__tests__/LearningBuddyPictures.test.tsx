// Learning Buddy with real pictures: characters, outfits, moods, saving and the profile card.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BUDDY_PICTURES } from '../buddyPictures.generated';
import {
  BUDDY_EMOTIONS, BUDDY_OUTFITS, PICTURE_CHARACTERS, buddyPicture, describePictureBuddy, emotionsWithPictures, fitOutfit, outfitsFor,
} from '../buddyPictureOptions';
import { LearningBuddyModal } from '../components/LearningBuddyModal';
import { LearningBuddyCard } from '../components/LearningBuddyCard';
import { DEFAULT_BUDDY, DEFAULT_CLASSIC_BUDDY, isPictureBuddy } from '../learningBuddyConstants';

jest.mock('../../../../context/ThemeContext', () => ({ useTheme: () => ({ colors: {}, isDark: false }) }));

const COLORS: any = new Proxy({}, { get: () => '#888888' });
const STYLES: any = new Proxy({}, { get: () => ({}) });

function openModal(currentBuddy = DEFAULT_BUDDY, onSave = jest.fn()) {
  return render(
    <LearningBuddyModal styles={STYLES} colors={COLORS} isDark={false} visible onClose={jest.fn()} onSave={onSave} currentBuddy={currentBuddy} />,
  );
}

describe('picture library', () => {
  test('all 6 characters have pictures, and every picture name is a known outfit and mood', () => {
    expect(PICTURE_CHARACTERS.map((c) => c.id)).toEqual(['aarav', 'meera', 'kabir', 'zoya', 'leo', 'pip']);
    const outfits = BUDDY_OUTFITS.map((o) => o.id);
    const moods = BUDDY_EMOTIONS.map((e) => e.id);
    for (const [char, pics] of Object.entries(BUDDY_PICTURES)) {
      for (const key of Object.keys(pics)) {
        const [outfit, mood] = key.split('-');
        expect({ char, outfit: outfits.includes(outfit), mood: moods.includes(mood) }).toEqual({ char, outfit: true, mood: true });
      }
    }
  });

  test('each character only offers the outfits it has pictures for', () => {
    expect(outfitsFor('meera').map((o) => o.id)).toEqual(
      ['casual', 'school', 'hero', 'astronaut', 'scientist', 'doctor', 'sports', 'traditional', 'explorer'],
    );
    expect(outfitsFor('pip').map((o) => o.id)).not.toContain('explorer');
    expect(fitOutfit('pip', 'explorer')).toBe('hero');
    expect(fitOutfit('meera', 'doctor')).toBe('doctor');
    expect(fitOutfit('meera', undefined)).toBe('hero');
  });

  test('a mood without its own picture uses the happy picture of that outfit', () => {
    const happy = buddyPicture('kabir', 'doctor', 'happy');
    expect(happy.exact).toBe(true);
    const sleepy = buddyPicture('kabir', 'doctor', 'sleepy');
    expect(sleepy.source).toBe(happy.source);
    expect(sleepy.exact).toBe(emotionsWithPictures('kabir', 'doctor').includes('sleepy'));
  });

  test('describes the buddy for screen readers', () => {
    expect(describePictureBuddy('Kiran', 'astronaut', 'excited')).toBe('Kiran, feeling excited, wearing Astronaut');
  });
});

describe('Learning Buddy modal', () => {
  test('opens on the picture buddies and saves character, outfit, mood and name', async () => {
    const onSave = jest.fn();
    await openModal(DEFAULT_BUDDY, onSave);
    expect(screen.getByLabelText('Aarav, feeling happy, wearing Super Hero')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('buddy-char-meera'));
    await fireEvent.press(screen.getByTestId('buddy-outfit-astronaut'));
    await fireEvent.press(screen.getByTestId('buddy-mood-excited'));
    await fireEvent.changeText(screen.getByTestId('buddy-name-input'), 'Captain Meera');
    expect(screen.getByLabelText('Captain Meera, feeling excited, wearing Astronaut')).toBeTruthy();
    expect(screen.getByText('Feeling excited · Astronaut')).toBeTruthy();

    await fireEvent.press(screen.getByText('Save Buddy'));
    expect(onSave).toHaveBeenCalledWith({ buddyId: 'meera', customName: 'Captain Meera', costumeId: 'astronaut', emotion: 'excited' });
  });

  test('switching to a character without the chosen outfit falls back to Super Hero', async () => {
    const onSave = jest.fn();
    await openModal({ buddyId: 'zoya', customName: null, costumeId: 'explorer', emotion: 'proud' }, onSave);
    expect(screen.getByLabelText('Zoya, feeling proud, wearing Explorer')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('buddy-char-pip'));
    expect(screen.queryByTestId('buddy-outfit-explorer')).toBeNull();
    await fireEvent.press(screen.getByText('Save Buddy'));
    expect(onSave).toHaveBeenCalledWith({ buddyId: 'pip', customName: null, costumeId: 'hero', emotion: 'proud' });
  });

  test('every mood can be picked and the preview shows it', async () => {
    await openModal();
    for (const e of BUDDY_EMOTIONS) {
      await fireEvent.press(screen.getByTestId(`buddy-mood-${e.id}`));
      expect(screen.getByLabelText(`Aarav, feeling ${e.label.toLowerCase()}, wearing Super Hero`)).toBeTruthy();
      expect(screen.getByTestId('buddy-preview-mood')).toBeTruthy();
    }
  });

  test('a student with a classic character still sees and saves it as before', async () => {
    const onSave = jest.fn();
    await openModal(DEFAULT_CLASSIC_BUDDY, onSave);
    expect(screen.queryByTestId('buddy-preview')).toBeNull();
    await fireEvent.press(screen.getByText('Save Buddy'));
    expect(onSave).toHaveBeenCalledWith(DEFAULT_CLASSIC_BUDDY);
  });

  test('a classic student can switch to the new buddies', async () => {
    const onSave = jest.fn();
    await openModal(DEFAULT_CLASSIC_BUDDY, onSave);
    await fireEvent.press(screen.getByTestId('buddy-mode-pictures'));
    await fireEvent.press(screen.getByTestId('buddy-char-leo'));
    await fireEvent.press(screen.getByText('Save Buddy'));
    expect(onSave).toHaveBeenCalledWith({ buddyId: 'leo', customName: null, costumeId: 'hero', emotion: 'happy' });
  });
});

describe('profile card', () => {
  test('shows the picture buddy with its mood and outfit', async () => {
    const onOpen = jest.fn();
    await render(
      <LearningBuddyCard styles={STYLES} colors={COLORS} isDark={false} onOpenCustomize={onOpen}
        savedBuddy={{ buddyId: 'leo', customName: 'Sunny', costumeId: 'scientist', emotion: 'thinking' }} />,
    );
    expect(screen.getByText('Sunny')).toBeTruthy();
    expect(screen.getByText('Feeling thinking · Scientist • Tap to change')).toBeTruthy();
    expect(screen.getByLabelText('Sunny, feeling thinking, wearing Scientist')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('buddy-card-picture'));
    expect(onOpen).toHaveBeenCalled();
  });

  test('new students get Aarav the super hero by default', () => {
    expect(isPictureBuddy(DEFAULT_BUDDY)).toBe(true);
    expect(isPictureBuddy(DEFAULT_CLASSIC_BUDDY)).toBe(false);
  });
});

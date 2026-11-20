import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import RecommendedPractice, { PRACTISE_THIS_SKILL } from '../components/RecommendedPractice';
import type { Recommendation } from '../types';

const COLORS: any = { accentGreen: '#5A8A70', accentYellow: '#B8860B', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff' };

const item = (over: Partial<Recommendation> = {}): Recommendation => ({
  followupId: 'f1', skillId: 'en.figurative.pun-vs-alliteration', label: 'Telling puns and alliteration apart', shortName: 'Puns and alliteration',
  status: 'available', evidenceCount: 2, answeredCount: 0,
  outcome: { code: 'available', label: 'Recommended', text: 'Follow-up practice is ready.', parentText: '', confirmed: 0 },
  ...over,
});

describe('RecommendedPractice (Test Report)', () => {
  test('available: "Recommended practice", the skill, and the exact Practise This Skill label', async () => {
    const onPractise = jest.fn();
    await render(<RecommendedPractice items={[item()]} loading={false} onPractise={onPractise} onDetails={jest.fn()} colors={COLORS} />);
    expect(screen.getByText('Recommended practice')).toBeTruthy();
    expect(screen.getByText('Telling puns and alliteration apart')).toBeTruthy();
    expect(PRACTISE_THIS_SKILL).toBe('Practise This Skill');
    await fireEvent.press(screen.getByText('Practise This Skill'));
    expect(onPractise).toHaveBeenCalledWith(expect.objectContaining({ followupId: 'f1' }));
  });

  test('one card per skill, each with its own Practise This Skill button', async () => {
    await render(<RecommendedPractice items={[item(), item({ followupId: 'f2', skillId: 'math.fractions.equivalent', label: 'Finding equivalent fractions' })]}
      loading={false} onPractise={jest.fn()} onDetails={jest.fn()} colors={COLORS} />);
    expect(screen.getAllByText('Practise This Skill')).toHaveLength(2);
  });

  test('in progress with a saved outcome: Continue Practice + outcome + details link', async () => {
    const onDetails = jest.fn();
    await render(<RecommendedPractice items={[item({ status: 'in_progress', answeredCount: 1, outcome: { code: 'assisted', label: 'Correct with a hint', text: '', parentText: '', confirmed: 0 } })]}
      loading={false} onPractise={jest.fn()} onDetails={onDetails} colors={COLORS} />);
    expect(screen.getByText('Continue Practice')).toBeTruthy();
    expect(screen.getByText('Correct with a hint')).toBeTruthy();
    await fireEvent.press(screen.getByText('View Practice Details'));
    expect(onDetails).toHaveBeenCalled();
  });

  test('completed: Practice complete, summary and View Practice Details (no practise button)', async () => {
    await render(<RecommendedPractice items={[item({ status: 'completed', answeredCount: 2, outcome: { code: 'completed', label: 'Practice complete', text: 'Answered two new questions correctly on their own and explained both answers.', parentText: '', confirmed: 2 } })]}
      loading={false} onPractise={jest.fn()} onDetails={jest.fn()} colors={COLORS} />);
    expect(screen.getByText('Practice complete')).toBeTruthy();
    expect(screen.getByText('View Practice Details')).toBeTruthy();
    expect(screen.queryByText('Practise This Skill')).toBeNull();
  });

  test('no reliable skill mapping: nothing is added to the report', async () => {
    await render(<RecommendedPractice items={[]} loading={false} onPractise={jest.fn()} onDetails={jest.fn()} colors={COLORS} />);
    expect(screen.queryByTestId('recommended-practice')).toBeNull();
  });

  test('a load error keeps the report and offers a retry', async () => {
    const onRetry = jest.fn();
    await render(<RecommendedPractice items={[]} loading={false} error="x" onRetry={onRetry} onPractise={jest.fn()} onDetails={jest.fn()} colors={COLORS} />);
    await fireEvent.press(screen.getByTestId('followup-error'));
    expect(onRetry).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import TopicPractice, { lessonTextOf } from '../components/TopicPractice';

jest.mock('../components/QuestionCoach', () => {
  const { Text } = require('react-native');
  return function MockQuestionCoach(p: any) { return <Text testID="coach">{`${p.attemptId}|${p.questionIndex}|${p.mode}|${p.lessonText}`}</Text>; };
});
const mockForTopic = jest.fn();
jest.mock('../services/practiceFollowupApi', () => ({ followupApi: { forTopic: (...a: any[]) => mockForTopic(...a) } }));

const COLORS: any = { accentYellow: '#B8860B', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff' };
const base = { topicName: 'Quality', subject: 'English', colors: COLORS, onBackToReport: jest.fn() };

beforeEach(() => mockForTopic.mockReset());

test('opened from the Test Report: the exact test, wrong question and mode, without a lookup', async () => {
  await render(<TopicPractice {...base} request={{ attemptId: 'a1', questionIndex: 3, mode: 'explain' }} lessonText="lesson" />);
  expect(screen.getByTestId('coach').props.children).toBe('a1|3|explain|lesson');
  expect(mockForTopic).not.toHaveBeenCalled();
});

test('Ask Aivorah on its own opens practice on the first wrong question of the newest test', async () => {
  mockForTopic.mockResolvedValue({ followupId: 'f', attemptId: 'a9', questionIndex: 1 });
  await render(<TopicPractice {...base} topicId="t1" lessonText="Mr Gessler made boots" />);
  await waitFor(() => expect(screen.getByTestId('coach').props.children).toBe('a9|1|practice|Mr Gessler made boots'));
  expect(mockForTopic).toHaveBeenCalledWith('Quality', 'English', 't1');
});

test('no test yet: explains what to do and links to Practice', async () => {
  const onGoToPractice = jest.fn();
  mockForTopic.mockResolvedValue({ followupId: null, attemptId: null, hasTest: false });
  await render(<TopicPractice {...base} onGoToPractice={onGoToPractice} />);
  await waitFor(() => expect(screen.getByTestId('topic-practice-none')).toBeTruthy());
  await fireEvent.press(screen.getByTestId('topic-practice-go'));
  expect(onGoToPractice).toHaveBeenCalled();
});

test('everything right last time: nothing to practise', async () => {
  mockForTopic.mockResolvedValue({ followupId: null, attemptId: 'a1', hasTest: true, questionIndex: null });
  await render(<TopicPractice {...base} />);
  await waitFor(() => expect(screen.getByText(/You got everything right/)).toBeTruthy());
});

test('lesson text comes from what Learn shows (strings or blocks)', () => {
  expect(lessonTextOf({ readText: { intro: 'Intro.', body: ['Para one.', { heading: 'H', text: 'Block text' }], keyLearnings: ['Key point'] } }))
    .toBe('Intro.\nPara one.\nH: Block text\nKey point');
  expect(lessonTextOf({})).toBe('');
});

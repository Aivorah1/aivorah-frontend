// Ask Aivorah: the practice panel and the chat sit in one scrollable column,
// so a student can scroll down to every follow-up question.
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import AskTab from '../AskTab';
import { makeStyles } from '../../styles';

jest.mock('../../../practice-followup/components/TopicPractice', () => {
  const { Text: T } = require('react-native');
  return { __esModule: true, default: function MockTopicPractice() { return <T testID="practice-panel">practice</T>; }, lessonTextOf: () => '' };
});
jest.mock('../../../../../../components/common/TopicAICoach', () => {
  const { Text: T } = require('react-native');
  return function MockTopicAICoach() { return <T testID="ai-chat">chat</T>; };
});
jest.mock('../BookPane', () => function MockBookPane() { return null; });

const COLORS: any = { primary: '#B8860B', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff', bgDark: '#fff', accentYellow: '#B8860B', accentGreen: '#5A8A70' };

test('the practice panel and the chat are inside one scrollable column', async () => {
  await render(
    <AskTab
      coachRequest={{ attemptId: "a1", questionIndex: 0, mode: "explain" }}
      topic={{ name: 'Wisdom Paves the Way' }}
      chapter={{ title: 'Wit and Wisdom' }}
      grade="Grade 8" subject="English" curriculum="CBSE" chapterIndex={0}
      colors={COLORS} styles={makeStyles(COLORS)} onReadFullBook={jest.fn()}
    />,
  );
  const column = within(screen.getByTestId('ask-tab-scroll'));
  expect(column.getByTestId('practice-panel')).toBeTruthy();
  expect(column.getByTestId('ai-chat')).toBeTruthy();
  expect(screen.getByText(/Context loaded: Grade 8 · English · Unit 1 · Wisdom Paves the Way/)).toBeTruthy();
});

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import type { Conversation } from '../types';
import { convoRoleLabel, formatTime, isAivorah } from '../utils/messageFormat';
import { renderPersonAvatar } from './PersonAvatar';

interface Props {
  activeConvo: Conversation;
  colors: AppColors;
  styles: any;
  onBackToInbox?: () => void;
}

export default function ChatHeader({ activeConvo, colors, styles, onBackToInbox }: Props) {
  return (
    <View style={[styles.chatHeader, isAivorah(activeConvo) && styles.chatHeaderAivorah]}>
      {onBackToInbox && (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to conversations"
          style={styles.backToInbox} onPress={onBackToInbox}>
          <Feather name="arrow-left" size={19} color={colors.textMain} />
        </TouchableOpacity>
      )}
      {renderPersonAvatar(activeConvo.otherName, activeConvo.otherRole, (activeConvo as any).photoUrl, 38, isAivorah(activeConvo), colors)}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.chatName, isAivorah(activeConvo) && { fontSize: 16, fontWeight: '800' }]} numberOfLines={onBackToInbox ? 1 : undefined}>{activeConvo.otherName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isAivorah(activeConvo) ? (
            <>
              <View style={styles.onlineDot} />
              <Text style={[styles.chatRole, { color: colors.accentYellow }]}>Always online · Learning Buddy</Text>
            </>
          ) : (
            <>
              <View style={[styles.onlineDot, { backgroundColor: colors.textDim }]} />
              <Text style={styles.chatRole}>
                {activeConvo.lastMessageAt
                  ? `Last seen ${new Date(activeConvo.lastMessageAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${formatTime(activeConvo.lastMessageAt)}`
                  : convoRoleLabel(activeConvo)}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

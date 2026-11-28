import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard, Platform, StyleSheet } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import { fonts } from '../../../../theme';
import type { Attachment, Conversation, Message } from '../types';
import { fileIcon, formatFileSize, parseContent } from '../utils/messageFormat';

interface Props {
  activeConvo: Conversation;
  colors: AppColors;
  styles: any;
  userRole: string;
  compact?: boolean;
  userEmail: string;
  replyTo: Message | null;
  setReplyTo: (m: Message | null) => void;
  attachment: Attachment | null;
  removeAttachment: () => void;
  uploading: boolean;
  sending: boolean;
  pickFile: () => void;
  showEmoji: boolean;
  setShowEmoji: (v: boolean | ((prev: boolean) => boolean)) => void;
  inputText: string;
  setInputText: (v: string) => void;
  sendMessage: () => void;
}

export default function MessageComposer({
  activeConvo, colors, styles, userRole, compact, userEmail, replyTo, setReplyTo, attachment, removeAttachment,
  uploading, sending, pickFile, setShowEmoji, inputText, setInputText, sendMessage,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  const teacherComposer = userRole === 'teacher' || userRole === 'super_admin';
  const web = Platform.OS === 'web';
  if (userRole === 'student') {
    return (
      <View style={{ padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.borderColor }}>
        <Text style={{ fontSize: 12, color: colors.textDim }}>Messages from your teacher or parent appear here.</Text>
      </View>
    );
  }

  const input = (
    <TextInput
      testID="messages-input"
      accessibilityLabel="Message"
      style={[styles.input, teacherComposer && [
        composerStyles.input,
        web ? composerStyles.webInput : { height: inputText ? inputHeight : 44 },
        focused && { borderColor: '#4B9187' },
      ]]}
      value={inputText}
      onChangeText={setInputText}
      placeholder={`Message ${activeConvo.otherName}...`}
      placeholderTextColor={colors.textDim}
      multiline
      {...(teacherComposer && web ? { rows: 1 } : {})}
      {...(teacherComposer && {
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        ...(web ? {} : {
          textAlignVertical: 'top' as const,
          onContentSizeChange: (e: { nativeEvent: { contentSize: { height: number } } }) =>
            setInputHeight(Math.min(110, Math.max(44, e.nativeEvent.contentSize.height))),
        }),
      })}
      maxLength={1000}
      onKeyPress={(e: any) => {
        if (web && (e.key ?? e.nativeEvent?.key) === 'Enter'
          && !(e.shiftKey ?? e.nativeEvent?.shiftKey) && !e.nativeEvent?.isComposing) {
          e.preventDefault?.();
          if (inputText.trim() || attachment) sendMessage();
        }
      }}
    />
  );

  return (
    <View>
      {/* Reply preview — quoting the message being replied to */}
      {replyTo && (
        <View style={styles.replyPreviewRow}>
          <Feather name="corner-up-left" size={14} color={colors.accentYellow} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyPreviewName}>{replyTo.sender_email === userEmail ? 'You' : replyTo.sender_name}</Text>
            <Text style={styles.replyPreviewText} numberOfLines={1}>{parseContent(replyTo.content).text || 'Attachment'}</Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)} activeOpacity={0.7}>
            <Feather name="x" size={16} color={colors.textDim} />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachment preview */}
      {attachment && (
        <View style={styles.attachPreviewRow}>
          <Feather name={fileIcon(attachment.type) as any} size={16} color={colors.accentYellow} />
          <Text style={styles.attachPreviewName} numberOfLines={1}>{attachment.name}</Text>
          <Text style={styles.attachPreviewSize}>{formatFileSize(attachment.size)}</Text>
          <TouchableOpacity onPress={removeAttachment} activeOpacity={0.7}>
            <Feather name="x" size={16} color={colors.textDim} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputRow, teacherComposer && composerStyles.row, compact && composerStyles.compactRow]}>
        {teacherComposer && web && React.createElement('style', null, `
          [data-teacher-composer] { display: grid; }
          [data-teacher-composer] > * { grid-area: 1 / 1; min-width: 0; }
          [data-teacher-composer] > span {
            visibility: hidden;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            box-sizing: border-box;
            max-height: 110px;
            overflow: hidden;
            padding: 11px 13px;
            font: 16px/22px var(--av-body, sans-serif);
          }
          [data-teacher-composer] textarea { width: 100%; height: 100%; resize: none; }
          body[data-av-portal] [data-teacher-composer] textarea:focus-visible {
            outline: 2px solid #226B64 !important;
            outline-offset: 1px !important;
          }
          body[data-av-theme="dark"] [data-teacher-composer] textarea:focus-visible { outline-color: #94D9CA !important; }
        `)}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            testID="messages-attach-button"
            accessibilityRole="button"
            accessibilityLabel="Attach a file"
            style={styles.attachBtn}
            onPress={pickFile}
            disabled={uploading || sending}
            activeOpacity={0.7}
          >
            {uploading
              ? <ActivityIndicator size="small" color={colors.accentYellow} />
              : <Feather name="paperclip" size={18} color={colors.accentYellow} />
            }
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.attachBtn}
          accessibilityRole="button"
          accessibilityLabel="Emoji picker"
          onPress={() => {
            if (compact) Keyboard.dismiss();
            setShowEmoji((v) => !v);
          }}
          {...(Platform.OS === 'web' ? { onClick: (e: any) => e.stopPropagation?.() } : {})}
          activeOpacity={0.7}
        >
          <Feather name="smile" size={18} color={colors.accentYellow} />
        </TouchableOpacity>
        {teacherComposer ? (
          <View style={composerStyles.field} {...{ dataSet: { teacherComposer: 'true' } }}>
            {/* The hidden draft sets the textarea height across browsers. */}
            {web && React.createElement('span', { 'aria-hidden': true }, (inputText || '') + '\u200b')}
            {input}
          </View>
        ) : input}
        <TouchableOpacity
          testID="messages-send-button"
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={[styles.sendBtn, (!inputText.trim() && !attachment || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={(!inputText.trim() && !attachment) || sending}
          activeOpacity={0.7}
        >
          {sending
            ? <ActivityIndicator size="small" color="white" />
            : <Feather name="send" size={16} color="white" />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const composerStyles = StyleSheet.create({
  row: { gap: 7 },
  compactRow: { paddingHorizontal: 8, paddingVertical: 8, gap: 6 },
  field: { flex: 1, minWidth: 0 },
  input: { fontSize: 16, lineHeight: 22, includeFontPadding: false, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, maxHeight: 110, borderRadius: 16 },
  webInput: {
    fontFamily: fonts.sans,
    ...{ resize: 'none', overflowY: 'auto' },
  },
});

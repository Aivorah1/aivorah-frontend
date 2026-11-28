import React from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import type { Channel } from '../../../../features/channels/api/channelsApi';
import ChannelThreadView from '../../../../features/channels/components/ChannelThreadView';
import type { Attachment, ContextMenuState, Conversation, Message } from '../types';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import EmojiPicker from './EmojiPicker';

interface Props {
  colors: AppColors;
  styles: any;
  userRole: string;
  compact?: boolean;
  userEmail: string;
  activeChannel: Channel | null;
  onCloseChannel: () => void;
  onChannelsReload: () => void;
  activeConvo: Conversation | null;
  onBackToInbox?: () => void;
  loadingThread: boolean;
  messages: Message[];
  flatListRef: React.RefObject<FlatList | null>;
  focusedMsgId: string | null;
  setFocusedMsgId: (id: string | null) => void;
  copiedMsgId: string | null;
  setContextMenu: (v: ContextMenuState) => void;
  startEdit: (msg: Message) => void;
  toggleReaction: (msgId: string, emoji: string) => void;
  showEmoji: boolean;
  setShowEmoji: (v: boolean | ((prev: boolean) => boolean)) => void;
  emojiCategory: number;
  setEmojiCategory: (i: number) => void;
  replyTo: Message | null;
  setReplyTo: (m: Message | null) => void;
  attachment: Attachment | null;
  removeAttachment: () => void;
  uploading: boolean;
  sending: boolean;
  pickFile: () => void;
  inputText: string;
  setInputText: (v: string) => void;
  sendMessage: () => void;
}

export default function ChatPanel({
  colors, styles, userRole, compact, userEmail, activeChannel, onCloseChannel, onChannelsReload,
  activeConvo, onBackToInbox, loadingThread, messages, flatListRef,
  focusedMsgId, setFocusedMsgId, copiedMsgId, setContextMenu, startEdit, toggleReaction,
  showEmoji, setShowEmoji, emojiCategory, setEmojiCategory,
  replyTo, setReplyTo, attachment, removeAttachment, uploading, sending, pickFile,
  inputText, setInputText, sendMessage,
}: Props) {
  const emojiPicker = showEmoji && (
    <EmojiPicker
      onClose={() => setShowEmoji(false)}
      styles={compact ? { ...styles, emojiPickerFloating: [styles.emojiPickerFloating, styles.compactEmojiPicker] } : styles}
      emojiCategory={emojiCategory}
      setEmojiCategory={setEmojiCategory}
      onPickEmoji={(e) => setInputText(inputText + e)}
    />
  );
  return (
    <KeyboardAvoidingView
      style={styles.chatPanel}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={compact ? 0 : 80}
    >
      {activeChannel ? (
        <ChannelThreadView channel={activeChannel} compact={compact} onBack={() => { onCloseChannel(); onChannelsReload(); }} />
      ) : !activeConvo ? (
        <View style={styles.noConvoState}>
          <Feather name="message-circle" size={48} color={colors.textDim} />
          <Text style={styles.noConvoText}>Select a conversation</Text>
          {userRole !== 'student' && (
            <Text style={styles.noConvoSub}>
              or tap <Text style={{ color: colors.accentYellow }}>New</Text> to message a {userRole === 'teacher' ? 'parent' : 'teacher'}
            </Text>
          )}
        </View>
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>
          <ChatHeader activeConvo={activeConvo} colors={colors} styles={styles} onBackToInbox={onBackToInbox} />

          {loadingThread ? (
            <ActivityIndicator color={colors.accentYellow} style={{ flex: 1 }} />
          ) : (
            <>
              {!compact && showEmoji && (
                <TouchableOpacity
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                  activeOpacity={1}
                  onPress={() => setShowEmoji(false)}
                />
              )}
              <FlatList
                style={compact ? { flex: 1, minHeight: 0 } : undefined}
                ref={flatListRef}
                data={messages}
                keyExtractor={i => i.id}
                renderItem={({ item, index }) => (
                  <MessageBubble
                    item={item} index={index} messages={messages} userEmail={userEmail}
                    colors={colors} styles={styles}
                    focusedMsgId={focusedMsgId} copiedMsgId={copiedMsgId}
                    setFocusedMsgId={setFocusedMsgId} setContextMenu={setContextMenu}
                    startEdit={startEdit} toggleReaction={toggleReaction}
                  />
                )}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                {...(Platform.OS === 'web' ? {
                  onClick: () => {
                    if (showEmoji) setShowEmoji(false);
                    if (focusedMsgId) setFocusedMsgId(null);
                  }
                } : {})}
                onTouchStart={() => {
                  if (showEmoji) setShowEmoji(false);
                  if (focusedMsgId) setFocusedMsgId(null);
                }}
                onScrollBeginDrag={() => {
                  if (showEmoji) setShowEmoji(false);
                  if (focusedMsgId) setFocusedMsgId(null);
                }}
                ListEmptyComponent={
                  <View style={styles.noMessagesState}>
                    <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
                  </View>
                }
              />
            </>
          )}

          {compact && emojiPicker}
          <MessageComposer
            activeConvo={activeConvo} colors={colors} styles={styles} userRole={userRole} userEmail={userEmail} compact={compact}
            replyTo={replyTo} setReplyTo={setReplyTo}
            attachment={attachment} removeAttachment={removeAttachment}
            uploading={uploading} sending={sending} pickFile={pickFile}
            showEmoji={showEmoji} setShowEmoji={setShowEmoji}
            inputText={inputText} setInputText={setInputText} sendMessage={sendMessage}
          />
        </View>
      )}

      {/* Emoji picker — floats above the composer as an overlay spanning the
          whole chat panel, so tapping anywhere outside (message list included)
          closes it, WhatsApp-style. */}
      {!compact && showEmoji && (
        <>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => setShowEmoji(false)} />
          {emojiPicker}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

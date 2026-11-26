/**
 * Portal icon (Website Redesign, Phase 3): Lucide outline icons.
 *
 * Lucide (ISC licence) is the maintained continuation of Feather, the set the
 * app already uses, so every existing Feather name maps 1:1 onto the same
 * drawing; it adds the symbols Feather lacks (calendar-check, graduation cap,
 * speaking mic, megaphone, earth, trophy, ...). One stroke width and a 24px
 * grid keep icons aligned with their labels. Icons are imported one by one
 * so the bundle only carries the ones used here.
 *
 * `name` accepts Lucide names and the Feather names used across the app.
 * An unknown name falls back to Feather so nothing disappears.
 */
import React from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { LucideIcon } from 'lucide-react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Award from 'lucide-react-native/icons/award';
import Bell from 'lucide-react-native/icons/bell';
import BookAudio from 'lucide-react-native/icons/book-audio';
import BookOpen from 'lucide-react-native/icons/book-open';
import BookOpenText from 'lucide-react-native/icons/book-open-text';
import Bookmark from 'lucide-react-native/icons/bookmark';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import CalendarPlus from 'lucide-react-native/icons/calendar-plus';
import ChartNoAxesColumn from 'lucide-react-native/icons/chart-no-axes-column';
import Check from 'lucide-react-native/icons/check';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleUserRound from 'lucide-react-native/icons/circle-user-round';
import CircleX from 'lucide-react-native/icons/circle-x';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ClipboardCheck from 'lucide-react-native/icons/clipboard-check';
import Clock from 'lucide-react-native/icons/clock';
import CreditCard from 'lucide-react-native/icons/credit-card';
import Download from 'lucide-react-native/icons/download';
import Earth from 'lucide-react-native/icons/earth';
import ExternalLink from 'lucide-react-native/icons/external-link';
import FolderOpen from 'lucide-react-native/icons/folder-open';
import Gift from 'lucide-react-native/icons/gift';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Headphones from 'lucide-react-native/icons/headphones';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import Layers from 'lucide-react-native/icons/layers';
import LifeBuoy from 'lucide-react-native/icons/life-buoy';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Megaphone from 'lucide-react-native/icons/megaphone';
import Menu from 'lucide-react-native/icons/menu';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import MessageSquare from 'lucide-react-native/icons/message-square';
import Mic from 'lucide-react-native/icons/mic';
import MicOff from 'lucide-react-native/icons/mic-off';
import MicVocal from 'lucide-react-native/icons/mic-vocal';
import Monitor from 'lucide-react-native/icons/monitor';
import Moon from 'lucide-react-native/icons/moon';
import MoonStar from 'lucide-react-native/icons/moon-star';
import Pencil from 'lucide-react-native/icons/pencil';
import Play from 'lucide-react-native/icons/play';
import Plus from 'lucide-react-native/icons/plus';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import School from 'lucide-react-native/icons/school';
import Search from 'lucide-react-native/icons/search';
import SendHorizontal from 'lucide-react-native/icons/send-horizontal';
import Settings from 'lucide-react-native/icons/settings';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Square from 'lucide-react-native/icons/square';
import Star from 'lucide-react-native/icons/star';
import Sun from 'lucide-react-native/icons/sun';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Target from 'lucide-react-native/icons/target';
import TimerReset from 'lucide-react-native/icons/timer-reset';
import Trophy from 'lucide-react-native/icons/trophy';
import User from 'lucide-react-native/icons/user';
import Users from 'lucide-react-native/icons/users';
import X from 'lucide-react-native/icons/x';
import Zap from 'lucide-react-native/icons/zap';
// Website Redesign, Phase 4 (Teacher Portal)
import UserRoundCheck from 'lucide-react-native/icons/user-round-check';
import Newspaper from 'lucide-react-native/icons/newspaper';
import FileText from 'lucide-react-native/icons/file-text';
import ImageIcon from 'lucide-react-native/icons/image';
import CloudUpload from 'lucide-react-native/icons/cloud-upload';
import MapIcon from 'lucide-react-native/icons/map';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Eye from 'lucide-react-native/icons/eye';
import ImagePlus from 'lucide-react-native/icons/image-plus';
import Replace from 'lucide-react-native/icons/replace';
import Trash from 'lucide-react-native/icons/trash';
import Move from 'lucide-react-native/icons/move';
import Upload from 'lucide-react-native/icons/upload';
import Cpu from 'lucide-react-native/icons/cpu';
import CirclePlus from 'lucide-react-native/icons/circle-plus';
import FileUp from 'lucide-react-native/icons/file-up';
import FileStack from 'lucide-react-native/icons/file-stack';
import SquarePen from 'lucide-react-native/icons/square-pen';
import Library from 'lucide-react-native/icons/library';
import UserPlus from 'lucide-react-native/icons/user-plus';
import LinkIcon from 'lucide-react-native/icons/link';
import ClipboardList from 'lucide-react-native/icons/clipboard-list';
import Printer from 'lucide-react-native/icons/printer';
import Copy from 'lucide-react-native/icons/copy';
import EyeOff from 'lucide-react-native/icons/eye-off';

const LUCIDE: Record<string, LucideIcon> = {
  // Student Portal destinations
  'layout-grid': LayoutGrid,
  'circle-user-round': CircleUserRound,
  'book-open': BookOpen,
  'message-circle': MessageCircle,
  'mic-vocal': MicVocal,
  'calendar-days': CalendarDays,
  'calendar-check': CalendarCheck,
  clock: Clock,
  'folder-open': FolderOpen,
  megaphone: Megaphone,
  earth: Earth,
  school: School,
  'moon-star': MoonStar,
  sunrise: Sunrise,
  'book-audio': BookAudio,
  'clipboard-check': ClipboardCheck,
  target: Target,
  trophy: Trophy,
  'chart-no-axes-column': ChartNoAxesColumn,
  gift: Gift,
  'credit-card': CreditCard,
  'life-buoy': LifeBuoy,
  settings: Settings,
  // Shared actions (same symbol wherever the action appears)
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  x: X,
  pencil: Pencil,
  download: Download,
  'send-horizontal': SendHorizontal,
  'rotate-ccw': RotateCcw,
  'log-out': LogOut,
  menu: Menu,
  bell: Bell,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  search: Search,
  plus: Plus,
  'calendar-plus': CalendarPlus,
  check: Check,
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  'external-link': ExternalLink,
  'book-open-text': BookOpenText,
  bookmark: Bookmark,
  headphones: Headphones,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  mic: Mic,
  'mic-off': MicOff,
  square: Square,
  play: Play,
  lock: Lock,
  star: Star,
  user: User,
  users: Users,
  'graduation-cap': GraduationCap,
  layers: Layers,
  award: Award,
  zap: Zap,
  'message-square': MessageSquare,
  'timer-reset': TimerReset,
  'user-round-check': UserRoundCheck,
  newspaper: Newspaper,
  'file-text': FileText,
  'image': ImageIcon,
  'cloud-upload': CloudUpload,
  'map': MapIcon,
  'briefcase': Briefcase,
  'eye': Eye,
  'image-plus': ImagePlus,
  'replace': Replace,
  'trash': Trash,
  'move': Move,
  'upload': Upload,
  'cpu': Cpu,
  'circle-plus': CirclePlus,
  'file-up': FileUp,
  'file-stack': FileStack,
  'square-pen': SquarePen,
  'library': Library,
  'user-plus': UserPlus,
  'link': LinkIcon,
  'clipboard-list': ClipboardList,
  'printer': Printer,
  'copy': Copy,
  'eye-off': EyeOff,
};

/** Feather names used in the app → their Lucide equivalent. */
const FEATHER_TO_LUCIDE: Record<string, string> = {
  grid: 'layout-grid',
  'user-check': 'mic-vocal',
  calendar: 'calendar-days',
  clipboard: 'calendar-check',
  columns: 'clock',
  folder: 'folder-open',
  'volume-2': 'megaphone',
  globe: 'earth',
  book: 'moon-star',
  'check-square': 'clipboard-check',
  'bar-chart-2': 'chart-no-axes-column',
  'help-circle': 'life-buoy',
  'edit-2': 'pencil',
  'edit-3': 'pencil',
  send: 'send-horizontal',
  'refresh-cw': 'rotate-ccw',
  'check-circle': 'circle-check',
  'x-circle': 'circle-x',
  // Teacher Portal (Phase 4)
  'upload-cloud': 'cloud-upload',
  'trash-2': 'trash',
  'plus-circle': 'circle-plus',
  'edit': 'square-pen',
  'external-link': 'external-link',
  'log-out': 'log-out',
};

export type IconProps = {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
  accessibilityLabel?: string;
};

export default function Icon({ name, size = 20, color = '#302117', strokeWidth = 2, style, accessibilityLabel }: IconProps) {
  const key = LUCIDE[name] ? name : FEATHER_TO_LUCIDE[name];
  const Glyph = key ? LUCIDE[key] : undefined;
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  if (!Glyph) return <Feather name={name as any} size={size} color={color} style={style} {...a11y} />;
  // Lucide draws a plain <svg> on web, which only understands ARIA attributes.
  const svgA11y = Platform.OS === 'web'
    ? (accessibilityLabel ? { role: 'img', 'aria-label': accessibilityLabel } : { 'aria-hidden': true })
    : a11y;
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} style={style} {...(svgA11y as any)} />;
}

/** Whether `name` renders through Lucide (mainly for tests). */
export function isLucideIcon(name: string) {
  return !!(LUCIDE[name] || FEATHER_TO_LUCIDE[name]);
}

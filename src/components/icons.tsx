import React from 'react';
import {View, Text} from 'react-native';
import Svg, {Path, Circle, Line, Rect} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';

interface IconProps {
  size?: number;
  color?: string;
}

// ─── Navigation Icons ─────────────────────────────────────────

export const BackArrowIcon = ({
  size = 24,
  color = COLORS.textWhite,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size * 0.96)}
    viewBox="0 0 24 23"
    fill="none">
    <Line
      x1={22}
      y1={11.5}
      x2={3}
      y2={11.5}
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.5 21.5L1.5 11.5L11.5 1.5"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CloseIcon = ({size = 22, color = COLORS.secondary}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronDownIcon = ({
  size = 16,
  color = COLORS.secondary,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Header / Nav Icons ──────────────────────────────────────

export const ShoppingBagIcon = ({
  size = 30,
  count,
}: {
  size?: number;
  count?: number;
}) => {
  // SVG viewBox is 30x31; built-in badge circle sits at (9, 9) with r=8.
  // Map those viewBox coords back to screen px so the overlaid count text
  // lands inside that circle regardless of `size`.
  const px = scale(size) / 30;
  const circleSize = 16 * px; // diameter = 2 * r
  const circleLeft = (9 - 8) * px;
  const circleTop = (9 - 8) * px;

  const hasCount = typeof count === 'number' && count > 0;
  const label = hasCount ? (count! > 99 ? '99+' : String(count)) : '';

  return (
    <View style={{width: scale(size), height: scale(size + 1)}}>
      <Svg
        width={scale(size)}
        height={scale(size + 1)}
        viewBox="0 0 30 31"
        fill="none">
        <Path
          d="M10.6667 5L7 9.88889V27C7 28.35 8.09442 29.4444 9.44444 29.4444H26.5556C27.9056 29.4444 29 28.35 29 27V9.88889L25.3333 5H10.6667Z"
          stroke={COLORS.yellowIcon}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Line
          x1={8}
          y1={9}
          x2={28}
          y2={9}
          stroke={COLORS.yellowIcon}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M22 16.2222C22 18.4314 20.2091 20.2222 18 20.2222C15.7909 20.2222 14 18.4314 14 16.2222"
          stroke={COLORS.yellowIcon}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={9}
          cy={9}
          r={8}
          fill={COLORS.secondary}
          stroke={COLORS.yellowIcon}
          strokeWidth={2}
        />
      </Svg>
      {hasCount && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: circleLeft,
            top: circleTop,
            width: circleSize,
            height: circleSize,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: scale(label.length > 2 ? 8 : 10),
              color: COLORS.yellowIcon,
              lineHeight: scale(label.length > 2 ? 9 : 11),
            }}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
};

export const ProfileIcon = ({size = 24}: {size?: number}) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M12 1.95122C6.48 1.95122 2 6.32247 2 11.7085C2 17.0945 6.48 21.4657 12 21.4657C17.52 21.4657 22 17.0945 22 11.7085C22 6.32247 17.52 1.95122 12 1.95122ZM12 4.8784C13.66 4.8784 15 6.18587 15 7.80558C15 9.42528 13.66 10.7328 12 10.7328C10.34 10.7328 9 9.42528 9 7.80558C9 6.18587 10.34 4.8784 12 4.8784ZM12 18.7337C9.5 18.7337 7.29 17.4848 6 15.5919C6.03 13.6502 10 12.5866 12 12.5866C13.99 12.5866 17.97 13.6502 18 15.5919C16.71 17.4848 14.5 18.7337 12 18.7337Z"
      fill={COLORS.yellowIcon}
    />
  </Svg>
);

// ─── Search & Filter Icons ───────────────────────────────────

export const SearchIcon = ({
  size = 18,
  color = COLORS.textDark,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 18 18"
    fill="none">
    <Path
      d="M8.11111 15.2222C12.0385 15.2222 15.2222 12.0385 15.2222 8.11111C15.2222 4.18375 12.0385 1 8.11111 1C4.18375 1 1 4.18375 1 8.11111C1 12.0385 4.18375 15.2222 8.11111 15.2222Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 17L13.1333 13.1333"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FilterIcon = ({
  size = 20,
  color = COLORS.secondary,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M4 4H20V6.172C20 6.702 19.789 7.211 19.414 7.586L14.586 12.414C14.211 12.789 14 13.298 14 13.828V17L10 21V13.828C10 13.298 9.789 12.789 9.414 12.414L4.586 7.586C4.211 7.211 4 6.702 4 6.172V4Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Action Icons ────────────────────────────────────────────

export const EditIcon = ({size = 16, color = COLORS.secondary}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M13.26 3.59997L5.04997 12.29C4.73997 12.62 4.43997 13.27 4.37997 13.72L4.00997 16.96C3.87997 18.13 4.71997 18.93 5.87997 18.73L9.09997 18.18C9.54997 18.1 10.18 17.77 10.49 17.43L18.7 8.73997C20.12 7.23997 20.76 5.52997 18.55 3.43997C16.35 1.36997 14.68 2.09997 13.26 3.59997Z"
      stroke={color}
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DeleteIcon = ({
  size = 18,
  color = COLORS.error,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M3 6H5H21"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusIcon = ({size = 14, color = COLORS.secondary}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const MinusIcon = ({
  size = 14,
  color = COLORS.secondary,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M5 12H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Status Icons ────────────────────────────────────────────

export const CheckCircleIcon = ({
  size = 24,
  color = COLORS.success,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.5} />
    <Path
      d="M8 12L11 15L16 9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const InfoIcon = ({size = 16, color = COLORS.warning}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.5} />
    <Path
      d="M12 16V12M12 8H12.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Radio Buttons ───────────────────────────────────────────

export const RadioEmpty = ({size = 22}: {size?: number}) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 22 22"
    fill="none">
    <Circle cx={11} cy={11} r={10} stroke={COLORS.grayBg} strokeWidth={1.5} />
  </Svg>
);

export const RadioFilled = ({size = 22}: {size?: number}) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 22 22"
    fill="none">
    <Circle cx={11} cy={11} r={10} stroke={COLORS.primary} strokeWidth={1.5} />
    <Circle cx={11} cy={11} r={6} fill={COLORS.primary} />
  </Svg>
);

// ─── Form Icons ──────────────────────────────────────────────

export const PersonIcon = ({
  size = 20,
  color = COLORS.textSecondary,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.5} />
  </Svg>
);

export const LocationPinIcon = ({
  size = 20,
  color = COLORS.textSecondary,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
      stroke={color}
      strokeWidth={1.5}
    />
    <Circle cx={12} cy={9} r={2.5} stroke={color} strokeWidth={1.5} />
  </Svg>
);

export const PhoneIcon = ({
  size = 20,
  color = COLORS.textSecondary,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Rect
      x={6}
      y={3}
      width={12}
      height={18}
      rx={2}
      stroke={color}
      strokeWidth={1.5}
    />
    <Line
      x1={10}
      y1={17}
      x2={14}
      y2={17}
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

export const EmailIcon = ({
  size = 18,
  color = COLORS.textSecondary,
}: IconProps) => (
  <Svg
    width={scale(size)}
    height={scale(size)}
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M4 6H20V18H4V6Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 6L12 13L20 6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

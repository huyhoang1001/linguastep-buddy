import React from 'react';
import {
  CatCompanionId,
  CatAccessoryId,
  CatMood,
  CAT_COMPANIONS
} from '../types/catTheme.ts';
import { playMeowSound, playPurrSound } from '../services/catSoundService.ts';

interface CatChibiAvatarProps {
  companionId?: CatCompanionId;
  accessoryId?: CatAccessoryId;
  mood?: CatMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CatChibiAvatar: React.FC<CatChibiAvatarProps> = ({
  companionId = 'mikan',
  accessoryId = 'none',
  mood = 'happy',
  size = 'md',
  interactive = false,
  className = '',
  onClick
}) => {
  const companion = CAT_COMPANIONS[companionId] || CAT_COMPANIONS.mikan;

  const sizePixels = {
    sm: 36,
    md: 52,
    lg: 84,
    xl: 120
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    if (interactive) {
      if (mood === 'purring') {
        playPurrSound();
      } else {
        playMeowSound(companionId === 'mochi' ? 1.2 : companionId === 'kuro' ? 0.95 : 1.1);
      }
    }
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center select-none transition-transform ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
      title={`${companion.name} (${companion.breedTitle})`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Cat Ears */}
        {/* Left Ear */}
        <path
          d="M20 44 L10 16 C10 16 34 22 40 32 Z"
          fill={companion.avatarColor}
          stroke="#0F172A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M20 38 L15 22 C15 22 30 26 34 32 Z"
          fill={companion.earColor}
          opacity="0.85"
        />

        {/* Right Ear */}
        <path
          d="M80 44 L90 16 C90 16 66 22 60 32 Z"
          fill={companion.avatarColor}
          stroke="#0F172A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M80 38 L85 22 C85 22 70 26 66 32 Z"
          fill={companion.earColor}
          opacity="0.85"
        />

        {/* Cat Head Base */}
        <ellipse
          cx="50"
          cy="56"
          rx="38"
          ry="32"
          fill={companion.avatarColor}
          stroke="#0F172A"
          strokeWidth="3.5"
        />

        {/* Tabby Stripes if Mikan */}
        {companionId === 'mikan' && (
          <g fill="#EA580C" opacity="0.45">
            <path d="M47 30 L53 30 L51 40 L49 40 Z" />
            <path d="M38 32 L43 33 L40 41 L36 40 Z" />
            <path d="M62 32 L57 33 L60 41 L64 40 Z" />
          </g>
        )}

        {/* Celestial Star if Luna */}
        {companionId === 'luna' && (
          <path
            d="M50 34 L52 39 L57 40 L53 43 L54 48 L50 45 L46 48 L47 43 L43 40 L48 39 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="0.8"
          />
        )}

        {/* Siamese Mask if Boba */}
        {companionId === 'boba' && (
          <ellipse
            cx="50"
            cy="56"
            rx="18"
            ry="14"
            fill="#451A03"
            opacity="0.25"
          />
        )}

        {/* Blush Cheeks */}
        <ellipse cx="26" cy="62" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.6" />
        <ellipse cx="74" cy="62" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.6" />

        {/* Whiskers */}
        <g stroke={companion.whiskerColor} strokeWidth="2" strokeLinecap="round">
          {/* Left Whiskers */}
          <line x1="8" y1="58" x2="26" y2="60" />
          <line x1="10" y1="65" x2="26" y2="64" />
          {/* Right Whiskers */}
          <line x1="92" y1="58" x2="74" y2="60" />
          <line x1="90" y1="65" x2="74" y2="64" />
        </g>

        {/* Eyes according to Mood */}
        {mood === 'happy' && (
          <g stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round">
            {/* Happy Curved Eyes */}
            <path d="M32 54 C35 48 41 48 44 54" fill="none" />
            <path d="M56 54 C59 48 65 48 68 54" fill="none" />
          </g>
        )}

        {mood === 'purring' && (
          <g stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round">
            {/* Soft closed bliss eyes */}
            <path d="M32 53 C36 57 42 57 44 53" fill="none" />
            <path d="M56 53 C60 57 66 57 68 53" fill="none" />
            {/* Cute Little Floating Heart */}
            <path
              d="M50 20 C50 17 46 15 44 18 C42 15 38 17 38 20 C38 24 44 27 44 27 C44 27 50 24 50 20 Z"
              fill="#F43F5E"
              opacity="0.9"
            />
          </g>
        )}

        {mood === 'studying' && (
          <g>
            {/* Focused Round Eyes */}
            <circle cx="38" cy="53" r="5" fill={companion.eyeColor} stroke="#0F172A" strokeWidth="2.5" />
            <circle cx="62" cy="53" r="5" fill={companion.eyeColor} stroke="#0F172A" strokeWidth="2.5" />
            {/* Eye glint */}
            <circle cx="36" cy="51" r="1.8" fill="#FFFFFF" />
            <circle cx="60" cy="51" r="1.8" fill="#FFFFFF" />
            {/* Cute Scholar Spectacles */}
            <circle cx="38" cy="53" r="8" fill="none" stroke="#6366F1" strokeWidth="2" opacity="0.9" />
            <circle cx="62" cy="53" r="8" fill="none" stroke="#6366F1" strokeWidth="2" opacity="0.9" />
            <line x1="46" y1="53" x2="54" y2="53" stroke="#6366F1" strokeWidth="2" />
          </g>
        )}

        {mood === 'excited' && (
          <g>
            {/* Starry Eyes */}
            <circle cx="38" cy="53" r="6" fill={companion.eyeColor} stroke="#0F172A" strokeWidth="2" />
            <circle cx="62" cy="53" r="6" fill={companion.eyeColor} stroke="#0F172A" strokeWidth="2" />
            {/* Star glints */}
            <path d="M38 49 L39 52 L42 53 L39 54 L38 57 L37 54 L34 53 L37 52 Z" fill="#FDE047" />
            <path d="M62 49 L63 52 L66 53 L63 54 L62 57 L61 54 L58 53 L61 52 Z" fill="#FDE047" />
          </g>
        )}

        {mood === 'sleepy' && (
          <g stroke="#0F172A" strokeWidth="3" strokeLinecap="round">
            {/* Straight relaxed eyes */}
            <line x1="33" y1="54" x2="43" y2="54" />
            <line x1="57" y1="54" x2="67" y2="54" />
            {/* Little zZz */}
            <text x="76" y="32" fill="#818CF8" fontSize="12" fontWeight="bold">z</text>
            <text x="84" y="24" fill="#A5B4FC" fontSize="9" fontWeight="bold">Z</text>
          </g>
        )}

        {/* Cute Pink Triangular Nose */}
        <polygon points="50,62 46,58 54,58" fill="#FB7185" />

        {/* Cute Cat Mouth: :3 */}
        <path
          d="M44 65 C47 68 50 67 50 64 C50 67 53 68 56 65"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Small Bottom Paws Peeking */}
        <ellipse cx="36" cy="84" rx="7" ry="5" fill={companion.avatarColor} stroke="#0F172A" strokeWidth="2.5" />
        <ellipse cx="64" cy="84" rx="7" ry="5" fill={companion.avatarColor} stroke="#0F172A" strokeWidth="2.5" />
        {/* Pink Paw Pads */}
        <circle cx="36" cy="84" r="2.5" fill="#FDA4AF" />
        <circle cx="64" cy="84" r="2.5" fill="#FDA4AF" />

        {/* Accessories Layer */}
        {accessoryId === 'ribbon' && (
          <g>
            {/* Red Bow on Collar */}
            <path d="M42 82 L34 76 L35 88 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
            <path d="M58 82 L66 76 L65 88 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
            <circle cx="50" cy="82" r="4" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
          </g>
        )}

        {accessoryId === 'wizard' && (
          <g>
            {/* Wizard Hat on Head */}
            <path
              d="M24 34 Q50 28 76 34 L62 8 Q46 6 40 10 Z"
              fill="#6366F1"
              stroke="#312E81"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Hat Band */}
            <path d="M28 33 Q50 28 72 33 L70 30 Q50 25 30 30 Z" fill="#FBBF24" />
            {/* Star on Hat */}
            <circle cx="48" cy="18" r="2.5" fill="#FDE047" />
          </g>
        )}

        {accessoryId === 'graduation' && (
          <g>
            {/* Graduation Cap */}
            <polygon points="50,14 82,24 50,34 18,24" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
            <rect x="42" y="27" width="16" height="7" fill="#1E293B" rx="1" />
            {/* Golden Tassel */}
            <line x1="50" y1="24" x2="72" y2="28" stroke="#FBBF24" strokeWidth="2" />
            <circle cx="72" cy="30" r="2" fill="#F59E0B" />
          </g>
        )}

        {accessoryId === 'fish' && (
          <g>
            {/* Cute Yellow Fish Sitting on Head */}
            <ellipse cx="50" cy="22" rx="14" ry="7" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            <polygon points="36,22 28,16 28,28" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="58" cy="20" r="1.5" fill="#0F172A" />
            <path d="M48 19 Q52 22 48 25" fill="none" stroke="#B45309" strokeWidth="1" />
          </g>
        )}

        {accessoryId === 'bell' && (
          <g>
            {/* Collar Band */}
            <path d="M30 80 Q50 86 70 80" stroke="#DC2626" strokeWidth="3" fill="none" />
            {/* Golden Bell */}
            <circle cx="50" cy="85" r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            <line x1="47" y1="87" x2="53" y2="87" stroke="#78350F" strokeWidth="1.2" />
            <circle cx="50" cy="87" r="1.2" fill="#78350F" />
          </g>
        )}
      </svg>
    </div>
  );
};

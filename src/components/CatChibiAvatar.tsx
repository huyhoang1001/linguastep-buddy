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
          <g>
            {/* Expressive Cute Eyebrows */}
            <path d="M31.5 43 Q36 40.5 40.5 43" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
            <path d="M59.5 43 Q64 40.5 68.5 43" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

            {/* Left Eye - Big Cute Chibi Boba Eye */}
            <ellipse cx="36" cy="52" rx="6.5" ry="7.5" fill="#0F172A" />
            {/* Luminous Lower Iris */}
            <ellipse cx="36" cy="53.5" rx="5.5" ry="5.2" fill={companion.eyeColor} />
            {/* Lower Rim Reflection */}
            <path d="M31.5 54 C32 58 40 58 40.5 54 C39.5 56.5 32.5 56.5 31.5 54 Z" fill="#FFFFFF" opacity="0.45" />
            {/* Deep Pupil */}
            <ellipse cx="36" cy="52" rx="3" ry="4.2" fill="#0B1120" />
            {/* Glossy Anime Catchlights */}
            <ellipse cx="33.8" cy="48.8" rx="2.4" ry="2" fill="#FFFFFF" transform="rotate(-15 33.8 48.8)" />
            <circle cx="38.5" cy="55.2" r="1.2" fill="#FFFFFF" opacity="0.9" />
            <circle cx="34.2" cy="55" r="0.75" fill="#FFFFFF" opacity="0.75" />
            {/* Upper Lash Line with Anime Flick */}
            <path d="M29 50.5 C31 44.5 41 44.5 43.2 50.5" fill="none" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M42.5 49.5 C44.5 48.2 45.8 46.5 46.5 44.5" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

            {/* Right Eye - Symmetrical Cute Chibi Boba Eye */}
            <ellipse cx="64" cy="52" rx="6.5" ry="7.5" fill="#0F172A" />
            {/* Luminous Lower Iris */}
            <ellipse cx="64" cy="53.5" rx="5.5" ry="5.2" fill={companion.eyeColor} />
            {/* Lower Rim Reflection */}
            <path d="M59.5 54 C60 58 68 58 68.5 54 C67.5 56.5 60.5 56.5 59.5 54 Z" fill="#FFFFFF" opacity="0.45" />
            {/* Deep Pupil */}
            <ellipse cx="64" cy="52" rx="3" ry="4.2" fill="#0B1120" />
            {/* Glossy Anime Catchlights */}
            <ellipse cx="61.8" cy="48.8" rx="2.4" ry="2" fill="#FFFFFF" transform="rotate(-15 61.8 48.8)" />
            <circle cx="66.5" cy="55.2" r="1.2" fill="#FFFFFF" opacity="0.9" />
            <circle cx="62.2" cy="55" r="0.75" fill="#FFFFFF" opacity="0.75" />
            {/* Upper Lash Line with Anime Flick */}
            <path d="M56.8 50.5 C59 44.5 69 44.5 71 50.5" fill="none" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M57.5 49.5 C55.5 48.2 54.2 46.5 53.5 44.5" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {mood === 'purring' && (
          <g stroke="#0F172A" strokeLinecap="round">
            {/* Happy Arched Brows */}
            <path d="M31 43 Q36 40.5 41 43" fill="none" strokeWidth="1.8" opacity="0.6" />
            <path d="M59 43 Q64 40.5 69 43" fill="none" strokeWidth="1.8" opacity="0.6" />

            {/* Blissful Curved Happy Cat Eyes */}
            <path d="M29 52 C32.5 58 39.5 58 43 52" fill="none" strokeWidth="3.2" />
            <path d="M42.5 52.5 L45.2 49.5" fill="none" strokeWidth="2" />
            <path d="M40 54.5 L42.5 52.5" fill="none" strokeWidth="1.8" />

            <path d="M57 52 C60.5 58 67.5 58 71 52" fill="none" strokeWidth="3.2" />
            <path d="M57.5 52.5 L54.8 49.5" fill="none" strokeWidth="2" />
            <path d="M60 54.5 L57.5 52.5" fill="none" strokeWidth="1.8" />

            {/* Cute Little Floating Heart */}
            <path
              d="M50 20 C50 17 46 15 44 18 C42 15 38 17 38 20 C38 24 44 27 44 27 C44 27 50 24 50 20 Z"
              fill="#F43F5E"
              opacity="0.95"
            />
          </g>
        )}

        {mood === 'studying' && (
          <g>
            {/* Inquisitive Scholar Eyebrows */}
            <path d="M31 41 Q36 38 41 42" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" fill="none" />
            <path d="M59 42 Q64 39 69 41" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" fill="none" />

            {/* Left Eye - Focused Smart Eyes */}
            <ellipse cx="36" cy="52" rx="6.5" ry="7.2" fill="#0F172A" />
            <ellipse cx="36" cy="53.5" rx="5.5" ry="5" fill={companion.eyeColor} />
            <ellipse cx="36" cy="52" rx="2.8" ry="3.8" fill="#0B1120" />
            <circle cx="34" cy="49.5" r="2" fill="#FFFFFF" />
            <circle cx="38" cy="54.5" r="1.1" fill="#FFFFFF" opacity="0.85" />
            <path d="M29.5 50.5 C31.5 45 40.5 45 42.5 50.5" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

            {/* Right Eye - Focused Smart Eyes */}
            <ellipse cx="64" cy="52" rx="6.5" ry="7.2" fill="#0F172A" />
            <ellipse cx="64" cy="53.5" rx="5.5" ry="5" fill={companion.eyeColor} />
            <ellipse cx="64" cy="52" rx="2.8" ry="3.8" fill="#0B1120" />
            <circle cx="62" cy="49.5" r="2" fill="#FFFFFF" />
            <circle cx="66" cy="54.5" r="1.1" fill="#FFFFFF" opacity="0.85" />
            <path d="M57.5 50.5 C59.5 45 68.5 45 70.5 50.5" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

            {/* Cute Scholar Spectacles */}
            <circle cx="36" cy="52" r="9.5" fill="none" stroke="#6366F1" strokeWidth="2.2" />
            <circle cx="64" cy="52" r="9.5" fill="none" stroke="#6366F1" strokeWidth="2.2" />
            <path d="M45.5 52 Q50 49.5 54.5 52" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" />
            {/* Spectacle Glare Reflection Lines */}
            <line x1="39" y1="46" x2="43" y2="50" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
            <line x1="67" y1="46" x2="71" y2="50" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
          </g>
        )}

        {mood === 'excited' && (
          <g>
            {/* Wide Joyful Eyebrows */}
            <path d="M30 40 Q36 36 42 40" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M58 40 Q64 36 70 40" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Extra Big Sparkling Starry Eyes */}
            <ellipse cx="36" cy="52" rx="7.5" ry="8.2" fill="#0F172A" />
            <ellipse cx="36" cy="53.5" rx="6.5" ry="6" fill={companion.eyeColor} />
            {/* Star Glint inside Left Eye */}
            <path d="M36 46.5 L37.5 50.5 L41.5 52 L37.5 53.5 L36 57.5 L34.5 53.5 L30.5 52 L34.5 50.5 Z" fill="#FBBF24" stroke="#FDE68A" strokeWidth="0.6" />
            <circle cx="36" cy="52" r="1.5" fill="#FEF08A" />
            <circle cx="33" cy="48" r="2.2" fill="#FFFFFF" />
            <circle cx="39" cy="55.5" r="1.3" fill="#FFFFFF" />

            {/* Extra Big Sparkling Starry Eyes */}
            <ellipse cx="64" cy="52" rx="7.5" ry="8.2" fill="#0F172A" />
            <ellipse cx="64" cy="53.5" rx="6.5" ry="6" fill={companion.eyeColor} />
            {/* Star Glint inside Right Eye */}
            <path d="M64 46.5 L65.5 50.5 L69.5 52 L65.5 53.5 L64 57.5 L62.5 53.5 L58.5 52 L62.5 50.5 Z" fill="#FBBF24" stroke="#FDE68A" strokeWidth="0.6" />
            <circle cx="64" cy="52" r="1.5" fill="#FEF08A" />
            <circle cx="61" cy="48" r="2.2" fill="#FFFFFF" />
            <circle cx="67" cy="55.5" r="1.3" fill="#FFFFFF" />
          </g>
        )}

        {mood === 'sleepy' && (
          <g strokeLinecap="round">
            {/* Drowsy Relaxed Brows */}
            <path d="M32 44 Q36 45 40 43" stroke="#0F172A" strokeWidth="1.8" opacity="0.5" fill="none" />
            <path d="M60 43 Q64 45 68 44" stroke="#0F172A" strokeWidth="1.8" opacity="0.5" fill="none" />

            {/* Peeking Glimpse of Iris */}
            <path d="M29 53 Q36 58 43 53 Q36 55 29 53 Z" fill={companion.eyeColor} opacity="0.85" />
            <circle cx="36" cy="54" r="1.6" fill="#0F172A" />
            {/* Cozy Sleepy Downward Eyelids */}
            <path d="M28.5 52.5 Q36 57 43.5 52.5" fill="none" stroke="#0F172A" strokeWidth="3.2" />
            <path d="M43 53.5 L45 56" fill="none" stroke="#0F172A" strokeWidth="2" />

            <path d="M57 53 Q64 58 71 53 Q64 55 57 53 Z" fill={companion.eyeColor} opacity="0.85" />
            <circle cx="64" cy="54" r="1.6" fill="#0F172A" />
            <path d="M56.5 52.5 Q64 57 71.5 52.5" fill="none" stroke="#0F172A" strokeWidth="3.2" />
            <path d="M57 53.5 L55 56" fill="none" stroke="#0F172A" strokeWidth="2" />

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

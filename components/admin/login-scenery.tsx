/**
 * Original illustrated landscape for the admin login: misty sky, layered mountains,
 * savanna trees and foreground foliage in blue-grey silhouette tones.
 */
export function LoginScenery() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="ls-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9fb5c0" />
          <stop offset="55%" stopColor="#b9c9d0" />
          <stop offset="100%" stopColor="#a7bac4" />
        </linearGradient>
        <linearGradient id="ls-haze" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
        </linearGradient>
        <symbol id="ls-acacia" viewBox="0 0 200 160">
          <path d="M96 160 L98 92 Q80 80 58 74 L60 70 Q82 74 99 84 L101 60 Q112 70 116 84 Q134 72 152 70 L153 74 Q132 80 106 94 L104 160 Z" />
          <path d="M10 66 Q20 44 54 46 Q60 30 92 34 Q108 20 134 32 Q166 26 178 46 Q198 50 192 64 Q170 74 128 70 Q96 78 64 72 Q24 78 10 66 Z" />
        </symbol>
        <symbol id="ls-tree" viewBox="0 0 400 420">
          <path d="M190 420 Q196 330 186 270 Q150 240 104 236 L108 228 Q152 228 184 246 Q178 210 160 188 L170 184 Q192 206 200 236 Q212 200 240 180 L248 188 Q222 214 214 252 Q250 232 296 232 L298 240 Q252 246 216 274 Q206 340 214 420 Z" />
          <path d="M40 210 Q10 170 44 140 Q30 96 76 80 Q86 40 132 44 Q156 8 204 20 Q246 0 278 30 Q326 26 340 66 Q384 80 372 124 Q398 156 368 188 Q372 226 330 236 Q300 262 256 248 Q220 270 180 252 Q140 270 108 250 Q60 256 40 210 Z" />
        </symbol>
      </defs>

      <rect width="1600" height="900" fill="url(#ls-sky)" />

      {/* Soft cloud bands */}
      <g fill="#ffffff" opacity="0.18">
        <path d="M0 120 Q200 90 420 118 T860 112 T1300 120 T1600 108 L1600 150 Q1380 160 1160 146 T720 150 T260 152 T0 158 Z" />
        <path d="M0 250 Q260 226 520 248 T1040 240 T1600 236 L1600 262 Q1320 278 1040 266 T480 272 T0 278 Z" />
      </g>

      {/* Distant mountains */}
      <path
        fill="#8fa6b3"
        d="M0 560 L120 470 L210 500 L330 380 L430 330 L520 380 L640 300 L760 380 L860 420 L980 360 L1100 300 L1210 360 L1320 330 L1450 420 L1600 380 L1600 900 L0 900 Z"
      />
      <path fill="url(#ls-haze)" d="M0 300 H1600 V700 H0 Z" />

      {/* Middle hills */}
      <path
        fill="#7891a0"
        d="M0 620 Q140 560 300 580 T620 560 T940 590 T1260 560 T1600 580 L1600 900 L0 900 Z"
      />

      {/* Mid-distance acacia trees */}
      <g fill="#5f7a8a">
        <use href="#ls-acacia" x="40" y="520" width="230" height="184" />
        <use href="#ls-acacia" x="290" y="590" width="150" height="120" />
        <use href="#ls-acacia" x="1130" y="560" width="200" height="160" />
        <use href="#ls-acacia" x="1360" y="540" width="240" height="192" />
      </g>

      {/* Near hills */}
      <path
        fill="#4b6575"
        d="M0 720 Q220 660 460 690 T920 700 T1380 680 T1600 700 L1600 900 L0 900 Z"
      />

      {/* Large centre tree */}
      <g fill="#14262f">
        <use href="#ls-tree" x="410" y="10" width="780" height="820" />
      </g>

      {/* Foreground ground + foliage */}
      <path fill="#1f3642" d="M0 810 Q300 770 620 792 T1240 786 T1600 800 L1600 900 L0 900 Z" />
      <g fill="#10222b">
        <path d="M0 900 L0 760 Q30 770 40 800 Q50 740 90 730 Q80 790 96 820 Q120 770 160 774 Q130 820 140 900 Z" />
        <path d="M1600 900 L1600 760 Q1570 770 1560 800 Q1548 740 1508 730 Q1520 790 1504 820 Q1480 770 1440 774 Q1470 820 1460 900 Z" />
        <path d="M300 900 Q306 850 296 820 L304 818 Q316 850 312 900 Z M320 900 Q330 840 352 812 L358 818 Q340 850 332 900 Z" />
        <path d="M1220 900 Q1226 850 1216 820 L1224 818 Q1236 850 1232 900 Z M1240 900 Q1250 840 1272 812 L1278 818 Q1260 850 1252 900 Z" />
      </g>
    </svg>
  )
}

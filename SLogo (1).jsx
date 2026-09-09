export default function SLogo() {
  return (
    <div className="rounded-3xl p-10 w-56 h-56 flex items-center justify-center" style={{ background: "#0B1622" }}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="sGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3FC6F6" />
            <stop offset="100%" stopColor="#1257AE" />
          </linearGradient>
          <linearGradient id="foldGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="vignette" cx="30%" cy="20%" r="85%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </radialGradient>
          <filter id="glossBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.35" />
          </filter>
          <clipPath id="topClip">
            <path d="M 21,76 C 3,63 2,32 19,19 C 23,16 27,15 32,15 L 78,15 L 95,29 L 70,32 L 38,32 C 30,32 23,38 20,49 C 17,60 13,68 21,76 Z" />
          </clipPath>
          <clipPath id="bottomClip">
            <path d="M 79,26 C 97,39 98,70 81,83 C 77,86 73,87 68,87 L 22,87 L 5,73 L 30,70 L 62,70 C 70,70 77,64 80,53 C 83,42 87,34 79,26 Z" />
          </clipPath>
        </defs>

        <g style={{ filter: "url(#dropShadow)" }}>
          <path d="M 33,49 L 67,53 L 45,58 Z" fill="#061c38" opacity={0.9} />

          <g style={{ transform: "translate(-5px, 10px) rotate(0deg) scale(0.81, 0.6480000000000001)", transformOrigin: "50px 50px" }}>
            <path d="M 79,26 C 97,39 98,70 81,83 C 77,86 73,87 68,87 L 22,87 L 5,73 L 30,70 L 62,70 C 70,70 77,64 80,53 C 83,42 87,34 79,26 Z" fill="url(#sGradient)" stroke="#0d3f6e" strokeWidth={0.3} />
            <g clipPath="url(#bottomClip)">
              <path d="M 80,53 C 77,64 70,70 62,70 L 56,70 C 66,69 74,63 77,53 C 80,44 79,38 75,33 C 80,34 85,40 86,49 C 86,50.5 83,51.5 80,53 Z" fill="url(#foldGradient)" />
              <path d="M 79,26 C 97,39 98,70 81,83 C 77,86 73,87 68,87 L 22,87 L 5,73 L 30,70 L 62,70 C 70,70 77,64 80,53 C 83,42 87,34 79,26 Z" fill="url(#vignette)" />
              <ellipse cx="88" cy="34" rx="16" ry="6" fill="#ffffff" opacity="0.4" filter="url(#glossBlur)" transform="rotate(-28 88 34)" />
              <ellipse cx="45" cy="80" rx="22" ry="4.5" fill="#ffffff" opacity="0.22" filter="url(#glossBlur)" transform="rotate(-6 45 80)" />
            </g>
          </g>

          <g style={{ transform: "translate(5px, -10px) rotate(0deg) scale(0.81, 0.6480000000000001)", transformOrigin: "50px 50px" }}>
            <path d="M 21,76 C 3,63 2,32 19,19 C 23,16 27,15 32,15 L 78,15 L 95,29 L 70,32 L 38,32 C 30,32 23,38 20,49 C 17,60 13,68 21,76 Z" fill="url(#sGradient)" stroke="#0d3f6e" strokeWidth={0.3} />
            <g clipPath="url(#topClip)">
              <path d="M 20,49 C 23,38 30,32 38,32 L 44,32 C 34,33 26,39 23,49 C 20,58 21,64 25,69 C 20,68 15,62 14,53 C 14,51.5 17,50.5 20,49 Z" fill="url(#foldGradient)" />
              <path d="M 21,76 C 3,63 2,32 19,19 C 23,16 27,15 32,15 L 78,15 L 95,29 L 70,32 L 38,32 C 30,32 23,38 20,49 C 17,60 13,68 21,76 Z" fill="url(#vignette)" />
              <ellipse cx="55" cy="20" rx="22" ry="4.5" fill="#ffffff" opacity="0.45" filter="url(#glossBlur)" transform="rotate(-4 55 20)" />
              <ellipse cx="12" cy="66" rx="15" ry="5.5" fill="#ffffff" opacity="0.2" filter="url(#glossBlur)" transform="rotate(-55 12 66)" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
  dark = false,
  onClick,
}) {
  const sizeMap = {
    xs: { icon: 20, box: 'w-6 h-6 rounded-lg', text: 'text-sm' },
    sm: { icon: 24, box: 'w-8 h-8 rounded-xl', text: 'text-base' },
    md: { icon: 30, box: 'w-10 h-10 rounded-2xl', text: 'text-lg sm:text-xl' },
    lg: { icon: 38, box: 'w-13 h-13 rounded-2xl', text: 'text-2xl sm:text-3xl' },
    xl: { icon: 48, box: 'w-16 h-16 rounded-3xl', text: 'text-3xl sm:text-4xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      {/* Dynamic Geometric Shield Vault & Compass SVG */}
      <div
        className={`${currentSize.box} bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center relative overflow-hidden group transition-transform hover:scale-105 active:scale-95 shrink-0`}
      >
        {/* Glow sheen */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/20 to-white/0 opacity-60 pointer-events-none"></div>

        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          {/* Shield Outer Outline */}
          <path
            d="M20 4L7 9V19C7 27.5 12.5 35.3 20 37.5C27.5 35.3 33 27.5 33 19V9L20 4Z"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Compass & Keyhole Core */}
          <circle cx="20" cy="18" r="4.5" stroke="white" strokeWidth="2.5" />
          
          {/* Compass North-South needle facets */}
          <path
            d="M20 9L21.8 15.5H18.2L20 9Z"
            fill="white"
          />
          <path
            d="M20 27L18.2 20.5H21.8L20 27Z"
            fill="#a5b4fc"
          />
          
          {/* Lateral Tick marks */}
          <path
            d="M13 18H15.5M24.5 18H27"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showText && (
        <div className="flex items-baseline tracking-tight">
          <span className={`font-black font-heading ${dark ? 'text-white' : 'text-slate-900'} ${currentSize.text} ${textClassName}`}>
            Trip<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Vault</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-0.5 inline-block"></span>
        </div>
      )}
    </div>
  );
}

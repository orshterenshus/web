'use client';

import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    const handleToggle = (e) => {
        if (!document.startViewTransition) {
            toggleTheme();
            return;
        }

        const x = e.clientX;
        const y = e.clientY;

        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            toggleTheme();
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ];

            document.documentElement.animate(
                {
                    clipPath: theme === 'dark' ? [...clipPath] : clipPath,
                },
                {
                    duration: 500,
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)',
                }
            );
        });
    };

    return (
        <button
            onClick={handleToggle}
            className="fixed bottom-6 left-6 p-3 rounded-full shadow-lg glass-button z-50 text-foreground transition-transform hover:scale-110 active:scale-95"
            aria-label="Toggle Theme"
        >
            {/* Animated Sun/Moon Icon */}
            <svg
                className="w-6 h-6 text-foreground"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Sun Center / Moon Body */}
                <circle
                    cx="12"
                    cy="12"
                    r={theme === 'light' ? 5 : 9}
                    fill="currentColor"
                    mask="url(#theme-toggle-mask)"
                    className="transition-all duration-500 ease-[cubic-bezier(0,0,0.2,1)]"
                />

                {/* Sun Rays */}
                <g
                    className={`origin-center transition-all duration-500 ease-[cubic-bezier(0,0,0.2,1)] ${theme === 'light' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'
                        }`}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <path d="M12 2V4" />
                    <path d="M12 20V22" />
                    <path d="M4.22 4.22L5.64 5.64" />
                    <path d="M18.36 18.36L19.78 19.78" />
                    <path d="M1 12H3" />
                    <path d="M21 12H23" />
                    <path d="M4.22 19.78L5.64 18.36" />
                    <path d="M18.36 5.64L19.78 4.22" />
                </g>

                {/* Mask for Eclipse Effect - Tuned for Half Moon */}
                <mask id="theme-toggle-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <circle
                        cx="24"
                        cy="10"
                        r="9"
                        fill="black"
                        className="transition-all duration-500 ease-[cubic-bezier(0,0,0.2,1)]"
                        style={{
                            transform: theme === 'light'
                                ? 'translate(8px, -8px) scale(0)'
                                : 'translate(-7px, 2px) scale(1)', // Moves cx:24 -> 17, cy:10 -> 12. Perfect crescent overlap.
                            transformBox: 'fill-box',
                            transformOrigin: 'center'
                        }}
                    />
                </mask>
            </svg>
        </button>
    );
}

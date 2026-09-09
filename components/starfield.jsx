'use client';

const COLORS = [
  'rgba(255, 255, 255, 1)',
  'rgba(91, 224, 255, 0.98)',
  'rgba(186, 132, 255, 0.95)',
];

function seededValue(index, salt) {
  const value = Math.sin(index * 91.73 + salt * 47.19) * 43758.5453;
  return value - Math.floor(value);
}

export default function Starfield({ children }) {
  const stars = Array.from({ length: 252 }, (_, index) => {
    const size =
      index % 17 === 0 ? 4 : index % 7 === 0 ? 3 : index % 3 === 0 ? 2 : 1;

    return {
      id: index,
      x: `${(seededValue(index, 1) * 100).toFixed(2)}%`,
      y: `${(seededValue(index, 2) * 100).toFixed(2)}%`,
      size: `${size}px`,
      delay: `${(seededValue(index, 3) * -8).toFixed(2)}s`,
      duration: `${((4.5 + seededValue(index, 4) * 5.5) / 3).toFixed(2)}s`,
      opacity: Math.min(1, (0.2 + seededValue(index, 5) * 0.65) * 6).toFixed(2),
      color: COLORS[index % COLORS.length],
      sparkle: index % 17 === 0,
    };
  });

  return (
    <div className="starShell">
      <div className="starfield" aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            className={star.sparkle ? 'star sparkle' : 'star'}
            style={{
              '--star-x': star.x,
              '--star-y': star.y,
              '--star-size': star.size,
              '--star-delay': star.delay,
              '--star-duration': star.duration,
              '--star-opacity': star.opacity,
              '--star-color': star.color,
            }}
          />
        ))}
      </div>

      <div className="starContent">{children}</div>

      <style jsx>{`
        .starShell {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 76% 4%,
              rgba(35, 211, 238, 0.07),
              transparent 34%
            ),
            radial-gradient(
              circle at 10% 72%,
              rgba(139, 92, 246, 0.06),
              transparent 30%
            ),
            #050b16;
        }

        .starfield {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }

        .starContent {
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        .star {
          position: absolute;
          left: var(--star-x);
          top: var(--star-y);
          width: var(--star-size);
          height: var(--star-size);
          border-radius: 50%;
          background: var(--star-color);
          opacity: var(--star-opacity);
          box-shadow: 0 0 calc(var(--star-size) * 10) var(--star-color);
          animation: twinkle var(--star-duration) ease-in-out
            var(--star-delay) infinite;
          will-change: opacity, transform;
        }

        .sparkle::before,
        .sparkle::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          background: var(--star-color);
          border-radius: 999px;
          transform: translate(-50%, -50%);
        }

        .sparkle::before {
          width: 1px;
          height: 12px;
        }

        .sparkle::after {
          width: 12px;
          height: 1px;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: calc(var(--star-opacity) * 0.3);
            transform: scale(0.75);
          }

          45% {
            opacity: var(--star-opacity);
            transform: scale(1.12);
          }

          65% {
            opacity: calc(var(--star-opacity) * 0.58);
            transform: scale(0.92);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .star {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

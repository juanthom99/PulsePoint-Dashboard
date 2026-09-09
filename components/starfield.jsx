'use client';

const COLORS = ['#ffffff', '#5be0ff', '#ba84ff'];

function seededValue(index, salt) {
  const value = Math.sin(index * 91.73 + salt * 47.19) * 43758.5453;
  return value - Math.floor(value);
}

export default function Starfield({ children }) {
  const stars = Array.from({ length: 96 }, (_, index) => ({
    id: index,
    x: `${(seededValue(index, 1) * 100).toFixed(2)}%`,
    y: `${(seededValue(index, 2) * 100).toFixed(2)}%`,
    size: `${index % 19 === 0 ? 4 : index % 7 === 0 ? 3 : index % 3 === 0 ? 2 : 1}px`,
    delay: `${(seededValue(index, 3) * -9).toFixed(2)}s`,
    duration: `${(3.2 + seededValue(index, 4) * 5).toFixed(2)}s`,
    opacity: (0.28 + seededValue(index, 5) * 0.68).toFixed(2),
    color: COLORS[index % COLORS.length],
    sparkle: index % 19 === 0,
  }));

  return (
    <div className="star-shell">
      <div className="foreground-stars" aria-hidden="true">
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
      <div className="star-content">{children}</div>
    </div>
  );
}

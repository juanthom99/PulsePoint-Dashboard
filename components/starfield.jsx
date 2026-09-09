'use client';

const COLORS = ['#ffffff', '#5be0ff', '#ba84ff'];

function seededValue(index, salt) {
  const value = Math.sin(index * 91.73 + salt * 47.19) * 43758.5453;
  return value - Math.floor(value);
}

export default function Starfield({ children }) {
  const stars = Array.from({ length: 144 }, (_, index) => {
    const sparkle = index % 9 === 0;
    let x = seededValue(index, 1) * 100;
    let y = seededValue(index, 2) * 100;

    if (sparkle) {
      for (let attempt = 0; attempt < 24; attempt += 1) {
        const candidateX = seededValue(index, 10 + attempt * 2) * 100;
        const candidateY = seededValue(index, 11 + attempt * 2) * 100;
        const overlapsMap = candidateX > 22 && candidateY > 10 && candidateY < 92;
        if (!overlapsMap) {
          x = candidateX;
          y = candidateY;
          break;
        }
      }
    }

    return {
      id: index,
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
      size: `${index % 19 === 0 ? 4 : index % 7 === 0 ? 3 : index % 3 === 0 ? 2 : 1}px`,
      delay: `${(seededValue(index, 3) * -4).toFixed(2)}s`,
      duration: `${(1.35 + seededValue(index, 4) * 2.35).toFixed(2)}s`,
      opacity: (0.48 + seededValue(index, 5) * 0.5).toFixed(2),
      color: COLORS[index % COLORS.length],
      sparkle,
      twinkling: index % 3 === 0,
    };
  });

  return (
    <div className="star-shell">
      <div className="foreground-stars" aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            className={`star${star.twinkling ? ' twinkling' : ''}${star.sparkle ? ' sparkle' : ''}`}
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

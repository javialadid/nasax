import React from 'react';

const STAR_COUNT = 120;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: Math.random() * 1.2 + 0.4, // 0.4px to 1.6px
  duration: Math.random() * 2 + 1.5, // 1.5s to 3.5s
  delay: Math.random() * 3, // 0s to 3s
}));

const DeepSpaceBackground: React.FC = () => (
  <div className="deepspace-bg">
    {stars.map(star => (
      <div
        key={star.id}
        className="deepspace-star"
        style={{
          top: `${star.top}%`,
          left: `${star.left}%`,
          width: `${star.size}px`,
          height: `${star.size}px`,
          animationDuration: `${star.duration}s`,
          animationDelay: `${star.delay}s`,
        }}
      />
    ))}
    <style>{`
      .deepspace-bg {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(ellipse at 60% 40%, #0a0e1a 0%, #01020a 80%, #000 100%);
        overflow: hidden;
      }
      .deepspace-star {
        position: absolute;
        border-radius: 50%;
        background: white;
        opacity: 0.7;
        box-shadow: 0 0 6px 1px #fff8;
        animation: twinkle 2s infinite alternate;
      }
      @keyframes twinkle {
        0% { opacity: 0.7; }
        50% { opacity: 0.2; }
        100% { opacity: 0.9; }
      }
    `}</style>
  </div>
);

export default DeepSpaceBackground; 
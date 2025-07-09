import React from 'react';

interface FadeTransitionProps {
  children: React.ReactNode;
  durationMs?: number; // transition duration in ms
  delayMs?: number;    // delay before showing in ms
}

const FadeTransition: React.FC<FadeTransitionProps> = ({ children, durationMs = 50, delayMs = 10 }) => {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    setShow(false);
    const timeout = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timeout);
  }, [children, delayMs]);
  return (
    <div
      className={`transition-opacity ease-in-out ${show ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${durationMs}ms` }}
    >
      {children}
    </div>
  );
};

export default FadeTransition; 
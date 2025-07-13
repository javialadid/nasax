import React from 'react';

interface ScrollableViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const ScrollableView: React.FC<ScrollableViewProps> = ({ children, className = '', style, ...rest }) => (
  <div
    className={`flex-1 min-h-0 h-full w-full overflow-y-auto ${className}`}
    style={style}
    {...rest}
  >
    {children}
  </div>
);

export default ScrollableView; 
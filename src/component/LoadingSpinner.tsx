// src/components/LoadingSpinner.tsx
import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullPage?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  fullPage = false,
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-8 h-8 border-3',
    medium: 'w-12 h-12 border-4',
    large: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className={`loading-spinner-container ${className}`}>
      <div className="relative">
        <div
          className={`rounded-full animate-spin border-solid ${sizeClasses[size]}`}
          style={{
            borderColor: '#ff69b4 transparent transparent transparent',
            borderTopColor: '#ff69b4',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
          }}
        ></div>
        {/* Optional inner ring */}
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-solid ${
            size === 'small' ? 'w-4 h-4 border-2' :
            size === 'medium' ? 'w-6 h-6 border-3' :
            'w-8 h-8 border-3'
          }`}
          style={{
            borderColor: 'transparent transparent transparent #ffffff',
            animation: 'spin 1.5s linear infinite reverse',
          }}
        ></div>
      </div>
      {text && (
        <div className="mt-3 text-center">
          <span className="loading-text">{text}</span>
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="full-page-loader">
        <div className="full-page-content">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
import React from 'react';
import { useApp } from '../../context/AppContext';

const Loader = ({ size = 'md', fullScreen = false }) => {
  const { loading } = useApp();

  if (!loading) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-10 w-10';
      case 'xl':
        return 'h-16 w-16';
      case 'md':
      default:
        return 'h-8 w-8';
    }
  };

  const spinnerClasses = `animate-spin ${getSizeClasses()} text-blue-600`;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-30 flex items-center justify-center">
        <div className="bg-white rounded-lg p-4 flex items-center space-x-4">
          <svg className={spinnerClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-700">Caricamento...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-4">
      <svg className={spinnerClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
};

export default Loader;
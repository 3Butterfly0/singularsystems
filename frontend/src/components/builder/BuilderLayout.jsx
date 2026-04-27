import React from 'react';

const BuilderLayout = ({ children, progress }) => {
  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] overflow-hidden">
      {/* progress bar */}
      <div className="flex-none z-30">
        {progress}
      </div>

      {/* main content */}
      <div className="flex-grow flex overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default BuilderLayout;

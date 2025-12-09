import React from "react";

const LoadingSkeleton = () => {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;

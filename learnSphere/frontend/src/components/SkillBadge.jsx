import React from 'react';

const SkillBadge = ({ level, size = 'md' }) => {
  const badgeStyles = {
    BEGINNER: 'bg-green-500/10 text-green-600 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-md',
    INTERMEDIATE: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md',
    ADVANCED: 'bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-md',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-block rounded-full font-semibold ${badgeStyles[level]} ${sizeStyles[size]}`}
    >
      {level}
    </span>
  );
};

export default SkillBadge;

// Utility functions for common operations

export const formatDate = date => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const calculateProgress = (completed, total) => {
  return Math.round((completed / total) * 100);
};

export const formatCurrency = amount => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getSkillLevelColor = level => {
  const colors = {
    BEGINNER: 'text-green-600',
    INTERMEDIATE: 'text-yellow-600',
    ADVANCED: 'text-purple-600',
  };
  return colors[level] || 'text-gray-600';
};

export const getSkillLevelBg = level => {
  const colors = {
    BEGINNER: 'bg-green-100',
    INTERMEDIATE: 'bg-yellow-100',
    ADVANCED: 'bg-purple-100',
  };
  return colors[level] || 'bg-gray-100';
};

export const truncateText = (text, length = 100) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const validateEmail = email => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const calculateTimeToComplete = minutes => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

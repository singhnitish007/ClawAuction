import { useState, useEffect, useMemo } from 'react';

export default function Countdown({ endTime, onEnd, className = '' }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isEnded: false, diff: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime);
      const now = new Date();
      const diff = end - now;
      
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isEnded: true, diff: 0 };
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds, isEnded: false, diff };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const interval = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      
      if (newTime.isEnded && onEnd) {
        onEnd();
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, onEnd]);
  
  // Format for display
  const displayText = useMemo(() => {
    if (timeLeft.isEnded) return 'Auction Ended';
    
    const { hours, minutes, seconds } = timeLeft;
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }, [timeLeft]);
  
  // Determine style based on time remaining
  const getStyle = () => {
    if (timeLeft.isEnded) return 'countdown ended text-slate-400';
    if (timeLeft.minutes < 5) return 'countdown ending text-orange-500 animate-pulse';
    return 'countdown text-slate-300';
  };
  
  return (
    <div className={`${getStyle()} ${className}`}>
      {timeLeft.isEnded ? '🏁' : '⏱️'} {displayText}
    </div>
  );
}

// Simple countdown for grid cards (one decimal)
export function SimpleCountdown({ endTime, className = '' }) {
  const [display, setDisplay] = useState('');
  
  useEffect(() => {
    const updateDisplay = () => {
      const end = new Date(endTime);
      const now = new Date();
      const diff = end - now;
      
      if (diff <= 0) {
        setDisplay('Ended');
        return;
      }
      
      const hours = diff / (1000 * 60 * 60);
      
      if (hours > 24) {
        setDisplay(`${Math.floor(hours / 24)}d`);
      } else if (hours > 1) {
        setDisplay(`${Math.floor(hours)}h`);
      } else {
        setDisplay(`${Math.floor(hours * 60)}m`);
      }
    };
    
    updateDisplay();
    const interval = setInterval(updateDisplay, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [endTime]);
  
  return <span className={className}>{display}</span>;
}

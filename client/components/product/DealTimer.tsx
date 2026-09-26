'use client';

import React, { useEffect, useState } from 'react';

interface DealTimerProps {
  endTime?: string;
  initialDays?: number;
  initialHours?: number;
  initialMins?: number;
  initialSecs?: number;
}

export default function DealTimer({
  endTime,
  initialDays = 14,
  initialHours = 8,
  initialMins = 30,
  initialSecs = 0,
}: DealTimerProps) {
  const calculateTimeLeft = () => {
    if (endTime) {
      const diff = new Date(endTime).getTime() - new Date().getTime();
      if (diff > 0) {
        return {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, mins: 0, secs: 0 };
    }
    return { days: initialDays, hours: initialHours, mins: initialMins, secs: initialSecs };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="deal-card__timer-wrap">
      <div className="deal-card__timer">
        <div className="deal-timer-item">
          <span className="deal-timer-num">{timeLeft.days}</span>
          <span className="deal-timer-label">DAYS</span>
        </div>
        <div className="deal-timer-item">
          <span className="deal-timer-num">{timeLeft.hours}</span>
          <span className="deal-timer-label">HOURS</span>
        </div>
        <div className="deal-timer-item">
          <span className="deal-timer-num">{timeLeft.mins}</span>
          <span className="deal-timer-label">MINS</span>
        </div>
        <div className="deal-timer-item">
          <span className="deal-timer-num">{timeLeft.secs}</span>
          <span className="deal-timer-label">SECS</span>
        </div>
      </div>
    </div>
  );
}

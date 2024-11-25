// useTimeSynchronization.js
import { useState, useEffect } from 'react';

const useTimeSynchronization = () => {
  const [timeOffset, setTimeOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const synchronizeTime = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch('https://timeapi.io/api/time/current/zone?timeZone=UTC');
        const endTime = Date.now();
        const networkLatency = (endTime - startTime) / 2;
        
        const data = await response.json();
        const serverUtcTime = new Date(data.dateTime).getTime();
        const localTime = Date.now();
        
        // Calculate offset (including network latency compensation)
        const calculatedOffset = serverUtcTime - localTime + networkLatency;
        
        setTimeOffset(calculatedOffset);
        setIsLoading(false);
      } catch (err) {
        setError(err);
        setIsLoading(false);
      }
    };

    synchronizeTime();
  }, []);

  // Function to get current UTC time using the stored offset
  const getCurrentUTCTime = () => {
    const now = Date.now() + timeOffset;

    // Method 2: More explicit conversion
    const localDate = new Date(now);
    return new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes(),
      localDate.getSeconds(),
      localDate.getMilliseconds()
    ));
  }

  // Function to get UTC timestamp for a specific local time
  const getUTCTimestamp = (localTime) => {
    const localDate = new Date(localTime + timeOffset);
    return new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes(),
      localDate.getSeconds(),
      localDate.getMilliseconds()
    ));
  };

  return {
    getCurrentUTCTime,
    getUTCTimestamp,
    isLoading,
    error,
    timeOffset
  };
};

export default useTimeSynchronization;
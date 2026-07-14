// Helper functions for week calculations
const calculateCurrentWeek = (startDate) => {
  if (!startDate) return 0; // No week if no start date

  const now = new Date();
  const start = new Date(startDate);

  // Calculate difference in days
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Calculate week number (1-indexed)
  const weekNumber = Math.ceil(diffDays / 7);

  return weekNumber > 0 ? weekNumber : 1;
};

const getWeekDateRange = (startDate, weekNumber) => {
  const start = new Date(startDate);
  const weekStart = new Date(
    start.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000
  );
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  return {
    from: weekStart,
    to: weekEnd,
  };
};

module.exports = { calculateCurrentWeek, getWeekDateRange };

const { calculateCurrentWeek, getWeekDateRange } = require('../utils/dateUtils');

describe('Date Utilities', () => {
  describe('calculateCurrentWeek', () => {
    it('should return 0 if no start date is provided', () => {
      expect(calculateCurrentWeek(null)).toBe(0);
    });

    it('should calculate the correct week based on the start date', () => {
      const now = new Date();
      const realDate = Date;
      const mockedNow = new Date('2024-01-15T12:00:00Z');
      global.Date = class extends Date {
        constructor(date) {
          if (date) return new realDate(date);
          return mockedNow;
        }
      };

      // 7 days ago -> week 1
      expect(calculateCurrentWeek('2024-01-08T12:00:00Z')).toBe(1);
      // 10 days ago -> week 2
      expect(calculateCurrentWeek('2024-01-05T12:00:00Z')).toBe(2);

      global.Date = realDate;
    });
  });

  describe('getWeekDateRange', () => {
    it('should calculate the start and end dates for a given week', () => {
      const startDate = '2024-01-01T12:00:00.000Z'; // Monday
      const week1Range = getWeekDateRange(startDate, 1);
      expect(week1Range.from.toISOString()).toBe('2024-01-01T12:00:00.000Z');
      expect(week1Range.to.toISOString()).toBe('2024-01-07T12:00:00.000Z');

      const week2Range = getWeekDateRange(startDate, 2);
      expect(week2Range.from.toISOString()).toBe('2024-01-08T12:00:00.000Z');
      expect(week2Range.to.toISOString()).toBe('2024-01-14T12:00:00.000Z');
    });
  });
});

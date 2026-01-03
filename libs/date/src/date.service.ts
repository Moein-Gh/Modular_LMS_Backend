/**
 * Persian Date Service
 * Provides utilities for working with Persian (Jalali) calendar dates
 */

import { Injectable } from '@nestjs/common';
import {
  addDays as addDaysJalali,
  addMonths as addMonthsJalali,
  addYears as addYearsJalali,
  differenceInDays as differenceInDaysJalali,
  differenceInMonths as differenceInMonthsJalali,
  differenceInYears as differenceInYearsJalali,
  endOfDay as endOfDayJalali,
  endOfMonth as endOfMonthJalali,
  endOfYear as endOfYearJalali,
  formatDistance as formatDistanceJalali,
  format as formatJalali,
  formatRelative as formatRelativeJalali,
  isAfter as isAfterJalali,
  isBefore as isBeforeJalali,
  isSameDay as isSameDayJalali,
  isSameMonth as isSameMonthJalali,
  isSameYear as isSameYearJalali,
  isValid as isValidJalali,
  parse as parseJalali,
  startOfDay as startOfDayJalali,
  startOfMonth as startOfMonthJalali,
  startOfYear as startOfYearJalali,
  subDays as subDaysJalali,
  subMonths as subMonthsJalali,
  subYears as subYearsJalali,
} from 'date-fns-jalali';

/**
 * Common date format presets
 */
export const DATE_FORMATS = {
  /** 1403/10/13 */
  SHORT: 'yyyy/MM/dd',
  /** 13 دی 1403 */
  MEDIUM: 'dd MMMM yyyy',
  /** جمعه 13 دی 1403 */
  LONG: 'EEEE dd MMMM yyyy',
  /** 1403/10/13 14:30 */
  SHORT_WITH_TIME: 'yyyy/MM/dd HH:mm',
  /** 13 دی 1403 ساعت 14:30 */
  MEDIUM_WITH_TIME: "dd MMMM yyyy 'ساعت' HH:mm",
  /** 14:30:45 */
  TIME_ONLY: 'HH:mm:ss',
  /** 14:30 */
  TIME_SHORT: 'HH:mm',
} as const;

@Injectable()
export class DateService {
  /**
   * Format a date to Persian calendar string
   * @param date - Date to format (Date object, timestamp, or ISO string)
   * @param formatStr - Format string (default: "yyyy/MM/dd")
   * @returns Formatted Persian date string
   *
   * Common format patterns:
   * - "yyyy/MM/dd" -> 1403/10/13
   * - "dd MMMM yyyy" -> 13 دی 1403
   * - "EEEE dd MMMM yyyy" -> جمعه 13 دی 1403
   * - "HH:mm:ss" -> 14:30:45
   * - "yyyy/MM/dd HH:mm" -> 1403/10/13 14:30
   */
  formatPersianDate(
    date: Date | number | string,
    formatStr = DATE_FORMATS.SHORT,
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatJalali(dateObj, formatStr);
  }

  /**
   * Format a date relative to now in Persian
   * @param date - Date to format
   * @returns Relative date string (e.g., "دیروز در ساعت 14:30")
   */
  formatPersianRelative(date: Date | number | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatRelativeJalali(dateObj, new Date());
  }

  /**
   * Format the distance between two dates in Persian
   * @param date - Date to compare
   * @param baseDate - Base date (default: now)
   * @param addSuffix - Add "ago" or "in" suffix (default: true)
   * @returns Distance string (e.g., "3 روز پیش")
   */
  formatPersianDistance(
    date: Date | number | string,
    baseDate?: Date | number,
    addSuffix = true,
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceJalali(dateObj, baseDate ?? new Date(), {
      addSuffix,
    });
  }

  /**
   * Parse a Persian date string to Date object
   * @param dateString - Persian date string
   * @param formatStr - Format pattern (default: "yyyy/MM/dd")
   * @param referenceDate - Reference date for parsing (default: now)
   * @returns Parsed Date object
   */
  parsePersianDate(
    dateString: string,
    formatStr = DATE_FORMATS.SHORT,
    referenceDate?: Date,
  ): Date {
    return parseJalali(dateString, formatStr, referenceDate ?? new Date());
  }

  /**
   * Check if a date is valid
   * @param date - Date to validate
   * @returns true if valid
   */
  isValidDate(date: Date | number | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isValidJalali(dateObj);
  }

  /**
   * Add days to a date
   */
  addDays(date: Date | number | string, amount: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return addDaysJalali(dateObj, amount);
  }

  /**
   * Add months to a date
   */
  addMonths(date: Date | number | string, amount: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return addMonthsJalali(dateObj, amount);
  }

  /**
   * Add years to a date
   */
  addYears(date: Date | number | string, amount: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return addYearsJalali(dateObj, amount);
  }

  /**
   * Subtract days from a date
   */
  subDays(date: Date | number | string, amount: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return subDaysJalali(dateObj, amount);
  }

  /**
   * Subtract months from a date
   */
  subMonths(date: Date | number | string, amount: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return subMonthsJalali(dateObj, amount);
  }

  /**
   * Subtract years from a date
   */
  subYears(date: Date | number | string, amount: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return subYearsJalali(dateObj, amount);
  }

  /**
   * Get start of day
   */
  startOfDay(date: Date | number | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return startOfDayJalali(dateObj);
  }

  /**
   * Get end of day
   */
  endOfDay(date: Date | number | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return endOfDayJalali(dateObj);
  }

  /**
   * Get start of month
   */
  startOfMonth(date: Date | number | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return startOfMonthJalali(dateObj);
  }

  /**
   * Get end of month
   */
  endOfMonth(date: Date | number | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return endOfMonthJalali(dateObj);
  }

  /**
   * Get start of year
   */
  startOfYear(date: Date | number | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return startOfYearJalali(dateObj);
  }

  /**
   * Get end of year
   */
  endOfYear(date: Date | number | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return endOfYearJalali(dateObj);
  }

  /**
   * Check if first date is before second date
   */
  isBefore(
    date: Date | number | string,
    dateToCompare: Date | number | string,
  ): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const compareObj =
      typeof dateToCompare === 'string'
        ? new Date(dateToCompare)
        : dateToCompare;
    return isBeforeJalali(dateObj, compareObj);
  }

  /**
   * Check if first date is after second date
   */
  isAfter(
    date: Date | number | string,
    dateToCompare: Date | number | string,
  ): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const compareObj =
      typeof dateToCompare === 'string'
        ? new Date(dateToCompare)
        : dateToCompare;
    return isAfterJalali(dateObj, compareObj);
  }

  /**
   * Check if two dates are on the same day
   */
  isSameDay(
    dateLeft: Date | number | string,
    dateRight: Date | number | string,
  ): boolean {
    const leftObj =
      typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const rightObj =
      typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isSameDayJalali(leftObj, rightObj);
  }

  /**
   * Check if two dates are in the same month
   */
  isSameMonth(
    dateLeft: Date | number | string,
    dateRight: Date | number | string,
  ): boolean {
    const leftObj =
      typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const rightObj =
      typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isSameMonthJalali(leftObj, rightObj);
  }

  /**
   * Check if two dates are in the same year
   */
  isSameYear(
    dateLeft: Date | number | string,
    dateRight: Date | number | string,
  ): boolean {
    const leftObj =
      typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const rightObj =
      typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return isSameYearJalali(leftObj, rightObj);
  }

  /**
   * Get difference in days between two dates
   */
  differenceInDays(
    dateLeft: Date | number | string,
    dateRight: Date | number | string,
  ): number {
    const leftObj =
      typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const rightObj =
      typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInDaysJalali(leftObj, rightObj);
  }

  /**
   * Get difference in months between two dates
   */
  differenceInMonths(
    dateLeft: Date | number | string,
    dateRight: Date | number | string,
  ): number {
    const leftObj =
      typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const rightObj =
      typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInMonthsJalali(leftObj, rightObj);
  }

  /**
   * Get difference in years between two dates
   */
  differenceInYears(
    dateLeft: Date | number | string,
    dateRight: Date | number | string,
  ): number {
    const leftObj =
      typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
    const rightObj =
      typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
    return differenceInYearsJalali(leftObj, rightObj);
  }

  /**
   * Get current Persian date as formatted string
   */
  nowPersian(formatStr = DATE_FORMATS.SHORT): string {
    return this.formatPersianDate(new Date(), formatStr);
  }

  /**
   * Get today at start of day
   */
  todayStart(): Date {
    return this.startOfDay(new Date());
  }

  /**
   * Get today at end of day
   */
  todayEnd(): Date {
    return this.endOfDay(new Date());
  }
}

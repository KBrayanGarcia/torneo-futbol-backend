import { Injectable, Logger } from '@nestjs/common';
import { TournamentConfig } from '../interfaces/fixture.interfaces';

@Injectable()
export class FixtureDateService {
  private readonly logger = new Logger(FixtureDateService.name);
  private readonly MAX_DAYS_SAFETY_LIMIT = 365;

  generateDates(config: TournamentConfig, requiredRounds: number): Date[] {
    const availableDates: Date[] = [];
    let startDate = new Date();

    if (config.startDate) {
      // Parse YYYY-MM-DD manually
      const [y, m, d] = config.startDate.split('-').map(Number);
      startDate = new Date(y, m - 1, d, 18, 0, 0);
    } else {
      startDate.setHours(18, 0, 0, 0);
    }

    // Default return if no rounds needed (e.g. 0 matches)
    if (requiredRounds <= 0) return [startDate];

    const endDate = config.endDate
      ? new Date(config.endDate + 'T23:59:59')
      : null;
    const excludedDays = config.excludedDays || [];

    const iteratorDate = new Date(startDate);
    let daysCount = 0;

    while (daysCount < this.MAX_DAYS_SAFETY_LIMIT) {
      const isPastEndDate = endDate && iteratorDate > endDate;

      if (isPastEndDate) {
        this.logger.debug('Breaking date loop (Date > EndDate).');
        break;
      }

      if (!excludedDays.includes(iteratorDate.getDay())) {
        availableDates.push(new Date(iteratorDate));
      }

      // Next day
      iteratorDate.setDate(iteratorDate.getDate() + 1);
      daysCount++;

      // Stop if we have enough dates to cover all rounds + buffer
      // (Actually we just need enough for rounds, but we generate a pool)
      if (availableDates.length >= requiredRounds + this.MAX_DAYS_SAFETY_LIMIT)
        break;
    }

    this.logger.debug(
      `Date pool generated: ${availableDates.length} dates for ${requiredRounds} rounds.`,
    );

    // Fallback
    if (availableDates.length === 0) {
      availableDates.push(startDate);
    }

    return availableDates;
  }
}

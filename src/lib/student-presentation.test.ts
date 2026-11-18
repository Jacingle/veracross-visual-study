import { describe, expect, it } from 'vitest';
import { gradeFraction, scheduleTime, teacherNames } from './student-presentation';

describe('student presentation rules', () => {
  it('joins faculty by surname, with optional titles and no first names', () => {
    const people = [{ id: 'z', prefix: 'Mrs.', first: 'Amy', last: 'Zhang' }, { id: 's', prefix: 'Mr.', first: 'Brian', last: 'Shade' }, { id: 't', first: 'Chris', last: 'Totin' }];
    expect(teacherNames(['z', 't', 's'], people)).toBe('Mr. Shade, Totin, Mrs. Zhang');
  });
  it('shows the actual point calculation from the supplied grade example', () => {
    expect(gradeFraction([{ category: 'Quiz', score: 62.15, points: 69 }, { category: 'Presentation', score: 40, points: 40 }, { category: 'Writing', score: 20, points: 20 }, { category: 'Quiz', points: 10 }], [])).toEqual({ numerator: '40.00 + 62.15 + 20.00', denominator: '40.00 + 69.00 + 20.00' });
  });
  it('leaves ungraded calculation blank', () => {
    expect(gradeFraction([{ category: 'Quiz', points: 10 }], [])).toBeNull();
  });
  it('reflects category drops and effective weights', () => {
    expect(gradeFraction([{ category: 'Quiz', score: 5, points: 10 }, { category: 'Quiz', score: 9, points: 10 }], [{ cat: 'Quiz', weight: 60, drop: true }, { cat: 'Test', weight: 40, drop: false }])).toEqual({ numerator: '(90.00 × 60)', denominator: '60' });
  });
  it('formats timetable starts as in the daily schedule picture', () => {
    expect(scheduleTime('13:40')).toBe('1:40 pm');
    expect(scheduleTime('08:00')).toBe('8:00 am');
  });
});
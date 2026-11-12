import {
  isValidTransition,
  getAllowedTransitions,
  requiresRejectionReason,
} from '../../src/utils/status-machine';
import { ReportStatus } from '../../src/types/database';

describe('Status Machine — Unit Tests', () => {
  describe('isValidTransition', () => {
    const valid: [ReportStatus, ReportStatus][] = [
      ['Draft', 'Submitted'],
      ['Submitted', 'Assigned'],
      ['Submitted', 'Rejected'],
      ['Assigned', 'In Progress'],
      ['Assigned', 'Rejected'],
      ['In Progress', 'Resolved'],
      ['In Progress', 'Rejected'],
      ['Resolved', 'In Progress'],
    ];

    const invalid: [ReportStatus, ReportStatus][] = [
      ['Draft', 'Assigned'],
      ['Draft', 'In Progress'],
      ['Draft', 'Resolved'],
      ['Draft', 'Rejected'],
      ['Submitted', 'Draft'],
      ['Submitted', 'In Progress'],
      ['Submitted', 'Resolved'],
      ['Rejected', 'Submitted'],
      ['Rejected', 'Draft'],
      ['Rejected', 'Assigned'],
      ['Resolved', 'Submitted'],
      ['Resolved', 'Draft'],
      ['Resolved', 'Rejected'],
    ];

    test.each(valid)('%s → %s is valid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });

    test.each(invalid)('%s → %s is invalid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns correct transitions for Draft', () => {
      expect(getAllowedTransitions('Draft')).toEqual(['Submitted']);
    });

    it('returns correct transitions for Submitted', () => {
      expect(getAllowedTransitions('Submitted')).toEqual(
        expect.arrayContaining(['Assigned', 'Rejected'])
      );
    });

    it('returns empty array for Rejected', () => {
      expect(getAllowedTransitions('Rejected')).toEqual([]);
    });
  });

  describe('requiresRejectionReason', () => {
    it('returns true for Rejected status', () => {
      expect(requiresRejectionReason('Rejected')).toBe(true);
    });

    it('returns false for all other statuses', () => {
      const others: ReportStatus[] = ['Draft', 'Submitted', 'Assigned', 'In Progress', 'Resolved'];
      others.forEach((s) => {
        expect(requiresRejectionReason(s)).toBe(false);
      });
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import {
  transformProposalToViewModel,
  isProposalModified,
  filterSaveableProposals,
  normalizeFlashcardKey,
  createExistingFlashcardsSet,
  isDuplicate,
  countProposalsByStatus
} from '../../../src/lib/utils/generate-helpers';
import type { ProposalViewModel } from '../../../src/lib/types/generate-view.types';

describe('transformProposalToViewModel', () => {
  it('should transform raw proposal to view model', () => {
    const rawProposal = {
      front: 'Test front',
      back: 'Test back'
    };

    const viewModel = transformProposalToViewModel(rawProposal);

    expect(viewModel).toEqual({
      originalFront: 'Test front',
      originalBack: 'Test back',
      currentFront: 'Test front',
      currentBack: 'Test back',
      status: 'pending',
      isEdited: false,
      validationErrors: {}
    });
  });

  it('should handle empty values', () => {
    const rawProposal = {
      front: '',
      back: ''
    };

    const viewModel = transformProposalToViewModel(rawProposal);

    expect(viewModel.originalFront).toBe('');
    expect(viewModel.originalBack).toBe('');
    expect(viewModel.currentFront).toBe('');
    expect(viewModel.currentBack).toBe('');
  });
});

describe('isProposalModified', () => {
  it('should return false when proposal is not modified', () => {
    const proposal: ProposalViewModel = {
      originalFront: 'Test front',
      originalBack: 'Test back',
      currentFront: 'Test front',
      currentBack: 'Test back',
      id: '123',
      status: 'pending',
      isEdited: false,
      validationErrors: {}
    };

    expect(isProposalModified(proposal)).toBe(false);
  });

  it('should return true when front is modified', () => {
    const proposal: ProposalViewModel = {
      originalFront: 'Test front',
      originalBack: 'Test back',
      currentFront: 'Modified front',
      currentBack: 'Test back',
      id: '123',
      status: 'pending',
      isEdited: false,
      validationErrors: {}
    };

    expect(isProposalModified(proposal)).toBe(true);
  });

  it('should return true when back is modified', () => {
    const proposal: ProposalViewModel = {
      originalFront: 'Test front',
      originalBack: 'Test back',
      currentFront: 'Test front',
      currentBack: 'Modified back',
      id: '123',
      status: 'pending',
      isEdited: false,
      validationErrors: {}
    };

    expect(isProposalModified(proposal)).toBe(true);
  });

  it('should ignore whitespace differences', () => {
    const proposal: ProposalViewModel = {
      originalFront: 'Test front',
      originalBack: 'Test back',
      currentFront: '  Test front  ',
      currentBack: '  Test back  ',
      id: '123',
      status: 'pending',
      isEdited: false,
      validationErrors: {}
    };

    expect(isProposalModified(proposal)).toBe(false);
  });
});

describe('filterSaveableProposals', () => {
  it('should filter out rejected proposals', () => {
    const proposals: ProposalViewModel[] = [
      {
        originalFront: 'Front 1',
        originalBack: 'Back 1',
        currentFront: 'Front 1',
        currentBack: 'Back 1',
        id: '1',
        status: 'accepted',
        isEdited: false,
        validationErrors: {}
      },
      {
        originalFront: 'Front 2',
        originalBack: 'Back 2',
        currentFront: 'Front 2',
        currentBack: 'Back 2',
        id: '2',
        status: 'rejected',
        isEdited: false,
        validationErrors: {}
      },
      {
        originalFront: 'Front 3',
        originalBack: 'Back 3',
        currentFront: 'Front 3 edited',
        currentBack: 'Back 3',
        id: '3',
        status: 'edited',
        isEdited: true,
        validationErrors: {}
      }
    ];

    const saveable = filterSaveableProposals(proposals);
    expect(saveable.length).toBe(2);
    expect(saveable.map(p => p.id)).toEqual(['1', '3']);
  });

  it('should filter out proposals with validation errors', () => {
    const proposals: ProposalViewModel[] = [
      {
        originalFront: 'Front 1',
        originalBack: 'Back 1',
        currentFront: 'Front 1',
        currentBack: 'Back 1',
        id: '1',
        status: 'accepted',
        isEdited: false,
        validationErrors: {}
      },
      {
        originalFront: 'Front 2',
        originalBack: 'Back 2',
        currentFront: '',
        currentBack: 'Back 2',
        id: '2',
        status: 'edited',
        isEdited: true,
        validationErrors: { front: 'Front side cannot be empty' }
      }
    ];

    const saveable = filterSaveableProposals(proposals);
    expect(saveable.length).toBe(1);
    expect(saveable[0].id).toBe('1');
  });

  it('should handle empty array', () => {
    expect(filterSaveableProposals([])).toEqual([]);
  });
});

describe('normalizeFlashcardKey and isDuplicate', () => {
  it('should normalize keys consistently', () => {
    expect(normalizeFlashcardKey(' test FRONT ', ' test BACK ')).toBe('test front|test back');
  });

  it('should detect duplicate flashcards', () => {
    const existingSet = new Set(['test front|test back', 'another|card']);
    
    expect(isDuplicate('Test Front', 'Test Back', existingSet)).toBe(true);
    expect(isDuplicate('Another', 'Card', existingSet)).toBe(true);
    expect(isDuplicate('New', 'Card', existingSet)).toBe(false);
  });

  it('should ignore case and whitespace in duplicates', () => {
    const existingSet = new Set(['test front|test back']);
    
    expect(isDuplicate('  TEST front  ', '  test BACK  ', existingSet)).toBe(true);
  });
});

describe('createExistingFlashcardsSet', () => {
  it('should create a set of normalized keys', () => {
    const flashcards = [
      { front: 'Test 1', back: 'Back 1' },
      { front: 'Test 2', back: 'Back 2' }
    ];

    const set = createExistingFlashcardsSet(flashcards);
    expect(set.size).toBe(2);
    expect(set.has('test 1|back 1')).toBe(true);
    expect(set.has('test 2|back 2')).toBe(true);
  });

  it('should handle empty flashcards array', () => {
    const set = createExistingFlashcardsSet([]);
    expect(set.size).toBe(0);
  });
});

describe('countProposalsByStatus', () => {
  it('should count proposals by status correctly', () => {
    const proposals: ProposalViewModel[] = [
      { status: 'pending', originalFront: '', originalBack: '', currentFront: '', currentBack: '', isEdited: false, validationErrors: {} },
      { status: 'accepted', originalFront: '', originalBack: '', currentFront: '', currentBack: '', isEdited: false, validationErrors: {} },
      { status: 'rejected', originalFront: '', originalBack: '', currentFront: '', currentBack: '', isEdited: false, validationErrors: {} },
      { status: 'edited', originalFront: '', originalBack: '', currentFront: '', currentBack: '', isEdited: true, validationErrors: {} },
      { status: 'accepted', originalFront: '', originalBack: '', currentFront: '', currentBack: '', isEdited: false, validationErrors: { front: 'Error' } }
    ];

    const counts = countProposalsByStatus(proposals);
    
    expect(counts.pending).toBe(1);
    expect(counts.accepted).toBe(2);
    expect(counts.rejected).toBe(1);
    expect(counts.edited).toBe(1);
    expect(counts.saveable).toBe(2); // Only accepted and edited without errors
  });

  it('should handle empty array', () => {
    const counts = countProposalsByStatus([]);
    
    expect(counts.pending).toBe(0);
    expect(counts.accepted).toBe(0);
    expect(counts.rejected).toBe(0);
    expect(counts.edited).toBe(0);
    expect(counts.saveable).toBe(0);
  });
});

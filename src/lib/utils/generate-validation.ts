/**
 * Validation utilities for Generate view
 *
 * Provides client-side validation for source text and proposal fields
 */

/**
 * Source text validation constraints
 */
export const SOURCE_TEXT_CONSTRAINTS = {
  MIN_LENGTH: 1000,
  MAX_LENGTH: 10000,
} as const;

/**
 * Proposal field validation constraints
 */
export const PROPOSAL_FIELD_CONSTRAINTS = {
  FRONT_MIN: 1,
  FRONT_MAX: 200,
  BACK_MIN: 1,
  BACK_MAX: 500,
} as const;

/**
 * Validates source text length
 */
export function validateSourceText(text: string): {
  isValid: boolean;
  error: string | null;
  charCount: number;
} {
  const trimmed = text.trim();
  const charCount = trimmed.length;

  if (charCount === 0) {
    return {
      isValid: false,
      error: "Source text is required",
      charCount: 0,
    };
  }

  if (charCount < SOURCE_TEXT_CONSTRAINTS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Source text must be at least ${SOURCE_TEXT_CONSTRAINTS.MIN_LENGTH} characters (currently ${charCount})`,
      charCount,
    };
  }

  if (charCount > SOURCE_TEXT_CONSTRAINTS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Source text must not exceed ${SOURCE_TEXT_CONSTRAINTS.MAX_LENGTH} characters (currently ${charCount})`,
      charCount,
    };
  }

  return {
    isValid: true,
    error: null,
    charCount,
  };
}

/**
 * Validates proposal front field
 */
export function validateProposalFront(front: string): string | undefined {
  const trimmed = front.trim();

  if (trimmed.length === 0) {
    return "Front text is required";
  }

  if (trimmed.length < PROPOSAL_FIELD_CONSTRAINTS.FRONT_MIN) {
    return `Front text must be at least ${PROPOSAL_FIELD_CONSTRAINTS.FRONT_MIN} character`;
  }

  if (trimmed.length > PROPOSAL_FIELD_CONSTRAINTS.FRONT_MAX) {
    return `Front text must not exceed ${PROPOSAL_FIELD_CONSTRAINTS.FRONT_MAX} characters`;
  }

  return undefined;
}

/**
 * Validates proposal back field
 */
export function validateProposalBack(back: string): string | undefined {
  const trimmed = back.trim();

  if (trimmed.length === 0) {
    return "Back text is required";
  }

  if (trimmed.length < PROPOSAL_FIELD_CONSTRAINTS.BACK_MIN) {
    return `Back text must be at least ${PROPOSAL_FIELD_CONSTRAINTS.BACK_MIN} character`;
  }

  if (trimmed.length > PROPOSAL_FIELD_CONSTRAINTS.BACK_MAX) {
    return `Back text must not exceed ${PROPOSAL_FIELD_CONSTRAINTS.BACK_MAX} characters`;
  }

  return undefined;
}

/**
 * Validates a complete proposal
 */
export function validateProposal(
  front: string,
  back: string
): {
  front?: string;
  back?: string;
} {
  return {
    front: validateProposalFront(front),
    back: validateProposalBack(back),
  };
}

/**
 * Checks if a proposal has any validation errors
 */
export function hasValidationErrors(errors: { front?: string; back?: string }): boolean {
  return !!(errors.front || errors.back);
}

/**
 * Gets character count color class based on validity
 */
export function getCharCountColorClass(charCount: number, isValid: boolean): string {
  if (isValid) {
    return "text-green-600 dark:text-green-400";
  }

  if (charCount === 0) {
    return "text-gray-500 dark:text-gray-400";
  }

  return "text-red-600 dark:text-red-400";
}

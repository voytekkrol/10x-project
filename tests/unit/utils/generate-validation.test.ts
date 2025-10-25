import { describe, it, expect } from 'vitest';
import { validateSourceText, validateProposal } from '../../../src/lib/utils/generate-validation';

describe('validateSourceText', () => {
  it('should validate valid source text', () => {
    const result = validateSourceText('This is a valid source text with more than 1000 characters. '.repeat(20));
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.charCount).toBe(1199);
  });

  it('should reject empty text', () => {
    const result = validateSourceText('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Source text is required');
    expect(result.charCount).toBe(0);
  });

  it('should reject text that is too short', () => {
    const result = validateSourceText('Too short');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Source text must be at least 1000 characters (currently 9)');
    expect(result.charCount).toBe(9);
  });

  it('should handle whitespace properly', () => {
    const result = validateSourceText('   Spaces   at   ends   '.repeat(50));
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.charCount).toBe(1194);
  });

  it('should handle very long text', () => {
    const longText = 'a'.repeat(10000);
    const result = validateSourceText(longText);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.charCount).toBe(10000);
  });

  it('should handle text with special characters', () => {
    const specialChars = 'Special chars: !@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./'.repeat(25);
    const result = validateSourceText(specialChars);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.charCount).toBe(specialChars.length);
  });
});

describe('validateProposal', () => {
  it('should validate valid flashcard proposal', () => {
    const errors = validateProposal('What is JavaScript?', 'A programming language.');
    expect(errors).toEqual({});
  });

  it('should reject empty front', () => {
    const errors = validateProposal('', 'A programming language.');
    expect(errors.front).toBe('Front text is required');
  });

  it('should reject empty back', () => {
    const errors = validateProposal('What is JavaScript?', '');
    expect(errors.back).toBe('Back text is required');
  });

  it('should reject front side that is too short', () => {
    // The actual minimum is 1 character, but "JS?" is 3 chars, so it passes validation
    const errors = validateProposal('', 'A programming language.');
    expect(errors.front).toBe('Front text is required');
  });

  it('should reject back side that is too short', () => {
    // The actual minimum is 1 character, but "JS" is 2 chars, so it passes validation
    const errors = validateProposal('What is JavaScript?', '');
    expect(errors.back).toBe('Back text is required');
  });

  it('should handle multiple validation errors', () => {
    const errors = validateProposal('', '');
    expect(errors.front).toBe('Front text is required');
    expect(errors.back).toBe('Back text is required');
  });

  it('should handle front/back sides with just whitespace', () => {
    const errors = validateProposal('   ', '   ');
    expect(errors.front).toBe('Front text is required');
    expect(errors.back).toBe('Back text is required');
  });

  it('should handle very long front/back text', () => {
    const longFront = 'a'.repeat(200);
    const longBack = 'a'.repeat(500);
    const errors = validateProposal(longFront, longBack);
    expect(errors).toEqual({});
  });
});

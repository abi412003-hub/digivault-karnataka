export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
};

export type FormRules<T extends string = string> = Partial<Record<T, ValidationRule>>;

export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: FormRules<string>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    if (!rule) continue;
    const value = values[field];
    const strVal = String(value ?? "").trim();

    if (rule.required && !strVal) {
      errors[field] = rule.message || `${field} is required`;
      continue;
    }

    if (strVal && rule.minLength && strVal.length < rule.minLength) {
      errors[field] = rule.message || `Minimum ${rule.minLength} characters`;
    }

    if (strVal && rule.maxLength && strVal.length > rule.maxLength) {
      errors[field] = rule.message || `Maximum ${rule.maxLength} characters`;
    }

    if (strVal && rule.pattern && !rule.pattern.test(strVal)) {
      errors[field] = rule.message || "Invalid format";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// Common patterns
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  pincode: /^\d{6}$/,
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
};

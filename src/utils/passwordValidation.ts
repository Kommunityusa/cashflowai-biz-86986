export interface PasswordStrength {
  score: number;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  message: string;
  color: string;
}

export function validatePassword(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let message = '';
  let color = '';

  switch (score) {
    case 0:
    case 1:
      message = 'Very Weak';
      color = 'text-destructive';
      break;
    case 2:
      message = 'Weak';
      color = 'text-orange-500';
      break;
    case 3:
      message = 'Fair';
      color = 'text-yellow-500';
      break;
    case 4:
      message = 'Good';
      color = 'text-blue-500';
      break;
    case 5:
      message = 'Strong';
      color = 'text-green-500';
      break;
    default:
      message = 'Invalid';
      color = 'text-muted-foreground';
  }

  return {
    score,
    requirements,
    message,
    color,
  };
}

export function getPasswordRequirements(): string[] {
  return [
    'At least 8 characters long',
    'Contains at least one uppercase letter',
    'Contains at least one lowercase letter',
    'Contains at least one number',
    'Contains at least one special character (!@#$%^&*)',
  ];
}
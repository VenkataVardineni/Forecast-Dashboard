export interface AppError {
  message: string;
  code?: string;
  retryable?: boolean;
}

export class APIError extends Error {
  code?: string;
  retryable: boolean;

  constructor(message: string, code?: string, retryable: boolean = false) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.retryable = retryable;
  }
}

export const handleError = (error: any): AppError => {
  if (error.response) {
    // API responded with error status
    const status = error.response.status;
    const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
    
    return {
      message,
      code: `HTTP_${status}`,
      retryable: status >= 500 || status === 408, // Server errors and timeout are retryable
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'Unable to reach the server. Please check your connection.',
      code: 'NETWORK_ERROR',
      retryable: true,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      retryable: false,
    };
  }
};

export const retryRequest = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = handleError(error);
      
      if (!appError.retryable || i === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError;
};


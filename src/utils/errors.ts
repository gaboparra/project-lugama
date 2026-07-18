export interface AppError extends Error {
  status?: number;
}

export const createError = (message: string, status: number): AppError => {
  const error = new Error(message) as AppError;
  error.status = status;
  return error;
};

export const getErrorInfo = (error: unknown): { status: number; message: string } => {
  if (error instanceof Error) {
    const status = (error as AppError).status || 500;
    return { status, message: error.message };
  }
  return { status: 500, message: "Unknown error" };
};

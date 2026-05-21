export function isNetworkError(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybeAxiosError = error as {
    response?: unknown;
    request?: unknown;
    code?: string;
    message?: string;
  };

  return (
    !maybeAxiosError.response &&
    Boolean(maybeAxiosError.request) ||
    maybeAxiosError.code === 'ERR_NETWORK' ||
    maybeAxiosError.code === 'ECONNABORTED' ||
    maybeAxiosError.message === 'Network Error'
  );
}
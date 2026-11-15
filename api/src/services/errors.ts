export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = 'error'
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} não encontrado(a).`, 'not_found');
export const forbidden = (message = 'Você não tem acesso a este recurso.') =>
  new HttpError(403, message, 'forbidden');

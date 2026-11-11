import { HttpException, Logger } from '@nestjs/common';
import { unwrapResolverError } from '@apollo/server/errors';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';

const logger = new Logger('GraphQL');

const codesByStatus: Record<number, string> = {
  400: 'BAD_USER_INPUT',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'BUSINESS_RULE_VIOLATION',
};

type ExceptionResponse = {
  code?: string;
  message?: string | string[];
};

export function formatGraphQLError(
  formatted: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const original = unwrapResolverError(error);
  const { path, locations } = formatted;

  if (original instanceof HttpException) {
    const response = original.getResponse() as string | ExceptionResponse;
    const body = typeof response === 'string' ? {} : response;
    const details = Array.isArray(body.message) ? body.message : undefined;

    return {
      message: details ? 'Validation failed' : original.message,
      path,
      locations,
      extensions: {
        code: body.code ?? codesByStatus[original.getStatus()] ?? 'INTERNAL_SERVER_ERROR',
        ...(details && { details }),
      },
    };
  }

  if (original instanceof GraphQLError) {
    return { message: formatted.message, path, locations, extensions: { code: formatted.extensions?.code } };
  }

  logger.error(original instanceof Error ? original.stack : original);

  return {
    message: 'Internal server error',
    path,
    locations,
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}
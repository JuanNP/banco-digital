import { Logger } from '@nestjs/common';
import type { ApolloServerPlugin } from '@apollo/server';
import { Kind, type OperationDefinitionNode } from 'graphql';

const logger = new Logger('GraphQL');

function describe(
  operation?: OperationDefinitionNode,
  operationName?: string | null,
) {
  if (!operation) return 'invalid operation';

  const firstField = operation.selectionSet.selections.find(
    (s) => s.kind === Kind.FIELD,
  );
  const name = operationName ?? firstField?.name.value ?? 'anonymous';
  return `${operation.operation} ${name}`;
}

export const requestLoggingPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    const startedAt = Date.now();

    return {
      async willSendResponse({ operation, operationName, errors }) {
        const label = describe(operation, operationName);
        const elapsed = Date.now() - startedAt;

        if (errors?.length) {
          const codes = errors.map((e) => e.message ?? 'UNKNOWN').join(', ');
          logger.warn(`${label} failed in ${elapsed}ms [${codes}]`);
        } else {
          logger.log(`${label} ${elapsed}ms`);
        }
      },
    };
  },
};

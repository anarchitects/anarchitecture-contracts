import { createAuthContracts } from '@anarchitects/auth-contracts';
import { digest, invariant, json } from './common.mjs';

// Configuration is canonical input, never a caller-supplied schema replacement.
export function configureAuthModels(models, config) {
  if (config === undefined) {
    invariant(
      !models.some((model) => model.configuration),
      'Configured models require explicit authConfig',
    );
    return models;
  }
  invariant(
    models.filter((model) => model.domain === 'auth').length === 1,
    'authConfig requires exactly one Auth model',
  );
  const contracts = createAuthContracts(config);
  return models.map((model) =>
    model.domain !== 'auth'
      ? model
      : {
          ...model,
          schemas: contracts.schemas,
          operations: contracts.operations,
          configuration: contracts.config,
          sourceFiles: {
            ...model.sourceFiles,
            // A virtual input digest binds P07 and host evidence to these exact rules.
            'configuration:auth': digest(json(contracts.config)),
          },
        },
  );
}

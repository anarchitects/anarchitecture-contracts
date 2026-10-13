import SwaggerParser from '@apidevtools/swagger-parser';
import { invariant } from './common.mjs';

const methods = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
export function validateRegistry(models, index) {
  const ids = new Set(),
    routes = new Set();
  for (const model of models)
    for (const op of model.operations) {
      const label = op.operationId;
      const check = (condition, message) =>
        invariant(condition, `${label}: ${message}`);
      check(
        op.domain === model.domain &&
          op.capability.startsWith(`${model.domain}.`),
        'invalid ownership',
      );
      check(text(label) && !ids.has(label), 'duplicate or missing operationId');
      ids.add(label);
      const route = `${op.method} ${op.path}`;
      check(
        methods.has(op.method) && /^\/(?!\/)[^?#\s]*$/.test(op.path),
        'invalid method/path',
      );
      const normalized = route.replace(/\{[^}]+\}/g, '{}');
      check(!routes.has(normalized), 'duplicate or ambiguous method/path');
      routes.add(normalized);
      check(
        Array.isArray(op.tags) &&
          op.tags.length &&
          op.tags.every(text) &&
          new Set(op.tags).size === op.tags.length,
        'missing or duplicate tags',
      );
      check(
        text(op.summary) &&
          text(op.description) &&
          typeof op.deprecated === 'boolean',
        'missing description/deprecation',
      );
      check(
        Array.isArray(op.parameters) && Array.isArray(op.semantics),
        'missing parameters/semantics',
      );
      const semanticIds = new Set();
      for (const semantic of op.semantics) {
        check(
          text(semantic.id) &&
            !semanticIds.has(semantic.id) &&
            text(semantic.description) &&
            Array.isArray(semantic.fixtures),
          'invalid semantic requirement',
        );
        check(
          [
            'pre-validation',
            'normalization',
            'authentication/authorization',
            'application outcome',
            'response',
          ].includes(semantic.phase),
          'invalid semantic phase',
        );
        semanticIds.add(semantic.id);
      }
      const refs = (values) =>
        check(
          Array.isArray(values) && values.every((id) => semanticIds.has(id)),
          'unknown semantic reference',
        );
      const schema = (value) => {
        check(index.has(value), 'unregistered schema reference');
        const origin = index.get(value);
        check(
          origin.domain === model.domain ||
            model.package.dependencies?.[origin.package],
          'undeclared cross-domain schema dependency',
        );
      };
      const body = (value) => {
        check(
          value && ['none', 'json', 'raw'].includes(value.kind),
          'invalid body',
        );
        if (value.kind === 'none') {
          check(Object.keys(value).length === 1, 'bodyless value has content');
          return;
        }
        check(
          typeof value.required === 'boolean',
          'missing body required flag',
        );
        if (value.kind === 'json') {
          check(
            value.content && Object.keys(value.content).length,
            'empty body content',
          );
          for (const [media, item] of Object.entries(value.content)) {
            check(/^[\w.+-]+\/[\w.+-]+$/.test(media), 'invalid media type');
            schema(item);
          }
        } else {
          check(
            text(value.mediaType) && value.parsedSchema,
            'raw body needs media type and parsed schema',
          );
          schema(value.parsedSchema);
          refs(value.semantics);
        }
      };
      const parameters = new Set(),
        pathNames = [];
      for (const parameter of op.parameters) {
        check(
          ['path', 'query', 'header', 'cookie'].includes(parameter.in) &&
            text(parameter.name),
          'invalid parameter',
        );
        const key = `${parameter.in}:${parameter.in === 'header' ? parameter.name.toLowerCase() : parameter.name}`;
        check(!parameters.has(key), 'duplicate parameter');
        parameters.add(key);
        check(
          typeof parameter.required === 'boolean' &&
            text(parameter.description),
          'missing parameter metadata',
        );
        const encoding = parameter.serialization;
        check(
          encoding &&
            typeof encoding.explode === 'boolean' &&
            encoding.style ===
              (['path', 'header'].includes(parameter.in) ? 'simple' : 'form'),
          'unsupported parameter serialization',
        );
        check(
          encoding.allowReserved === undefined ||
            (parameter.in === 'query' &&
              typeof encoding.allowReserved === 'boolean'),
          'invalid allowReserved',
        );
        if (parameter.in === 'path') {
          check(parameter.required, 'optional path parameter');
          pathNames.push(parameter.name);
        }
        schema(parameter.schema);
      }
      const placeholders = [...op.path.matchAll(/\{([^}]+)\}/g)].map(
        (match) => match[1],
      );
      check(
        !/[{}]/.test(op.path.replace(/\{[^{}]+\}/g, '')) &&
          new Set(placeholders).size === placeholders.length &&
          JSON.stringify(placeholders.sort()) ===
            JSON.stringify(pathNames.sort()),
        'path parameters do not match placeholders',
      );
      body(op.requestBody);
      check(
        op.responses && Object.keys(op.responses).length,
        'missing responses',
      );
      let successes = 0,
        errors = 0;
      for (const [status, response] of Object.entries(op.responses)) {
        check(/^[1-5]\d\d$/.test(status), 'invalid response status');
        check(
          ['success', 'error'].includes(response.outcome) &&
            text(response.description) &&
            Array.isArray(response.headers),
          'invalid response metadata',
        );
        if (response.outcome === 'success') {
          successes++;
          check(Number(status) < 400, 'success error status');
        } else {
          errors++;
          check(Number(status) >= 400, 'error success status');
        }
        body(response.body);
        refs(response.semantics);
        if (['204', '304'].includes(status) || op.method === 'HEAD')
          check(
            response.body.kind === 'none',
            'body forbidden for status/method',
          );
        const headers = new Set();
        for (const header of response.headers) {
          check(
            text(header.name) &&
              header.name === header.name.toLowerCase() &&
              !headers.has(header.name),
            'duplicate or unnormalized header',
          );
          headers.add(header.name);
          check(
            text(header.presence) &&
              ['single', 'repeated'].includes(header.cardinality),
            'missing header semantics',
          );
          if (header.name === 'set-cookie')
            check(
              header.cardinality === 'repeated',
              'Set-Cookie must remain repeated',
            );
          schema(header.schema);
        }
      }
      check(successes && errors, 'success and error outcomes must be explicit');
      check(
        op.security &&
          ['public', 'required', 'profile'].includes(op.security.kind),
        'missing security',
      );
      if (op.security.kind === 'profile')
        check(text(op.security.binding), 'missing security binding');
      if (op.security.kind === 'required')
        validateRequirements(op.security.alternatives);
      check(
        op.availability &&
          ['always', 'capability'].includes(op.availability.kind),
        'missing availability',
      );
      if (op.availability.kind === 'capability')
        check(
          op.availability.capability === op.capability,
          'availability capability mismatch',
        );
      check(
        op.compatibility &&
          /^[a-f0-9]{40}$/.test(op.compatibility.revision) &&
          op.compatibility.route === route &&
          op.compatibility.fixtures.length > 0 &&
          Array.isArray(op.compatibility.discrepancies) &&
          Array.isArray(op.compatibility.migrations),
        'invalid compatibility evidence',
      );
    }
}

export function validateRequirements(requirements, schemes) {
  invariant(
    Array.isArray(requirements) && requirements.length > 0,
    'Security requires nonempty alternatives',
  );
  for (const alternative of requirements) {
    invariant(
      alternative && Object.keys(alternative).length > 0,
      'Anonymous security alternative is forbidden',
    );
    for (const [name, scopes] of Object.entries(alternative)) {
      invariant(
        Array.isArray(scopes) && scopes.every(text),
        `Invalid security scopes: ${name}`,
      );
      if (schemes) {
        invariant(
          Object.hasOwn(schemes, name),
          `Unresolved security scheme: ${name}`,
        );
        const scheme = schemes[name];
        invariant(!scheme.$ref, 'External security schemes are forbidden');
        invariant(
          ['apiKey', 'http', 'oauth2', 'openIdConnect', 'mutualTLS'].includes(
            scheme.type,
          ),
          `Invalid scheme: ${name}`,
        );
        if (!['oauth2', 'openIdConnect'].includes(scheme.type))
          invariant(scopes.length === 0, `Scopes are not allowed for ${name}`);
      }
    }
  }
}

export async function lintDocument(document) {
  invariant(document.openapi === '3.1.1', 'Expected OpenAPI 3.1.1');
  const ids = new Set();
  for (const item of Object.values(document.paths))
    for (const operation of Object.values(item)) {
      invariant(!ids.has(operation.operationId), 'Duplicate operationId');
      ids.add(operation.operationId);
      invariant(
        Array.isArray(operation.security),
        'Every emitted operation must resolve security explicitly',
      );
      if (operation.security.length)
        validateRequirements(
          operation.security,
          document.components.securitySchemes,
        );
    }
  const checkRefs = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.$ref) {
      invariant(
        value.$ref.startsWith('#/'),
        `External or unrelocated reference: ${value.$ref}`,
      );
      let target = document;
      for (const segment of value.$ref.slice(2).split('/'))
        target = target?.[segment.replace(/~1/g, '/').replace(/~0/g, '~')];
      invariant(target !== undefined, `Dangling reference: ${value.$ref}`);
    }
    Object.values(value).forEach(checkRefs);
  };
  checkRefs(document);
  await SwaggerParser.validate(structuredClone(document), {
    resolve: { external: false },
    validate: { spec: true, schema: true },
  });
}

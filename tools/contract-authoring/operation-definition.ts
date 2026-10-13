// Authoring protocol only: erased from JS and inlined in published declarations.
export type Body<Schema> =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'json';
      readonly required: boolean;
      readonly content: Readonly<Record<string, Schema>>;
    }
  | {
      readonly kind: 'raw';
      readonly required: boolean;
      readonly mediaType: string;
      readonly parsedSchema?: Schema;
      readonly semantics: readonly string[];
    };

export interface SemanticRequirement {
  readonly id: string;
  readonly phase:
    | 'pre-validation'
    | 'normalization'
    | 'authentication/authorization'
    | 'application outcome'
    | 'response';
  readonly description: string;
  readonly fixtures: readonly string[];
}

export interface ResponseDefinition<Schema> {
  readonly outcome: 'success' | 'error';
  readonly description: string;
  readonly body: Body<Schema>;
  readonly headers: readonly {
    readonly name: string;
    readonly schema: Schema;
    readonly presence: string;
    readonly cardinality: 'single' | 'repeated';
  }[];
  readonly semantics: readonly string[];
}

export interface HttpOperationDefinition<Schema> {
  readonly domain: 'auth' | 'identity' | 'forms' | 'newsletter';
  readonly capability: string;
  readonly operationId: string;
  readonly method:
    | 'GET'
    | 'POST'
    | 'PATCH'
    | 'PUT'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS';
  readonly path: `/${string}`;
  readonly tags: readonly [string, ...string[]];
  readonly summary: string;
  readonly description: string;
  readonly parameters: readonly {
    readonly in: 'path' | 'query' | 'header' | 'cookie';
    readonly name: string;
    readonly required: boolean;
    readonly schema: Schema;
    readonly description: string;
    readonly serialization: {
      readonly style: 'simple' | 'form';
      readonly explode: boolean;
      readonly allowReserved?: boolean;
    };
  }[];
  readonly requestBody: Body<Schema>;
  readonly responses: Readonly<Record<`${number}`, ResponseDefinition<Schema>>>;
  readonly security:
    | { readonly kind: 'public' }
    | {
        readonly kind: 'required';
        readonly alternatives: readonly [
          Readonly<Record<string, readonly string[]>>,
          ...Readonly<Record<string, readonly string[]>>[],
        ];
      }
    | { readonly kind: 'profile'; readonly binding: string };
  readonly availability:
    | { readonly kind: 'always' }
    | { readonly kind: 'capability'; readonly capability: string };
  readonly semantics: readonly SemanticRequirement[];
  readonly compatibility: {
    readonly revision: string;
    readonly route: string;
    readonly fixtures: readonly string[];
    readonly discrepancies: readonly string[];
    readonly migrations: readonly string[];
  };
  readonly deprecated: boolean;
}

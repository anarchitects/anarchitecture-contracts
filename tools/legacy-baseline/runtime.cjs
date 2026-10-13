const { createHmac } = require('node:crypto');

const instant = '2026-01-01T00:00:00.000Z';
const sessionCookie =
  'better-auth.session=baseline; Path=/; HttpOnly; SameSite=Lax';
const webhookSecret = 'public-test-fixture-secret-not-a-deployment-secret';

const controllerFiles = [
  ['auth/nest/src/presentation/controllers/auth.controller', 'AuthController'],
  [
    'auth/nest/src/presentation/controllers/passkey-auth.controller',
    'PasskeyAuthController',
  ],
  [
    'auth/nest/src/infrastructure-engine/better-auth/plugins/jwt/jwt-auth-plugin.controller',
    'JwtAuthPluginController',
  ],
  [
    'forms/nest/src/presentation/controllers/forms.controller',
    'FormsController',
  ],
  [
    'forms/nest/src/presentation/controllers/submissions.controller',
    'SubmissionsController',
  ],
  [
    'identity/nest/src/presentation/controllers/user-profiles.controller',
    'UserProfilesController',
  ],
  [
    'newsletter/nest/src/presentation/newsletter-subscription.controller',
    'NewsletterSubscriptionController',
  ],
  [
    'newsletter/nest/src/presentation/newsletter-native.controller',
    'NewsletterNativeController',
  ],
  [
    'newsletter/nest/src/presentation/newsletter-webhook.controller',
    'NewsletterWebhookController',
  ],
];

function implementation(legacy) {
  const { source, requireSource: req } = legacy;
  const get = (file, name) => source(`libs/${file}.ts`)[name];
  const controllers = controllerFiles.map(([file, name]) => get(file, name));
  const [AuthController] = controllers;
  const apply = get(
    'auth/nest/src/presentation/auth-controller-route-schemas',
    'applyAuthControllerContractRouteSchemas',
  );
  const contracts = get(
    'auth/nest/src/presentation/auth-contracts',
    'createDefaultAuthContracts',
  );
  apply(AuthController, contracts());
  return { get, controllers, req, apply, contracts };
}

function inventory(legacy) {
  const { controllers, req } = implementation(legacy);
  const { PATH_METADATA, METHOD_METADATA, HTTP_CODE_METADATA } = req(
    '@nestjs/common/constants',
  );
  const { FASTIFY_ROUTE_SCHEMA_METADATA } = req(
    '@nestjs/platform-fastify/constants',
  );
  const { RequestMethod } = req('@nestjs/common');
  const { OPERATION_ID_MAP } = legacy.source(
    'tools/api-specs/route-metadata.ts',
  );
  return controllers
    .flatMap((Controller, i) =>
      Object.getOwnPropertyNames(Controller.prototype).flatMap(
        (handlerName) => {
          const handler = Controller.prototype[handlerName];
          const methodId = Reflect.getMetadata(METHOD_METADATA, handler);
          if (methodId === undefined) return [];
          const method = RequestMethod[methodId];
          const path =
            `/${Reflect.getMetadata(PATH_METADATA, Controller)}/${Reflect.getMetadata(PATH_METADATA, handler) ?? ''}`
              .replace(/\/+/g, '/')
              .replace(/\/$/, '')
              .replace(/:([\w]+)/g, '{$1}');
          const schema = Reflect.getMetadata(
            FASTIFY_ROUTE_SCHEMA_METADATA,
            handler,
          );
          return [
            {
              key: `${method} ${path}`,
              method,
              path,
              operationId: OPERATION_ID_MAP[`${method} ${path}`] ?? null,
              handler: `${Controller.name}.${handlerName}`,
              source: `libs/${controllerFiles[i][0]}.ts`,
              successStatus:
                Reflect.getMetadata(HTTP_CODE_METADATA, handler) ??
                (method === 'POST' ? 201 : 200),
              schema: JSON.parse(JSON.stringify(schema)),
            },
          ];
        },
      ),
    )
    .sort((a, b) => a.key.localeCompare(b.key));
}

async function executeCase(legacy, fixture) {
  const { get, controllers, req } = implementation(legacy);
  const { Test } = req('@nestjs/testing');
  const { FastifyAdapter } = req('@nestjs/platform-fastify');
  const { Module, NotFoundException, UnauthorizedException } =
    req('@nestjs/common');
  const { Reflector } = req('@nestjs/core');
  const controls = fixture.controls ?? {};
  const events = [];
  const record = (name, data) =>
    events.push({ name, data: JSON.parse(JSON.stringify(data ?? null)) });
  const providers = [];
  const bind = (token, value) =>
    providers.push({ provide: token, useValue: value });
  const imports = [];
  let selectedControllers = [];
  let principal;

  if (fixture.host === 'core' || fixture.host === 'guarded') {
    selectedControllers = controllers.slice(0, 6);
    const user = {
      id: 'user-1',
      email: 'reader@example.test',
      name: 'Reader',
      emailVerified: true,
      image: null,
      roles: controls.policyRules
        ? [{ id: 'role-1', name: 'fixture', permissions: controls.policyRules }]
        : [],
      createdAt: new Date(instant),
      updatedAt: new Date(instant),
    };
    const users = {
      find: async () => (controls.existingUser ? [user] : []),
      findOne: async () => (controls.missingUser ? null : user),
      ensureRole: async (...args) => record('ensureRole', args),
      update: async (value) => {
        record('updateUser', value);
        return value;
      },
    };
    const headers = () => {
      const value = new Headers();
      value.append('set-cookie', sessionCookie);
      value.append(
        'set-cookie',
        'baseline.challenge=fixture; Path=/; HttpOnly',
      );
      return value;
    };
    const credential = {
      challenge: 'Y2hhbGxlbmdl',
      rpId: 'example.test',
      userVerification: 'required',
    };
    const engine = {
      register: async (dto) => {
        record('register', dto);
        return { userId: user.id };
      },
      login: async (dto, incoming) => {
        record('login', { dto, cookie: new Headers(incoming).get('cookie') });
        if (controls.engineReject)
          throw new UnauthorizedException('Invalid credentials');
        return { userId: user.id, headers: headers() };
      },
      logout: async (dto, incoming) => {
        record('logout', { dto, cookie: new Headers(incoming).get('cookie') });
        return {
          success: true,
          headers: new Headers({
            'set-cookie': 'better-auth.session=; Max-Age=0; Path=/; HttpOnly',
          }),
        };
      },
      getSession: async (incoming) =>
        new Headers(incoming)
          .get('cookie')
          ?.includes('better-auth.session=baseline')
          ? { userId: user.id, headers: headers() }
          : null,
      requestPasswordReset: async (dto) => record('requestPasswordReset', dto),
      resetPassword: async (dto) => {
        record('resetPassword', dto);
        if (controls.engineReject) throw new Error('provider detail');
      },
      verifyEmail: async (token) => {
        record('verifyEmail', token);
        if (controls.engineReject) throw new Error('provider detail');
      },
      beginPasskeyRegistration: async (dto, incoming) => {
        record('beginPasskeyRegistration', {
          dto,
          cookie: new Headers(incoming).get('cookie'),
        });
        return {
          body: {
            rp: { id: 'example.test', name: 'Fixture' },
            user: { id: 'dXNlcg', name: user.email, displayName: user.name },
            challenge: credential.challenge,
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          },
          headers: headers(),
        };
      },
      finishPasskeyRegistration: async (dto) => {
        record('finishPasskeyRegistration', dto);
        return { success: true, headers: headers() };
      },
      beginPasskeyAuthentication: async (dto) => {
        record('beginPasskeyAuthentication', dto);
        return { body: credential, headers: headers() };
      },
      finishPasskeyAuthentication: async (dto) => {
        record('finishPasskeyAuthentication', dto);
        if (controls.engineReject)
          throw new UnauthorizedException(
            'Fixture verifier rejected assertion',
          );
        return { userId: user.id, headers: headers() };
      },
    };
    const Principal = get(
      'auth/nest/src/application/services/auth-principal.resolver',
      'AuthPrincipalResolver',
    );
    principal = new Principal(engine, users);
    const Ability = get(
      'auth/nest/src/application/factories/ability.factory',
      'AbilityFactory',
    );
    const Policies = get(
      'auth/nest/src/application/services/policies.service',
      'PoliciesService',
    );
    const policies = new Policies(users, new Ability());
    const accounts = {
      findCredentialAccountByUserId: async () => ({ password: 'fixture-hash' }),
      upsertCredentialAccount: async (data) =>
        record('upsertCredentialAccount', data),
    };
    const hash = {
      compare: async (value) => value === 'password',
      hash: async (value) => `fixture-hash:${value}`,
    };
    const Orchestration = get(
      'auth/nest/src/application/services/auth-orchestration.service',
      'AuthOrchestrationService',
    );
    bind(
      get('auth/nest/src/application/services/auth.service', 'AuthService'),
      new Orchestration(hash, accounts, users, engine, principal, policies),
    );
    const Passkeys = get(
      'auth/nest/src/application/services/auth-passkey.service',
      'AuthPasskeyService',
    );
    bind(Passkeys, new Passkeys(engine, principal, policies));
    const Jwt = get(
      'auth/nest/src/infrastructure-engine/better-auth/plugins/jwt/better-auth-jwt-plugin.service',
      'BetterAuthJwtPluginService',
    );
    const { JwtService } = req('@nestjs/jwt');
    const jwt = new JwtService({
      secret: 'public-jwt-fixture-secret',
      signOptions: { noTimestamp: true },
    });
    bind(
      Jwt,
      new Jwt(
        hash,
        accounts,
        users,
        {
          invalidateTokens: async (...data) => record('invalidateTokens', data),
          isTokenInvalidated: async () => !!controls.invalidatedToken,
        },
        jwt,
      ),
    );

    const Forms = get(
      'forms/nest/src/application/services/forms.service',
      'FormsService',
    );
    const Submissions = get(
      'forms/nest/src/application/services/submissions.service',
      'SubmissionsService',
    );
    const forms = new Forms({
      getFormConfig: async (id, version) => {
        record('getFormConfig', { id, version });
        if (id === 'missing')
          throw new NotFoundException('Form config not found');
        return {
          id,
          version,
          ...(controls.formDelivery
            ? {
                delivery: {
                  webhooks: [
                    {
                      url: 'https://example.test/hook',
                      secret: 'public-fixture-webhook-secret',
                    },
                  ],
                },
              }
            : {}),
          fields: [
            {
              name: 'email',
              kind: 'email',
              ui: { label: 'Email' },
              required: true,
            },
          ],
        };
      },
    });
    const submission = {
      id: '01900000-0000-7000-8000-000000000001',
      formId: 'contact',
      formVersion: 1,
      payload: { email: 'reader@example.test' },
      createdAt: new Date(instant),
      updatedAt: new Date(instant),
    };
    bind(Forms, forms);
    bind(
      Submissions,
      new Submissions(
        {
          getSubmissions: async (query) => {
            record('getSubmissions', query);
            return [submission];
          },
          getSubmission: async ({ id }) =>
            id.endsWith('0002') ? null : submission,
          createSubmission: async (dto) => {
            record('createSubmission', dto);
            return { ...submission, ...dto };
          },
        },
        undefined,
        forms,
      ),
    );

    const profile = {
      ...(controls.responseExtra
        ? { internalOnly: 'fixture-internal-value' }
        : {}),
      id: 'profile-1',
      authUserId: 'user-1',
      displayName: null,
      givenName: null,
      familyName: null,
      avatarUrl: null,
      locale: null,
      timeZone: null,
      createdAt: new Date(instant),
      updatedAt: new Date(instant),
    };
    const profiles = {
      findById: async (id) => (id === 'missing' ? null : profile),
      findByAuthUserId: async (id) =>
        controls.existingProfile || id === 'user-1' ? profile : null,
      save: async (dto) => {
        record('saveProfile', dto);
        return { ...profile, ...dto };
      },
      update: async (dto) => {
        record('updateProfile', dto);
        return { ...profile, ...dto };
      },
    };
    for (const [file, name] of [
      ['create-user-profile', 'CreateUserProfileService'],
      ['get-user-profile', 'GetUserProfileService'],
      ['update-user-profile', 'UpdateUserProfileService'],
    ]) {
      const Service = get(
        `identity/nest/src/application/services/${file}.service`,
        name,
      );
      bind(Service, new Service(profiles));
    }
  } else if (fixture.host === 'newsletter') {
    const Newsletter = get(
      'newsletter/nest/src/newsletter.module',
      'NewsletterModule',
    );
    const seen = new Set();
    const limiter = {
      consume: async () => {
        if (controls.limiterUnavailable) throw new Error('fixture unavailable');
        return controls.rateLimited
          ? { allowed: false, retryAfterMs: 1501 }
          : { allowed: true };
      },
    };
    imports.push(
      Newsletter.forRoot({
        consent: { version: 'v1', text: 'Public fixture consent text.' },
        persistence: {
          mode: 'custom',
          provider: {
            useValue: {
              appendGrant: async (data) => {
                if (controls.storageUnavailable)
                  throw new Error('private storage detail');
                record('appendGrant', { ...data, recordedAt: '<clock>' });
              },
              appendWithdrawalOnce: async (data) => {
                if (controls.storageUnavailable)
                  throw new Error('private storage detail');
                const key = `${data.eventSource}:${data.dedupeKey}`;
                const fresh = !seen.has(key);
                seen.add(key);
                record('appendWithdrawalOnce', {
                  ...data,
                  recordedAt: '<clock>',
                });
                return fresh ? 'recorded' : 'duplicate';
              },
            },
          },
        },
        subscriber: {
          mode: 'custom',
          provider: {
            useValue: {
              subscribe: async (data) => {
                record('subscribe', data);
                if (controls.subscriberUnavailable)
                  throw new Error('private provider detail');
              },
            },
          },
        },
        rateLimit: {
          mode: 'custom',
          limit: 5,
          windowMs: 10000,
          provider: { useValue: limiter },
        },
        presentation: {
          resolveClientKey: () =>
            controls.missingClientKey ? undefined : 'fixture-client',
        },
        webhook: controls.webhookDisabled
          ? false
          : { webhookSecret, accountId: '42', maxBodyBytes: 1024 },
      }),
    );
  } else if (fixture.host === 'native') {
    const Presentation = get(
      'newsletter/nest/src/presentation/newsletter-presentation.module',
      'NewsletterPresentationModule',
    );
    const { NATIVE_NEWSLETTER_ACTIONS, NewsletterSubscriptionService } =
      legacy.source('libs/newsletter/nest/src/application/index.ts');
    const actions = Object.fromEntries(
      ['confirm', 'unsubscribe'].map((action) => [
        action,
        async (token) => {
          record(action, token);
          if (controls.actionsUnavailable)
            throw new Error('private action detail');
        },
      ]),
    );
    class NativePorts {}
    Module({
      providers: [
        { provide: NATIVE_NEWSLETTER_ACTIONS, useValue: actions },
        {
          provide: NewsletterSubscriptionService,
          useValue: { subscribe: async () => ({ accepted: true }) },
        },
      ],
      exports: [NATIVE_NEWSLETTER_ACTIONS, NewsletterSubscriptionService],
    })(NativePorts);
    imports.push(
      Presentation.forRoot({
        imports: [NativePorts],
        nativeEnabled: !controls.nativeDisabled,
        rateLimit: { mode: 'disabled' },
      }),
    );
  } else throw new Error(`Unknown fixture host: ${fixture.host}`);

  const module = await Test.createTestingModule({
    imports,
    providers,
    controllers: selectedControllers,
  }).compile();
  const app = module.createNestApplication(
    new FastifyAdapter({ logger: false }),
    { logger: false, rawBody: !controls.noRawBody },
  );
  if (fixture.host === 'guarded') {
    const Guard = get(
      'auth/nest/src/presentation/guards/authentication.guard',
      'AuthenticationGuard',
    );
    app.useGlobalGuards(new Guard(new Reflector(), principal));
  }
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const results = [];
    for (const step of fixture.steps) {
      const body =
        step.rawBody ??
        (step.body === undefined ? undefined : JSON.stringify(step.body));
      const headers = {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...step.headers,
      };
      if (step.signature)
        headers.signature = createHmac('sha256', webhookSecret)
          .update(step.signature === 'tampered' ? `${body} ` : body)
          .digest('hex');
      const response = await fetch(`${base}${step.path}`, {
        method: step.method,
        headers,
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
      const selected = {};
      for (const name of [
        'content-type',
        'cache-control',
        'referrer-policy',
        'retry-after',
        'location',
      ]) {
        if (response.headers.has(name))
          selected[name] = response.headers.get(name);
      }
      if (response.headers.getSetCookie().length)
        selected['set-cookie'] = response.headers.getSetCookie();
      const text = await response.text();
      let value;
      try {
        value = JSON.parse(text);
      } catch {
        value = text;
      }
      results.push({ status: response.status, headers: selected, body: value });
    }
    return { responses: results, events };
  } finally {
    await app.close();
  }
}

module.exports = { inventory, executeCase, controllerFiles };

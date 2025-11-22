
# VENDURE PLUGIN ARCHITECTURE - COMPLETE ANALYSIS

## 1. HIGH-LEVEL SUMMARY

### Architecture Type
**Metadata-Driven, Dependency Injection-Based Plugin System**

Vendure implements a sophisticated plugin architecture built on top of NestJS modules with enhanced metadata capabilities. It combines:
- **Registry-based**: Plugins register via configuration array
- **Interface-driven**: Strict TypeScript interfaces define plugin contracts
- **Dependency Injection**: Full access to NestJS DI container
- **Event-driven**: Optional event bus for reactive extensions
- **Strategy pattern**: 50+ pluggable strategy interfaces for behavior customization

### Problem Solved
The plugin system enables:
1. **Extensibility without forking**: Add features without modifying core code
2. **E-commerce customization**: Payment gateways, shipping calculators, tax strategies, search engines
3. **GraphQL schema extension**: Add custom queries/mutations to Admin and Shop APIs
4. **Database extension**: Custom entities and fields without migrations
5. **Business logic injection**: Configuration hooks modify system behavior at bootstrap
6. **Multi-tenancy support**: Per-tenant plugin configurations

---

## 2. PLUGIN DISCOVERY & LOADING

### Discovery Mechanism
**Configuration-based (explicit registration)**
- Location: `/packages/core/src/config/vendure-config.ts:1266`
- Plugins are explicitly declared in `VendureConfig.plugins` array
- **No** automatic file system scanning or reflection-based discovery
- **No** runtime plugin installation (all plugins must be known at bootstrap)

```typescript
export const config: VendureConfig = {
    plugins: [
        DefaultSearchPlugin,
        DefaultJobQueuePlugin.init({ pollInterval: 5000 }),
        AssetServerPlugin.init({ route: 'assets' }),
        MyCustomPlugin,
    ],
};
```

### Loading Mechanism
**Sequential bootstrap-time loading**
- Location: `/packages/core/src/bootstrap.ts`
- Key functions:

| Function | Line | Purpose |
|----------|------|---------|
| `preBootstrapConfig()` | 255 | Orchestrates plugin initialization |
| `checkPluginCompatibility()` | 296 | Validates semver compatibility |
| `runPluginConfigurations()` | 333 | Executes plugin configuration hooks |
| `getAllEntities()` | 347 | Collects entities from all plugins |

**Loading Sequence:**
```typescript
// bootstrap.ts:255
async function preBootstrapConfig(userConfig: Partial<VendureConfig>) {
    1. Create initial config from user + defaults
    2. checkPluginCompatibility() - validate versions
    3. Collect all entities (core + plugins)
    4. runPluginConfigurations() - let plugins modify config
    5. Validate custom fields
    6. Register custom entity fields
    7. Run entity metadata modifiers
    8. Return final RuntimeVendureConfig
}
```

### Plugin Module Integration
**NestJS module system integration**
- Location: `/packages/core/src/plugin/plugin.module.ts:12`

```typescript
@Module({ imports: [ConfigModule] })
export class PluginModule {
    static forRoot(): DynamicModule {
        return {
            module: PluginModule,
            imports: [...getConfig().plugins],  // All plugins become module imports
        };
    }
}
```

- Imported into `AppModule` at `/packages/core/src/app.module.ts:23`
- Results in all plugins becoming part of the NestJS module dependency graph

---

## 3. PLUGIN REGISTRATION

### Primary Registration: @VendurePlugin Decorator
**Location**: `/packages/core/src/plugin/vendure-plugin.ts:164`

The `@VendurePlugin()` decorator is a **class decorator** that:
1. Stores plugin metadata using `Reflect.defineMetadata()`
2. Automatically applies NestJS `@Module()` decorator
3. Auto-exports all providers (except global providers like `APP_INTERCEPTOR`)

**Implementation Pattern:**
```typescript
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [MyService, MyStrategy],
    controllers: [MyController],
    configuration: config => {
        // Modify Vendure configuration
        config.paymentOptions.paymentMethodHandlers.push(myPaymentHandler);
        return config;
    },
    adminApiExtensions: {
        schema: gql`extend type Query { customQuery: String }`,
        resolvers: [MyResolver],
    },
    entities: [MyCustomEntity],
    compatibility: '^3.0.0',
})
export class MyPlugin {}
```

### Metadata Storage Keys
**Location**: `/packages/core/src/plugin/plugin-metadata.ts:8`

```typescript
export const PLUGIN_METADATA = {
    CONFIGURATION: 'configuration',           // Config modification hook
    SHOP_API_EXTENSIONS: 'shopApiExtensions', // Shop GraphQL extensions
    ADMIN_API_EXTENSIONS: 'adminApiExtensions', // Admin GraphQL extensions
    ENTITIES: 'entities',                     // Custom database entities
    COMPATIBILITY: 'compatibility',           // Semver version requirement
    DASHBOARD: 'dashboard',                   // Dashboard UI extension
};
```

### Plugin Initialization Pattern
**Convention**: Static `init()` method for configuration

```typescript
@VendurePlugin({...})
export class AssetServerPlugin {
    static options: AssetServerOptions;

    static init(options: AssetServerOptions) {
        this.options = options;
        return AssetServerPlugin;  // Returns class for method chaining
    }
}

// Usage
plugins: [AssetServerPlugin.init({ route: 'assets' })]
```

### Metadata Extraction Functions
**Location**: `/packages/core/src/plugin/plugin-metadata.ts`

| Function | Purpose | Line |
|----------|---------|------|
| `getEntitiesFromPlugins()` | Extract all custom entities | 17 |
| `getPluginAPIExtensions()` | Get GraphQL extensions | 38 |
| `getPluginDashboardExtensions()` | Get dashboard extensions | 50 |
| `getCompatibility()` | Get version requirement | 56 |
| `getConfigurationFunction()` | Get config hook | 60 |
| `reflectMetadata()` | Generic metadata reader | 82 |

---

## 4. PLUGIN INTERFACE / CONTRACT

### VendurePluginMetadata Interface
**Location**: `/packages/core/src/plugin/vendure-plugin.ts:23`

**Full Interface:**
```typescript
export interface VendurePluginMetadata extends ModuleMetadata {
    // === NestJS Module Properties (inherited) ===
    imports?: Array<Type<any> | DynamicModule>;
    controllers?: Type<any>[];
    providers?: Provider[];
    exports?: Array<DynamicModule | Type<any> | string | symbol>;

    // === Vendure-Specific Properties ===

    /**
     * Configuration hook executed at bootstrap time.
     * Receives RuntimeVendureConfig, returns modified config.
     */
    configuration?: PluginConfigurationFn;

    /**
     * GraphQL schema extensions for Shop API
     */
    shopApiExtensions?: APIExtensionDefinition;

    /**
     * GraphQL schema extensions for Admin API
     */
    adminApiExtensions?: APIExtensionDefinition;

    /**
     * Custom database entities
     */
    entities?: Array<Type<any>> | (() => Array<Type<any>>);

    /**
     * Dashboard UI extension path
     */
    dashboard?: DashboardExtension;

    /**
     * Semver compatibility range (e.g., "^3.0.0")
     */
    compatibility?: string;
}
```

### APIExtensionDefinition Interface
**Location**: `/packages/core/src/plugin/vendure-plugin.ts:80`

```typescript
export interface APIExtensionDefinition {
    /**
     * GraphQL schema extension (DocumentNode from graphql-tag)
     * Can be a function that receives current schema
     */
    schema?: DocumentNode | ((schema?: GraphQLSchema) => DocumentNode | undefined);

    /**
     * GraphQL resolver classes
     */
    resolvers?: Array<Type<any>> | (() => Array<Type<any>>);

    /**
     * Custom GraphQL scalar types
     */
    scalars?: Record<string, GraphQLScalarType> | (() => Record<string, GraphQLScalarType>);
}
```

### Required vs Optional
**All properties are optional** - minimum valid plugin:

```typescript
@VendurePlugin({})
export class MinimalPlugin {}
```

However, useful plugins typically implement:
- At least one of: `configuration`, `adminApiExtensions`, `shopApiExtensions`, `entities`
- Usually `imports: [PluginCommonModule]` for core services access
- Often `providers` for custom services/strategies
- Recommended: `compatibility` for version safety

---

## 5. PLUGIN LIFECYCLE

### Phase 1: Pre-Bootstrap Discovery
**Timing**: Before NestJS application creation
**Location**: `bootstrap.ts:255` (`preBootstrapConfig`)

1. **Configuration Creation** (line 258)
   - Merge user config with defaults
   - Plugins array is available but not yet executed

2. **Compatibility Check** (line 280)
   ```typescript
   checkPluginCompatibility(config, options?.ignoreCompatibilityErrorsForPlugins);
   ```
   - Validates semver ranges against `VENDURE_VERSION`
   - Throws error if incompatible (unless ignored)
   - Located at `bootstrap.ts:296`

3. **Entity Collection** (line 264)
   ```typescript
   const entities = await getAllEntities(config);
   ```
   - Extracts entities from plugins using `getEntitiesFromPlugins()`
   - Supports both static arrays and factory functions

### Phase 2: Configuration Hook Execution
**Timing**: After compatibility check, before entity metadata
**Location**: `bootstrap.ts:333` (`runPluginConfigurations`)

```typescript
export async function runPluginConfigurations(
    config: RuntimeVendureConfig
): Promise<RuntimeVendureConfig> {
    for (const plugin of config.plugins) {
        const configFn = getConfigurationFunction(plugin);
        if (typeof configFn === 'function') {
            const result = await configFn(config);
            Object.assign(config, result);  // Merge changes back
        }
    }
    return config;
}
```

**What plugins can do in configuration hook:**
- Modify any part of `VendureConfig`
- Add custom fields
- Register strategies (payment, shipping, tax, etc.)
- Add middleware
- Configure database options
- Modify GraphQL configuration

### Phase 3: NestJS Module Initialization
**Timing**: During `NestFactory.create(AppModule)`
**Location**: `app.module.ts:23`

1. **Plugin Module Registration**
   - `PluginModule.forRoot()` imports all plugins as NestJS modules
   - NestJS processes all `@Module()` decorators
   - Dependency injection container is built

2. **Service Construction**
   - Plugin providers are instantiated
   - Constructor injection occurs
   - Singleton scope by default

### Phase 4: NestJS Lifecycle Hooks
**Timing**: After DI container is ready
**Plugins can implement standard NestJS lifecycle interfaces:**

| Hook | Interface | Purpose |
|------|-----------|---------|
| `onModuleInit()` | `OnModuleInit` | After module dependencies resolved |
| `onApplicationBootstrap()` | `OnApplicationBootstrap` | After all modules initialized |
| `onModuleDestroy()` | `OnModuleDestroy` | Before module destroyed |
| `onApplicationShutdown()` | `OnApplicationShutdown` | Before app shutdown |

**Example** (DefaultSearchPlugin):
```typescript
export class DefaultSearchPlugin implements OnApplicationBootstrap, OnApplicationShutdown {
    async onApplicationBootstrap() {
        // Start indexing workers
        await this.indexerService.start();
    }

    async onApplicationShutdown() {
        // Clean up resources
        await this.indexerService.stop();
    }
}
```

### Phase 5: Strategy Initialization
**Timing**: When strategies are first accessed
**Location**: Various strategy files

All strategies extending `InjectableStrategy` can implement:
```typescript
export interface InjectableStrategy {
    init?(injector: Injector): void | Promise<void>;
    destroy?(): void | Promise<void>;
}
```

**Example** (Custom Payment Strategy):
```typescript
export class StripePaymentHandler implements PaymentMethodHandler {
    async init(injector: Injector) {
        this.connection = injector.get(TransactionalConnection);
        await this.initializeStripeSDK();
    }

    async destroy() {
        await this.stripeClient.disconnect();
    }
}
```

### Phase 6: Runtime Operation
**Continuous operation during application lifetime**

1. **Event Bus Subscriptions** (if used)
   ```typescript
   onApplicationBootstrap() {
       this.eventBus
           .ofType(OrderStateTransitionEvent)
           .subscribe(event => this.handleOrder(event));
   }
   ```

2. **GraphQL Request Handling**
   - Plugin resolvers receive requests
   - Services injected via DI

3. **Database Operations**
   - Custom entities are queried via repositories
   - Custom fields are populated automatically

### Phase 7: Shutdown
**Timing**: Application termination

1. **OnApplicationShutdown hooks** called
2. **Strategy destroy() methods** called
3. **OnModuleDestroy hooks** called
4. NestJS cleans up DI container

---

## 6. EXTENSION POINTS

### A. GraphQL Schema Extensions
**Purpose**: Add custom queries, mutations, types to Admin/Shop APIs

**Configuration:**
```typescript
adminApiExtensions: {
    schema: gql`
        extend type Query {
            myCustomQuery(id: ID!): MyCustomType
        }

        type MyCustomType {
            id: ID!
            name: String!
        }
    `,
    resolvers: [MyResolver],
    scalars: {
        DateTime: GraphQLDateTime
    }
}
```

**Processing Location**: `/packages/core/src/api/config/get-final-vendure-schema.ts:121`

**How it works:**
1. Plugin schemas collected by `getPluginAPIExtensions()` (plugin-metadata.ts:38)
2. Merged into base schema during `generateSchemaForApi()` (generate-schema.ts:62)
3. Plugin resolvers added to dynamic module (dynamic-plugin-api.module.ts:30)
4. Imported into AdminApiModule/ShopApiModule (api-internal-modules.ts:209, 220)

### B. Custom Database Entities
**Purpose**: Add new tables to database schema

**Configuration:**
```typescript
entities: [MyCustomEntity]
// OR dynamic:
entities: () => [MyCustomEntity]
```

**Example Entity:**
```typescript
@Entity()
class ProductReview extends VendureEntity {
    @ManyToOne(type => Product)
    product: Product;

    @Column()
    rating: number;

    @Column('text')
    comment: string;
}
```

**Processing:**
- Collected by `getAllEntities()` (bootstrap.ts:347)
- Added to TypeORM connection options (bootstrap.ts:265)
- Auto-migrated via `runMigrations()` or synchronize

### C. Custom Fields
**Purpose**: Add fields to existing core entities without creating new tables

**Configuration:**
```typescript
configuration: config => {
    config.customFields.Product.push({
        name: 'internalNotes',
        type: 'text',
        label: [{ languageCode: LanguageCode.en, value: 'Internal Notes' }],
        ui: { component: 'textarea-form-input' },
    });
    return config;
}
```

**Supported Entities** (20+):
- Address, Administrator, Asset, Channel, Collection
- Customer, CustomerGroup, Facet, FacetValue
- Fulfillment, GlobalSettings, Order, OrderLine
- PaymentMethod, Product, ProductOption, ProductOptionGroup
- ProductVariant, ProductVariantPrice, Promotion
- Region, Seller, ShippingMethod, StockLocation
- TaxCategory, TaxRate, User, Zone

**Field Types**:
- `string`, `localeString`, `int`, `float`, `boolean`
- `datetime`, `relation`, `text`, `localeText`

### D. Strategy Pattern Extensions
**Purpose**: Replace or extend core business logic

**50+ Strategy Types Available** - Examples:

| Strategy | Purpose | Config Location |
|----------|---------|-----------------|
| `PaymentMethodHandler` | Process payments | `paymentOptions.paymentMethodHandlers` |
| `ShippingCalculator` | Calculate shipping costs | `shippingOptions.shippingCalculators` |
| `TaxLineCalculationStrategy` | Calculate taxes | `taxOptions.taxLineCalculationStrategy` |
| `OrderCodeStrategy` | Generate order codes | `orderOptions.orderCodeStrategy` |
| `AssetStorageStrategy` | Store uploaded files | `assetOptions.assetStorageStrategy` |
| `CacheStrategy` | System-wide caching | `systemOptions.cacheStrategy` |
| `JobQueueStrategy` | Background job processing | `jobQueueOptions.jobQueueStrategy` |
| `SearchStrategy` | Product search | `catalogOptions.searchStrategy` |

**Example Implementation:**
```typescript
export class S3AssetStorageStrategy implements AssetStorageStrategy {
    async writeFileFromStream(fileName: string, stream: ReadStream): Promise<string> {
        // Upload to S3
    }

    async readFileToStream(identifier: string): Promise<ReadStream> {
        // Download from S3
    }
}

// In plugin configuration:
configuration: config => {
    config.assetOptions.assetStorageStrategy = new S3AssetStorageStrategy();
    return config;
}
```

### E. Event Bus Integration
**Purpose**: React to system events without modifying core code

**Location**: `/packages/core/src/event-bus/event-bus.ts`

**Pattern:**
```typescript
constructor(private eventBus: EventBus) {}

onApplicationBootstrap() {
    // Subscribe to specific event types
    this.eventBus
        .ofType(OrderStateTransitionEvent)
        .pipe(
            filter(e => e.toState === 'PaymentSettled'),
            debounceTime(1000)
        )
        .subscribe(event => {
            this.sendOrderConfirmationEmail(event.order);
        });
}
```

**Available Events** (30+):
- Order: `OrderStateTransitionEvent`, `OrderPlacedEvent`, `OrderLineEvent`
- Product: `ProductEvent`, `ProductVariantEvent`, `ProductChannelEvent`
- Customer: `CustomerEvent`, `AccountRegistrationEvent`, `CustomerGroupChangeEvent`
- Asset: `AssetEvent`, `AssetChannelEvent`
- Collection: `CollectionEvent`, `CollectionModificationEvent`
- And many more...

### F. Middleware Integration
**Purpose**: Add HTTP middleware to API endpoints

**Configuration:**
```typescript
configuration: config => {
    config.apiOptions.middleware.push({
        route: '/webhooks',
        handler: createProxyHandler({
            label: 'Webhook Handler',
            route: '/webhooks',
            port: 3001,
        }),
    });
    return config;
}
```

**Helper Utility**: `createProxyHandler()` (plugin-utils.ts:37)

### G. Entity Metadata Modifiers
**Purpose**: Modify TypeORM metadata (add indexes, change column types)

**Type**: `EntityMetadataModifier`
**Location**: `/packages/core/src/config/entity-metadata/entity-metadata-modifier.ts`

**Configuration:**
```typescript
configuration: config => {
    config.entityOptions.metadataModifiers.push({
        modify: (metadata: MetadataArgsStorage) => {
            // Add unique index to ProductVariant.sku
            metadata.indices.push({
                target: ProductVariant,
                name: 'IDX_UNIQUE_SKU',
                columns: ['sku'],
                unique: true,
            });
        }
    });
    return config;
}
```

**Processing**: Executed in `runEntityMetadataModifiers()` (run-entity-metadata-modifiers.ts)

### H. Dashboard Extensions
**Purpose**: Add custom UI to Vendure Admin Dashboard

**Configuration:**
```typescript
dashboard: {
    location: './admin-ui-extensions',
}
// OR simply:
dashboard: './admin-ui-extensions'
```

**Usage**: Compiled into dashboard via `@vendure/ui-devkit`

### I. Job Queue Integration
**Purpose**: Run background tasks asynchronously

**Access**: Via `JobQueueService` (available in PluginCommonModule)

**Pattern:**
```typescript
constructor(private jobQueue: JobQueueService) {}

async onApplicationBootstrap() {
    this.queue = await this.jobQueue.createQueue({
        name: 'send-email',
        process: async job => {
            await this.emailService.send(job.data.recipient, job.data.template);
        }
    });
}

async sendEmail(recipient: string, template: string) {
    await this.queue.add({ recipient, template });
}
```

### J. REST Controllers
**Purpose**: Add REST endpoints alongside GraphQL APIs

**Configuration:**
```typescript
@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [WebhookController],
})
export class WebhookPlugin {}

@Controller('webhooks')
export class WebhookController {
    @Post('stripe')
    async handleStripeWebhook(@Body() payload: any) {
        // Process webhook
    }
}
```

---

## 7. CONFIGURATION & METADATA

### Configuration Hook Mechanism
**Function**: `PluginConfigurationFn`
**Location**: `/packages/core/src/plugin/vendure-plugin.ts:119`

**Signature:**
```typescript
export type PluginConfigurationFn = (
    config: RuntimeVendureConfig,
) => RuntimeVendureConfig | Promise<RuntimeVendureConfig>;
```

**Execution Timing**:
- After compatibility validation
- Before entity metadata processing
- Before GraphQL schema building
- Before NestJS module initialization

**Access Level**: **Full read/write access** to entire `VendureConfig`

**Example Use Cases:**
```typescript
configuration: async config => {
    // 1. Register strategies
    config.paymentOptions.paymentMethodHandlers.push(new StripeHandler());

    // 2. Add custom fields
    config.customFields.Product.push({
        name: 'seoScore',
        type: 'int',
    });

    // 3. Modify database options
    config.dbConnectionOptions.logging = ['error'];

    // 4. Add middleware
    config.apiOptions.middleware.push({ route: '/api', handler: myMiddleware });

    // 5. Configure plugins (if dependent plugins exist)
    const searchPlugin = config.plugins.find(p => p.constructor.name === 'DefaultSearchPlugin');
    if (searchPlugin) {
        // Modify search plugin config
    }

    return config;
}
```

### Metadata Storage Pattern
**Technology**: TypeScript Reflect Metadata API

**Storage:**
```typescript
// vendure-plugin.ts:186
Reflect.defineMetadata(PLUGIN_METADATA.CONFIGURATION, options.configuration, target);
Reflect.defineMetadata(PLUGIN_METADATA.ENTITIES, options.entities, target);
// ... etc
```

**Retrieval:**
```typescript
// plugin-metadata.ts:82
function reflectMetadata(metadataKey: string, plugin: Type<any> | DynamicModule) {
    const target = (plugin as DynamicModule).module || plugin;
    return Reflect.getMetadata(metadataKey, target);
}
```

### Compatibility Validation
**Location**: `bootstrap.ts:296` (`checkPluginCompatibility`)

**Validation Logic:**
```typescript
function checkPluginCompatibility(
    config: RuntimeVendureConfig,
    ignoredPlugins: Array<DynamicModule | Type<any>> = [],
): void {
    for (const plugin of config.plugins) {
        const compatibility = getCompatibility(plugin);
        const pluginName = (plugin as any).name as string;

        if (!compatibility) {
            Logger.info(`Plugin "${pluginName}" does not specify compatibility range`);
        } else {
            if (!satisfies(VENDURE_VERSION, compatibility, { loose: true })) {
                if (ignoredPlugins.includes(plugin)) {
                    Logger.warn(`Compatibility error ignored for ${pluginName}`);
                } else {
                    throw new InternalServerError(
                        `Plugin "${pluginName}" incompatible. ` +
                        `Requires "${compatibility}", current is "${VENDURE_VERSION}"`
                    );
                }
            }
        }
    }
}
```

**Override Mechanism:**
```typescript
bootstrap(config, {
    ignoreCompatibilityErrorsForPlugins: [MyPlugin],
});
```

**Best Practices:**
- Use semver ranges: `^3.0.0` (3.x compatible)
- Use `>0.0.0` to disable check (not recommended)
- Always specify compatibility for public plugins

### Hot Reload Capability
**Supported**: ❌ **No**

- Plugins must be known at bootstrap time
- Configuration is immutable after `preBootstrapConfig()`
- Changing plugins requires full application restart
- No runtime plugin installation/removal

---

## 8. SECURITY, ISOLATION & ERROR HANDLING

### Security & Isolation

#### ❌ **No Sandboxing**
- Plugins run in the same Node.js process as core
- Full access to file system, network, process
- No memory isolation
- No CPU/resource limits

#### ❌ **No Permission System**
- Plugins can access all core services
- Plugins can modify configuration arbitrarily
- No capability-based security

#### ✅ **Validation Mechanisms**

1. **Compatibility Validation** (bootstrap.ts:296)
   - Semver range checking
   - Fails bootstrap if incompatible (unless ignored)

2. **Custom Field Validation** (bootstrap.ts:271)
   - Validates custom field definitions
   - Checks for name collisions
   - Validates field types

3. **TypeScript Type Safety**
   - Compile-time interface enforcement
   - Dependency injection type checking

#### ⚠️ **Implicit Trust Model**
- Plugins are **trusted code**
- Expected to be vetted before installation
- Similar security model to npm packages

### Error Handling

#### Configuration Phase Errors
**Location**: `bootstrap.ts:333` (`runPluginConfigurations`)

```typescript
export async function runPluginConfigurations(
    config: RuntimeVendureConfig
): Promise<RuntimeVendureConfig> {
    for (const plugin of config.plugins) {
        const configFn = getConfigurationFunction(plugin);
        if (typeof configFn === 'function') {
            try {
                const result = await configFn(config);
                Object.assign(config, result);
            } catch (e) {
                Logger.error(`Error running configuration for plugin ${plugin.name}`);
                throw e;  // Fails bootstrap
            }
        }
    }
    return config;
}
```

**Behavior**: **Fails fast** - any error aborts bootstrap

#### Runtime Errors
**NestJS Exception Filters** handle runtime errors:

1. **GraphQL Resolver Errors**
   - Caught by GraphQL error handling
   - Logged but don't crash application
   - Return error to client

2. **Service Errors**
   - Propagate through call stack
   - Can be caught by calling code
   - Or bubble to GraphQL/REST error handler

3. **Event Bus Errors**
   - Isolated to event handler
   - Logged but don't affect other subscribers
   - Don't fail originating transaction

**Example** (Event error handling in event-bus.ts):
```typescript
.subscribe(
    event => handler(event),
    error => Logger.error(`Event handler error: ${error.message}`)
)
```

#### Strategy Initialization Errors
**Location**: Various strategy files

**Pattern:**
```typescript
async init(injector: Injector) {
    try {
        this.connection = injector.get(TransactionalConnection);
        await this.setupExternalService();
    } catch (error) {
        Logger.error(`Failed to initialize strategy: ${error.message}`);
        throw error;  // Fails bootstrap
    }
}
```

**Behavior**: Strategy init failures abort bootstrap

### Error Recovery
**Mechanisms:**

1. **Graceful Degradation**: None - plugins expected to work or fail bootstrap
2. **Circuit Breakers**: Not built-in - plugins must implement
3. **Retry Logic**: Not built-in - plugins must implement
4. **Fallbacks**: Not built-in - plugins must implement

**Recommendation**: Implement error handling in plugin code:
```typescript
@VendurePlugin({...})
export class ResilientPlugin {
    onApplicationBootstrap() {
        this.eventBus
            .ofType(OrderPlacedEvent)
            .subscribe(event => {
                this.processOrder(event).catch(error => {
                    Logger.error(`Order processing failed: ${error.message}`);
                    this.queueRetry(event);
                });
            });
    }
}
```

---

## 9. DEPENDENCY MANAGEMENT

### Dependency Injection
**Technology**: NestJS DI Container
**Injector**: `/packages/core/src/common/injector.ts`

**The `Injector` class** wraps NestJS `ModuleRef`:
```typescript
export class Injector {
    constructor(private moduleRef: ModuleRef) {}

    get<T>(typeOrToken: Type<T> | string | symbol): T {
        return this.moduleRef.get(typeOrToken, { strict: false });
    }

    resolve<T>(typeOrToken: Type<T> | string | symbol, contextId?: ContextId): Promise<T> {
        return this.moduleRef.resolve(typeOrToken, contextId, { strict: false });
    }
}
```

### Dependency Declaration Patterns

#### Pattern 1: Constructor Injection (Recommended)
```typescript
@Injectable()
export class MyService {
    constructor(
        private connection: TransactionalConnection,
        private eventBus: EventBus,
        private configService: ConfigService,
    ) {}
}
```

**How it works:**
1. Service declared in plugin `providers: [MyService]`
2. NestJS analyzes constructor parameters
3. Resolves dependencies from DI container
4. Injects instances automatically

#### Pattern 2: Injector (for Strategies)
```typescript
export class MyPaymentHandler implements PaymentMethodHandler {
    private connection: TransactionalConnection;

    async init(injector: Injector) {
        this.connection = injector.get(TransactionalConnection);
        this.orderService = injector.get(OrderService);
    }
}
```

**Why needed:** Strategies are instantiated before DI container is ready

#### Pattern 3: PluginCommonModule Import
```typescript
@VendurePlugin({
    imports: [PluginCommonModule],  // Provides common services
    providers: [MyService],
})
export class MyPlugin {}
```

**What PluginCommonModule provides** (plugin-common.module.ts):
- `EventBusModule` → `EventBus`
- `ServiceModule` → All entity services (ProductService, OrderService, etc.)
- `ConfigModule` → `ConfigService`
- `JobQueueModule` → `JobQueueService`
- `CacheModule` → `CacheService`
- `I18nModule` → Internationalization
- `DataImportModule` → Data import utilities

### Inter-Plugin Dependencies

#### ❌ **No Explicit Dependency Declaration**
- Plugins cannot declare dependencies on other plugins
- No `dependencies: [OtherPlugin]` field

#### ✅ **Implicit Dependencies** (via configuration)
```typescript
@VendurePlugin({
    configuration: config => {
        // Find another plugin in config
        const searchPlugin = config.plugins.find(
            p => p.constructor.name === 'DefaultSearchPlugin'
        );

        if (!searchPlugin) {
            throw new Error('MyPlugin requires DefaultSearchPlugin');
        }

        // Modify its configuration
        return config;
    }
})
export class MyPlugin {}
```

#### ⚠️ **Order Dependency**
- Configuration hooks run in **array order**
- Later plugins can modify earlier plugins' configurations
- No guaranteed initialization order

**Recommendation**: Document plugin dependencies in README

### Version & Compatibility Constraints

#### Plugin → Vendure Compatibility
```typescript
@VendurePlugin({
    compatibility: '^3.0.0',  // Requires Vendure 3.x
})
export class MyPlugin {}
```

#### ❌ **No Plugin → Plugin Compatibility**
- No mechanism to specify required versions of other plugins
- No peer dependency checking

#### ✅ **npm Package Dependencies**
- Declared in plugin package's `package.json`
- Managed by npm/yarn/pnpm
- Standard semver resolution

**Example** (in plugin's package.json):
```json
{
  "peerDependencies": {
    "@vendure/core": "^3.0.0"
  },
  "dependencies": {
    "stripe": "^14.0.0"
  }
}
```

### Service Scope
**Default**: **Singleton** (application-scoped)

**Available Scopes:**
```typescript
@Injectable({ scope: Scope.REQUEST })  // New instance per request
export class RequestScopedService {}

@Injectable({ scope: Scope.TRANSIENT })  // New instance per injection
export class TransientService {}
```

**Access Scoped Services:**
```typescript
// In resolver or controller
constructor(@Inject(REQUEST) private request: Request) {}

async handler() {
    const scopedService = await this.moduleRef.resolve(MyScopedService, this.request);
}
```

---

## 10. ARCHITECTURE DIAGRAM

### System-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       VENDURE APPLICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              VendureConfig (config.ts)                  │    │
│  │  plugins: [                                             │    │
│  │    DefaultSearchPlugin,                                 │    │
│  │    AssetServerPlugin.init({...}),                       │    │
│  │    MyCustomPlugin                                       │    │
│  │  ]                                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Bootstrap Process (bootstrap.ts)                │    │
│  │  1. checkPluginCompatibility()                          │    │
│  │  2. getAllEntities()                                    │    │
│  │  3. runPluginConfigurations() ◄─────────────────┐      │    │
│  │  4. Validate custom fields                      │      │    │
│  │  5. Run entity metadata modifiers               │      │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                         │           │
│                           ▼                         │           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           Plugin Metadata Extraction                    │    │
│  │  - getEntitiesFromPlugins()                             │    │
│  │  - getPluginAPIExtensions()                             │    │
│  │  - getConfigurationFunction() ─────────────────┘        │    │
│  │  - getCompatibility()                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           NestJS Application Module                     │    │
│  │  AppModule                                              │    │
│  │    ├─ PluginModule.forRoot()                           │    │
│  │    │    └─ imports: [...plugins]                       │    │
│  │    ├─ ApiModule                                         │    │
│  │    ├─ ServiceModule                                     │    │
│  │    └─ ...CoreModules                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         NestJS Dependency Injection Container           │    │
│  │  - Plugin Providers                                     │    │
│  │  - Plugin Controllers                                   │    │
│  │  - Plugin Resolvers                                     │    │
│  │  - Core Services                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Lifecycle Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     PLUGIN LIFECYCLE                              │
└──────────────────────────────────────────────────────────────────┘

1. DISCOVERY
   Developer defines plugin in config.plugins[]
   │
   ▼
2. COMPATIBILITY CHECK
   checkPluginCompatibility(plugin)
   - Validate semver range
   - Throw if incompatible (unless ignored)
   │
   ▼
3. METADATA EXTRACTION
   - Extract entities, resolvers, config hooks
   - Store in metadata registry
   │
   ▼
4. CONFIGURATION HOOK
   configurationFn(config) → modifiedConfig
   - Plugin modifies VendureConfig
   - Add strategies, custom fields, middleware
   │
   ▼
5. ENTITY REGISTRATION
   - Add plugin entities to TypeORM
   - Run entity metadata modifiers
   │
   ▼
6. MODULE REGISTRATION
   - Plugin becomes NestJS module
   - Added to DI container
   │
   ▼
7. PROVIDER INSTANTIATION
   - NestJS creates plugin services
   - Constructor injection occurs
   │
   ▼
8. onModuleInit()
   - Initialize plugin services
   │
   ▼
9. onApplicationBootstrap()
   - Subscribe to events
   - Start background tasks
   │
   ▼
10. RUNTIME OPERATION
   - GraphQL resolvers handle requests
   - Event handlers react to events
   - Background jobs process
   │
   ▼
11. onApplicationShutdown()
   - Clean up resources
   │
   ▼
12. onModuleDestroy()
   - Destroy plugin module
```

### Extension Points Map

```
┌───────────────────────────────────────────────────────────────────┐
│                       PLUGIN EXTENSION POINTS                      │
└───────────────────────────────────────────────────────────────────┘

Plugin Class
├─ configuration: (config) => config
│  └─ Modify VendureConfig at bootstrap
│     ├─ Add strategies
│     ├─ Add custom fields
│     ├─ Register middleware
│     └─ Configure options
│
├─ adminApiExtensions
│  ├─ schema: GraphQL DocumentNode
│  ├─ resolvers: [ResolverClass]
│  └─ scalars: { ScalarName: GraphQLScalar }
│
├─ shopApiExtensions
│  ├─ schema: GraphQL DocumentNode
│  ├─ resolvers: [ResolverClass]
│  └─ scalars: { ScalarName: GraphQLScalar }
│
├─ entities: [CustomEntity]
│  └─ Add TypeORM entities (new tables)
│
├─ dashboard: { location: './ui' }
│  └─ Extend Admin UI
│
├─ imports: [PluginCommonModule, OtherModule]
│  └─ Access core services
│
├─ providers: [Service, Strategy]
│  └─ Register injectable services
│
└─ controllers: [RestController]
   └─ Add REST endpoints

Runtime Extension
├─ EventBus
│  └─ Subscribe to system events
│
├─ JobQueue
│  └─ Run background tasks
│
└─ Strategies (50+ types)
   ├─ PaymentMethodHandler
   ├─ ShippingCalculator
   ├─ TaxLineCalculationStrategy
   ├─ OrderCodeStrategy
   ├─ AssetStorageStrategy
   ├─ CacheStrategy
   ├─ SearchStrategy
   └─ ... many more
```

### GraphQL Extension Processing

```
┌──────────────────────────────────────────────────────────────────┐
│                  GRAPHQL EXTENSION PROCESSING                     │
└──────────────────────────────────────────────────────────────────┘

Plugin Definition
  adminApiExtensions: {
    schema: gql`extend type Query { ... }`,
    resolvers: [MyResolver]
  }
         │
         ▼
   getPluginAPIExtensions()  (plugin-metadata.ts:38)
   - Extract schema + resolvers
         │
         ▼
   generateSchemaForApi()  (generate-schema.ts:62)
   - Merge plugin schemas into base schema
         │
         ▼
   generateResolvers()  (generate-resolvers.ts)
   - Create resolver map
         │
         ▼
   DynamicPluginApiModule.forPlugin()  (dynamic-plugin-api.module.ts:30)
   - Create NestJS module with resolvers
   - Module = { providers: resolvers, exports: resolvers }
         │
         ▼
   AdminApiModule / ShopApiModule  (api-internal-modules.ts:209, 220)
   - Import dynamic plugin modules
         │
         ▼
   GraphQL Server
   - Requests routed to plugin resolvers
```

---

## 11. IMPROVEMENT RECOMMENDATIONS

### Performance Optimizations

#### 1. **Lazy Plugin Loading**
**Current**: All plugins loaded at bootstrap
**Recommendation**: Implement conditional loading

```typescript
@VendurePlugin({
    lazy: true,  // Only load when needed
    condition: (config) => config.apiOptions.adminApiPath !== undefined,
})
```

**Benefits**:
- Faster startup time
- Reduced memory footprint
- Optional feature loading

#### 2. **Plugin Metadata Caching**
**Current**: Metadata extracted via reflection on every bootstrap
**Recommendation**: Cache metadata in build step

```typescript
// Build-time code generation
export const MyPluginMetadata = {
    entities: [Entity1, Entity2],
    resolvers: [Resolver1],
    // ... precomputed metadata
};
```

**Benefits**:
- Faster bootstrap (no reflection)
- Type-safe metadata

#### 3. **Parallel Plugin Initialization**
**Current**: Configuration hooks run sequentially
**Recommendation**: Analyze dependencies, parallelize independent plugins

```typescript
async function runPluginConfigurations(config: RuntimeVendureConfig) {
    const { dependent, independent } = analyzePluginDependencies(config.plugins);

    // Run independent plugins in parallel
    const results = await Promise.all(
        independent.map(p => getConfigurationFunction(p)(config))
    );

    // Run dependent plugins sequentially
    for (const plugin of dependent) {
        await getConfigurationFunction(plugin)(config);
    }
}
```

### Stability Improvements

#### 4. **Plugin Dependency Declaration**
**Current**: No explicit dependency management
**Recommendation**: Add dependency field

```typescript
@VendurePlugin({
    requires: [DefaultSearchPlugin],  // Explicit dependency
    requiredVersion: {
        DefaultSearchPlugin: '^2.0.0'
    },
})
export class MyPlugin {}
```

**Benefits**:
- Clear dependency graph
- Version compatibility checks
- Automatic load ordering

#### 5. **Plugin Isolation / Sandboxing**
**Current**: Full process access
**Recommendation**: Optional isolation levels

```typescript
@VendurePlugin({
    isolation: 'process',  // Run in separate process via worker threads
    permissions: ['database:read', 'api:admin'],  // Permission system
})
export class MyPlugin {}
```

**Benefits**:
- Crash isolation
- Security boundaries
- Resource limits

#### 6. **Rollback on Configuration Error**
**Current**: Failed configuration aborts bootstrap
**Recommendation**: Transaction-like config modification

```typescript
async function runPluginConfigurations(config: RuntimeVendureConfig) {
    const originalConfig = cloneDeep(config);

    try {
        for (const plugin of config.plugins) {
            await configFn(config);
        }
    } catch (error) {
        Logger.error('Plugin configuration failed, rolling back');
        return originalConfig;  // Restore original config
    }
}
```

### Cleaner Extension Points

#### 7. **Typed Configuration Hooks**
**Current**: Untyped config modification
**Recommendation**: Typed builder API

```typescript
@VendurePlugin({
    configuration: new ConfigBuilder()
        .addCustomField('Product', { name: 'seo', type: 'text' })
        .addStrategy('payment', new StripeHandler())
        .addMiddleware('/webhooks', webhookHandler)
        .build()
})
```

**Benefits**:
- Type safety
- Autocomplete
- Validation at compile time

#### 8. **Event Hook Decorators**
**Current**: Manual EventBus subscription in `onApplicationBootstrap`
**Recommendation**: Declarative event handlers

```typescript
@Injectable()
export class MyService {
    @OnEvent(OrderPlacedEvent)
    async handleOrderPlaced(event: OrderPlacedEvent) {
        // Automatic subscription
    }

    @OnEvent(OrderPlacedEvent, {
        filter: e => e.order.total > 10000,
        priority: 10
    })
    async handleLargeOrder(event: OrderPlacedEvent) {
        // Conditional handler
    }
}
```

#### 9. **GraphQL Code-First API**
**Current**: Schema-first with string templates
**Recommendation**: Code-first decorators (NestJS style)

```typescript
@ObjectType()
export class ProductReview {
    @Field(type => ID)
    id: string;

    @Field()
    rating: number;
}

@Resolver(of => Product)
export class ProductReviewResolver {
    @ResolveField(returns => [ProductReview])
    async reviews(@Parent() product: Product) {
        return this.reviewService.findByProduct(product.id);
    }
}
```

### Better Lifecycle APIs

#### 10. **Plugin Health Checks**
**Current**: No built-in health monitoring
**Recommendation**: Health check interface

```typescript
@VendurePlugin({...})
export class MyPlugin implements PluginHealthIndicator {
    async checkHealth(): Promise<HealthStatus> {
        try {
            await this.externalService.ping();
            return { status: 'healthy' };
        } catch (error) {
            return { status: 'unhealthy', reason: error.message };
        }
    }
}
```

#### 11. **Plugin State Management**
**Current**: Plugins manage own state
**Recommendation**: Standardized state API

```typescript
@VendurePlugin({...})
export class MyPlugin {
    async onEnable() {
        // Called when plugin activated
    }

    async onDisable() {
        // Called when plugin deactivated (without restart)
    }

    async onReload() {
        // Hot reload support
    }
}
```

### Safer Plugin Execution

#### 12. **Plugin Validation Schema**
**Current**: Runtime errors for invalid config
**Recommendation**: JSON Schema validation

```typescript
@VendurePlugin({
    configSchema: {
        type: 'object',
        required: ['apiKey'],
        properties: {
            apiKey: { type: 'string', minLength: 20 },
            timeout: { type: 'number', default: 5000 }
        }
    }
})
export class MyPlugin {
    static init(options: MyPluginOptions) {
        // Options already validated against schema
    }
}
```

#### 13. **Plugin Capability Declaration**
**Current**: Implicit capabilities
**Recommendation**: Explicit declaration

```typescript
@VendurePlugin({
    capabilities: {
        graphql: { admin: true, shop: false },
        database: { read: true, write: true },
        events: ['OrderPlaced', 'ProductUpdated'],
        http: { port: 3001 },
    }
})
export class MyPlugin {}
```

**Benefits**:
- Documentation
- Security auditing
- Conflict detection (e.g., port collisions)

---

## SUMMARY

### Vendure Plugin Architecture Strengths

✅ **Type-Safe & Developer-Friendly**
- Full TypeScript support with strong typing
- Excellent IDE autocomplete via dependency injection
- Clear interfaces and contracts

✅ **Powerful Extension Points**
- 50+ strategy types for business logic customization
- GraphQL schema extension for both Admin and Shop APIs
- Custom entities and fields without core modifications
- Event bus for reactive extensions

✅ **NestJS Integration**
- Leverages mature DI container
- Standard module system
- Familiar patterns for NestJS developers

✅ **Flexible Configuration**
- Configuration hooks provide deep system access
- Plugins can modify any aspect of Vendure config
- Supports complex initialization logic

### Architecture Weaknesses

⚠️ **No Plugin Isolation**
- Plugins share process space
- No sandboxing or resource limits
- Plugin crashes can crash entire system

⚠️ **No Dependency Management**
- No explicit plugin-to-plugin dependencies
- Load order matters but not enforced
- No version compatibility between plugins

⚠️ **No Hot Reload**
- Requires full restart to add/modify plugins
- Configuration immutable after bootstrap
- Long development feedback loop

⚠️ **Limited Error Recovery**
- Bootstrap failures abort entire application
- No graceful degradation
- No plugin-level circuit breakers

### Architectural Pattern Classification

**Primary Pattern**: **Metadata-Driven Dependency Injection Plugin Architecture**

**Secondary Patterns**:
- Strategy Pattern (for business logic)
- Observer Pattern (event bus)
- Factory Pattern (dynamic module creation)
- Decorator Pattern (metadata annotations)

### Comparison to Other Plugin Systems

| System | Discovery | Loading | Isolation | Hot Reload |
|--------|-----------|---------|-----------|------------|
| Vendure | Config-based | Bootstrap | None | No |
| WordPress | File scan | Runtime | Process | Partial |
| VS Code | Package.json | Runtime | Process | Yes |
| Webpack | Config-based | Build | None | Yes (dev) |

**Vendure is most similar to**: **NestJS module system** (which it's built on)

### Final Assessment

The Vendure plugin architecture is **production-ready, well-designed, and developer-friendly**, with excellent type safety and extension points. However, it **prioritizes simplicity over isolation**, making it best suited for:

✅ **Good for**:
- E-commerce customization
- Trusted plugin ecosystems
- Single-tenant deployments
- Rapid feature development

⚠️ **Challenges for**:
- Untrusted third-party plugins
- Multi-tenant SaaS (plugin isolation)
- Zero-downtime plugin updates
- Plugin marketplaces with quality variation

The architecture successfully solves the core problem of making Vendure extensible without requiring core modifications, while maintaining type safety and developer experience.

---

## KEY FILES REFERENCE

### Core Plugin Infrastructure
| File | Purpose |
|------|---------|
| `/packages/core/src/plugin/vendure-plugin.ts` | Plugin decorator definition |
| `/packages/core/src/plugin/plugin-metadata.ts` | Metadata extraction utilities |
| `/packages/core/src/plugin/plugin.module.ts` | Plugin module registration |
| `/packages/core/src/plugin/dynamic-plugin-api.module.ts` | Dynamic GraphQL module creation |
| `/packages/core/src/plugin/plugin-utils.ts` | Utility functions (proxy handler, startup messages) |
| `/packages/core/src/plugin/plugin-common.module.ts` | Common imports for plugins |
| `/packages/core/src/bootstrap.ts` | Bootstrap process and plugin loading |

### Plugin Integration Points
| File | Purpose |
|------|---------|
| `/packages/core/src/app.module.ts` | Main app module integrating PluginModule |
| `/packages/core/src/api/api.module.ts` | API module with GraphQL configuration |
| `/packages/core/src/api/api-internal-modules.ts` | Dynamic plugin module imports (lines 209, 220) |
| `/packages/core/src/api/config/get-final-vendure-schema.ts` | Schema building with plugin extensions |
| `/packages/core/src/api/config/generate-resolvers.ts` | Resolver generation |

### Plugin Lifecycle
| File | Purpose |
|------|---------|
| `/packages/core/src/config/entity-metadata/entity-metadata-modifier.ts` | Entity metadata modification |
| `/packages/core/src/entity/run-entity-metadata-modifiers.ts` | Execute metadata modifiers |
| `/packages/core/src/event-bus/event-bus.ts` | Event subscription system |
| `/packages/core/src/config/vendure-config.ts` | Main config interface |

### Example Plugins
| Plugin | Location | Demonstrates |
|--------|----------|---------------|
| DefaultCachePlugin | `/packages/core/src/plugin/default-cache-plugin/` | Configuration function |
| DefaultSearchPlugin | `/packages/core/src/plugin/default-search-plugin/` | GraphQL extensions, lifecycle hooks |
| DefaultJobQueuePlugin | `/packages/core/src/plugin/default-job-queue-plugin/` | Entities, providers, configuration |
| DefaultSchedulerPlugin | `/packages/core/src/plugin/default-scheduler-plugin/` | Scheduled tasks |
| RedisCachePlugin | `/packages/core/src/plugin/redis-cache-plugin/` | Alternative strategy implementation |
| DashboardPlugin | `/packages/dashboard/plugin/` | Dashboard extension, metrics |

---

*Report generated: 2025-11-22*
*Analyzed version: Vendure v3.5.1*
*Analysis model: Claude Sonnet 4.5*

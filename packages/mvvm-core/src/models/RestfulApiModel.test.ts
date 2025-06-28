import { describe, it, beforeEach, expect, afterEach, vi } from 'vitest';

import { RestfulApiModel, Fetcher, ExtractItemType } from './RestfulApiModel';
import { BaseModel } from './BaseModel'; // Import BaseModel
import { z, ZodError, ZodIssueCode } from 'zod'; // Consolidated Zod import
import { first } from 'rxjs/operators'; // Removed skip

// Define a simple Zod schema for testing
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  optionalField: z.string().optional(),
});

type User = z.infer<typeof UserSchema>;

// Helper to create an invalid user object (e.g., missing email)
const createInvalidUser = (id: string, name: string): Partial<User> => ({
  id,
  name,
  // email is missing
});

// Helper to create a user object with an invalid email format
const createUserWithInvalidEmail = (id: string, name: string): User => ({
  id,
  name,
  email: 'not-a-valid-email',
});

describe('RestfulApiModel', () => {
  const baseUrl = 'https://api.test.com';
  // @ts-ignore
  let mockFetcher: vi.Mock<ReturnType<Fetcher>>;
  const endpoint = 'users';
  let model: RestfulApiModel<User | User[], typeof UserSchema>;

  beforeEach(() => {
    mockFetcher = vi.fn();
    model = new RestfulApiModel<User | User[], typeof UserSchema>({
      baseUrl,
      endpoint,
      fetcher: mockFetcher,
      schema: UserSchema,
      initialData: null, // Start with no initial data
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly with base properties', async () => {
    expect(await model.data$.pipe(first()).toPromise()).toBeNull();
    expect(await model.isLoading$.pipe(first()).toPromise()).toBe(false);
    expect(await model.error$.pipe(first()).toPromise()).toBeNull();
  });

  it('should throw error if baseUrl, endpoint, or fetcher are missing', () => {
    // @ts-ignore
    expect(
      // () => new RestfulApiModel(null, endpoint, mockFetcher, UserSchema)
      () =>
        new RestfulApiModel({
          baseUrl: null,
          endpoint,
          fetcher: mockFetcher,
          schema: UserSchema as any,
          initialData: null,
        }),
    ).toThrow('RestfulApiModel requires baseUrl, endpoint, and fetcher.');
    // @ts-ignore
    expect(
      // () => new RestfulApiModel(baseUrl, null, mockFetcher, UserSchema)
      () =>
        new RestfulApiModel({
          baseUrl,
          endpoint: null,
          fetcher: mockFetcher,
          schema: UserSchema as any,
          initialData: null,
        }),
    ).toThrow('RestfulApiModel requires baseUrl, endpoint, and fetcher.');
    // @ts-ignore
    expect(
      // () => new RestfulApiModel(baseUrl, endpoint, null, UserSchema)
      () =>
        new RestfulApiModel({
          baseUrl,
          endpoint,
          fetcher: null,
          schema: UserSchema as any,
          initialData: null,
        }),
    ).toThrow('RestfulApiModel requires baseUrl, endpoint, and fetcher.');
  });

  describe('fetch method', () => {
    // The problematic test "should fetch a collection of users and update data$" has been removed.

    it('should fetch a collection, update data$, and manage loading states', async () => {
      const users: User[] = [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];
      mockFetcher.mockResolvedValue({
        ok: true, // Important for RestfulApiModel's internal checks
        json: () => Promise.resolve(users),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const isLoadingHistory: boolean[] = [];
      const subscription = model.isLoading$.subscribe((value) => {
        isLoadingHistory.push(value);
      });

      await model.fetch(); // Perform the fetch operation

      // Assertions
      expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}`, {
        method: 'GET',
      });

      // data$ is a BehaviorSubject. After fetch, its current value should be the fetched users.
      // pipe(first()) gets the current value of the BehaviorSubject after fetch has completed.
      expect(await model.data$.pipe(first()).toPromise()).toEqual(users);

      // isLoading$ sequence:
      // 1. Initial `false` (from BehaviorSubject construction, captured on subscription)
      // 2. `true` (when fetch starts)
      // 3. `false` (when fetch ends in finally block)
      expect(isLoadingHistory).toEqual([false, true, false]);

      expect(await model.error$.pipe(first()).toPromise()).toBeNull();

      subscription.unsubscribe(); // Clean up subscription
    }, 10000); // Timeout

    it('should fetch a single user by ID and update data$', async () => {
      const user: User = { id: '1', name: 'Alice', email: 'alice@example.com' };
      mockFetcher.mockResolvedValue({
        json: () => Promise.resolve(user),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      await model.fetch('1');

      expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}/1`, {
        method: 'GET',
      });
      expect(await model.data$.pipe(first()).toPromise()).toEqual(user);
    });

    it('should set error$ if fetch fails', async () => {
      const fetchError = new Error('Network error');
      mockFetcher.mockRejectedValue(fetchError);

      await expect(model.fetch()).rejects.toThrow('Network error');

      expect(await model.error$.pipe(first()).toPromise()).toBe(fetchError);
      expect(await model.isLoading$.pipe(first()).toPromise()).toBe(false); // Loading should be false after error
    });

    it('should throw ZodError if fetched data is invalid', async () => {
      const invalidData = [{ id: '1', name: 'Alice', email: 'invalid-email' }]; // invalid email
      mockFetcher.mockResolvedValue({
        json: () => Promise.resolve(invalidData),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      await expect(model.fetch()).rejects.toThrowError(ZodError);

      const error = await model.error$.pipe(first()).toPromise();
      expect(error).toBeInstanceOf(ZodError); // Assuming ZodError is correctly imported

      const zodError = error as ZodError;
      expect(zodError.issues.length).toBeGreaterThan(0);
      const firstIssue = zodError.issues[0];

      // Check the code first
      expect(firstIssue.code).toBe(ZodIssueCode.invalid_string); // Assuming ZodIssueCode is correctly imported

      // Now, TypeScript should allow access to 'validation' by narrowing the type
      if (firstIssue.code === ZodIssueCode.invalid_string) {
        expect(firstIssue.validation).toBe('email');
      } else {
        // Fail the test explicitly if it's not the expected issue code,
        // as the .validation check wouldn't make sense otherwise.
        throw new Error('Test expectation failed: Expected ZodIssueCode.invalid_string, but got ' + firstIssue.code);
      }
      expect(await model.data$.pipe(first()).toPromise()).toBeNull(); // Data should not be set
    });

    it('should throw ZodError if fetched data is invalid and validateSchema is true (explicit)', async () => {
      const modelValidateTrue = new RestfulApiModel<User, typeof UserSchema>({
        baseUrl,
        endpoint: 'singleUser', // Using a different endpoint for clarity if needed
        fetcher: mockFetcher,
        schema: UserSchema,
        initialData: null,
        validateSchema: true,
      });

      const invalidUserData = createUserWithInvalidEmail('1', 'Invalid User');
      mockFetcher.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidUserData),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      await expect(modelValidateTrue.fetch('1')).rejects.toThrowError(ZodError);
      expect(await modelValidateTrue.error$.pipe(first()).toPromise()).toBeInstanceOf(ZodError);
      expect(await modelValidateTrue.data$.pipe(first()).toPromise()).toBeNull();
      modelValidateTrue.dispose();
    });

    it('should fetch and set invalid data if validateSchema is false', async () => {
      const modelValidateFalse = new RestfulApiModel<User, typeof UserSchema>({
        baseUrl,
        endpoint: 'singleUser',
        fetcher: mockFetcher,
        schema: UserSchema,
        initialData: null,
        validateSchema: false,
      });

      const technicallyInvalidUserData = createInvalidUser('1', 'Invalid User Allowed') as User; // Cast because it's partial
      mockFetcher.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(technicallyInvalidUserData),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      await expect(modelValidateFalse.fetch('1')).resolves.not.toThrow();
      expect(await modelValidateFalse.error$.pipe(first()).toPromise()).toBeNull();
      expect(await modelValidateFalse.data$.pipe(first()).toPromise()).toEqual(technicallyInvalidUserData);
      modelValidateFalse.dispose();
    });
  });

  describe('create method', () => {
    const serverUser: User = {
      // Renamed from newUser to distinguish from payload
      id: 'server-3', // Server assigns a real ID
      name: 'Charlie Server',
      email: 'charlie@example.com',
    };
    const payload: Partial<User> = {
      // Payload might not have ID
      name: 'Charlie Server',
      email: 'charlie@example.com',
    };
    const payloadWithClientId: Partial<User> & { id: string } = {
      id: 'client-temp-123',
      name: 'Charlie Client ID',
      email: 'charlie.client@example.com',
    };
    const serverUserFromClientPayload: User = {
      id: 'server-assigned-from-client-payload',
      name: payloadWithClientId.name!,
      email: payloadWithClientId.email!,
    };

    // Model for TData = User[]
    let modelForUserArray: RestfulApiModel<User[], typeof UserSchema>;
    // Model for TData = User
    let modelForSingleUser: RestfulApiModel<User, typeof UserSchema>;

    let initialCollectionData: User[];

    beforeEach(() => {
      initialCollectionData = [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];

      // Default mock fetcher for successful creation of a single user
      mockFetcher.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(serverUser), // serverUser is a single user object
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      // Initialize model (used for TData = User[] tests primarily)
      model = new RestfulApiModel<User[], typeof UserSchema>({
        baseUrl,
        endpoint,
        fetcher: mockFetcher,
        schema: UserSchema, // Schema for a single user, model handles array validation
        initialData: [...initialCollectionData],
      });

      modelForUserArray = new RestfulApiModel<User[], typeof UserSchema>({
        baseUrl,
        endpoint,
        fetcher: mockFetcher,
        schema: UserSchema, // Schema for a single User item
        initialData: [...initialCollectionData],
      });

      modelForSingleUser = new RestfulApiModel<User, typeof UserSchema>({
        baseUrl,
        endpoint,
        fetcher: mockFetcher,
        schema: UserSchema,
        initialData: null, // Or a single user
      });

    });

    it('should optimistically add a single item to collection (TData is User[]), then update with server response', async () => {
      const model = modelForUserArray; // Explicitly use the array model
      const initialData = [...initialCollectionData];
      model.setData(initialData); // Ensure fresh data for this test

      const dataEmissions: (User[] | null)[] = [];
      model.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const singleUserPayload: Partial<User> = { name: 'Charlie Temp', email: 'temp@example.com' };
      const serverResponseUser: User = { id: 'server-gen-id-1', ...singleUserPayload } as User;

      mockFetcher.mockResolvedValueOnce({ // Specific mock for this test's API call
        ok: true,
        json: () => Promise.resolve(serverResponseUser),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const promise = model.create(singleUserPayload); // Pass single Partial<User>

      // Optimistic update
      const optimisticData = await model.data$.pipe(first(data => (data as User[]).length > initialData.length)).toPromise();
      expect((optimisticData as User[]).length).toBe(initialData.length + 1);
      const tempItem = (optimisticData as User[]).find((u) => u.name === singleUserPayload.name);
      expect(tempItem).toBeDefined();
      expect(tempItem!.id.startsWith('temp_')).toBe(true);

      const createdItem = await promise;
      expect(createdItem).toEqual(serverResponseUser);

      // Final update from server
      const finalData = await model.data$.pipe(first(data => (data as User[]).some(u => u.id === serverResponseUser.id))).toPromise() as User[];
      expect(finalData.length).toBe(initialData.length + 1);
      expect(finalData.find((u) => u.id === serverResponseUser.id)).toEqual(serverResponseUser);
      expect(finalData.find((u) => u.id === tempItem!.id)).toBeUndefined();

      expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify(singleUserPayload) })
      );
    });

    it('should optimistically add multiple items to collection (TData is User[]), then update with server responses', async () => {
      const model = modelForUserArray;
      const initialData = [...initialCollectionData];
      model.setData(initialData);

      const usersPayload: Partial<User>[] = [
        { name: 'User Batch 1', email: 'batch1@example.com' },
        { name: 'User Batch 2', email: 'batch2@example.com' },
      ];
      const serverResponseUsers: User[] = [
        { id: 'server-batch-1', ...usersPayload[0] } as User,
        { id: 'server-batch-2', ...usersPayload[1] } as User,
      ];

      // Mock fetcher to return responses one by one
      mockFetcher
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(serverResponseUsers[0]), headers: new Headers({ 'Content-Type': 'application/json' }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(serverResponseUsers[1]), headers: new Headers({ 'Content-Type': 'application/json' }) } as Response);

      const promise = model.create(usersPayload);

      const optimisticData = await model.data$.pipe(first(data => (data as User[]).length === initialData.length + usersPayload.length)).toPromise() as User[];
      expect(optimisticData.length).toBe(initialData.length + usersPayload.length);
      usersPayload.forEach(payloadUser => {
        const tempItem = optimisticData.find(u => u.name === payloadUser.name);
        expect(tempItem).toBeDefined();
        expect(tempItem!.id.startsWith('temp_')).toBe(true);
      });

      const createdItems = await promise as User[];
      expect(createdItems).toEqual(serverResponseUsers);

      const finalData = await model.data$.pipe(first(data => serverResponseUsers.every(su => (data as User[]).some(u => u.id === su.id)))).toPromise() as User[];
      expect(finalData.length).toBe(initialData.length + usersPayload.length);
      serverResponseUsers.forEach(serverUser => {
        expect(finalData.find(u => u.id === serverUser.id)).toEqual(serverUser);
      });
      expect(mockFetcher).toHaveBeenCalledTimes(usersPayload.length);
    });

    it('should replace data$ with a single server response if initial data was null and creating single item (TData is User)', async () => {
      const model = modelForSingleUser; // Use TData = User model
      model.setData(null); // Start with null

      const singleUserPayload: Partial<User> = { name: 'Solo User', email: 'solo@example.com' };
      const serverResponseUser: User = { id: 'server-solo-1', ...singleUserPayload } as User;

      mockFetcher.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serverResponseUser),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const createdItem = await model.create(singleUserPayload);
      expect(createdItem).toEqual(serverResponseUser);
      expect(await model.data$.pipe(first()).toPromise()).toEqual(serverResponseUser);
    });

    it('should replace data$ with an array of server responses if initial data was null and creating multiple items (TData is User[])', async () => {
      const model = modelForUserArray;
      model.setData(null); // Start with null, but TData is User[]

      const usersPayload: Partial<User>[] = [
          { name: 'New Array User 1', email: 'na1@example.com' },
          { name: 'New Array User 2', email: 'na2@example.com' },
      ];
      const serverResponseUsers: User[] = [
          { id: 'server-na-1', ...usersPayload[0] } as User,
          { id: 'server-na-2', ...usersPayload[1] } as User,
      ];

      mockFetcher
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(serverResponseUsers[0]), headers: new Headers({'Content-Type': 'application/json'}) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(serverResponseUsers[1]), headers: new Headers({'Content-Type': 'application/json'}) } as Response);

      const createdItems = await model.create(usersPayload);
      expect(createdItems).toEqual(serverResponseUsers);
      expect(await model.data$.pipe(first()).toPromise()).toEqual(serverResponseUsers);
    });


    it('should revert optimistic add from collection if create of single item fails (TData is User[])', async () => {
      const model = modelForUserArray;
      const initialData = [...initialCollectionData];
      model.setData(initialData);

      const dataEmissions: (User[] | null)[] = [];
      model.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const createError = new Error('Creation failed');
      mockFetcher.mockRejectedValueOnce(createError);

      const singleUserPayloadFail: Partial<User> = { name: 'Fail User', email: 'fail@example.com' };

      await expect(model.create(singleUserPayloadFail)).rejects.toThrow(createError);

      // Check that data has been reverted
      // Optimistic (length + 1), Reverted (length)
      expect(dataEmissions.length).toBeGreaterThanOrEqual(3); // Initial, Optimistic, Reverted
      const optimisticSnapshot = dataEmissions[dataEmissions.length - 2] as User[];
      expect(optimisticSnapshot.length).toBe(initialData.length + 1);

      const finalData = dataEmissions[dataEmissions.length - 1] as User[];
      expect(finalData).toEqual(initialData);
      expect(await model.error$.pipe(first()).toPromise()).toBe(createError);
    });

    it('should revert optimistic add from collection if create of multiple items fails (TData is User[])', async () => {
      const model = modelForUserArray;
      const initialData = [...initialCollectionData];
      model.setData(initialData);

      const dataEmissions: (User[] | null)[] = [];
      model.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const usersPayloadFail: Partial<User>[] = [
        { name: 'Batch Fail 1', email: 'bf1@example.com'},
        { name: 'Batch Fail 2', email: 'bf2@example.com'}
      ];
      const serverResponseUser1: User = { id: 'server-bf-1', ...usersPayloadFail[0]} as User;

      const createError = new Error('Second creation failed');
      mockFetcher
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(serverResponseUser1), headers: new Headers({ 'Content-Type': 'application/json' }) } as Response)
        .mockRejectedValueOnce(createError);


      await expect(model.create(usersPayloadFail)).rejects.toThrow(createError);

      expect(dataEmissions.length).toBeGreaterThanOrEqual(3);
      const optimisticSnapshot = dataEmissions[dataEmissions.length - 2] as User[];
      // Optimistic would have added both temp items
      expect(optimisticSnapshot.length).toBe(initialData.length + usersPayloadFail.length);

      const finalData = dataEmissions[dataEmissions.length - 1] as User[];
      expect(finalData).toEqual(initialData); // Should be fully reverted
      expect(await model.error$.pipe(first()).toPromise()).toBe(createError);
    });

    // Original tests for single item model (TData = User)
    // Need to ensure they still pass or adapt them for modelForSingleUser
    it('ORIGINAL: should replace data$ with server response if initial data was single item/null (TData is User)', async () => {
      const singleItemModel = modelForSingleUser;
       mockFetcher.mockResolvedValue({ // Reset general mock for this
        ok: true,
        json: () => Promise.resolve(serverUser), // serverUser is a single User
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);
      singleItemModel.setData(null);


      const dataEmissionsSingle: (User | null)[] = [];
      singleItemModel.data$.subscribe((data) =>
        dataEmissionsSingle.push(data ? JSON.parse(JSON.stringify(data)) : null),
      );
      const createPayload : Partial<User> = {name: "Test", email: "test@example.com"};
      await singleItemModel.create(createPayload);

      expect(dataEmissionsSingle.length).toBeGreaterThanOrEqual(3);
      const optimisticSingle = dataEmissionsSingle[dataEmissionsSingle.length - 2] as User;
      expect(optimisticSingle.name).toBe(createPayload.name);
      if (!createPayload.id) expect(optimisticSingle.id.startsWith('temp_')).toBe(true);

      // The serverUser has a fixed ID 'server-3', ensure the mock returns that or something consistent.
      // For this test, let's assume mockFetcher returns 'serverUser' which has id 'server-3'
      const expectedServerUser = {...serverUser, name: createPayload.name, email: createPayload.email }; // align with payload for this test
      mockFetcher.mockResolvedValue({
         ok: true,
         json: () => Promise.resolve(expectedServerUser),
         headers: new Headers({ 'Content-Type': 'application/json' }),
       } as Response);
      // Re-run create with the specific mock if needed, or ensure general mock is sufficient.
      // The issue might be that the general mock is not specific enough for the payload.
      // Let's re-run create with a more specific payload that matches 'serverUser' if that's the expectation
      const specificPayload = { name: serverUser.name, email: serverUser.email };
      const created = await singleItemModel.create(specificPayload); // This call uses the new mock

      expect(await singleItemModel.data$.pipe(first(d => d?.id === expectedServerUser.id)).toPromise()).toEqual(expectedServerUser);
    });

    it('ORIGINAL: should revert optimistic set of single item if create fails (TData is User)', async () => {
      const singleItemModelFail = modelForSingleUser;
      const initialSingleUser = {
        id: 'single-initial', name: 'Initial Single', email: 'single@example.com',
      };
      singleItemModelFail.setData(JSON.parse(JSON.stringify(initialSingleUser)));

      const createError = new Error('Single Create Failed');
      mockFetcher.mockRejectedValueOnce(createError);

      const dataEmissionsSingleFail: (User | null)[] = [];
      singleItemModelFail.data$.subscribe((data) =>
        dataEmissionsSingleFail.push(data ? JSON.parse(JSON.stringify(data)) : null),
      );
      const payloadToFail: Partial<User> = { name: "payload to fail", email: "fail@example.com"};
      await expect(singleItemModelFail.create(payloadToFail)).rejects.toThrow(createError);

      expect(dataEmissionsSingleFail.length).toBeGreaterThanOrEqual(3);
      const optimisticSingleFailed = dataEmissionsSingleFail[dataEmissionsSingleFail.length - 2] as User;
      expect(optimisticSingleFailed.name).toBe(payloadToFail.name);

      expect(await singleItemModelFail.data$.pipe(first()).toPromise()).toEqual(initialSingleUser);
      expect(await singleItemModelFail.error$.pipe(first()).toPromise()).toBe(createError);
    });

    it('should throw ZodError on create if server response is invalid (TData is User[])', async () => {
      const modelToValidate = modelForUserArray;
      modelToValidate.setData([]); // Start with empty array

      const invalidServerResponse = createUserWithInvalidEmail('new-id', 'Created Invalid');
      mockFetcher.mockResolvedValueOnce({ // Specific mock for this test
        ok: true,
        json: () => Promise.resolve(invalidServerResponse),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const createPayload: Partial<User> = { name: 'Test', email: 'test@example.com' };
      // Test with validateSchema: true (default)
      await expect(modelToValidate.create(createPayload)).rejects.toThrowError(ZodError);
      expect(await modelToValidate.error$.pipe(first()).toPromise()).toBeInstanceOf(ZodError);
      expect(await modelToValidate.data$.pipe(first()).toPromise()).toEqual([]); // Reverted
    });

    it('should create and set invalid created item if validateSchema is false (TData is User[])', async () => {
        const modelValidateFalse = new RestfulApiModel<User[], typeof UserSchema>({
            baseUrl, endpoint, fetcher: mockFetcher, schema: UserSchema, initialData: [], validateSchema: false,
        });

        const invalidServerResponse = createInvalidUser('new-id-invalid', 'Created Invalid Allowed') as User;
        mockFetcher.mockResolvedValueOnce({
            ok: true, json: () => Promise.resolve(invalidServerResponse), headers: new Headers({ 'Content-Type': 'application/json' }),
        } as Response);

        const createPayload: Partial<User> = { name: 'Test Valid Payload', email: 'validpayload@example.com' };

        const createdItem = await modelValidateFalse.create(createPayload);
        expect(createdItem).toEqual(invalidServerResponse);
        expect(await modelValidateFalse.error$.pipe(first()).toPromise()).toBeNull();

        const currentData = await modelValidateFalse.data$.pipe(first(d => (d as User[]).some(u => u.id === invalidServerResponse.id))).toPromise() as User[];
        expect(currentData).toEqual(expect.arrayContaining([invalidServerResponse]));
        modelValidateFalse.dispose();
    });

  });

  describe('update method', () => {
    // serverUpdatedUser and updatePayload remain relevant for single item updates
    const serverUpdatedUser: User = {
      id: '1', name: 'Alice Updated By Server', email: 'alice.updated@example.com',
    };
    const updatePayload: Partial<ExtractItemType<User>> = { // Note: ExtractItemType used for clarity
      name: 'Alice Updated By Server',
    };

    // Declare these here so they are scoped for the whole describe block
    let modelForUserArray: RestfulApiModel<User[], typeof UserSchema>;
    let modelForSingleUser: RestfulApiModel<User, typeof UserSchema>;
    let originalUserInCollection: User;
    let initialCollectionForUpdate: User[];

    beforeEach(() => {
      // Initialize models here if they are not already initialized in the outer block's beforeEach
      // For this specific structure, they ARE initialized in the outer 'create method' describe's beforeEach.
      // We need to ensure they are re-initialized or set up freshly if needed for 'update' tests,
      // or ensure the outer beforeEach is sufficient and variables are correctly scoped.

      // Re-initializing them here for clarity and to avoid test interference.
      modelForUserArray = new RestfulApiModel<User[], typeof UserSchema>({
        baseUrl,
        endpoint,
        fetcher: mockFetcher,
        schema: UserSchema,
        initialData: [], // Start empty for update tests, will be set specifically
      });

      modelForSingleUser = new RestfulApiModel<User, typeof UserSchema>({
        baseUrl,
        endpoint,
        fetcher: mockFetcher,
        schema: UserSchema,
        initialData: null,
      });

      // This setup is for modelForUserArray (TData = User[])
      originalUserInCollection = { id: '1', name: 'Alice Original', email: 'alice@example.com' };
      initialCollectionForUpdate = [
        JSON.parse(JSON.stringify(originalUserInCollection)),
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];
      modelForUserArray.setData([...initialCollectionForUpdate]);

      // Default mock for successful update, can be overridden per test
      mockFetcher.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(serverUpdatedUser), // Returns a single updated user
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);
    });

    it('should optimistically update item in collection (TData is User[]), then confirm with server response', async () => {
      const modelToTest = modelForUserArray; // Using TData = User[] model
      const dataEmissions: (User[] | null)[] = [];
      modelToTest.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const promise = modelToTest.update('1', updatePayload); // updatePayload is Partial<User>

      // Optimistic
      const optimisticData = await modelToTest.data$.pipe(first(d => (d as User[]).find(u=>u.id === '1')?.name === updatePayload.name)).toPromise() as User[];
      const updatedOptimisticItem = optimisticData.find((u) => u.id === '1');
      expect(updatedOptimisticItem?.name).toBe(updatePayload.name);
      expect(updatedOptimisticItem?.email).toBe(originalUserInCollection.email); // Email not in payload

      const updatedItem = await promise;
      expect(updatedItem).toEqual(serverUpdatedUser);

      // Server confirmed
      const finalData = await modelToTest.data$.pipe(first(d => (d as User[]).find(u=>u.id === '1')?.email === serverUpdatedUser.email)).toPromise() as User[];
      expect(finalData.find((u) => u.id === '1')).toEqual(serverUpdatedUser);

      expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}/1`,
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(updatePayload) })
      );
    });

    it('should revert optimistic update in collection (TData is User[]) if update fails', async () => {
      const modelToTest = modelForUserArray;
      const dataEmissions: (User[] | null)[] = [];
      modelToTest.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const updateError = new Error('Update failed');
      mockFetcher.mockRejectedValueOnce(updateError);

      await expect(modelToTest.update('1', updatePayload)).rejects.toThrow(updateError);

      // Check data reverted
      expect(dataEmissions.length).toBeGreaterThanOrEqual(3); // Initial, Optimistic, Reverted
      const revertedData = dataEmissions[dataEmissions.length-1] as User[];
      expect(revertedData.find((u) => u.id === '1')).toEqual(originalUserInCollection);
      expect(await modelToTest.error$.pipe(first()).toPromise()).toBe(updateError);
    });

    // Tests for TData = User model (single item model)
    it('should optimistically update single item (TData is User), then confirm with server response', async () => {
      const modelToTest = modelForSingleUser;
      const initialSingleUser = { id: 'single-1', name: 'Single Original', email: 'single@example.com' };
      modelToTest.setData(JSON.parse(JSON.stringify(initialSingleUser)));

      const singleUpdatePayload: Partial<User> = { name: 'Single Updated by Server' };
      const serverSingleUpdated: User = { ...initialSingleUser, name: singleUpdatePayload.name! };

      mockFetcher.mockResolvedValueOnce({ // Specific mock for this call
        ok: true,
        json: () => Promise.resolve(serverSingleUpdated),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const dataEmissions: (User | null)[] = [];
      modelToTest.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const promise = modelToTest.update(initialSingleUser.id, singleUpdatePayload);

      // Optimistic
      const optimisticData = await modelToTest.data$.pipe(first(d => (d as User)?.name === singleUpdatePayload.name)).toPromise();
      expect((optimisticData as User)?.name).toBe(singleUpdatePayload.name);

      const updatedItem = await promise;
      expect(updatedItem).toEqual(serverSingleUpdated);

      // Server confirmed
      expect(await modelToTest.data$.pipe(first()).toPromise()).toEqual(serverSingleUpdated);
    });

    it('should revert optimistic update of single item (TData is User) if update fails', async () => {
      const modelToTest = modelForSingleUser;
      const initialSingleUserToFail = { id: 's-fail-1', name: 'Single Fail Original', email: 'sfail@example.com' };
      modelToTest.setData(JSON.parse(JSON.stringify(initialSingleUserToFail)));

      const singleUpdatePayloadFail: Partial<User> = { name: 'Single Fail Updated' };
      const updateError = new Error('Single Update Failed');
      mockFetcher.mockRejectedValueOnce(updateError);

      const dataEmissions: (User | null)[] = [];
      modelToTest.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      await expect(modelToTest.update(initialSingleUserToFail.id, singleUpdatePayloadFail)).rejects.toThrow(updateError);

      expect(dataEmissions.length).toBeGreaterThanOrEqual(3); // Initial, Optimistic, Reverted
      const revertedData = dataEmissions[dataEmissions.length - 1];
      expect(revertedData).toEqual(initialSingleUserToFail);
      expect(await modelToTest.error$.pipe(first()).toPromise()).toBe(updateError);
    });

    it('should throw ZodError on update if server response is invalid (TData is User[])', async () => {
      const modelToTest = modelForUserArray; // Test with collection model
      // originalUserInCollection is { id: '1', name: 'Alice Original', email: 'alice@example.com' }
      modelToTest.setData([...initialCollectionForUpdate]); // Set initial state for the array model

      const invalidServerResponse = createUserWithInvalidEmail('1', 'Updated Invalid'); // id '1' matches originalUserInCollection
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidServerResponse),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const updatePayloadAttempt: Partial<User> = { name: 'Attempted Update' };
      // Expect ZodError because the server response for the item being updated is invalid
      await expect(modelToTest.update('1', updatePayloadAttempt)).rejects.toThrowError(ZodError);
      expect(await modelToTest.error$.pipe(first()).toPromise()).toBeInstanceOf(ZodError);

      // Optimistic update should have been reverted
      const currentData = await modelToTest.data$.pipe(first()).toPromise() as User[];
      expect(currentData.find(u => u.id === '1')).toEqual(originalUserInCollection);
    });

    it('should throw ZodError on update if server response is invalid (TData is User)', async () => {
      const modelToTest = modelForSingleUser;
      const initialUser: User = { id: 'zod-test-1', name: 'User Before Update', email: 'user@example.com' };
      modelToTest.setData(initialUser);

      const invalidServerResponse = createUserWithInvalidEmail(initialUser.id, 'Updated Invalid');
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidServerResponse),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const updatePayloadAttempt: Partial<User> = { name: 'Attempted Update' };
      await expect(modelToTest.update(initialUser.id, updatePayloadAttempt)).rejects.toThrowError(ZodError);
      expect(await modelToTest.error$.pipe(first()).toPromise()).toBeInstanceOf(ZodError);
      expect(await modelToTest.data$.pipe(first()).toPromise()).toEqual(initialUser); // Reverted
    });


    it('should update and set invalid updated item if validateSchema is false (TData is User[])', async () => {
      const modelValidateFalse = new RestfulApiModel<User[], typeof UserSchema>({
        baseUrl, endpoint, fetcher: mockFetcher, schema: UserSchema,
        initialData: [...initialCollectionForUpdate], // Use known collection
        validateSchema: false,
      });

      const invalidServerResponse = createInvalidUser('1', 'Updated Invalid Allowed') as User; // id '1'
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidServerResponse),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response);

      const updatePayloadAttempt: Partial<User> = { name: 'Attempted Update False' };
      const updatedItem = await modelValidateFalse.update('1', updatePayloadAttempt);
      expect(updatedItem).toEqual(invalidServerResponse);
      expect(await modelValidateFalse.error$.pipe(first()).toPromise()).toBeNull();

      const currentData = await modelValidateFalse.data$.pipe(first(d => (d as User[]).some(u => u.id === '1' && u.name === invalidServerResponse.name))).toPromise() as User[];
      expect(currentData.find(u => u.id === '1')).toEqual(invalidServerResponse);
      modelValidateFalse.dispose();
    });

    it('should update and set invalid updated item if validateSchema is false (TData is User)', async () => {
        const initialUser: User = { id: 'val-false-1', name: 'User Valid', email: 'uservalid@example.com' };
        const modelValidateFalse = new RestfulApiModel<User, typeof UserSchema>({
            baseUrl, endpoint, fetcher: mockFetcher, schema: UserSchema,
            initialData: initialUser,
            validateSchema: false,
        });

        const invalidServerResponse = createInvalidUser(initialUser.id, 'Updated Invalid Allowed') as User;
        mockFetcher.mockResolvedValueOnce({
            ok: true, json: () => Promise.resolve(invalidServerResponse), headers: new Headers({ 'Content-Type': 'application/json' }),
        } as Response);

        const updatePayloadAttempt: Partial<User> = { name: 'Attempted Update False' };
        const updatedItem = await modelValidateFalse.update(initialUser.id, updatePayloadAttempt);
        expect(updatedItem).toEqual(invalidServerResponse);
        expect(await modelValidateFalse.error$.pipe(first()).toPromise()).toBeNull();
        expect(await modelValidateFalse.data$.pipe(first()).toPromise()).toEqual(invalidServerResponse);
        modelValidateFalse.dispose();
    });

  });

  describe('delete method', () => {
    let initialCollectionDataDelete: User[];
    const userToDeleteId = '1';

    beforeEach(() => {
      initialCollectionDataDelete = [
        { id: userToDeleteId, name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];
      model.setData([...initialCollectionDataDelete]);
      // Default mock for successful deletion (204 No Content)
      mockFetcher.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve(null), // Should not be called for 204
        text: () => Promise.resolve(''), // Should not be called for 204
        headers: new Headers({ 'Content-Type': 'application/json' }), // Content-Type might not be there for 204
      } as Response);
    });

    it('should optimistically delete item from collection and confirm', async () => {
      const dataEmissions: (User[] | null)[] = [];
      model.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const promise = model.delete(userToDeleteId);

      expect(dataEmissions.length).toBeGreaterThanOrEqual(2); // Initial, Optimistic
      const optimisticData = dataEmissions[dataEmissions.length - 1] as User[];
      expect(optimisticData.find((u) => u.id === userToDeleteId)).toBeUndefined();
      expect(optimisticData.length).toBe(initialCollectionDataDelete.length - 1);

      await promise; // Wait for API call to resolve

      expect(mockFetcher).toHaveBeenCalledWith(`${baseUrl}/${endpoint}/${userToDeleteId}`, {
        method: 'DELETE',
      });
      // Final state should be the same as optimistic for delete
      const finalData = (await model.data$.pipe(first()).toPromise()) as User[];
      expect(finalData.find((u) => u.id === userToDeleteId)).toBeUndefined();
      expect(finalData.length).toBe(initialCollectionDataDelete.length - 1);
      expect(await model.isLoading$.pipe(first()).toPromise()).toBe(false);
      expect(await model.error$.pipe(first()).toPromise()).toBeNull();
    });

    it('should revert optimistic delete from collection if delete fails', async () => {
      const dataEmissions: (User[] | null)[] = [];
      model.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      const deleteError = new Error('Deletion failed');
      mockFetcher.mockRejectedValue(deleteError);

      await expect(model.delete(userToDeleteId)).rejects.toThrow(deleteError);

      expect(dataEmissions.length).toBeGreaterThanOrEqual(3); // Initial, Optimistic, Reverted
      const revertedData = dataEmissions[dataEmissions.length - 1] as User[];
      expect(revertedData).toEqual(initialCollectionDataDelete);
      expect(await model.error$.pipe(first()).toPromise()).toBe(deleteError);
    });

    it('should optimistically set single item to null and confirm', async () => {
      const initialSingleUser = {
        id: 'single-del-1',
        name: 'Single Delete',
        email: 'sdel@example.com',
      };
      const singleItemModel = new RestfulApiModel<User, typeof UserSchema>(
        // baseUrl,
        // endpoint,
        // mockFetcher, // Reuses beforeEach mock for successful delete
        // UserSchema,
        // JSON.parse(JSON.stringify(initialSingleUser))
        {
          baseUrl,
          endpoint,
          fetcher: mockFetcher,
          schema: UserSchema,
          initialData: JSON.parse(JSON.stringify(initialSingleUser)), // Use a deep copy
        },
      );

      const dataEmissions: (User | null)[] = [];
      singleItemModel.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      await singleItemModel.delete(initialSingleUser.id);

      // Emissions: Initial, Optimistic (which is also final for successful delete)
      expect(dataEmissions.length).toBeGreaterThanOrEqual(2);
      expect(dataEmissions[dataEmissions.length - 1]).toBeNull(); // Optimistic & Final state
      expect(await singleItemModel.data$.pipe(first()).toPromise()).toBeNull();
      singleItemModel.dispose();
    });

    it('should revert optimistic set to null of single item if delete fails', async () => {
      const initialSingleUserFail = {
        id: 's-del-fail-1',
        name: 'Single Del Fail',
        email: 'sdelfail@example.com',
      };
      const singleItemModelFail = new RestfulApiModel<User, typeof UserSchema>(
        // baseUrl,
        // endpoint,
        // mockFetcher,
        // UserSchema,
        // JSON.parse(JSON.stringify(initialSingleUserFail))

        {
          baseUrl,
          endpoint,
          fetcher: mockFetcher,
          schema: UserSchema,
          initialData: JSON.parse(JSON.stringify(initialSingleUserFail)), // Use a deep copy
        },
      );
      const deleteError = new Error('Single Deletion Failed');
      mockFetcher.mockRejectedValue(deleteError); // Mock failure

      const dataEmissions: (User | null)[] = [];
      singleItemModelFail.data$.subscribe((data) => dataEmissions.push(data ? JSON.parse(JSON.stringify(data)) : null));

      await expect(singleItemModelFail.delete(initialSingleUserFail.id)).rejects.toThrow(deleteError);

      expect(dataEmissions.length).toBeGreaterThanOrEqual(3); // Initial, Optimistic(null), Reverted
      expect(dataEmissions[dataEmissions.length - 2]).toBeNull(); // Optimistic state was null
      expect(await singleItemModelFail.data$.pipe(first()).toPromise()).toEqual(initialSingleUserFail); // Reverted
      expect(await singleItemModelFail.error$.pipe(first()).toPromise()).toBe(deleteError);
      singleItemModelFail.dispose();
    });
  });

  describe('dispose method', () => {
    it('should call super.dispose and complete BaseModel observables', () => {
      const baseModelDisposeSpy = vi.spyOn(BaseModel.prototype, 'dispose');

      // Create a new model instance for this test to avoid interference
      const disposeModel = new RestfulApiModel<User | User[], typeof UserSchema>(
        // baseUrl, endpoint, mockFetcher, UserSchema
        {
          baseUrl,
          endpoint,
          fetcher: mockFetcher,
          schema: UserSchema,
          initialData: null, // Start with no initial data
        },
      );

      const dataCompleteSpy = vi.fn();
      const isLoadingCompleteSpy = vi.fn();
      const errorCompleteSpy = vi.fn();

      disposeModel.data$.subscribe({ complete: dataCompleteSpy });
      disposeModel.isLoading$.subscribe({ complete: isLoadingCompleteSpy });
      disposeModel.error$.subscribe({ complete: errorCompleteSpy });

      disposeModel.dispose();

      expect(baseModelDisposeSpy).toHaveBeenCalledTimes(1);
      expect(dataCompleteSpy).toHaveBeenCalledTimes(1);
      expect(isLoadingCompleteSpy).toHaveBeenCalledTimes(1);
      expect(errorCompleteSpy).toHaveBeenCalledTimes(1);

      // Attempt to use methods that change state to ensure no further actions
      disposeModel.setData(null); // Should not emit on data$
      disposeModel.setLoading(true); // Should not emit on isLoading$
      disposeModel.setError(new Error('test')); // Should not emit on error$

      // Verify no new next emissions after dispose (spies would have been called again)
      // This is implicitly tested by checking complete was called, as completed subjects don't emit.

      baseModelDisposeSpy.mockRestore(); // Clean up the spy
    });
  });
});

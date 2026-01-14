export interface UserApiResponse {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly email: string,
    public readonly avatarUrl: string | null,
    public readonly role: string
  ) {}

  static fromApi(payload: UserApiResponse) {
    return new UserEntity(payload.id, payload.displayName, payload.email, payload.avatarUrl, payload.role);
  }
}

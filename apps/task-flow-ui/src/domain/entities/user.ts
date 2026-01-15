export interface UserApiResponse {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export class UserEntity {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly role: string;

  constructor(
    id: string,
    displayName: string,
    email: string,
    avatarUrl: string | null,
    role: string
  ) {
    this.id = id;
    this.displayName = displayName;
    this.email = email;
    this.avatarUrl = avatarUrl;
    this.role = role;
  }

  static fromApi(payload: UserApiResponse) {
    return new UserEntity(payload.id, payload.displayName, payload.email, payload.avatarUrl, payload.role);
  }
}

export interface ProfilePreferences {
  theme?: 'light' | 'dark';
}

export interface UserApiResponse {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  preferences?: ProfilePreferences | null;
}

export class UserEntity {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly role: string;
  readonly preferences: ProfilePreferences;

  constructor(
    id: string,
    displayName: string,
    email: string,
    avatarUrl: string | null,
    role: string,
    preferences: ProfilePreferences,
  ) {
    this.id = id;
    this.displayName = displayName;
    this.email = email;
    this.avatarUrl = avatarUrl;
    this.role = role;
    this.preferences = preferences;
  }

  static fromApi(payload: UserApiResponse) {
    return new UserEntity(
      payload.id,
      payload.displayName,
      payload.email,
      payload.avatarUrl,
      payload.role,
      payload.preferences ?? {},
    );
  }
}

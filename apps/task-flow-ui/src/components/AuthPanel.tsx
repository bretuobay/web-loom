import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { useObservable } from '../hooks/useObservable';
import type { AuthViewModel } from '../view-models/AuthViewModel';
import { formatUserRole, USER_ROLES, type UserRole } from '../domain/values/userRole';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Display name is required'),
  role: z.enum(USER_ROLES),
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const makeFieldId = (form: string, field: string) => `auth-${form}-${field}`;
const joinDescribedBy = (...ids: (string | undefined)[]) => {
  const filtered = ids.filter(Boolean) as string[];
  return filtered.length ? filtered.join(' ') : undefined;
};
const errorId = (fieldId: string) => `${fieldId}-error`;

const loginHeadingId = 'auth-login-heading';
const registerHeadingId = 'auth-register-heading';
const changePasswordHeadingId = 'auth-change-password-heading';
const loginFeedbackId = 'auth-login-feedback';
const registerFeedbackId = 'auth-register-feedback';
const changePasswordFeedbackId = 'auth-change-password-feedback';
const globalErrorId = 'auth-panel-error';

const loginCardId = 'auth-login-card';
const registerCardId = 'auth-register-card';
const changePasswordCardId = 'auth-change-password-card';
const loginTabId = 'auth-login-tab';
const registerTabId = 'auth-register-tab';

const loginFieldIds = {
  email: makeFieldId('login', 'email'),
  password: makeFieldId('login', 'password'),
};

const registerFieldIds = {
  displayName: makeFieldId('register', 'display-name'),
  email: makeFieldId('register', 'email'),
  role: makeFieldId('register', 'role'),
  avatarUrl: makeFieldId('register', 'avatar'),
  password: makeFieldId('register', 'password'),
  confirmPassword: makeFieldId('register', 'confirm-password'),
};

const changePasswordFieldIds = {
  currentPassword: makeFieldId('change-password', 'current'),
  newPassword: makeFieldId('change-password', 'new'),
  confirmPassword: makeFieldId('change-password', 'confirm'),
};

const registerPasswordHintId = `${registerFieldIds.password}-hint`;
const registerRoleHintId = `${registerFieldIds.role}-hint`;
const changePasswordNewHintId = `${changePasswordFieldIds.newPassword}-hint`;
const registerAvatarHintId = `${registerFieldIds.avatarUrl}-hint`;

const formatErrors = (result: z.SafeParseReturnType<any, any>) => {
  if (result.success) return {};
  return result.error.issues.reduce<Record<string, string>>((acc, issue) => {
    if (issue.path.length) {
      acc[issue.path[0] as string] = issue.message;
    }
    return acc;
  }, {});
};

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema> & { confirmPassword: string };
type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface AuthPanelProps {
  viewModel: AuthViewModel;
}

export function AuthPanel({ viewModel }: AuthPanelProps) {
  const user = useObservable(viewModel.userObservable, null);
  const errorMessage = useObservable(viewModel.errorMessage$, null);
  const isLoading = useObservable(viewModel.isLoading$, false);

  const [loginValues, setLoginValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  const [registerValues, setRegisterValues] = useState<RegisterFormValues>({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
    role: USER_ROLES[0],
    avatarUrl: '',
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [registerFeedback, setRegisterFeedback] = useState<string | null>(null);

  const [changePasswordValues, setChangePasswordValues] = useState<ChangePasswordFormValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changePasswordErrors, setChangePasswordErrors] = useState<Record<string, string>>({});
  const [changePasswordFeedback, setChangePasswordFeedback] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<'login' | 'register'>('login');

  const registerPasswordDescribedBy = joinDescribedBy(
    registerPasswordHintId,
    registerErrors.password ? errorId(registerFieldIds.password) : undefined,
  );
  const registerRoleDescribedBy = joinDescribedBy(
    registerRoleHintId,
    registerErrors.role ? errorId(registerFieldIds.role) : undefined,
  );
  const changePasswordNewDescribedBy = joinDescribedBy(
    changePasswordNewHintId,
    changePasswordErrors.newPassword ? errorId(changePasswordFieldIds.newPassword) : undefined,
  );
  const registerAvatarDescribedBy = joinDescribedBy(
    registerAvatarHintId,
    registerErrors.avatarUrl ? errorId(registerFieldIds.avatarUrl) : undefined,
  );

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    viewModel.clearError();
    const validation = loginSchema.safeParse(loginValues);
    if (!validation.success) {
      setLoginErrors(formatErrors(validation));
      return;
    }
    try {
      await viewModel.login(validation.data);
      setLoginFeedback('Signed in successfully');
      setLoginErrors({});
      setRegisterErrors({});
      setRegisterFeedback(null);
    } finally {
      setLoginValues((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    viewModel.clearError();
    if (registerValues.password !== registerValues.confirmPassword) {
      setRegisterErrors({ confirmPassword: 'Passwords must match' });
      return;
    }

    const { confirmPassword: _confirmPassword, ...rest } = registerValues;
    const payload = {
      ...rest,
      avatarUrl: rest.avatarUrl?.trim() || undefined,
    };
    const validation = registerSchema.safeParse(payload);
    if (!validation.success) {
      setRegisterErrors(formatErrors(validation));
      return;
    }

    try {
      await viewModel.register(validation.data);
      setRegisterFeedback('Account created — signed in automatically.');
      setRegisterErrors({});
      setLoginErrors({});
      setLoginFeedback(null);
    } finally {
      setRegisterValues((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    viewModel.clearError();
    if (changePasswordValues.newPassword !== changePasswordValues.confirmPassword) {
      setChangePasswordErrors({ confirmPassword: 'New passwords must match' });
      return;
    }
    const validation = changePasswordSchema.safeParse({
      currentPassword: changePasswordValues.currentPassword,
      newPassword: changePasswordValues.newPassword,
    });
    if (!validation.success) {
      setChangePasswordErrors(formatErrors(validation));
      return;
    }
    try {
      await viewModel.changePassword(validation.data);
      setChangePasswordFeedback('Password updated successfully.');
      setChangePasswordErrors({});
    } finally {
      setChangePasswordValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const loginForm = (
    <form className="task-form task-form--panel" onSubmit={handleLogin} noValidate aria-labelledby={loginHeadingId}>
      <div className="task-form__field">
        <label htmlFor={loginFieldIds.email}>Email address</label>
        <input
          id={loginFieldIds.email}
          type="email"
          placeholder="you@example.com"
          autoComplete="username"
          value={loginValues.email}
          onChange={(event) => setLoginValues((prev) => ({ ...prev, email: event.target.value }))}
          required
          aria-invalid={Boolean(loginErrors.email)}
          aria-describedby={loginErrors.email ? errorId(loginFieldIds.email) : undefined}
        />
        {loginErrors.email && (
          <p className="task-form__error" id={errorId(loginFieldIds.email)}>
            {loginErrors.email}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={loginFieldIds.password}>Password</label>
        <input
          id={loginFieldIds.password}
          type="password"
          autoComplete="current-password"
          value={loginValues.password}
          onChange={(event) => setLoginValues((prev) => ({ ...prev, password: event.target.value }))}
          required
          aria-invalid={Boolean(loginErrors.password)}
          aria-describedby={loginErrors.password ? errorId(loginFieldIds.password) : undefined}
        />
        {loginErrors.password && (
          <p className="task-form__error" id={errorId(loginFieldIds.password)}>
            {loginErrors.password}
          </p>
        )}
      </div>
      <button type="submit" disabled={isLoading}>
        Sign in
      </button>
      {loginFeedback && (
        <p className="task-form__feedback" id={loginFeedbackId} role="status" aria-live="polite">
          {loginFeedback}
        </p>
      )}
    </form>
  );

  const registerForm = (
    <form
      className="task-form task-form--panel"
      onSubmit={handleRegister}
      noValidate
      aria-labelledby={registerHeadingId}
    >
      <div className="task-form__field">
        <label htmlFor={registerFieldIds.displayName}>Display name</label>
        <input
          id={registerFieldIds.displayName}
          type="text"
          autoComplete="name"
          value={registerValues.displayName}
          onChange={(event) => setRegisterValues((prev) => ({ ...prev, displayName: event.target.value }))}
          required
          aria-invalid={Boolean(registerErrors.displayName)}
          aria-describedby={registerErrors.displayName ? errorId(registerFieldIds.displayName) : undefined}
        />
        {registerErrors.displayName && (
          <p className="task-form__error" id={errorId(registerFieldIds.displayName)}>
            {registerErrors.displayName}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={registerFieldIds.email}>Email address</label>
        <input
          id={registerFieldIds.email}
          type="email"
          autoComplete="username"
          value={registerValues.email}
          onChange={(event) => setRegisterValues((prev) => ({ ...prev, email: event.target.value }))}
          required
          aria-invalid={Boolean(registerErrors.email)}
          aria-describedby={registerErrors.email ? errorId(registerFieldIds.email) : undefined}
        />
        {registerErrors.email && (
          <p className="task-form__error" id={errorId(registerFieldIds.email)}>
            {registerErrors.email}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={registerFieldIds.role}>Role</label>
        <select
          id={registerFieldIds.role}
          value={registerValues.role}
          onChange={(event) => setRegisterValues((prev) => ({ ...prev, role: event.target.value as UserRole }))}
          aria-invalid={Boolean(registerErrors.role)}
          aria-describedby={registerRoleDescribedBy}
          required
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {formatUserRole(role)}
            </option>
          ))}
        </select>
        <p className="task-form__hint" id={registerRoleHintId}>
          Choose a role that matches the access you need.
        </p>
        {registerErrors.role && (
          <p className="task-form__error" id={errorId(registerFieldIds.role)}>
            {registerErrors.role}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={registerFieldIds.avatarUrl}>Avatar URL (optional)</label>
        <input
          id={registerFieldIds.avatarUrl}
          type="url"
          autoComplete="url"
          value={registerValues.avatarUrl}
          onChange={(event) => setRegisterValues((prev) => ({ ...prev, avatarUrl: event.target.value }))}
          aria-describedby={registerAvatarDescribedBy}
          aria-invalid={Boolean(registerErrors.avatarUrl)}
        />
        <p className="task-form__hint" id={registerAvatarHintId}>
          Upload a PNG, GIF, or JPEG by pasting a public link.
        </p>
        {registerErrors.avatarUrl && (
          <p className="task-form__error" id={errorId(registerFieldIds.avatarUrl)}>
            {registerErrors.avatarUrl}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={registerFieldIds.password}>Password</label>
        <input
          id={registerFieldIds.password}
          type="password"
          autoComplete="new-password"
          value={registerValues.password}
          onChange={(event) => setRegisterValues((prev) => ({ ...prev, password: event.target.value }))}
          required
          aria-invalid={Boolean(registerErrors.password)}
          aria-describedby={registerPasswordDescribedBy}
        />
        <p className="task-form__hint" id={registerPasswordHintId}>
          At least 8 characters with a mix of letters and numbers.
        </p>
        {registerErrors.password && (
          <p className="task-form__error" id={errorId(registerFieldIds.password)}>
            {registerErrors.password}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={registerFieldIds.confirmPassword}>Confirm password</label>
        <input
          id={registerFieldIds.confirmPassword}
          type="password"
          autoComplete="new-password"
          value={registerValues.confirmPassword}
          onChange={(event) => setRegisterValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          required
          aria-invalid={Boolean(registerErrors.confirmPassword)}
          aria-describedby={registerErrors.confirmPassword ? errorId(registerFieldIds.confirmPassword) : undefined}
        />
        {registerErrors.confirmPassword && (
          <p className="task-form__error" id={errorId(registerFieldIds.confirmPassword)}>
            {registerErrors.confirmPassword}
          </p>
        )}
      </div>
      <button type="submit" disabled={isLoading}>
        Register
      </button>
      {registerFeedback && (
        <p className="task-form__feedback" id={registerFeedbackId} role="status" aria-live="polite">
          {registerFeedback}
        </p>
      )}
    </form>
  );

  const changePasswordForm = (
    <form
      className="task-form task-form--panel"
      onSubmit={handleChangePassword}
      noValidate
      aria-labelledby={changePasswordHeadingId}
    >
      <div className="task-form__field">
        <label htmlFor={changePasswordFieldIds.currentPassword}>Current password</label>
        <input
          id={changePasswordFieldIds.currentPassword}
          type="password"
          autoComplete="current-password"
          value={changePasswordValues.currentPassword}
          onChange={(event) => setChangePasswordValues((prev) => ({ ...prev, currentPassword: event.target.value }))}
          required
          aria-invalid={Boolean(changePasswordErrors.currentPassword)}
          aria-describedby={
            changePasswordErrors.currentPassword ? errorId(changePasswordFieldIds.currentPassword) : undefined
          }
        />
        {changePasswordErrors.currentPassword && (
          <p className="task-form__error" id={errorId(changePasswordFieldIds.currentPassword)}>
            {changePasswordErrors.currentPassword}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={changePasswordFieldIds.newPassword}>New password</label>
        <input
          id={changePasswordFieldIds.newPassword}
          type="password"
          autoComplete="new-password"
          value={changePasswordValues.newPassword}
          onChange={(event) => setChangePasswordValues((prev) => ({ ...prev, newPassword: event.target.value }))}
          required
          aria-invalid={Boolean(changePasswordErrors.newPassword)}
          aria-describedby={changePasswordNewDescribedBy}
        />
        <p className="task-form__hint" id={changePasswordNewHintId}>
          Choose a unique password you can rotate regularly.
        </p>
        {changePasswordErrors.newPassword && (
          <p className="task-form__error" id={errorId(changePasswordFieldIds.newPassword)}>
            {changePasswordErrors.newPassword}
          </p>
        )}
      </div>
      <div className="task-form__field">
        <label htmlFor={changePasswordFieldIds.confirmPassword}>Confirm new password</label>
        <input
          id={changePasswordFieldIds.confirmPassword}
          type="password"
          autoComplete="new-password"
          value={changePasswordValues.confirmPassword}
          onChange={(event) => setChangePasswordValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          required
          aria-invalid={Boolean(changePasswordErrors.confirmPassword)}
          aria-describedby={
            changePasswordErrors.confirmPassword ? errorId(changePasswordFieldIds.confirmPassword) : undefined
          }
        />
        {changePasswordErrors.confirmPassword && (
          <p className="task-form__error" id={errorId(changePasswordFieldIds.confirmPassword)}>
            {changePasswordErrors.confirmPassword}
          </p>
        )}
      </div>
      <button type="submit" disabled={isLoading}>
        Update password
      </button>
      {changePasswordFeedback && (
        <p className="task-form__feedback" id={changePasswordFeedbackId} role="status" aria-live="polite">
          {changePasswordFeedback}
        </p>
      )}
    </form>
  );

  const loginCard = (
    <article id={loginCardId} role="tabpanel" className="auth-panel__card" aria-labelledby={loginHeadingId}>
      <div className="auth-panel__card-header">
        <div>
          <h3 id={loginHeadingId}>Sign in</h3>
          <p className="auth-panel__eyebrow">Returning users</p>
        </div>
        <p className="auth-panel__card-note">Access your workspace securely.</p>
      </div>
      {loginForm}
    </article>
  );

  const registerCard = (
    <article id={registerCardId} role="tabpanel" className="auth-panel__card" aria-labelledby={registerHeadingId}>
      <div className="auth-panel__card-header">
        <div>
          <h3 id={registerHeadingId}>Create an account</h3>
          <p className="auth-panel__eyebrow">New here?</p>
        </div>
        <p className="auth-panel__card-note">Create a profile, pick a role, and jump straight into Loom.</p>
      </div>
      {registerForm}
    </article>
  );

  const changePasswordCard = (
    <article
      id={changePasswordCardId}
      role="tabpanel"
      className="auth-panel__card"
      aria-labelledby={changePasswordHeadingId}
    >
      <div className="auth-panel__card-header">
        <div>
          <h3 id={changePasswordHeadingId}>Change password</h3>
          <p className="auth-panel__eyebrow">Security</p>
        </div>
        <p className="auth-panel__card-note">Rotate credentials regularly.</p>
      </div>
      {changePasswordForm}
    </article>
  );

  const formNav = (
    <div className="auth-panel__nav" role="tablist" aria-label="Authentication options">
      <button
        type="button"
        className={`auth-panel__nav-link ${activeForm === 'login' ? 'auth-panel__nav-link--selected' : ''}`}
        role="tab"
        id={loginTabId}
        aria-controls={loginCardId}
        aria-selected={activeForm === 'login'}
        tabIndex={activeForm === 'login' ? 0 : -1}
        onClick={() => setActiveForm('login')}
      >
        Sign in
      </button>
      <button
        type="button"
        className={`auth-panel__nav-link ${activeForm === 'register' ? 'auth-panel__nav-link--selected' : ''}`}
        role="tab"
        id={registerTabId}
        aria-controls={registerCardId}
        aria-selected={activeForm === 'register'}
        tabIndex={activeForm === 'register' ? 0 : -1}
        onClick={() => setActiveForm('register')}
      >
        Create account
      </button>
    </div>
  );

  const authForms = (
    <div className="auth-panel__single">
      {formNav}
      <div className="auth-panel__single-card">{activeForm === 'login' ? loginCard : registerCard}</div>
    </div>
  );

  return (
    <section className="panel panel--auth" aria-labelledby="auth-panel-heading">
      <div className="panel__header">
        <div>
          <h2 id="auth-panel-heading">Authentication</h2>
          <p className="panel__subhead">Securely sign in or create a new account for Loom.</p>
        </div>
      </div>
      {errorMessage && (
        <p id={globalErrorId} className="task-form__error" role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      )}
      {!user ? (
        authForms
      ) : (
        <div className="auth-panel__details">
          <div className="auth-panel__details__header">
            <p className="auth-panel__details__text" aria-live="polite">
              Signed in as <strong>{user.displayName}</strong> ({user.email}) · role: {user.role}
            </p>
            <button type="button" className="panel__button" onClick={() => viewModel.logout()}>
              Logout
            </button>
          </div>
          {changePasswordCard}
        </div>
      )}
    </section>
  );
}

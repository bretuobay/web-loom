import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { useObservable } from '../hooks/useObservable';
import { AuthViewModel } from '../view-models/AuthViewModel';
import { formatUserRole, USER_ROLES, type UserRole } from '../domain/values/userRole';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Display name is required'),
  role: z.enum(USER_ROLES),
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal(''))
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

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
    avatarUrl: ''
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [registerFeedback, setRegisterFeedback] = useState<string | null>(null);

  const [changePasswordValues, setChangePasswordValues] = useState<ChangePasswordFormValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePasswordErrors, setChangePasswordErrors] = useState<Record<string, string>>({});
  const [changePasswordFeedback, setChangePasswordFeedback] = useState<string | null>(null);

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

    const { confirmPassword, ...rest } = registerValues;
    const payload = {
      ...rest,
      avatarUrl: rest.avatarUrl.trim() || undefined
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
      newPassword: changePasswordValues.newPassword
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
    <form className="task-form" onSubmit={handleLogin} noValidate>
      <h3>Sign in</h3>
      <label>Email</label>
      <input
        type="email"
        value={loginValues.email}
        onChange={(event) => setLoginValues((prev) => ({ ...prev, email: event.target.value }))}
        required
      />
      {loginErrors.email && <p className="task-form__error">{loginErrors.email}</p>}
      <label>Password</label>
      <input
        type="password"
        value={loginValues.password}
        onChange={(event) => setLoginValues((prev) => ({ ...prev, password: event.target.value }))}
        required
      />
      {loginErrors.password && <p className="task-form__error">{loginErrors.password}</p>}
      <button type="submit" disabled={isLoading}>
        Sign in
      </button>
      {loginFeedback && <p className="task-form__feedback">{loginFeedback}</p>}
    </form>
  );

  const registerForm = (
    <form className="task-form" onSubmit={handleRegister} noValidate>
      <h3>Create account</h3>
      <label>Display name</label>
      <input
        value={registerValues.displayName}
        onChange={(event) =>
          setRegisterValues((prev) => ({ ...prev, displayName: event.target.value }))
        }
        required
      />
      {registerErrors.displayName && <p className="task-form__error">{registerErrors.displayName}</p>}
      <label>Email</label>
      <input
        type="email"
        value={registerValues.email}
        onChange={(event) => setRegisterValues((prev) => ({ ...prev, email: event.target.value }))}
        required
      />
      {registerErrors.email && <p className="task-form__error">{registerErrors.email}</p>}
      <label>Role</label>
          <select
            value={registerValues.role}
            onChange={(event) =>
              setRegisterValues((prev) => ({ ...prev, role: event.target.value as UserRole }))
            }
          >
        {USER_ROLES.map((role) => (
          <option key={role} value={role}>
            {formatUserRole(role)}
          </option>
        ))}
      </select>
      <label>Avatar URL (optional)</label>
      <input
        type="url"
        value={registerValues.avatarUrl}
        onChange={(event) => setRegisterValues((prev) => ({ ...prev, avatarUrl: event.target.value }))}
      />
      {registerErrors.avatarUrl && <p className="task-form__error">{registerErrors.avatarUrl}</p>}
      <label>Password</label>
      <input
        type="password"
        value={registerValues.password}
        onChange={(event) => setRegisterValues((prev) => ({ ...prev, password: event.target.value }))}
        required
      />
      {registerErrors.password && <p className="task-form__error">{registerErrors.password}</p>}
      <label>Confirm password</label>
      <input
        type="password"
        value={registerValues.confirmPassword}
        onChange={(event) => setRegisterValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
        required
      />
      {registerErrors.confirmPassword && (
        <p className="task-form__error">{registerErrors.confirmPassword}</p>
      )}
      <button type="submit" disabled={isLoading}>
        Register
      </button>
      {registerFeedback && <p className="task-form__feedback">{registerFeedback}</p>}
    </form>
  );

  const changePasswordForm = (
    <form className="task-form" onSubmit={handleChangePassword} noValidate>
      <h3>Change password</h3>
      <label>Current password</label>
      <input
        type="password"
        value={changePasswordValues.currentPassword}
        onChange={(event) =>
          setChangePasswordValues((prev) => ({ ...prev, currentPassword: event.target.value }))
        }
        required
      />
      {changePasswordErrors.currentPassword && (
        <p className="task-form__error">{changePasswordErrors.currentPassword}</p>
      )}
      <label>New password</label>
      <input
        type="password"
        value={changePasswordValues.newPassword}
        onChange={(event) =>
          setChangePasswordValues((prev) => ({ ...prev, newPassword: event.target.value }))
        }
        required
      />
      {changePasswordErrors.newPassword && (
        <p className="task-form__error">{changePasswordErrors.newPassword}</p>
      )}
      <label>Confirm new password</label>
      <input
        type="password"
        value={changePasswordValues.confirmPassword}
        onChange={(event) =>
          setChangePasswordValues((prev) => ({ ...prev, confirmPassword: event.target.value }))
        }
        required
      />
      {changePasswordErrors.confirmPassword && (
        <p className="task-form__error">{changePasswordErrors.confirmPassword}</p>
      )}
      <button type="submit" disabled={isLoading}>
        Update password
      </button>
      {changePasswordFeedback && <p className="task-form__feedback">{changePasswordFeedback}</p>}
    </form>
  );

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Authentication</h2>
      </div>
      {errorMessage && <p className="task-form__error">{errorMessage}</p>}
      {!user ? (
        <div className="auth-panel__grid">
          {loginForm}
          {registerForm}
        </div>
      ) : (
        <div className="auth-panel__details">
          <p>
            Signed in as <strong>{user.displayName}</strong> ({user.email}) · role: {user.role}
          </p>
          <button type="button" className="panel__button" onClick={() => viewModel.logout()}>
            Logout
          </button>
          {changePasswordForm}
        </div>
      )}
    </section>
  );
}

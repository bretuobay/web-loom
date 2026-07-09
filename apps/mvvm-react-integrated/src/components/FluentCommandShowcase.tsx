import '../styles/FluentCommandShowcase.css';

import { Command } from '@web-loom/mvvm-core';
import { computed, signal, type WritableSignal } from '@web-loom/signals-core';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useSignal } from '../hooks/useSignal';

const FluentCommandShowcase = () => {
  const username$ = useMemo(() => signal(''), []);
  const email$ = useMemo(() => signal(''), []);
  const password$ = useMemo(() => signal(''), []);
  const acceptedPolicy$ = useMemo(() => signal(false), []);
  const validationReset$ = useMemo(() => signal(0), []);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const emailValid$ = useMemo(() => computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email$.get())), [email$]);

  const registerCommand = useMemo(() => {
    const command = new Command(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    })
      .observesProperty(username$)
      .observesProperty(password$)
      .observesCanExecute(emailValid$)
      .observesCanExecute(acceptedPolicy$)
      .observesCanExecute(() => validationReset$.get() >= 0);

    return command;
  }, [acceptedPolicy$, emailValid$, password$, username$, validationReset$]);

  useEffect(() => {
    return () => {
      registerCommand.dispose();
    };
  }, [registerCommand]);

  const canSubmit = useSignal(registerCommand.canExecute$);
  const isSubmitting = useSignal(registerCommand.isExecuting$);

  const usernameValue = username;
  const emailValue = email;
  const passwordValue = password;
  const acceptedPolicyValue = acceptedPolicy;

  const raiseCanExecute = () => {
    registerCommand.raiseCanExecuteChanged();
  };

  const handleInput =
    (field: WritableSignal<string>, setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setter(value);
      field.set(value);
      raiseCanExecute();
    };

  const handleCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setAcceptedPolicy(checked);
    acceptedPolicy$.set(checked);
    raiseCanExecute();
  };

  const handleResetValidation = () => {
    validationReset$.update((value) => value + 1);
    registerCommand.raiseCanExecuteChanged();
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    const username = usernameValue;
    const email = emailValue;
    await registerCommand.execute();
    alert(`Registered ${username} (${email})`);
  };

  return (
    <div className="fluent-command-showcase">
      <header className="fluent-command-showcase__header">
        <p className="fluent-command-showcase__eyebrow">MVVM Core Pattern</p>
        <h3>Fluent Command Guardrail</h3>
        <p>Watch the submit button enable only when every reactive rule is satisfied.</p>
      </header>

      <div className="fluent-command-showcase__form">
        <label>
          Username
          <input value={usernameValue} onChange={handleInput(username$, setUsername)} />
        </label>
        <label>
          Email
          <input value={emailValue} onChange={handleInput(email$, setEmail)} />
        </label>
        <label>
          Password
          <input type="password" value={passwordValue} onChange={handleInput(password$, setPassword)} />
        </label>

        <label className="fluent-command-showcase__checkbox">
          <input type="checkbox" checked={acceptedPolicyValue} onChange={handleCheckbox} />
          Accept policy
        </label>

        <div className="fluent-command-showcase__actions">
          <button
            className="fluent-command-showcase__button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit form'}
          </button>
          <button className="fluent-command-showcase__link-button" onClick={handleResetValidation}>
            Reset validation
          </button>
        </div>
      </div>

      <div className="fluent-command-showcase__status">
        <p>
          Command states: <strong>{canSubmit ? 'Can execute' : 'Waiting on validation'}</strong>
        </p>
        <p>
          Observed Fields: username {usernameValue ? '✔' : '•'}, email {emailValue ? '✔' : '•'}, password{' '}
          {passwordValue ? '✔' : '•'}
        </p>
        <p>Policy accepted: {acceptedPolicyValue ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default FluentCommandShowcase;

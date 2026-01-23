import '../styles/FluentCommandShowcase.css';

import { Command } from '@web-loom/mvvm-core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useObservable } from '../hooks/useObservable';

const FluentCommandShowcase = () => {
  const username$ = useMemo(() => new BehaviorSubject(''), []);
  const email$ = useMemo(() => new BehaviorSubject(''), []);
  const password$ = useMemo(() => new BehaviorSubject(''), []);
  const acceptedPolicy$ = useMemo(() => new BehaviorSubject(false), []);
  const validationReset$ = useMemo(() => new BehaviorSubject(0), []);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const emailValid$ = useMemo(() => email$.pipe(map((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))), [email$]);

  const registerCommand = useMemo(() => {
    const command = new Command(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    })
      .observesProperty(username$)
      .observesProperty(password$)
      .observesCanExecute(emailValid$)
      .observesCanExecute(acceptedPolicy$)
      .observesCanExecute(validationReset$.pipe(map(() => true)));

    return command;
  }, [acceptedPolicy$, emailValid$, password$, username$, validationReset$]);

  useEffect(() => {
    return () => {
      registerCommand.dispose();
      username$.complete();
      email$.complete();
      password$.complete();
      acceptedPolicy$.complete();
      validationReset$.complete();
    };
  }, [acceptedPolicy$, email$, registerCommand, password$, username$, validationReset$]);

  const canSubmit = useObservable(registerCommand.canExecute$, false);
  const isSubmitting = useObservable(registerCommand.isExecuting$, false);

  const usernameValue = username;
  const emailValue = email;
  const passwordValue = password;
  const acceptedPolicyValue = acceptedPolicy;

  const raiseCanExecute = () => {
    registerCommand.raiseCanExecuteChanged();
  };

  const handleInput =
    (subject: BehaviorSubject<string>, setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setter(value);
      subject.next(value);
      raiseCanExecute();
    };

  const handleCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setAcceptedPolicy(checked);
    acceptedPolicy$.next(checked);
    raiseCanExecute();
  };

  const handleResetValidation = () => {
    validationReset$.next(validationReset$.value + 1);
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

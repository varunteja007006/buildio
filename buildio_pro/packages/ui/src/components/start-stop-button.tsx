'use client';

import * as React from 'react';
import { PlayIcon, SquareIcon } from 'lucide-react';

import {
  RippleButton,
  type RippleButtonProps,
  RippleButtonRipples,
} from '@workspace/ui/components/animate-ui/components/buttons/ripple';
import { Spinner } from '@workspace/ui/components/spinner';
import { cn } from '@workspace/ui/lib/utils';

type StartStopButtonProps = Omit<RippleButtonProps, 'asChild' | 'children'> & {
  /**
   * Whether the tracked activity is running. Controls which label, icon and
   * variant the button shows: inactive renders the start state, active the
   * stop state.
   */
  active?: boolean;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Label of the start state. */
  startLabel?: React.ReactNode;
  /** Label of the stop state. */
  stopLabel?: React.ReactNode;
  /** Variant of the start state. */
  startVariant?: RippleButtonProps['variant'];
  /** Variant of the stop state. */
  stopVariant?: RippleButtonProps['variant'];
  /** Overrides the state label entirely (icons stay). */
  children?: React.ReactNode;
};

function StartStopButton({
  active = false,
  loading = false,
  startLabel = 'Start',
  stopLabel = 'Stop',
  startVariant = 'default',
  stopVariant = 'destructive',
  variant,
  className,
  children,
  disabled,
  ...props
}: StartStopButtonProps) {
  return (
    <RippleButton
      variant={variant ?? (active ? stopVariant : startVariant)}
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading ? <Spinner /> : active ? <SquareIcon /> : <PlayIcon />}
      {children ?? (active ? stopLabel : startLabel)}
      <RippleButtonRipples />
    </RippleButton>
  );
}

export { StartStopButton, type StartStopButtonProps };

'use client';

import { Progress as ProgressPrimitives } from '@base-ui/react/progress';
import { getStrictContext } from '@workspace/ui/lib/get-strict-context';
import { motion, type MotionProps } from 'motion/react';
import * as React from 'react';

import {
  CountingNumber,
  type CountingNumberProps,
} from '@workspace/ui/components/animate-ui/primitives/texts/counting-number';


type ProgressContextType = {
  value: number;
};

const [ProgressProvider, useProgress] =
  getStrictContext<ProgressContextType>('ProgressContext');

type ProgressProps = React.ComponentProps<typeof ProgressPrimitives.Root>;

const Progress = (props: ProgressProps) => {
  return (
    <ProgressProvider value={{ value: props.value ?? 0 }}>
      <ProgressPrimitives.Root data-slot="progress" {...props} />
    </ProgressProvider>
  );
};

type ProgressIndicatorProps = React.ComponentProps<
  typeof MotionProgressIndicator
>;

const MotionProgressIndicator = motion.create(
  ProgressPrimitives.Indicator,
) as React.ComponentType<
  React.ComponentProps<typeof ProgressPrimitives.Indicator> & MotionProps
>;

function ProgressIndicator({
  transition = { type: 'spring', stiffness: 100, damping: 30 },
  ...props
}: ProgressIndicatorProps) {
  const { value } = useProgress();

  return (
    <MotionProgressIndicator
      data-slot="progress-indicator"
      animate={{ width: `${value}%` }}
      transition={transition}
      {...props}
    />
  );
}

type ProgressTrackProps = React.ComponentProps<typeof ProgressPrimitives.Track>;

function ProgressTrack(props: ProgressTrackProps) {
  return <ProgressPrimitives.Track data-slot="progress-track" {...props} />;
}

type ProgressLabelProps = React.ComponentProps<typeof ProgressPrimitives.Label>;

function ProgressLabel(props: ProgressLabelProps) {
  return <ProgressPrimitives.Label data-slot="progress-label" {...props} />;
}

type ProgressValueProps = Omit<
  React.ComponentProps<typeof ProgressPrimitives.Value>,
  'render'
> &
  Omit<CountingNumberProps, 'number'>;

function ProgressValue({
  transition = { stiffness: 80, damping: 20 },
  ...props
}: ProgressValueProps) {
  const { value } = useProgress();

  return (
    <ProgressPrimitives.Value
      data-slot="progress-value"
      render={
        <CountingNumber
          number={value ?? 0}
          transition={transition}
          {...props}
        />
      }
    />
  );
}

export {
  Progress,
  ProgressIndicator,
  ProgressTrack,
  ProgressLabel,
  ProgressValue,
  useProgress,
  type ProgressProps,
  type ProgressIndicatorProps,
  type ProgressTrackProps,
  type ProgressLabelProps,
  type ProgressValueProps,
  type ProgressContextType,
};

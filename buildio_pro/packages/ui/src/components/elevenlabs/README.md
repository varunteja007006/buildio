# ElevenLabs UI

Install reusable ElevenLabs components here, separately from the shared shadcn and Dice UI components:

```bash
cd packages/ui
pnpm dlx shadcn@latest add @elevenlabs/orb --path src/components/elevenlabs
```

Replace `orb` with a component name from the [ElevenLabs UI catalog](https://ui.elevenlabs.io/docs/components). Import installed components through `@workspace/ui/components/elevenlabs/<name>`.

`bar-visualizer` is included here with its audio-analysis hooks and types. Its source is from [ElevenLabs UI](https://github.com/elevenlabs/ui), licensed under MIT.

Install reusable components individually; the ElevenLabs `all` bundle also includes app pages, blocks, and examples that do not belong in this shared package.

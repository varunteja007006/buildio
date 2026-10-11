import { useEffect, useMemo, useRef, useState } from "react"

export interface AudioAnalyserOptions {
  fftSize?: number
  smoothingTimeConstant?: number
  minDecibels?: number
  maxDecibels?: number
}

function createAudioAnalyser(
  mediaStream: MediaStream,
  options: AudioAnalyserOptions = {}
) {
  const audioContext = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)()
  const source = audioContext.createMediaStreamSource(mediaStream)
  const analyser = audioContext.createAnalyser()

  if (options.fftSize) analyser.fftSize = options.fftSize
  if (options.smoothingTimeConstant !== undefined) {
    analyser.smoothingTimeConstant = options.smoothingTimeConstant
  }
  if (options.minDecibels !== undefined) {
    analyser.minDecibels = options.minDecibels
  }
  if (options.maxDecibels !== undefined) {
    analyser.maxDecibels = options.maxDecibels
  }

  source.connect(analyser)

  return {
    analyser,
    cleanup: () => {
      source.disconnect()
      void audioContext.close()
    },
  }
}

export function useAudioVolume(
  mediaStream?: MediaStream | null,
  options: AudioAnalyserOptions = { fftSize: 32, smoothingTimeConstant: 0 }
) {
  const [volume, setVolume] = useState(0)
  const volumeRef = useRef(0)
  const frameId = useRef<number | undefined>(undefined)
  const memoizedOptions = useMemo(() => options, [
    options.fftSize,
    options.smoothingTimeConstant,
    options.minDecibels,
    options.maxDecibels,
  ])

  useEffect(() => {
    if (!mediaStream) {
      setVolume(0)
      volumeRef.current = 0
      return
    }

    const { analyser, cleanup } = createAudioAnalyser(
      mediaStream,
      memoizedOptions
    )
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let lastUpdate = 0

    const updateVolume = (timestamp: number) => {
      if (timestamp - lastUpdate >= 1000 / 30) {
        analyser.getByteFrequencyData(dataArray)
        const sum = dataArray.reduce((total, value) => total + value * value, 0)
        const nextVolume = Math.sqrt(sum / dataArray.length) / 255

        if (Math.abs(nextVolume - volumeRef.current) > 0.01) {
          volumeRef.current = nextVolume
          setVolume(nextVolume)
        }
        lastUpdate = timestamp
      }
      frameId.current = requestAnimationFrame(updateVolume)
    }

    frameId.current = requestAnimationFrame(updateVolume)
    return () => {
      cleanup()
      if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
    }
  }, [mediaStream, memoizedOptions])

  return volume
}

export interface MultiBandVolumeOptions {
  bands?: number
  loPass?: number
  hiPass?: number
  updateInterval?: number
  analyserOptions?: AudioAnalyserOptions
}

const multibandDefaults: MultiBandVolumeOptions = {
  bands: 5,
  loPass: 100,
  hiPass: 600,
  updateInterval: 32,
  analyserOptions: { fftSize: 2048 },
}

const normalizeDb = (value: number) => {
  if (value === -Infinity) return 0
  const db = 1 - (Math.max(-100, Math.min(-10, value)) * -1) / 100
  return Math.sqrt(db)
}

export function useMultibandVolume(
  mediaStream?: MediaStream | null,
  options: MultiBandVolumeOptions = {}
) {
  const opts = useMemo(() => ({ ...multibandDefaults, ...options }), [
    options.bands,
    options.loPass,
    options.hiPass,
    options.updateInterval,
    options.analyserOptions?.fftSize,
    options.analyserOptions?.smoothingTimeConstant,
    options.analyserOptions?.minDecibels,
    options.analyserOptions?.maxDecibels,
  ])
  const bandCount = opts.bands ?? 5
  const loPass = opts.loPass ?? 100
  const hiPass = opts.hiPass ?? 600
  const updateInterval = opts.updateInterval ?? 32
  const [frequencyBands, setFrequencyBands] = useState<number[]>(() =>
    new Array<number>(bandCount).fill(0)
  )
  const bandsRef = useRef<number[]>(new Array<number>(bandCount).fill(0))
  const frameId = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!mediaStream) {
      const emptyBands = new Array<number>(bandCount).fill(0)
      setFrequencyBands(emptyBands)
      bandsRef.current = emptyBands
      return
    }

    const { analyser, cleanup } = createAudioAnalyser(
      mediaStream,
      opts.analyserOptions
    )
    const dataArray = new Float32Array(analyser.frequencyBinCount)
    const chunkSize = Math.ceil((hiPass - loPass) / bandCount)
    let lastUpdate = 0

    const updateVolume = (timestamp: number) => {
      if (timestamp - lastUpdate >= updateInterval) {
        analyser.getFloatFrequencyData(dataArray)
        const chunks = new Array<number>(bandCount)

        for (let band = 0; band < bandCount; band++) {
          const start = loPass + band * chunkSize
          const end = Math.min(loPass + (band + 1) * chunkSize, hiPass)
          let sum = 0
          for (let index = start; index < end; index++) {
            sum += normalizeDb(dataArray[index] ?? -Infinity)
          }
          chunks[band] = end > start ? sum / (end - start) : 0
        }

        if (
          chunks.some(
            (value, index) =>
              Math.abs(value - (bandsRef.current[index] ?? 0)) > 0.01
          )
        ) {
          bandsRef.current = chunks
          setFrequencyBands(chunks)
        }
        lastUpdate = timestamp
      }
      frameId.current = requestAnimationFrame(updateVolume)
    }

    frameId.current = requestAnimationFrame(updateVolume)
    return () => {
      cleanup()
      if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
    }
  }, [mediaStream, opts, bandCount, loPass, hiPass, updateInterval])

  return frequencyBands
}

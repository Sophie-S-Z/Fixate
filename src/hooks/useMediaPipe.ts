'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RawWindowMetrics } from '@/lib/types'

interface UseMediaPipeReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isLoading: boolean
  isReady: boolean
  error: string | null
  liveBlinkRate: number      // rolling estimate, updates every 3s
  liveEAR: number            // current eye aspect ratio (0–1)
  trackingState: 'idle' | 'loading' | 'ready' | 'paused' | 'lost' | 'error'
  onWindowComplete: (cb: (metrics: RawWindowMetrics) => void) => void
  flush: () => void          // emit the final partial window before stopping
}

function calcEAR(lm: { x: number; y: number; z: number }[], idx: number[]) {
  const [p1, p2, p3, p4, p5, p6] = idx.map((i) => lm[i])
  const v1 = Math.hypot(p2.x - p6.x, p2.y - p6.y)
  const v2 = Math.hypot(p3.x - p5.x, p3.y - p5.y)
  const h  = Math.hypot(p1.x - p4.x, p1.y - p4.y)
  return h === 0 ? 0 : (v1 + v2) / (2 * h)
}

// MediaPipe 478-landmark face mesh eye indices
const LEFT_EYE  = [362, 385, 387, 263, 373, 380]
const RIGHT_EYE = [33,  160, 158, 133, 153, 144]
const LEFT_IRIS  = [468, 469, 470, 471, 472]
const RIGHT_IRIS = [473, 474, 475, 476, 477]

// Blink is confirmed when EAR stays below this for ≥2 consecutive frames (~30ms)
const BLINK_EAR_THRESHOLD = 0.22

export function useMediaPipe(started: boolean): UseMediaPipeReturn {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady,   setIsReady]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [liveBlinkRate, setLiveBlinkRate] = useState(0)
  const [liveEAR,       setLiveEAR]       = useState(1)
  const [trackingState, setTrackingState] = useState<
    'idle' | 'loading' | 'ready' | 'paused' | 'lost' | 'error'
  >('idle')

  const windowCallbackRef = useRef<((m: RawWindowMetrics) => void) | null>(null)
  const onWindowComplete = useCallback((cb: (m: RawWindowMetrics) => void) => {
    windowCallbackRef.current = cb
  }, [])

  // Emit whatever has accumulated since the last 60s boundary as a final window.
  // Without this, any session under a minute (or the tail of any session) is lost.
  // Counts are scaled to a per-minute rate so a short tail scores like a full window.
  const flush = useCallback(() => {
    const elapsedSec = (Date.now() - windowStartMsRef.current) / 1000
    if (elapsedSec < 5 || pupilSamplesRef.current.length === 0) return
    const factor = 60 / elapsedSec
    const quality: 'good' | 'degraded' | 'lost' =
      noFaceFramesRef.current >= 50 ? 'lost' : 'good'

    windowCallbackRef.current?.({
      windowStart: windowStartISORef.current,
      blinkCount: Math.round(blinkCountRef.current * factor),
      fixationEvents: Math.round(fixationCountRef.current * factor),
      pupilRadiusSamples: [...pupilSamplesRef.current],
      trackingQuality: quality,
    })

    blinkCountRef.current = 0
    fixationCountRef.current = 0
    pupilSamplesRef.current = []
    windowStartISORef.current = new Date().toISOString()
    windowStartMsRef.current = Date.now()
  }, [])

  // Accumulation refs — mutated in rAF loop, no re-renders
  const blinkCountRef        = useRef(0)
  const fixationCountRef     = useRef(0)
  const pupilSamplesRef      = useRef<number[]>([])
  const windowStartISORef    = useRef(new Date().toISOString())
  const windowStartMsRef     = useRef(Date.now())
  const prevEARRef           = useRef(1)
  const lowEARFramesRef      = useRef(0)
  const prevGazeRef          = useRef<[number, number, number]>([0, 0, 0])
  const fixationFramesRef    = useRef(0)
  const noFaceFramesRef      = useRef(0)
  const animFrameRef         = useRef(0)
  const faceLandmarkerRef    = useRef<unknown>(null)

  useEffect(() => {
    if (!started) return

    let stream: MediaStream | null = null
    let windowInterval:   ReturnType<typeof setInterval> | null = null
    let blinkRateInterval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    async function init() {
      setIsLoading(true)
      setTrackingState('loading')

      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
        })

        if (cancelled) { landmarker.close(); return }

        faceLandmarkerRef.current = landmarker

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        // Wait up to 2s for the video element to render (React may not have committed yet)
        let waited = 0
        while (!videoRef.current && waited < 2000) {
          await new Promise(r => setTimeout(r, 50))
          waited += 50
        }
        if (!videoRef.current) {
          stream.getTracks().forEach(t => t.stop())
          throw new Error('Camera initialised but video element never appeared in the DOM.')
        }

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        setIsLoading(false)
        setIsReady(true)
        setTrackingState('ready')
        windowStartMsRef.current  = Date.now()
        windowStartISORef.current = new Date().toISOString()

        // ── Detection loop ────────────────────────────────────────────
        function detect() {
          if (cancelled) return
          const video = videoRef.current
          if (!video || !faceLandmarkerRef.current) {
            animFrameRef.current = requestAnimationFrame(detect)
            return
          }
          if (video.readyState < 2) {
            animFrameRef.current = requestAnimationFrame(detect)
            return
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (faceLandmarkerRef.current as any).detectForVideo(
            video,
            performance.now()
          )
          const lm = result?.faceLandmarks?.[0]

          if (!lm || lm.length < 478) {
            noFaceFramesRef.current += 1
            if (noFaceFramesRef.current >= 50) setTrackingState('paused')
            animFrameRef.current = requestAnimationFrame(detect)
            return
          }

          noFaceFramesRef.current = 0
          setTrackingState('ready')

          // EAR blink detection
          const ear = (calcEAR(lm, LEFT_EYE) + calcEAR(lm, RIGHT_EYE)) / 2
          setLiveEAR(ear)

          if (ear < BLINK_EAR_THRESHOLD) {
            lowEARFramesRef.current += 1
          } else {
            // Transition eye-open: count blink if we had ≥2 low frames
            if (lowEARFramesRef.current >= 2) {
              blinkCountRef.current += 1
            }
            lowEARFramesRef.current = 0
          }
          prevEARRef.current = ear

          // Pupil radius
          const lIris = lm[LEFT_IRIS[0]],  lEdge = lm[LEFT_IRIS[1]]
          const rIris = lm[RIGHT_IRIS[0]], rEdge = lm[RIGHT_IRIS[1]]
          const avgRadius =
            (Math.hypot(lIris.x - lEdge.x, lIris.y - lEdge.y) +
             Math.hypot(rIris.x - rEdge.x, rIris.y - rEdge.y)) / 2
          pupilSamplesRef.current.push(avgRadius)

          // Gaze fixation
          const nose  = lm[4]
          const gaze: [number, number, number] = [nose.x, nose.y, nose.z]
          const delta = Math.hypot(gaze[0] - prevGazeRef.current[0], gaze[1] - prevGazeRef.current[1])
          if (delta < 0.05) {
            fixationFramesRef.current += 1
          } else {
            if (fixationFramesRef.current >= 2) fixationCountRef.current += 1
            fixationFramesRef.current = 0
          }
          prevGazeRef.current = gaze

          animFrameRef.current = requestAnimationFrame(detect)
        }

        animFrameRef.current = requestAnimationFrame(detect)

        // ── Live blink rate — updates every 3s ────────────────────────
        blinkRateInterval = setInterval(() => {
          const elapsedMin = (Date.now() - windowStartMsRef.current) / 60_000
          if (elapsedMin > 0.05) {
            setLiveBlinkRate(Math.round(blinkCountRef.current / elapsedMin))
          }
        }, 3_000)

        // ── 60s FocusWindow emission ──────────────────────────────────
        windowInterval = setInterval(() => {
          const quality: 'good' | 'degraded' | 'lost' =
            noFaceFramesRef.current >= 50 ? 'lost' : 'good'

          windowCallbackRef.current?.({
            windowStart: windowStartISORef.current,
            blinkCount: blinkCountRef.current,
            fixationEvents: fixationCountRef.current,
            pupilRadiusSamples: [...pupilSamplesRef.current],
            trackingQuality: quality,
          })

          // Reset window accumulators
          blinkCountRef.current     = 0
          fixationCountRef.current  = 0
          pupilSamplesRef.current   = []
          windowStartISORef.current = new Date().toISOString()
          windowStartMsRef.current  = Date.now()
        }, 60_000)

      } catch (err) {
        if (cancelled) return
        console.error('MediaPipe init error:', err)
        setError(err instanceof Error ? err.message : 'Camera or model init failed')
        setTrackingState('error')
        setIsLoading(false)
      }
    }

    init()

    return () => {
      cancelled = true
      if (animFrameRef.current)  cancelAnimationFrame(animFrameRef.current)
      if (windowInterval)        clearInterval(windowInterval)
      if (blinkRateInterval)     clearInterval(blinkRateInterval)
      if (stream)                stream.getTracks().forEach(t => t.stop())
      try { (faceLandmarkerRef.current as any)?.close?.() } catch {} // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [started])

  return {
    videoRef,
    isLoading,
    isReady,
    error,
    liveBlinkRate,
    liveEAR,
    trackingState,
    onWindowComplete,
    flush,
  }
}

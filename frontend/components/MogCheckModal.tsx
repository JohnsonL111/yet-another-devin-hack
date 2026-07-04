'use client';

import { useEffect, useRef, useState } from 'react';
import { formatMs } from '@/lib/utils';

interface Props {
  checkId: string;
  fromUsername: string;
  expiresAt: number;
  onSubmit: (checkId: string, photoBase64: string) => void;
  onFail: (checkId: string) => void;
}

export default function MogCheckModal({ checkId, fromUsername, expiresAt, onSubmit, onFail }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const failedRef = useRef(false);

  const [remaining, setRemaining] = useState(expiresAt - Date.now());
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);

  // Keep a stable ref to the latest onFail/checkId so effects never need them as deps.
  // This is the key fix: nothing in here changes on re-renders, so effects run exactly once.
  const failCallbackRef = useRef({ checkId, onFail });
  useEffect(() => {
    failCallbackRef.current = { checkId, onFail };
  });

  function doFail() {
    if (failedRef.current) return;
    failedRef.current = true;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    failCallbackRef.current.onFail(failCallbackRef.current.checkId);
  }

  // Start webcam — runs exactly ONCE on mount.
  // Do NOT list doFail or any prop as a dep; use failCallbackRef instead.
  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // autoPlay on the element handles play(); calling .play() manually here
          // races with autoPlay and causes the AbortError — so we don't call it.
        }
        setCameraReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCameraError(true);
        // Give the error UI 2 seconds to render before auto-failing
        setTimeout(() => doFail(), 2000);
      });

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally empty: runs once

  // Countdown — expiresAt is a number that never changes for a given modal instance
  useEffect(() => {
    const interval = setInterval(() => {
      const r = expiresAt - Date.now();
      setRemaining(Math.max(0, r));
      if (r <= 0) {
        clearInterval(interval);
        doFail();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [expiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Guard: video must have real dimensions (stream fully loaded)
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    setCaptured(dataUrl);

    // Stop the live stream now that we have the photo
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function confirmPhoto() {
    if (!captured) return;
    onSubmit(checkId, captured);
  }

  function retake() {
    setCaptured(null);
    setCameraReady(false);
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Again: no manual .play() — autoPlay handles it
        }
        setCameraReady(true);
      })
      .catch(() => {
        setCameraError(true);
        setTimeout(() => doFail(), 2000);
      });
  }

  const pct = Math.max(0, (remaining / 60000) * 100);
  const urgent = remaining < 15000;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className={`glass rounded-3xl p-8 w-full max-w-lg mx-4 fade-in ${urgent ? 'glow-red shake' : 'glow-yellow'}`}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🚨</div>
          <h2 className="text-3xl font-black text-red-400 mb-1">MOG CHECK</h2>
          <p className="text-gray-300">
            <span className="text-yellow-300 font-bold">{fromUsername}</span> suspects you&apos;re doomscrolling.
          </p>
          <p className="text-gray-500 text-sm">Prove you&apos;re actually studying.</p>
        </div>

        {/* Countdown bar */}
        <div className="relative mb-6">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${urgent ? 'bg-red-500' : 'bg-yellow-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={`text-center mt-2 text-2xl font-black font-mono ${urgent ? 'text-red-400' : 'text-yellow-300'}`}>
            {formatMs(remaining)}
          </div>
        </div>

        {cameraError ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">📵</div>
            <p className="text-red-400 font-semibold">No camera detected — auto-failing...</p>
            <p className="text-gray-500 text-sm mt-1">Caught lacking. No excuses.</p>
          </div>
        ) : (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-black mb-4" style={{ aspectRatio: '16/9' }}>
              {captured ? (
                <img src={captured} alt="captured" className="w-full h-full object-cover" />
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              )}
              {!cameraReady && !captured && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-gray-400 text-sm">⏳ Loading camera...</div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3">
              {!captured ? (
                <>
                  <button
                    className="btn btn-success flex-1 justify-center py-3"
                    onClick={takePhoto}
                    disabled={!cameraReady}
                  >
                    📸 Take Photo
                  </button>
                  <button className="btn btn-danger px-5" onClick={() => doFail()}>
                    ✕ Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-success flex-1 justify-center py-3" onClick={confirmPhoto}>
                    ✅ Submit Proof
                  </button>
                  <button className="btn btn-ghost px-5" onClick={retake}>
                    🔄 Retake
                  </button>
                </>
              )}
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-600 mt-3">Cancel = instant fail. No mercy.</p>
      </div>
    </div>
  );
}

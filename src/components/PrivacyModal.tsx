'use client'

interface PrivacyModalProps {
  onAccept: () => void
}

export function PrivacyModal({ onAccept }: PrivacyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-white/[0.08] rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">👁️</span>
          <div>
            <h2 className="font-sora text-xl font-bold text-[#e6edf3]">
              Fixate sees your eyes, not your face.
            </h2>
          </div>
        </div>

        <p className="text-[#b9c2cd] text-sm leading-relaxed mb-5">
          All tracking runs in your browser using WebAssembly — your camera feed
          never leaves your device. The only numbers sent to our servers are:
        </p>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5 space-y-2">
          {[
            ['Blink rate', 'blinks per minute — a number, not an image'],
            ['Fixation count', 'how often your gaze pauses per minute'],
            ['Pupil variance', 'a normalized float, nothing identifiable'],
            ['Strain score', 'a 0–100 composite of the above three'],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="text-[#3fb950] font-bold text-sm mt-0.5">✓</span>
              <div>
                <span className="text-sm font-semibold text-[#e6edf3]">
                  {title}
                </span>
                <span className="text-sm text-[#7d8694]"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[#7d8694] text-xs mb-6">
          No images. No video. Nothing that could identify you visually. Your
          session data is protected by row-level security — only you can access
          it.
        </p>

        <button
          onClick={onAccept}
          className="w-full py-3 bg-[#a5d6ff] hover:bg-[#8fc8ff] text-[#0d1117] font-semibold rounded-xl transition-colors text-sm"
        >
          Allow camera access &amp; start tracking
        </button>
      </div>
    </div>
  )
}

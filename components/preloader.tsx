"use client"

import { useEffect, useState } from "react"

export function Preloader() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Add a minimum display time for the preloader
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      style={{
        animationName: "fadeOut",
        animationDuration: "0.6s",
        animationTimingFunction: "ease-out",
        animationDelay: "1.4s",
        animationFillMode: "forwards",
      }}
    >
      <style>{`
        @keyframes fadeOut {
          from {
            opacity: 1;
            visibility: visible;
          }
          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes spin-custom {
          0% {
            transform: rotate(0deg);
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dashoffset: 50;
          }
          100% {
            transform: rotate(360deg);
            stroke-dashoffset: 100;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 2px rgba(212, 175, 55, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.6));
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        .preloader-spinner {
          animation: spin-custom 2s linear infinite;
        }

        .preloader-circle {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-6">
        {/* Main SVG Spinner */}
        <div className="relative w-24 h-24">
          <svg
            className="preloader-spinner absolute inset-0"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Gold Ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#goldGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              opacity="0.3"
            />

            {/* Inner Blue Ring */}
            <circle
              cx="50"
              cy="50"
              r="35"
              stroke="url(#blueGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              opacity="0.5"
            />

            {/* Animated Center Circle */}
            <circle
              cx="50"
              cy="50"
              r="25"
              stroke="url(#goldGradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="50"
              opacity="0.8"
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="1" />
                <stop offset="100%" stopColor="#F3D166" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1F3A70" stopOpacity="1" />
                <stop offset="100%" stopColor="#4A6FA5" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Pulsing outer circle */}
          <div
            className="preloader-circle absolute inset-0 border-2 border-primary/20 rounded-full"
            style={{
              transform: "scale(1.1)",
            }}
          />
        </div>

        {/* Text with animation */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">
            <span className="inline-block">W</span>
            <span
              className="inline-block"
              style={{
                animationName: "pulse",
                animationDuration: "1.5s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: "0.1s",
              }}
            >
              e
            </span>
            <span
              className="inline-block"
              style={{
                animationName: "pulse",
                animationDuration: "1.5s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: "0.2s",
              }}
            >
              l
            </span>
            <span
              className="inline-block"
              style={{
                animationName: "pulse",
                animationDuration: "1.5s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: "0.3s",
              }}
            >
              c
            </span>
            <span
              className="inline-block"
              style={{
                animationName: "pulse",
                animationDuration: "1.5s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: "0.4s",
              }}
            >
              o
            </span>
            <span
              className="inline-block"
              style={{
                animationName: "pulse",
                animationDuration: "1.5s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: "0.5s",
              }}
            >
              m
            </span>
            <span
              className="inline-block"
              style={{
                animationName: "pulse",
                animationDuration: "1.5s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDelay: "0.6s",
              }}
            >
              e
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Loading Pastor Evelyn Joshua's ministry portal</p>
        </div>
      </div>
    </div>
  )
}

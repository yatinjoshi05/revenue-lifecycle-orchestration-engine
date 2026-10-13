import type { SVGProps } from "react";

export function CogLoopIcon({
  size = 16,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        {/* Center Hub */}
        <path d="M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z" />

        {/* Outer Cog Teeth - fully visible at all times to prevent '0' or 'O' appearance */}
        <g>
          <animateTransform
            attributeName="transform"
            dur="24s"
            repeatCount="indefinite"
            type="rotate"
            values="0 12 12;360 12 12"
          />
          {/* Tooth 1 */}
          <path d="M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83l2.63-1.06l1.56 2.7l-2.22 1.75c0.1 0.45 0.15 0.93 0.15 1.41" />
          {/* Tooth 2 */}
          <path d="M18.5 11.99c0.01 0.47-0.04 0.95-0.15 1.4l2.23 1.75l-1.56 2.7l-2.63-1.05c-0.34 0.31-0.73 0.59-1.15 0.83" />
          {/* Tooth 3 */}
          <path d="M15.26 17.62c-0.4 0.24-0.84 0.44-1.29 0.57l-0.4 2.81h-3.12l-0.41-2.8c-0.44-0.14-0.88-0.34-1.3-0.58" />
          {/* Tooth 4 */}
          <path d="M8.76 17.63c-0.41-0.23-0.8-0.51-1.14-0.83l-2.63 1.06l-1.56-2.7l2.22-1.75c-0.1-0.45-0.15-0.93-0.15-1.41" />
          {/* Tooth 5 */}
          <path d="M5.5 12.01c-0.01-0.47 0.04-0.95 0.15-1.4l-2.23-1.75l1.56-2.7l2.63 1.05c0.34-0.31 0.73-0.59 1.15-0.83" />
          {/* Tooth 6 */}
          <path d="M8.74 6.38c0.4-0.24 0.84-0.44 1.29-0.57l0.4-2.81h3.12l0.41 2.8c0.44 0.14 0.88 0.34 1.3 0.58" />
        </g>
      </g>
    </svg>
  );
}

export default CogLoopIcon;

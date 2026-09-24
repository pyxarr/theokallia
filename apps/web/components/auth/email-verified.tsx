export default function EmailVerified() {
  return (
    <div className="flex flex-col items-center px-2 py-4">
      {/* Short success state shown after the callback returns to the app. */}
      <div className="mb-6 animate-pulse">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* star/seal shape */}
          <path
            d="M40 4L46.5 14.5L59 10L58 23.5L70 28L63 39.5L70 51L58 55.5L59 69L46.5 64.5L40 75L33.5 64.5L21 69L22 55.5L10 51L17 39.5L10 28L22 23.5L21 10L33.5 14.5L40 4Z"
            fill="#7E22CE"
          />
          {/* checkmark */}
          <path
            d="M28 40L36 48L53 31"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        className="mb-3 text-center text-2xl font-normal"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Email verified
      </h2>

      <p
        className="mb-8 text-center text-sm leading-relaxed text-gray-500"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Your email has been verified successfully.
        <br />
        You can sign in now.
      </p>
    </div>
  )
}

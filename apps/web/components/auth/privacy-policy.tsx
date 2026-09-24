interface PrivacyPolicyProps {
  onContinue: () => void
}

export default function PrivacyPolicy({ onContinue }: PrivacyPolicyProps) {
  return (
    <div className="flex flex-col px-2">
      <h2
        className="mb-2 text-center text-3xl font-normal"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Privacy Policy
      </h2>
      <p
        className="mb-6 text-center text-sm text-gray-500"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        We value your privacy and are committed to protecting your personal information.
      </p>

      <div
        className="flex max-h-[340px] flex-col gap-5 overflow-y-auto pr-1 text-sm text-gray-600"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Information We Collect</h3>
          <p className="mb-2">We may collect:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Name and contact details</li>
            <li>Email address</li>
            <li>Shipping and billing information</li>
            <li>Payment details (processed securely)</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">How We Use Your Information</h3>
          <p className="mb-2">Your information is used to:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Process and deliver orders</li>
            <li>Improve our website and services</li>
            <li>Send updates, offers, and promotions (if you opt in)</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Data Protection</h3>
          <p>We implement appropriate security measures to protect your personal data from unauthorized access or disclosure.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Sharing of Information</h3>
          <p>We do not sell your personal information. We may share data with trusted service providers (e.g., payment and delivery services) to operate our business.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Cookies</h3>
          <p>We use cookies to enhance your browsing experience and analyze website traffic.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Your Rights</h3>
          <p>You may request access, correction, or deletion of your personal data at any time.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Updates to This Policy</h3>
          <p>We may update this policy periodically. Changes will be posted on this page.</p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="mt-6 w-full bg-purple-700 py-3.5 text-sm tracking-wide text-white transition-colors hover:bg-purple-800"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Continue
      </button>
    </div>
  )
}
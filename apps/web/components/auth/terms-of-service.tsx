interface TermsOfServiceProps {
  onContinue: () => void
}

export default function TermsOfService({ onContinue }: TermsOfServiceProps) {
  return (
    <div className="flex flex-col px-2">
      <h2
        className="mb-2 text-center text-3xl font-normal"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Term of Service
      </h2>
      <p
        className="mb-6 text-center text-sm text-gray-500"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Welcome to our website. By accessing or using our services, you agree to the following terms:
      </p>

      <div
        className="flex max-h-[340px] flex-col gap-5 overflow-y-auto pr-1 text-sm text-gray-600"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Use of Our Website</h3>
          <p>You agree to use this website only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the site.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Payments</h3>
          <p>All payments must be completed at checkout. We use secure payment providers to process transactions.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Intellectual Property</h3>
          <p>All content on this website, including images, text, and designs, is the property of our brand and may not be used without permission.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Limitation of Liability</h3>
          <p>We are not liable for any indirect or consequential damages arising from the use of our website or products.</p>
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">Changes to Terms</h3>
          <p>We may update these terms at any time. Continued use of the site means you accept the updated terms.</p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="mt-6 w-full bg-purple-700 py-3.5 text-sm tracking-wide text-white transition-colors hover:bg-purple-800"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Agree &amp; continue
      </button>
    </div>
  )
}
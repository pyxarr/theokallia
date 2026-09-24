'use client'
import { ChevronUp } from 'lucide-react'
import useBackToTop from '@/lib/hooks/use-back-to-top'

const BackToTop = () => {
  const { visible, scrollToTop } = useBackToTop()

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-8 bottom-8 z-50 bg-primary/90 p-3 text-white transition-all duration-300 hover:bg-primary/70 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ChevronUp size={20} />
    </button>
  )
}

export default BackToTop

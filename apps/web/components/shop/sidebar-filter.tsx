'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useCategories } from '@/lib/hooks/use-categories'
import { useCurrency } from '@/lib/hooks/use-currency'

// Ranges are defined in NGN — the backend filters on Product.price in NGN.
// Only the visible label is converted to the active currency.
const priceRanges: { min?: number; max?: number }[] = [
  { max: 20000 },
  { min: 20000, max: 50000 },
  { min: 50000, max: 100000 },
  { min: 100000 },
]

const sortOptions = [
  { label: 'Best sellers', value: 'best-seller' },
  { label: 'New arrivals', value: 'new-arrival' },
]

const Checkbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) => (
  <div className="flex cursor-pointer items-center gap-3" onClick={onChange}>
    <div className="flex h-4 w-4 shrink-0 items-center justify-center border border-gray-400 bg-white">
      {checked && (
        <svg
          className="h-2.5 w-2.5"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 5L4 7.5L8.5 2.5"
            stroke="#111827"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
    <span className="tracking-wide">{label}</span>
  </div>
)

const SidebarFilter = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice } = useCurrency()

  /** Builds a currency-aware label for an NGN price range. */
  const rangeLabel = ({ min, max }: { min?: number; max?: number }) => {
    if (min === undefined && max !== undefined) return `Under ${formatPrice(max)}`
    if (max === undefined && min !== undefined) return `Above ${formatPrice(min)}`
    return `${formatPrice(min ?? 0)} – ${formatPrice(max ?? 0)}`
  }
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isSuccess,
  } = useCategories()

  const activeCategorySlugs = searchParams.get('category')
    ? searchParams.get('category')!.split(',')
    : []

  const activeMinPrice = searchParams.get('minPrice')
    ? Number(searchParams.get('minPrice'))
    : undefined

  const activeMaxPrice = searchParams.get('maxPrice')
    ? Number(searchParams.get('maxPrice'))
    : undefined

  const activeSort = searchParams.get('sort') ?? undefined

  const buildUrl = (params: Record<string, string | undefined>) => {
    const current = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) {
        current.delete(key)
      } else {
        current.set(key, value)
      }
    })

    current.delete('page')
    return `/shop?${current.toString()}`
  }

  const toggleCategory = (slug: string) => {
    const next = activeCategorySlugs.includes(slug)
      ? activeCategorySlugs.filter((s) => s !== slug)
      : [...activeCategorySlugs, slug]

    router.push(
      buildUrl({ category: next.length > 0 ? next.join(',') : undefined }),
      { scroll: false }
    )
  }

  const clearCategories = () => {
    router.push(buildUrl({ category: undefined }), { scroll: false })
  }

  const togglePrice = (min: number | undefined, max: number | undefined) => {
    const isActive = activeMinPrice === min && activeMaxPrice === max
    router.push(
      buildUrl({
        minPrice: isActive ? undefined : min?.toString(),
        maxPrice: isActive ? undefined : max?.toString(),
      }),
      { scroll: false }
    )
  }

  const toggleSort = (value: string) => {
    const isActive = activeSort === value
    router.push(buildUrl({ sort: isActive ? undefined : value }), {
      scroll: false,
    })
  }

  return (
    <section className="w-[280px] px-6 font-cormorant-garamond">
      {/* Sort by */}
      <h2 className="font-allure text-6xl font-light tracking-tight">
        Sort by
      </h2>
      <div className="mb-5 border-b border-gray-500" />
      <ul className="mb-10 flex flex-col gap-5">
        {sortOptions.map((option) => (
          <li key={option.value}>
            <Checkbox
              checked={activeSort === option.value}
              onChange={() => toggleSort(option.value)}
              label={option.label}
            />
          </li>
        ))}
      </ul>

      {/* Filter */}
      <h2 className="font-allure text-6xl font-light tracking-tight">Filter</h2>
      <div className="mb-1 border-b border-gray-500" />

      <Accordion
        key={isSuccess ? 'loaded' : 'loading'}
        type="multiple"
        defaultValue={isSuccess ? ['categories', 'price'] : []}
        className="w-full"
      >
        {/* Categories */}
        <AccordionItem
          value="categories"
          className="border-b border-gray-500 py-1"
        >
          <AccordionTrigger className="py-4 font-allure text-3xl font-light tracking-tight hover:no-underline">
            Categories
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-4 text-xl text-gray-900">
            <ul className="flex flex-col gap-3">
              <li>
                <Checkbox
                  checked={activeCategorySlugs.length === 0}
                  onChange={clearCategories}
                  label="All"
                />
              </li>
              {categoriesLoading ? (
                <li className="text-gray-400">Loading...</li>
              ) : (
                categories.map((cat) => (
                  <li key={cat.slug}>
                    <Checkbox
                      checked={activeCategorySlugs.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                      label={cat.name}
                    />
                  </li>
                ))
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Price */}
        <AccordionItem value="price" className="border-b border-gray-500 py-1">
          <AccordionTrigger className="py-4 font-allure text-3xl font-light tracking-tight hover:no-underline">
            Price
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-4 text-xl text-gray-900">
            <ul className="flex flex-col gap-3">
              {priceRanges.map((range) => (
                <li key={`${range.min ?? 'any'}-${range.max ?? 'any'}`}>
                  <Checkbox
                    checked={
                      activeMinPrice === range.min &&
                      activeMaxPrice === range.max
                    }
                    onChange={() => togglePrice(range.min, range.max)}
                    label={rangeLabel(range)}
                  />
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Watermark */}
      <div className="mt-8 flex justify-center overflow-hidden">
        <h1
          className="pointer-events-none ml-16 rotate-180 font-le-jour text-9xl font-extrabold tracking-normal text-gray-50 uppercase select-none [writing-mode:vertical-rl]"
          style={{ transform: 'scaleX(2.05)', transformOrigin: 'center' }}
        >
          Theokallia
        </h1>
      </div>
    </section>
  )
}

export default SidebarFilter

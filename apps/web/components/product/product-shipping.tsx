import { Clock, Package, MapPin, PlaneTakeoff } from 'lucide-react'

interface ShippingInfo {
  deliveryTime: string
  courier: string
  arrival: string
  location: string
}

interface ProductShippingProps {
  shipping: ShippingInfo
}

const ProductShipping = ({ shipping }: ProductShippingProps) => {
  return (
    <div className="border border-gray-400 p-4 font-cormorant-garamond">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Shipping</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Delivery Time */}
        <div className="flex items-start gap-2">
          <Clock size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Delivery time</span>
            <span className="text-sm text-gray-900">{shipping.deliveryTime}</span>
          </div>
        </div>

        {/* Courier */}
        <div className="flex items-start gap-2">
          <Package size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Courier partner</span>
            <span className="text-sm text-gray-900">{shipping.courier}</span>
          </div>
        </div>

        {/* Arrival */}
        <div className="flex items-start gap-2">
          <PlaneTakeoff size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Arrival</span>
            <span className="text-sm text-gray-900">{shipping.arrival}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Shipping location</span>
            <span className="text-sm text-gray-900">{shipping.location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductShipping
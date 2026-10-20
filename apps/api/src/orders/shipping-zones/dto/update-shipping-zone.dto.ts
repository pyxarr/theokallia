import { PartialType } from '@nestjs/swagger'
import { CreateShippingZoneDto } from './create-shipping-zone.dto'

/**
 * DTO for updating an existing shipping zone — all fields optional
 * (PATCH semantics). Fields left out keep their current value.
 */
export class UpdateShippingZoneDto extends PartialType(CreateShippingZoneDto) {}

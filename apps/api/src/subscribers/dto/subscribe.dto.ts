import { ApiProperty } from '@nestjs/swagger'
import { IsEmail } from 'class-validator'

/**
 * Body for the public newsletter signup.
 * Only the email is required — registered status is inferred from an account
 * matching the email, not from an auth session.
 */
export class SubscribeDto {
  /** Email address to add to the newsletter list. */
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string
}

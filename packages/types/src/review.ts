export interface Review {
  id: string
  productId: string
  userId: string
  rating: number
  comment: string
  user: {
    firstName: string
    lastName: string
  }
  createdAt: string
}
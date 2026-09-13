export type MealDealRole = 'main' | 'side' | 'drink' | 'unknown'

export type ProductKind =
  | 'sandwich'
  | 'wrap'
  | 'sub'
  | 'pasta'
  | 'salad'
  | 'sushi'
  | 'crisps'
  | 'chocolate'
  | 'snack'
  | 'fruit'
  | 'bottle'
  | 'can'
  | 'carton'
  | 'smoothie'
  | 'coffee'
  | 'other'

export interface Product {
  id: string

  // Exactly what Tesco gave us.
  rawName: string

  // Our nicer enriched name, when available.
  displayName?: string

  // Barcode / GTIN if Tesco gives us one.
  gtin?: string

  // Our own classifications.
  mealDealRole?: MealDealRole
  kind?: ProductKind
  flavour?: string
}

export interface PurchaseItem {
  productId: string
  quantity: number

  // Total shelf value of this line, before discounts.
  shelfPricePence?: number

  // Total actually paid for this line.
  paidPricePence?: number

  // Discount attributable to this line, if known.
  savingPence?: number
}

export interface Store {
  id: string
  name?: string
  town?: string
}

export interface BasketTotals {
  shelfTotalPence?: number
  paidTotalPence?: number
  savingPence?: number
}

export interface Transaction {
  id: string

  // ISO timestamp, e.g. 2024-08-17T12:43:00
  occurredAt: string

  store?: Store
  items: PurchaseItem[]
  totals: BasketTotals
}

export interface MealDealDataset {
  schemaVersion: 1

  source: 'demo' | 'tesco-portability'

  customerName?: string

  products: Record<string, Product>
  transactions: Transaction[]
}
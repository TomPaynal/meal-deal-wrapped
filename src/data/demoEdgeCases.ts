import type {
  Transaction,
} from '../types/data'

export interface DemoDiagnosticCase {
  transactionId: string
  title: string
  description: string
}

export const demoDiagnosticCases:
  DemoDiagnosticCase[] = [
    {
      transactionId:
        'demo-edge-two-deals',
      title:
        'Two Meal Deals scanned consecutively',
      description:
        'Six eligible items, scanned as two clean main + snack + drink groups.',
    },
    {
      transactionId:
        'demo-edge-extra-snack',
      title:
        'One Meal Deal plus a cheaper extra snack',
      description:
        'The Meal Deal snack is both scanned with the combo and more expensive than the extra snack.',
    },
    {
      transactionId:
        'demo-edge-equal-drink',
      title:
        'One Meal Deal plus an equal-price drink',
      description:
        'The two eligible drinks cost exactly the same. Price cannot distinguish them, but scan order potentially can.',
    },
    {
      transactionId:
        'demo-edge-conflict',
      title:
        'Scan order and value disagree',
      description:
        'The consecutively scanned snack is cheaper, while a later eligible snack would maximise the Meal Deal saving.',
    },
  ]

export const demoEdgeCaseTransactions:
  Transaction[] = [
    {
      id: 'demo-edge-two-deals',
      occurredAt:
        '2026-09-01T12:15:00.000Z',

      store: {
        id: 'store-central',
        name: 'Central Express',
        town: 'Demo City',
      },

      /*
       * Scan order:
       *
       * Deal 1:
       * Caesar → Bueno → Smoothie
       *
       * Deal 2:
       * Tuna → S&V → Pepsi
       */
      items: [
        {
          productId:
            'main-caesar-wrap',
          quantity: 1,
          shelfPricePence: 350,
        },
        {
          productId:
            'side-bueno',
          quantity: 1,
          shelfPricePence: 160,
        },
        {
          productId:
            'drink-smoothie',
          quantity: 1,
          shelfPricePence: 280,
        },
        {
          productId:
            'main-tuna-crunch',
          quantity: 1,
          shelfPricePence: 330,
        },
        {
          productId:
            'side-salt-vinegar',
          quantity: 1,
          shelfPricePence: 150,
        },
        {
          productId:
            'drink-pepsi',
          quantity: 1,
          shelfPricePence: 200,
        },
      ],

      totals: {
        shelfTotalPence: 1470,
        paidTotalPence: 680,
        savingPence: 790,
      },
    },

    {
      id: 'demo-edge-extra-snack',
      occurredAt:
        '2026-09-02T12:20:00.000Z',

      store: {
        id: 'store-central',
        name: 'Central Express',
        town: 'Demo City',
      },

      /*
       * Intended:
       *
       * Tuna + Bueno + Pepsi
       *
       * S&V is an extra standalone snack.
       */
      items: [
        {
          productId:
            'main-tuna-crunch',
          quantity: 1,
          shelfPricePence: 330,
        },
        {
          productId:
            'side-bueno',
          quantity: 1,
          shelfPricePence: 160,
        },
        {
          productId:
            'drink-pepsi',
          quantity: 1,
          shelfPricePence: 200,
        },
        {
          productId:
            'side-salt-vinegar',
          quantity: 1,
          shelfPricePence: 150,
        },
      ],

      totals: {
        shelfTotalPence: 840,

        /*
         * £3.40 Meal Deal
         * + £1.50 extra crisps
         */
        paidTotalPence: 490,
        savingPence: 350,
      },
    },

    {
      id: 'demo-edge-equal-drink',
      occurredAt:
        '2026-09-03T12:25:00.000Z',

      store: {
        id: 'store-station',
        name: 'Station Express',
        town: 'Demo City',
      },

      /*
       * Intended:
       *
       * Caesar + S&V + Pepsi
       *
       * Cola is standalone.
       *
       * Both drinks cost £2.00.
       */
      items: [
        {
          productId:
            'main-caesar-wrap',
          quantity: 1,
          shelfPricePence: 350,
        },
        {
          productId:
            'side-salt-vinegar',
          quantity: 1,
          shelfPricePence: 150,
        },
        {
          productId:
            'drink-pepsi',
          quantity: 1,
          shelfPricePence: 200,
        },
        {
          productId:
            'drink-cola',
          quantity: 1,
          shelfPricePence: 200,
        },
      ],

      totals: {
        shelfTotalPence: 900,

        /*
         * £3.40 Meal Deal
         * + £2 standalone drink
         */
        paidTotalPence: 540,
        savingPence: 360,
      },
    },

    {
      id: 'demo-edge-conflict',
      occurredAt:
        '2026-09-04T12:30:00.000Z',

      store: {
        id: 'store-high-street',
        name: 'High Street Superstore',
        town: 'Demo Town',
      },

      /*
       * Deliberate conflict:
       *
       * Scan proximity suggests:
       * Caesar + S&V + Pepsi
       *
       * Highest-value rule suggests:
       * Caesar + Bueno + Pepsi
       */
      items: [
        {
          productId:
            'main-caesar-wrap',
          quantity: 1,
          shelfPricePence: 350,
        },
        {
          productId:
            'side-salt-vinegar',
          quantity: 1,
          shelfPricePence: 150,
        },
        {
          productId:
            'drink-pepsi',
          quantity: 1,
          shelfPricePence: 200,
        },
        {
          productId:
            'side-bueno',
          quantity: 1,
          shelfPricePence: 160,
        },
      ],

      totals: {
        shelfTotalPence: 860,
        paidTotalPence: 500,
        savingPence: 360,
      },
    },
  ]
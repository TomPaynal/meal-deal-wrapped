import type {
  MealDealDataset,
  Product,
  Store,
  Transaction,
} from '../types/data'


// Completely synthetic demo data.
// None of these transactions represent real purchases.

const products: Record<string, Product> = {
  'main-chicken-bacon': {
    id: 'main-chicken-bacon',
    rawName: 'CHKN BACON SANDWICH',
    displayName: 'Chicken & Bacon Sandwich',
    mealDealRole: 'main',
    kind: 'sandwich',
  },

  'main-blt': {
    id: 'main-blt',
    rawName: 'BLT SANDWICH',
    displayName: 'BLT Sandwich',
    mealDealRole: 'main',
    kind: 'sandwich',
  },

  'main-caesar-wrap': {
    id: 'main-caesar-wrap',
    rawName: 'CHKN CAESAR WRAP',
    displayName: 'Chicken Caesar Wrap',
    mealDealRole: 'main',
    kind: 'wrap',
  },

  'main-triple': {
    id: 'main-triple',
    rawName: 'CHKN TRIPLE SANDWICH',
    displayName: 'Chicken Triple Sandwich',
    mealDealRole: 'main',
    kind: 'sandwich',
  },

  'main-pasta': {
    id: 'main-pasta',
    rawName: 'CHKN BACON PASTA',
    displayName: 'Chicken & Bacon Pasta',
    mealDealRole: 'main',
    kind: 'pasta',
  },

  'main-tuna-crunch': {
    id: 'main-tuna-crunch',
    rawName: 'TUNA CRUNCH SANDWICH',
    displayName: 'Tuna Crunch Sandwich',
    mealDealRole: 'main',
    kind: 'sandwich',
  },

  'side-salt-vinegar': {
    id: 'side-salt-vinegar',
    rawName: 'MAX S&V CRISPS',
    displayName: 'Salt & Vinegar Crisps',
    mealDealRole: 'side',
    kind: 'crisps',
    flavour: 'salt-vinegar',
  },

  'side-cheese-onion': {
    id: 'side-cheese-onion',
    rawName: 'CHEESE ONION CRISPS',
    displayName: 'Cheese & Onion Crisps',
    mealDealRole: 'side',
    kind: 'crisps',
    flavour: 'cheese-onion',
  },

  'side-ready-salted': {
    id: 'side-ready-salted',
    rawName: 'READY SALTED CRISPS',
    displayName: 'Ready Salted Crisps',
    mealDealRole: 'side',
    kind: 'crisps',
    flavour: 'ready-salted',
  },

  'side-bueno': {
    id: 'side-bueno',
    rawName: 'KINDER BUENO',
    displayName: 'Kinder Bueno',
    mealDealRole: 'side',
    kind: 'chocolate',
  },

  'side-fruit': {
    id: 'side-fruit',
    rawName: 'MIXED FRUIT POT',
    displayName: 'Mixed Fruit Pot',
    mealDealRole: 'side',
    kind: 'fruit',
  },

  'drink-cola': {
    id: 'drink-cola',
    rawName: 'COLA ZERO 500ML',
    displayName: 'Cola Zero',
    mealDealRole: 'drink',
    kind: 'bottle',
  },

  'drink-pepsi': {
    id: 'drink-pepsi',
    rawName: 'PEPSI MAX 500ML',
    displayName: 'Pepsi Max',
    mealDealRole: 'drink',
    kind: 'bottle',
  },

  'drink-smoothie': {
    id: 'drink-smoothie',
    rawName: 'BERRY SMOOTHIE 300ML',
    displayName: 'Berry Smoothie',
    mealDealRole: 'drink',
    kind: 'smoothie',
  },

  'drink-orange': {
    id: 'drink-orange',
    rawName: 'ORANGE JUICE 330ML',
    displayName: 'Orange Juice',
    mealDealRole: 'drink',
    kind: 'bottle',
  },

  'drink-energy': {
    id: 'drink-energy',
    rawName: 'ENERGY DRINK 473ML',
    displayName: 'Energy Drink',
    mealDealRole: 'drink',
    kind: 'can',
  },
}

const stores: Store[] = [
  {
    id: 'store-central',
    name: 'Central Express',
    town: 'Demo City',
  },
  {
    id: 'store-station',
    name: 'Station Express',
    town: 'Demo City',
  },
  {
    id: 'store-high-street',
    name: 'High Street Superstore',
    town: 'Demo Town',
  },
]

const sidePool = [
  'side-salt-vinegar',
  'side-salt-vinegar',
  'side-bueno',
  'side-cheese-onion',
  'side-ready-salted',
  'side-fruit',
]

const drinkPool = [
  'drink-pepsi',
  'drink-pepsi',
  'drink-cola',
  'drink-smoothie',
  'drink-orange',
  'drink-energy',
]

const shelfPricesPence: Record<string, number> = {
  'main-chicken-bacon': 325,
  'main-blt': 310,
  'main-caesar-wrap': 350,
  'main-triple': 375,
  'main-pasta': 340,
  'main-tuna-crunch': 330,

  'side-salt-vinegar': 150,
  'side-cheese-onion': 150,
  'side-ready-salted': 150,
  'side-bueno': 160,
  'side-fruit': 175,

  'drink-cola': 200,
  'drink-pepsi': 200,
  'drink-smoothie': 280,
  'drink-orange': 230,
  'drink-energy': 290,
}

// Deliberately constructed to give our demo bar-chart race a story.
const mainCountsByYear: Record<
  number,
  Record<string, number>
> = {
  2014: {
    'main-chicken-bacon': 14,
    'main-blt': 8,
    'main-caesar-wrap': 3,
    'main-triple': 5,
  },

  2015: {
    'main-chicken-bacon': 10,
    'main-blt': 7,
    'main-caesar-wrap': 18,
    'main-triple': 5,
  },

  2016: {
    'main-chicken-bacon': 7,
    'main-blt': 6,
    'main-caesar-wrap': 26,
    'main-triple': 5,
    'main-pasta': 3,
  },

  2017: {
    'main-chicken-bacon': 7,
    'main-blt': 5,
    'main-caesar-wrap': 20,
    'main-triple': 8,
    'main-pasta': 5,
  },

  2018: {
    'main-chicken-bacon': 5,
    'main-blt': 4,
    'main-caesar-wrap': 18,
    'main-triple': 7,
    'main-pasta': 8,
  },

  2019: {
    'main-chicken-bacon': 4,
    'main-blt': 3,
    'main-caesar-wrap': 15,
    'main-triple': 5,
    'main-pasta': 10,
  },

  2020: {
    'main-chicken-bacon': 3,
    'main-blt': 2,
    'main-caesar-wrap': 10,
    'main-triple': 4,
    'main-pasta': 9,
    'main-tuna-crunch': 8,
  },

  2021: {
    'main-chicken-bacon': 2,
    'main-blt': 2,
    'main-caesar-wrap': 8,
    'main-triple': 4,
    'main-pasta': 8,
    'main-tuna-crunch': 18,
  },

  2022: {
    'main-chicken-bacon': 2,
    'main-blt': 1,
    'main-caesar-wrap': 5,
    'main-triple': 3,
    'main-pasta': 6,
    'main-tuna-crunch': 24,
  },

  2023: {
    'main-chicken-bacon': 1,
    'main-blt': 1,
    'main-caesar-wrap': 4,
    'main-triple': 3,
    'main-pasta': 5,
    'main-tuna-crunch': 27,
  },

  2024: {
    'main-chicken-bacon': 1,
    'main-blt': 1,
    'main-caesar-wrap': 3,
    'main-triple': 2,
    'main-pasta': 4,
    'main-tuna-crunch': 22,
  },

  2025: {
    'main-chicken-bacon': 1,
    'main-caesar-wrap': 2,
    'main-triple': 2,
    'main-pasta': 3,
    'main-tuna-crunch': 19,
  },

  2026: {
    'main-chicken-bacon': 1,
    'main-caesar-wrap': 1,
    'main-triple': 1,
    'main-pasta': 2,
    'main-tuna-crunch': 16,
  },
}

function makeRandom(seed: number) {
  let value = seed >>> 0

  return () => {
    value =
      (value * 1664525 + 1013904223) >>> 0

    return value / 4294967296
  }
}

function shuffled<T>(
  items: T[],
  seed: number,
): T[] {
  const result = [...items]
  const random = makeRandom(seed)

  for (
    let i = result.length - 1;
    i > 0;
    i -= 1
  ) {
    const j =
      Math.floor(
        random() * (i + 1),
      )

    ;[
      result[i],
      result[j],
    ] = [
      result[j],
      result[i],
    ]
  }

  return result
}

function createDemoTransactions():
  Transaction[] {
  const transactions:
    Transaction[] = []

  for (
    const [
      yearText,
      counts,
    ] of Object.entries(
      mainCountsByYear,
    )
  ) {
    const year =
      Number(yearText)

    const mains: string[] = []

    for (
      const [
        mainId,
        count,
      ] of Object.entries(counts)
    ) {
      for (
        let i = 0;
        i < count;
        i += 1
      ) {
        mains.push(mainId)
      }
    }

    const random =
      makeRandom(year * 7919)

    const shuffledMains =
      shuffled(mains, year)

    shuffledMains.forEach(
      (mainId, index) => {
        const sideId =
          sidePool[
            Math.floor(
              random() *
                sidePool.length,
            )
          ]

        const drinkId =
          drinkPool[
            Math.floor(
              random() *
                drinkPool.length,
            )
          ]

        const fractionThroughYear =
          (index + 1) /
          (
            shuffledMains.length +
            1
          )

        const date =
          new Date(
            Date.UTC(
              year,
              0,
              1,
            ),
          )

        date.setUTCDate(
          1 +
            Math.floor(
              fractionThroughYear *
                364,
            ),
        )

        date.setUTCHours(
          11 +
            Math.floor(
              random() * 4,
            ),

          Math.floor(
            random() * 60,
          ),
        )

        const shelfTotalPence =
          (
            shelfPricesPence[
              mainId
            ] ?? 0
          ) +
          (
            shelfPricesPence[
              sideId
            ] ?? 0
          ) +
          (
            shelfPricesPence[
              drinkId
            ] ?? 0
          )

        // Demo price only.
        // Real prices will come from Tesco data.
        const paidTotalPence = 340

        transactions.push({
          id:
            `demo-${year}-${String(
              index + 1,
            ).padStart(
              3,
              '0',
            )}`,

          occurredAt:
            date.toISOString(),

          store:
            stores[
              Math.floor(
                random() *
                  stores.length,
              )
            ],

          items: [
            {
              productId:
                mainId,

              quantity: 1,

              shelfPricePence:
                shelfPricesPence[
                  mainId
                ],
            },

            {
              productId:
                sideId,

              quantity: 1,

              shelfPricePence:
                shelfPricesPence[
                  sideId
                ],
            },

            {
              productId:
                drinkId,

              quantity: 1,

              shelfPricePence:
                shelfPricesPence[
                  drinkId
                ],
            },
          ],

          totals: {
            shelfTotalPence,
            paidTotalPence,

            savingPence:
              shelfTotalPence -
              paidTotalPence,
          },
        })
      },
    )
  }

  return transactions.sort(
    (a, b) =>
      new Date(
        a.occurredAt,
      ).getTime() -
      new Date(
        b.occurredAt,
      ).getTime(),
  )
}

export const demoDataset:
  MealDealDataset = {
  schemaVersion: 1,

  source: 'demo',

  customerName: 'Demo Person',

  products,

  transactions:
    createDemoTransactions(),
}
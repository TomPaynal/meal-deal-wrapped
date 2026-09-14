import type {
  MealDealRole,
  ProductKind,
} from '../types/data'

export interface TescoProductClassification {
  mealDealRole: MealDealRole
  kind: ProductKind
}

/*
 * IMPORTANT:
 *
 * This does NOT decide whether a product was definitely
 * Meal Deal eligible.
 *
 * It only answers:
 *
 *   "If this product appeared in a Meal Deal,
 *    what role would it most likely occupy?"
 *
 * Transaction / pricing evidence will decide eligibility
 * later.
 *
 * Unknown is deliberately preferable to a clever guess.
 */

function normalise(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/&+/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesAny(
  value: string,
  patterns: RegExp[],
): boolean {
  return patterns.some(
    pattern =>
      pattern.test(value),
  )
}


/* ---------------------------------------------------------
   DRINKS
--------------------------------------------------------- */

const DRINK_PATTERNS: RegExp[] = [
  /\bsoft drink\b/,
  /\bcola\b/,
  /\bcoke\b/,
  /\bpepsi\b/,
  /\bfanta\b/,
  /\bsprite\b/,
  /\b7up\b/,

  /\bribena\b/,
  /\boasis\b/,
  /\bvimto\b/,
  /\blucozade\b/,
  /\bred bull\b/,
  /\bmonster energy\b/,
  /\benergy drink\b/,
  /\bsports drink\b/,

  /\bjuice drink\b/,
  /\borange juice\b/,
  /\bapple juice\b/,
  /\bfruit juice\b/,
  /\bjuice burst\b/,
  /\bcapri[- ]?sun\b/,

  /\bsmoothie\b/,
  /\bnaked .* machine\b/,
  /\binnocent\b.*\bjuice\b/,

  /\bmilkshake\b/,
  /\bmilk drink\b/,
  /\byazoo\b/,
  /\bfrijj\b/,
  /\bshaken udder\b/,
  /\byop\b.*\bdrink\b/,
  /\byoghurt drink\b/,
  /\byogurt drink\b/,

  /\bmineral water\b/,
  /\bsparkling water\b/,
  /\bstill water\b/,

  /\bcosta\b.*\b(coffee|latte|cappuccino|americano|mocha)\b/,
  /\b(coffee|latte|cappuccino|americano|mocha)\b/,
]

const SMOOTHIE_PATTERNS: RegExp[] = [
  /\bsmoothie\b/,
  /\bnaked .* machine\b/,
]

const COFFEE_PATTERNS: RegExp[] = [
  /\bcoffee\b/,
  /\blatte\b/,
  /\bcappuccino\b/,
  /\bamericano\b/,
  /\bmocha\b/,
]

const CAN_PATTERNS: RegExp[] = [
  /\bcan\b/,
  /\b330 ?ml\b/,
]

const CARTON_PATTERNS: RegExp[] = [
  /\bcarton\b/,
]



/* ---------------------------------------------------------
   SNACKS / SIDES

   These are intentionally broad format clues.

   A family-size bag of chocolate may classify as a snack,
   but that does NOT make it Meal Deal eligible.
--------------------------------------------------------- */

const ICE_CREAM_PATTERNS: RegExp[] = [
  /\bice cream\b/,
  /\bmagnum\b/,
  /\bcornetto\b/,
  /\blolly\b/,
  /\blollies\b/,
  /\bice lolly\b/,
]

const CRISP_PATTERNS: RegExp[] = [
  /\bcrisps?\b/,
  /\bchips\b/,
  /\bdoritos\b/,
  /\bwalkers\b/,
  /\bmccoy'?s\b/,
  /\bkettle chips\b/,
  /\bmonster munch\b/,
  /\bquavers\b/,
  /\bwotsits\b/,
  /\bskips\b/,
  /\bpopchips\b/,
  /\bprawn crackers?\b/,
]

const CHOCOLATE_PATTERNS: RegExp[] = [
  /\bchocolate\b/,
  /\bsnickers\b/,
  /\btwix\b/,
  /\bkinder\b/,
  /\byorkie\b/,
  /\bmilky ?way\b/,
  /\bm&m'?s\b/,
  /\bminstrels\b/,
  /\bcrunchie\b/,
  /\bgrenade\b.*\bbar\b/,
]

const FRUIT_PATTERNS: RegExp[] = [
  /\bfruit pot\b/,
  /\bfruit salad\b/,
  /\bmelon pot\b/,
  /\bgrape pot\b/,
  /\bapple slices\b/,
  /\bmedjool dates\b/,
]

const SAVOURY_SNACK_PATTERNS: RegExp[] = [
  /\bolives?\b/,
  /\bscotch eggs?\b/,
  /\bsamosa\b/,
  /\bgyoza snack pot\b/,
  /\bsnack pot\b/,
  /\bpork pie\b/,
  /\bsausage roll\b/,
]

const BAKERY_SNACK_PATTERNS: RegExp[] = [
  /\bcroissant\b/,
  /\bpain au chocolat\b/,
  /\bpastel de nata\b/,
  /\bcheese twist\b/,
  /\bchocolate twist\b/,
  /\bpastry\b/,
]

const GENERIC_SNACK_PATTERNS: RegExp[] = [
  /\bsnack\b/,
  /\bflapjack\b/,
  /\bcereal bar\b/,
  /\boat boost\b/,
  /\bmalt loaf\b/,
  /\brice krispies squares?\b/,
  /\bprotein bar\b/,
  /\bsweets?\b/,
  /\bgums\b/,
]


/* ---------------------------------------------------------
   MAINS

   Run these AFTER snack detection.

   That matters for products such as:

     "Ben & Jerry's Cookie Dough Sandwich"

   which contains the word "sandwich" but is very much
   not our main course.
--------------------------------------------------------- */

const WRAP_PATTERNS: RegExp[] = [
  /\bwrap\b/,
  /\bwraps\b/,
  /\btortilla wrap\b/,
]

const SUB_PATTERNS: RegExp[] = [
  /\bsub\b/,
  /\bbaguette\b/,
  /\bfilled roll\b/,
]

const SUSHI_PATTERNS: RegExp[] = [
  /\bsushi\b/,
  /\bmaki\b/,
  /\bnigiri\b/,
]

const PASTA_PATTERNS: RegExp[] = [
  /\bpasta\b/,
]

const SALAD_PATTERNS: RegExp[] = [
  /\bsalad\b/,
]

const SANDWICH_PATTERNS: RegExp[] = [
  /\bsandwich\b/,
  /\bsandwiches\b/,
  /\btriple\b/,
]

const OTHER_MAIN_PATTERNS: RegExp[] = [
  /\bpoke\b/,
  /\bgyros\b/,
  /\bkebab style\b/,
]


/* ---------------------------------------------------------
   MAIN CLASSIFIER
--------------------------------------------------------- */

export function classifyTescoProduct(
  rawName: string,
): TescoProductClassification {
  const name =
    normalise(rawName)


  /* -----------------------
     DRINK
  ----------------------- */

  if (
    matchesAny(
      name,
      DRINK_PATTERNS,
    )
  ) {
    if (
      matchesAny(
        name,
        SMOOTHIE_PATTERNS,
      )
    ) {
      return {
        mealDealRole: 'drink',
        kind: 'smoothie',
      }
    }

    if (
      matchesAny(
        name,
        COFFEE_PATTERNS,
      )
    ) {
      return {
        mealDealRole: 'drink',
        kind: 'coffee',
      }
    }

    if (
      matchesAny(
        name,
        CARTON_PATTERNS,
      )
    ) {
      return {
        mealDealRole: 'drink',
        kind: 'carton',
      }
    }

    if (
      matchesAny(
        name,
        CAN_PATTERNS,
      )
    ) {
      return {
        mealDealRole: 'drink',
        kind: 'can',
      }
    }

    return {
      mealDealRole: 'drink',
      kind: 'bottle',
    }
  }


  /* -----------------------
     SNACK / SIDE
  ----------------------- */

  if (
    matchesAny(
      name,
      ICE_CREAM_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'side',
      kind: 'snack',
    }
  }

  if (
    matchesAny(
      name,
      CRISP_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'side',
      kind: 'crisps',
    }
  }

  if (
    matchesAny(
      name,
      CHOCOLATE_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'side',
      kind: 'chocolate',
    }
  }

  if (
    matchesAny(
      name,
      FRUIT_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'side',
      kind: 'fruit',
    }
  }

  if (
    matchesAny(
      name,
      SAVOURY_SNACK_PATTERNS,
    ) ||
    matchesAny(
      name,
      BAKERY_SNACK_PATTERNS,
    ) ||
    matchesAny(
      name,
      GENERIC_SNACK_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'side',
      kind: 'snack',
    }
  }


  /* -----------------------
     MAIN
  ----------------------- */

  if (
    matchesAny(
      name,
      WRAP_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'main',
      kind: 'wrap',
    }
  }

  if (
    matchesAny(
      name,
      SUB_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'main',
      kind: 'sub',
    }
  }

  if (
    matchesAny(
      name,
      SUSHI_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'main',
      kind: 'sushi',
    }
  }

  if (
    matchesAny(
      name,
      PASTA_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'main',
      kind: 'pasta',
    }
  }

  if (
    matchesAny(
      name,
      SALAD_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'main',
      kind: 'salad',
    }
  }

  if (
    matchesAny(
      name,
      SANDWICH_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'main',
      kind: 'sandwich',
    }
  }

  if (
    matchesAny(
      name,
      OTHER_MAIN_PATTERNS,
    )
  ) {
    return {
      mealDealRole: 'main',
      kind: 'other',
    }
  }


  /* -----------------------
     UNKNOWN
  ----------------------- */

  return {
    mealDealRole: 'unknown',
    kind: 'other',
  }
}
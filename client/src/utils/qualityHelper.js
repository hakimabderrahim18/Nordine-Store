/**
 * Helper to extract quality / model type (BLINDÉ, JT, KBS, OLED, INCELL, ORG, etc.)
 * from a product name, specifications, or variants.
 */
export function getProductQualityBadge(name) {
  if (!name || typeof name !== 'string') return null;

  const upper = name.toUpperCase();

  const rules = [
    {
      regex: /\bGOLDEN\s+BLIND[EÉ]?\b/i,
      label: 'GOLDEN BLINDÉ',
      shortLabel: 'GOLDEN',
      color: 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
    },
    {
      regex: /\bBLIND[EÉ]\b/i,
      label: 'BLINDÉ',
      shortLabel: 'BLINDÉ',
      color: 'bg-purple-100 text-purple-900 border-purple-300 shadow-sm'
    },
    {
      regex: /\bHD[+\-]?\s*JT\b/i,
      label: 'HD+ JT',
      shortLabel: 'HD+ JT',
      color: 'bg-sky-100 text-sky-900 border-sky-300 shadow-sm'
    },
    {
      regex: /\bJT\b/i,
      label: 'JT',
      shortLabel: 'JT',
      color: 'bg-blue-100 text-blue-900 border-blue-300 shadow-sm'
    },
    {
      regex: /\bOLED\s+KBS\b/i,
      label: 'OLED KBS',
      shortLabel: 'OLED KBS',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm'
    },
    {
      regex: /\bKBS\b/i,
      label: 'KBS',
      shortLabel: 'KBS',
      color: 'bg-teal-100 text-teal-900 border-teal-300 shadow-sm'
    },
    {
      regex: /\bOLED\b/i,
      label: 'OLED',
      shortLabel: 'OLED',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm'
    },
    {
      regex: /\bINCELL\b/i,
      label: 'INCELL',
      shortLabel: 'INCELL',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300 shadow-sm'
    },
    {
      regex: /\b(ORG|ORIGINAL|ORIG)\b/i,
      label: 'ORIGINAL (ORG)',
      shortLabel: 'ORG',
      color: 'bg-green-100 text-green-900 border-green-300 shadow-sm'
    },
    {
      regex: /\bGX\b/i,
      label: 'GX',
      shortLabel: 'GX',
      color: 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-sm'
    },
    {
      regex: /\bAAA\b/i,
      label: 'AAA',
      shortLabel: 'AAA',
      color: 'bg-rose-100 text-rose-900 border-rose-300 shadow-sm'
    },
    {
      regex: /\bDJN\b/i,
      label: 'DJN',
      shortLabel: 'DJN',
      color: 'bg-orange-100 text-orange-900 border-orange-300 shadow-sm'
    },
    {
      regex: /\bTFT\b/i,
      label: 'TFT',
      shortLabel: 'TFT',
      color: 'bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
    },
    {
      regex: /\bFHD\b/i,
      label: 'FHD',
      shortLabel: 'FHD',
      color: 'bg-violet-100 text-violet-900 border-violet-300 shadow-sm'
    },
    {
      regex: /\bHD\+\b/i,
      label: 'HD+',
      shortLabel: 'HD+',
      color: 'bg-blue-50 text-blue-800 border-blue-200 shadow-sm'
    }
  ];

  for (const rule of rules) {
    if (rule.regex.test(upper)) {
      return rule;
    }
  }

  return null;
}

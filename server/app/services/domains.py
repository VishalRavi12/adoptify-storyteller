import random
from typing import List

SUFFIX_SCORES = {".pet": 1.0, ".today": 0.9, ".dev": 0.7, ".org": 0.85, ".love": 0.65}


def generate_domains(pet_name: str, location: str | None, keywords: List[str], tlds: List[str]) -> List[dict]:
    base_words = [pet_name.lower()]
    if location:
        base_words.append(location.lower().replace(" ", ""))
    base_words.extend([k.lower().replace(" ", "") for k in keywords])

    combos = set()
    seeds = [
        f"get{base_words[0]}",
        f"team{base_words[0]}",
        f"{base_words[0]}needsyou",
    ]
    if len(base_words) > 1:
        seeds.append(f"{base_words[0]}{base_words[1]}")

    combos.update(seeds)

    suggestions = []
    for combo in combos:
        for tld in tlds:
            score = min(1.0, 0.6 + len(combo) / 50 + SUFFIX_SCORES.get(tld, 0.5))
            jitter = random.uniform(-0.05, 0.05)
            suggestions.append(
                {
                    "domain": f"{combo}{tld}",
                    "score": round(max(0.2, min(1.0, score + jitter)), 2),
                    "reason": f"Short + brandable + {tld} promo",
                }
            )

    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return suggestions[:10]

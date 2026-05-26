import type { BirdSpecies, INaturalistTaxonSummary } from '../types';
import { fetchINaturalistTaxon } from './inaturalist';

export interface IdentificationRequest {
  photoName?: string;
  notes?: string;
  habitats?: string[];
  regionPackId?: string;
  species: BirdSpecies[];
}

export interface IdentificationSuggestion {
  species: BirdSpecies;
  confidence: number;
  rationale: string[];
  autoNotes: string;
  inaturalistTaxon?: INaturalistTaxonSummary;
  alternatives: Array<{
    species: BirdSpecies;
    confidence: number;
    rationale: string[];
    inaturalistTaxon?: INaturalistTaxonSummary;
  }>;
}

export interface BirdIdentifier {
  id: string;
  label: string;
  identify(request: IdentificationRequest): Promise<IdentificationSuggestion | null>;
}

const KEYWORD_WEIGHTS: Array<{ terms: string[]; speciesIds: string[]; weight: number; reason: string }> = [
  {
    terms: ['owl', 'hoot', 'who cooks for you', 'night'],
    speciesIds: ['app-004', 'app-024'],
    weight: 0.26,
    reason: 'notes mention owl-like or nocturnal behavior',
  },
  {
    terms: ['red tail', 'hawk', 'soaring', 'raptor'],
    speciesIds: ['app-017', 'app-018'],
    weight: 0.28,
    reason: 'notes mention raptor field marks or soaring behavior',
  },
  {
    terms: ['stream', 'creek', 'rushing water', 'waterthrush'],
    speciesIds: ['app-011', 'app-015'],
    weight: 0.24,
    reason: 'notes mention stream habitat',
  },
  {
    terms: ['heron', 'wading', 'pond', 'marsh'],
    speciesIds: ['app-014'],
    weight: 0.32,
    reason: 'notes mention wading-bird clues',
  },
  {
    terms: ['hummingbird', 'hovering', 'flower'],
    speciesIds: ['app-023'],
    weight: 0.35,
    reason: 'notes mention hovering nectar-feeding behavior',
  },
  {
    terms: ['woodpecker', 'drumming', 'red crest'],
    speciesIds: ['app-003'],
    weight: 0.34,
    reason: 'notes mention woodpecker traits',
  },
  {
    terms: ['bluebird', 'blue', 'meadow'],
    speciesIds: ['app-013'],
    weight: 0.24,
    reason: 'notes mention open-country bluebird cues',
  },
  {
    terms: ['raven', 'crow', 'all black'],
    speciesIds: ['app-021'],
    weight: 0.24,
    reason: 'notes mention large black corvid traits',
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(text: string): string {
  return text.toLowerCase();
}

function seasonForMonth(month: number): BirdSpecies['seasonality'][number] {
  if ([11, 0, 1].includes(month)) return 'winter';
  if ([2, 3, 4].includes(month)) return 'spring';
  if ([5, 6, 7].includes(month)) return 'summer';
  return 'fall';
}

function scoreSpecies(species: BirdSpecies, request: IdentificationRequest) {
  let score = 0.12;
  const rationale: string[] = [];
  const text = normalize(`${request.photoName ?? ''} ${request.notes ?? ''}`);
  const habitats = request.habitats ?? [];
  const currentSeason = seasonForMonth(new Date().getMonth());

  if (!request.regionPackId || species.regions.includes(request.regionPackId)) {
    score += 0.18;
    rationale.push('species occurs in the active region pack');
  }

  const matchingHabitats = species.habitats.filter((habitat) => habitats.includes(habitat));
  if (matchingHabitats.length > 0) {
    score += Math.min(0.24, matchingHabitats.length * 0.09);
    rationale.push(`habitat matches ${matchingHabitats.join(', ')}`);
  }

  if (species.seasonality.includes('year-round') || species.seasonality.includes(currentSeason)) {
    score += 0.12;
    rationale.push(`seasonality fits ${currentSeason}`);
  }

  const nameTerms = [species.commonName, species.scientificName, ...species.aliases].map(normalize);
  const matchedName = nameTerms.find((term) => term && text.includes(term));
  if (matchedName) {
    score += 0.35;
    rationale.push(`notes mention ${matchedName}`);
  }

  for (const keywordSet of KEYWORD_WEIGHTS) {
    if (!keywordSet.speciesIds.includes(species.id)) continue;
    if (keywordSet.terms.some((term) => text.includes(term))) {
      score += keywordSet.weight;
      rationale.push(keywordSet.reason);
    }
  }

  return { score: clamp(score, 0, 0.99), rationale };
}

export const demoBirdIdentifier: BirdIdentifier = {
  id: 'demo-local',
  label: 'Trail Smart ID',
  async identify(request) {
    const availableSpecies = request.species.filter((species) => {
      return !request.regionPackId || species.regions.includes(request.regionPackId);
    });

    if (availableSpecies.length === 0) return null;

    const ranked = availableSpecies
      .map((species) => ({ species, ...scoreSpecies(species, request) }))
      .sort((left, right) => right.score - left.score);

    const enrichedRanked = await Promise.all(
      ranked.slice(0, 4).map(async (candidate) => ({
        ...candidate,
        inaturalistTaxon: await fetchINaturalistTaxon(candidate.species) ?? undefined,
      })),
    );

    const best = enrichedRanked[0];
    if (!best || best.score < 0.5) return null;

    const rationale = best.rationale.length > 0
      ? best.rationale.slice(0, 3)
      : ['matched against the active regional bird pack'];
    const alternatives = enrichedRanked
      .slice(1, 4)
      .filter((candidate) => candidate.score >= 0.35)
      .map((candidate) => ({
        species: candidate.species,
        confidence: candidate.score,
        rationale: candidate.rationale.slice(0, 2),
        inaturalistTaxon: candidate.inaturalistTaxon,
      }));

    return {
      species: best.species,
      confidence: best.score,
      rationale,
      autoNotes: `${best.species.commonName} (${best.species.scientificName})\n${best.species.description ?? 'Regional species match.'}`,
      inaturalistTaxon: best.inaturalistTaxon,
      alternatives,
    };
  },
};
import { StateData, DetailedDemographics } from '../types/game';

/**
 * Calculate detailed demographics breakdown for a state
 * Based on the base demographics, distributes voters into:
 * - Democrats: hardcore, likely, swingable
 * - Independents: demHardcore, demLikely, swingable, repLikely, repHardcore
 * - Republicans: hardcore, likely, swingable
 * - Undecided
 */
export function calculateDetailedDemographics(state: StateData): DetailedDemographics {
  const { democraticBase, republicanBase, independent, undecided } = state.demographics;
  
  // Calculate Democrats breakdown
  // Hardcore: 60% of dem base, Likely: 30%, Swingable: 10%
  const demHardcore = democraticBase * 0.60;
  const demLikely = democraticBase * 0.30;
  const demSwingable = democraticBase * 0.10;
  
  // Calculate Republicans breakdown
  // Hardcore: 60% of rep base, Likely: 30%, Swingable: 10%
  const repHardcore = republicanBase * 0.60;
  const repLikely = republicanBase * 0.30;
  const repSwingable = republicanBase * 0.10;
  
  // Calculate Independents breakdown
  // Split based on leanings: 40% Dem-leaning, 20% swingable, 40% Rep-leaning
  // Within each leaning: 50% hardcore, 30% likely, 20% swingable
  const indDemTotal = independent * 0.40;
  const indDemHardcore = indDemTotal * 0.50;
  const indDemLikely = indDemTotal * 0.30;
  const indSwingable = independent * 0.20;
  const indRepTotal = independent * 0.40;
  const indRepLikely = indRepTotal * 0.30;
  const indRepHardcore = indRepTotal * 0.50;
  
  return {
    democrats: {
      hardcore: demHardcore,
      likely: demLikely,
      swingable: demSwingable,
    },
    independents: {
      demHardcore: indDemHardcore,
      demLikely: indDemLikely,
      swingable: indSwingable,
      repLikely: indRepLikely,
      repHardcore: indRepHardcore,
    },
    republicans: {
      hardcore: repHardcore,
      likely: repLikely,
      swingable: repSwingable,
    },
    undecided: undecided,
  };
}


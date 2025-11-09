import { TopicId, Microgroup, TOPIC_RATINGS } from '../data/topics';
import { MicrogroupRelationships } from '../types/game';

/**
 * Calculate relationship change for a microgroup based on a topic
 * @param microgroup The microgroup
 * @param topicId The topic being addressed
 * @param candidate 'democrat' or 'republican'
 * @param position 'for' or 'against' the topic
 * @returns Change in relationship (-2 to +2)
 */
export function calculateTopicRelationshipChange(
  microgroup: Microgroup,
  topicId: TopicId,
  candidate: 'democrat' | 'republican',
  position: 'for' | 'against' = 'for'
): number {
  const topicRating = TOPIC_RATINGS[microgroup][topicId];
  
  // Base change: how aligned is the microgroup with this topic?
  // Rating of 10 = +2, rating of 1 = -2, rating of 5 = 0
  let baseChange = (topicRating - 5) * 0.4; // Scale from -1.6 to +2
  
  // If position is "against", invert the base change
  // This now represents how aligned the microgroup is with the POSITION (not the topic)
  if (position === 'against') {
    baseChange = -baseChange;
  }
  
  // Debug logging
  console.log(`  calculateTopicRelationshipChange: microgroup=${microgroup}, topicId=${topicId}, candidate=${candidate}, position=${position}, topicRating=${topicRating}, baseChange=${baseChange.toFixed(3)}`);
  
  // Adjust based on candidate
  // The baseChange now represents how the microgroup feels about the POSITION
  // For Democrats: positive baseChange means they like the Democrat's position → positive relationship change
  // For Republicans: positive baseChange means they like the Republican's position → positive relationship change
  // So we DON'T need to invert for Republicans - the baseChange already represents their alignment with the position
  return baseChange;
}

/**
 * Apply relationship changes for multiple topics (e.g., rally with 3 topics)
 * @param relationships Current relationships
 * @param topics Array of topic IDs
 * @param candidate 'democrat' or 'republican'
 * @param topicPositions Map of topic ID to position ('for' | 'against')
 * @returns Updated relationships
 */
export function applyTopicRelationshipChanges(
  relationships: MicrogroupRelationships,
  topics: TopicId[],
  candidate: 'democrat' | 'republican',
  topicPositions: Map<string, 'for' | 'against'> = new Map()
): MicrogroupRelationships {
  const updated: MicrogroupRelationships = {
    hardcore_dem: relationships.hardcore_dem,
    lean_dem: relationships.lean_dem,
    swingable_dem: relationships.swingable_dem,
    hardcore_rep: relationships.hardcore_rep,
    lean_rep: relationships.lean_rep,
    swingable_rep: relationships.swingable_rep,
    hardcore_dem_indie: relationships.hardcore_dem_indie,
    lean_dem_indie: relationships.lean_dem_indie,
    swingable_indie: relationships.swingable_indie,
    lean_rep_indie: relationships.lean_rep_indie,
    hardcore_rep_indie: relationships.hardcore_rep_indie,
  };
  
  const microgroups: Microgroup[] = [
    'hardcore_dem',
    'lean_dem',
    'swingable_dem',
    'hardcore_rep',
    'lean_rep',
    'swingable_rep',
    'hardcore_dem_indie',
    'lean_dem_indie',
    'swingable_indie',
    'lean_rep_indie',
    'hardcore_rep_indie',
  ];
  
  topics.forEach(topicId => {
    const position = topicPositions.get(topicId) || 'for'; // Default to 'for' if not set
    microgroups.forEach(microgroup => {
      const change = calculateTopicRelationshipChange(microgroup, topicId, candidate, position);
      updated[microgroup] = Math.max(1, Math.min(10, updated[microgroup] + change));
    });
  });
  
  return updated;
}

/**
 * Initialize default relationships (all start at 5 = neutral)
 */
export function initializeRelationships(): MicrogroupRelationships {
  return {
    hardcore_dem: 5,
    lean_dem: 5,
    swingable_dem: 5,
    hardcore_rep: 5,
    lean_rep: 5,
    swingable_rep: 5,
    hardcore_dem_indie: 5,
    lean_dem_indie: 5,
    swingable_indie: 5,
    lean_rep_indie: 5,
    hardcore_rep_indie: 5,
  };
}


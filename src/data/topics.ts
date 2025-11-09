// 20 Topics relevant to the 1976 Election
// Each topic represents a position you can be FOR or AGAINST
export const TOPICS = [
  { id: 'watergate', name: 'Government Accountability After Watergate' },
  { id: 'economy', name: 'Tax Cuts to Stimulate Economy' },
  { id: 'unemployment', name: 'Federal Jobs Programs' },
  { id: 'energy', name: 'Energy Independence & Conservation' },
  { id: 'taxes', name: 'Tax Relief for Middle Class' },
  { id: 'healthcare', name: 'National Health Insurance' },
  { id: 'education', name: 'Federal Education Funding' },
  { id: 'civil_rights', name: 'Federal Civil Rights Enforcement' },
  { id: 'foreign_policy', name: 'Strong Foreign Policy Leadership' },
  { id: 'defense', name: 'Increased Defense Spending' },
  { id: 'environment', name: 'Environmental Regulations' },
  { id: 'welfare', name: 'Expanded Welfare Programs' },
  { id: 'farm_policy', name: 'Farm Subsidies' },
  { id: 'labor', name: 'Union Rights & Collective Bargaining' },
  { id: 'crime', name: 'Tough on Crime Policies' },
  { id: 'gun_control', name: 'Gun Control Legislation' },
  { id: 'abortion', name: 'Support Roe v. Wade' },
  { id: 'urban_policy', name: 'Urban Aid & City Programs' },
  { id: 'government_size', name: 'Expanded Federal Government' },
  { id: 'moral_values', name: 'Traditional Family Values' },
] as const;

export type TopicId = typeof TOPICS[number]['id'];

// Microgroups
export type Microgroup = 
  | 'hardcore_dem'
  | 'lean_dem'
  | 'swingable_dem'
  | 'hardcore_rep'
  | 'lean_rep'
  | 'swingable_rep'
  | 'hardcore_dem_indie'
  | 'lean_dem_indie'
  | 'swingable_indie'
  | 'lean_rep_indie'
  | 'hardcore_rep_indie';

export const MICROGROUPS: Record<Microgroup, string> = {
  hardcore_dem: 'Hardcore Democrats',
  lean_dem: 'Lean Democrats',
  swingable_dem: 'Swingable Democrats',
  hardcore_rep: 'Hardcore Republicans',
  lean_rep: 'Lean Republicans',
  swingable_rep: 'Swingable Republicans',
  hardcore_dem_indie: 'Hardcore Dem Independents',
  lean_dem_indie: 'Lean Dem Independents',
  swingable_indie: 'Swingable Independents',
  lean_rep_indie: 'Lean Rep Independents',
  hardcore_rep_indie: 'Hardcore Rep Independents',
};

// Topic ratings for each microgroup (1-10 scale)
// 1 = completely turned off by this position, 10 = completely on board/top issue, 5 = ambivalent
// Ratings based on 1976 political context and positions
export const TOPIC_RATINGS: Record<Microgroup, Record<TopicId, number>> = {
  // Hardcore Democrats - strongly progressive, 77% voted for Carter
  // Strongly FOR: Watergate accountability, Civil Rights, Labor, Abortion Rights, Urban Aid, Federal Programs
  // AGAINST: Defense spending, Traditional values, Gun rights
  hardcore_dem: {
    watergate: 10,      // Top issue - government accountability after Watergate
    economy: 7,          // Tax cuts less important than jobs programs
    unemployment: 10,   // Top priority - federal jobs programs
    energy: 8,          // Energy independence important
    taxes: 7,           // Tax relief for middle class (not cuts for rich)
    healthcare: 10,     // Top priority - national health insurance
    education: 9,       // Strongly FOR federal education funding
    civil_rights: 10,  // Top priority - federal civil rights enforcement
    foreign_policy: 6,  // Moderate - less emphasis than domestic
    defense: 3,         // AGAINST increased defense spending
    environment: 9,     // Strongly FOR environmental regulations
    welfare: 9,         // Strongly FOR expanded welfare programs
    farm_policy: 7,     // Support farm price supports
    labor: 10,          // Top priority - union rights
    crime: 6,           // Moderate on tough crime policies
    gun_control: 9,     // Strongly FOR gun control legislation
    abortion: 10,       // Top priority - abortion rights (Roe v. Wade)
    urban_policy: 10,   // Top priority - urban aid programs
    government_size: 8, // FOR expanded federal government
    moral_values: 3,    // AGAINST traditional family values emphasis
  },
  
  // Lean Democrats - progressive but more moderate, still 77% for Carter
  // Similar to hardcore but more moderate on some issues
  lean_dem: {
    watergate: 9,       // Very important - government accountability
    economy: 8,         // Tax cuts more acceptable if for middle class
    unemployment: 9,   // Very important - federal jobs programs
    energy: 8,          // Energy independence important
    taxes: 8,          // Tax relief for middle class
    healthcare: 9,     // Very important - national health insurance
    education: 8,      // FOR federal education funding
    civil_rights: 9,   // Very important - federal civil rights enforcement
    foreign_policy: 7,  // Moderate support
    defense: 4,        // AGAINST increased defense spending
    environment: 8,    // FOR environmental regulations
    welfare: 8,        // FOR expanded welfare programs
    farm_policy: 8,    // Support farm price supports
    labor: 9,          // Very important - union rights
    crime: 7,          // Some support for tough crime policies
    gun_control: 8,    // FOR gun control legislation
    abortion: 8,       // FOR abortion rights
    urban_policy: 9,   // FOR urban aid programs
    government_size: 7, // FOR expanded federal government
    moral_values: 4,   // Less emphasis on traditional values
  },
  
  // Swingable Democrats - moderate, can be swayed, still majority for Carter
  // More focused on economy, less on social issues
  swingable_dem: {
    watergate: 7,      // Important but not top priority
    economy: 9,       // Top concern - economy and tax relief
    unemployment: 8,   // Important - federal jobs programs
    energy: 7,        // Energy independence
    taxes: 8,         // Tax relief for middle class
    healthcare: 7,    // Support national health insurance
    education: 7,     // Support federal education funding
    civil_rights: 7,  // Support federal civil rights enforcement
    foreign_policy: 7, // Moderate support
    defense: 5,       // Neutral on defense spending
    environment: 7,   // Support environmental regulations
    welfare: 6,       // Moderate support for welfare
    farm_policy: 7,   // Support farm price supports
    labor: 7,         // Support union rights
    crime: 7,         // Some support for tough crime policies
    gun_control: 6,   // Moderate support for gun control
    abortion: 6,      // Moderate support for abortion rights
    urban_policy: 7,  // Support urban aid
    government_size: 6, // Moderate support for expanded government
    moral_values: 5,  // Neutral on traditional values
  },
  
  // Hardcore Republicans - strongly conservative, 90% voted for Ford
  // Strongly FOR: Tax cuts, Defense, Crime, Traditional values, Foreign policy
  // AGAINST: Watergate focus, Federal programs, Civil rights enforcement, Abortion rights
  hardcore_rep: {
    watergate: 2,      // AGAINST dwelling on Watergate - want to move past
    economy: 9,        // Very important - tax cuts to stimulate economy
    unemployment: 4,  // AGAINST federal jobs programs - prefer private sector
    energy: 8,        // Support energy independence
    taxes: 10,        // Top priority - tax cuts
    healthcare: 2,    // AGAINST national health insurance
    education: 5,     // Prefer local control over federal funding
    civil_rights: 2,  // AGAINST federal civil rights enforcement
    foreign_policy: 10, // Top priority - strong foreign policy leadership
    defense: 10,      // Top priority - increased defense spending
    environment: 3,   // AGAINST environmental regulations (too restrictive)
    welfare: 2,       // AGAINST expanded welfare programs
    farm_policy: 8,   // Support farm price supports
    labor: 2,         // AGAINST union rights - prefer right-to-work
    crime: 10,        // Top priority - tough on crime policies
    gun_control: 2,   // AGAINST gun control legislation
    abortion: 2,      // AGAINST abortion rights - pro-life
    urban_policy: 3,  // AGAINST urban aid programs
    government_size: 2, // AGAINST expanded federal government
    moral_values: 10, // Top priority - traditional family values
  },
  
  // Lean Republicans - conservative but moderate, still 90% for Ford
  // Similar to hardcore but more moderate
  lean_rep: {
    watergate: 3,     // Want to move past Watergate
    economy: 9,      // Very important - tax cuts
    unemployment: 5, // Moderate - prefer private sector solutions
    energy: 8,       // Support energy independence
    taxes: 9,        // Very important - tax cuts
    healthcare: 3,   // AGAINST national health insurance
    education: 6,    // Prefer local control
    civil_rights: 3, // AGAINST federal civil rights enforcement
    foreign_policy: 9, // Very important - strong foreign policy
    defense: 9,      // Very important - increased defense spending
    environment: 5,  // Moderate - some regulations acceptable
    welfare: 3,      // AGAINST expanded welfare
    farm_policy: 8,  // Support farm price supports
    labor: 3,        // AGAINST union rights
    crime: 9,        // Very important - tough on crime
    gun_control: 3, // AGAINST gun control
    abortion: 3,     // AGAINST abortion rights
    urban_policy: 4, // AGAINST urban aid
    government_size: 3, // AGAINST expanded government
    moral_values: 9, // Very important - traditional values
  },
  
  // Swingable Republicans - moderate, can be swayed, still majority for Ford
  // More focused on economy, less on social issues
  swingable_rep: {
    watergate: 4,    // Want to move past but less strongly
    economy: 9,      // Top concern - tax cuts
    unemployment: 6,   // Moderate - some federal help acceptable
    energy: 7,       // Support energy independence
    taxes: 8,       // Important - tax cuts
    healthcare: 4,  // AGAINST national health insurance
    education: 6,   // Moderate - some federal funding okay
    civil_rights: 4, // AGAINST federal enforcement
    foreign_policy: 8, // Important - strong foreign policy
    defense: 8,     // Important - increased defense spending
    environment: 6, // Moderate - some regulations okay
    welfare: 4,     // AGAINST expanded welfare
    farm_policy: 7, // Support farm price supports
    labor: 4,       // AGAINST union rights
    crime: 8,      // Important - tough on crime
    gun_control: 4, // AGAINST gun control
    abortion: 4,    // AGAINST abortion rights
    urban_policy: 5, // Moderate - some urban aid okay
    government_size: 4, // AGAINST expanded government
    moral_values: 8, // Important - traditional values
  },
  
  // Hardcore Dem Independents - progressive independents, likely voted for Carter
  // Similar to hardcore Dems but slightly more moderate
  hardcore_dem_indie: {
    watergate: 9,    // Very important - government accountability
    economy: 7,      // Tax cuts less important
    unemployment: 9, // Very important - federal jobs programs
    energy: 8,      // Energy independence
    taxes: 7,       // Tax relief for middle class
    healthcare: 9,  // Very important - national health insurance
    education: 8,   // FOR federal education funding
    civil_rights: 9, // Very important - federal civil rights enforcement
    foreign_policy: 6, // Moderate
    defense: 4,     // AGAINST increased defense spending
    environment: 9, // Very important - environmental regulations
    welfare: 9,     // FOR expanded welfare programs
    farm_policy: 7, // Support farm price supports
    labor: 9,       // Very important - union rights
    crime: 6,      // Moderate on crime
    gun_control: 8, // FOR gun control
    abortion: 9,   // Very important - abortion rights
    urban_policy: 9, // FOR urban aid
    government_size: 7, // FOR expanded government
    moral_values: 4, // Less emphasis on traditional values
  },
  
  // Lean Dem Independents - moderate progressive, split between Carter and Ford
  // More focused on economy
  lean_dem_indie: {
    watergate: 8,   // Important - government accountability
    economy: 9,     // Top concern - economy and tax relief
    unemployment: 8, // Important - federal jobs programs
    energy: 8,     // Energy independence
    taxes: 7,      // Tax relief for middle class
    healthcare: 8, // Important - national health insurance
    education: 7,  // Support federal education funding
    civil_rights: 8, // Important - federal civil rights enforcement
    foreign_policy: 7, // Moderate support
    defense: 5,    // Neutral on defense spending
    environment: 8, // Important - environmental regulations
    welfare: 8,    // Support expanded welfare
    farm_policy: 7, // Support farm price supports
    labor: 8,      // Important - union rights
    crime: 7,     // Some support for tough crime
    gun_control: 7, // Support gun control
    abortion: 7,  // Support abortion rights
    urban_policy: 8, // Support urban aid
    government_size: 6, // Moderate support for expanded government
    moral_values: 5, // Neutral on traditional values
  },
  
  // Swingable Independents - true swing voters, 43% Carter, 54% Ford
  // Focused on economy, neutral on most social issues
  swingable_indie: {
    watergate: 6,   // Moderate - want accountability but move forward
    economy: 10,    // Top priority - economy and tax relief
    unemployment: 9, // Very important - jobs
    energy: 7,     // Energy independence
    taxes: 7,      // Tax relief important
    healthcare: 6,  // Moderate - some national health insurance okay
    education: 6,  // Moderate - some federal funding okay
    civil_rights: 6, // Moderate - some federal enforcement okay
    foreign_policy: 7, // Moderate support
    defense: 6,    // Moderate - some defense spending okay
    environment: 6, // Moderate - some regulations okay
    welfare: 6,    // Slightly positive on welfare
    farm_policy: 6, // Support farm price supports
    labor: 5,      // Neutral on union rights
    crime: 7,     // Some support for tough crime
    gun_control: 5, // Neutral on gun control
    abortion: 5,  // Neutral on abortion
    urban_policy: 5, // Neutral on urban aid
    government_size: 5, // Neutral on expanded government
    moral_values: 6, // Moderate - some traditional values okay
  },
  
  // Lean Rep Independents - moderate conservative, likely voted for Ford
  // Similar to lean Reps but slightly more moderate
  lean_rep_indie: {
    watergate: 3,  // Want to move past Watergate
    economy: 9,    // Very important - tax cuts
    unemployment: 6, // Moderate - prefer private sector
    energy: 8,    // Energy independence
    taxes: 8,     // Important - tax cuts
    healthcare: 3, // AGAINST national health insurance
    education: 6, // Prefer local control
    civil_rights: 3, // AGAINST federal enforcement
    foreign_policy: 9, // Very important - strong foreign policy
    defense: 8,   // Important - increased defense spending
    environment: 5, // Moderate - some regulations okay
    welfare: 2,   // AGAINST expanded welfare
    farm_policy: 8, // Support farm price supports
    labor: 3,     // AGAINST union rights
    crime: 8,     // Important - tough on crime
    gun_control: 3, // AGAINST gun control
    abortion: 3,  // AGAINST abortion rights
    urban_policy: 4, // AGAINST urban aid
    government_size: 3, // AGAINST expanded government
    moral_values: 8, // Important - traditional values
  },
  
  // Hardcore Rep Independents - conservative independents, likely voted for Ford
  // Similar to hardcore Reps
  hardcore_rep_indie: {
    watergate: 2,  // AGAINST dwelling on Watergate
    economy: 8,    // Important - tax cuts
    unemployment: 4, // AGAINST federal jobs programs
    energy: 8,    // Energy independence
    taxes: 9,     // Very important - tax cuts
    healthcare: 2, // AGAINST national health insurance
    education: 5, // Prefer local control
    civil_rights: 2, // AGAINST federal enforcement
    foreign_policy: 9, // Very important - strong foreign policy
    defense: 9,   // Very important - increased defense spending
    environment: 3, // AGAINST environmental regulations
    welfare: 1,   // AGAINST expanded welfare
    farm_policy: 8, // Support farm price supports
    labor: 2,     // AGAINST union rights
    crime: 9,     // Very important - tough on crime
    gun_control: 2, // AGAINST gun control
    abortion: 2,  // AGAINST abortion rights
    urban_policy: 3, // AGAINST urban aid
    government_size: 2, // AGAINST expanded government
    moral_values: 9, // Very important - traditional values
  },
};


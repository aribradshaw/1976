// News headlines for each week of the 1976 campaign
// Week 1 is the first week, Week 25 is election week (Nov 2, 1976)
// Dates are mapped to the Tuesday of each week

export interface NewsHeadline {
  headline: string;
  week: number;
}

export const NEWS_HEADLINES: NewsHeadline[] = [
  // Week 1 - May 18, 1976
  { headline: 'Houston Ammonia Truck Disaster Kills 5 in Chemical Leak', week: 1 },
  { headline: 'Pan Am 747SP Sets New World Record for Commercial Flight Speed', week: 1 },
  { headline: 'El País Newspaper Launches as Spain\'s Leading Daily', week: 1 },
  { headline: 'Soviet Union Launches Salyut 5 Military Space Station', week: 1 },
  { headline: 'US Celebrates Memorial Day with Nationwide Parades', week: 1 },
  { headline: 'Billboard Hot 100: "Boogie Fever" by The Sylvers Reaches #1', week: 1 },
  { headline: 'Box Office: <i>All the President\'s Men</i> Stays at #1', week: 1 },
  
  // Week 2 - May 25, 1976
  { headline: 'UK and Iceland Resolve Cod Wars Fishery Dispute with Agreement', week: 2 },
  { headline: 'International Whaling Commission Meets to Debate Quotas', week: 2 },
  { headline: 'US Economy Shows Signs of Recovery Amid Inflation Fears', week: 2 },
  { headline: 'New York Times Reports on Rising Crime Rates in Major Cities', week: 2 },
  { headline: 'Supreme Court Rules on Key Labor Rights Case', week: 2 },
  { headline: 'Billboard Hot 100: "Silly Love Songs" by Wings Reaches #1', week: 2 },
  { headline: 'Box Office: <i>All the President\'s Men</i> Stays at #1', week: 2 },
  
  // Week 3 - Jun 01, 1976
  { headline: 'Soweto Student Protests Erupt Against Apartheid Education Policies', week: 3 },
  { headline: 'US Unemployment Dips Slightly in Latest Labor Report', week: 3 },
  { headline: 'NASA Prepares for Viking Mission Milestones to Mars', week: 3 },
  { headline: 'International Trade Talks Stall Over Tariff Disputes', week: 3 },
  { headline: 'Hollywood Releases \'The Omen\' Horror Film to Critical Acclaim', week: 3 },
  { headline: 'Billboard Hot 100: "Love Hangover" by Diana Ross Reaches #1', week: 3 },
  { headline: 'Box Office: <i>The Missouri Breaks</i> Reaches #1', week: 3 },
  
  // Week 4 - Jun 08, 1976
  { headline: 'Soweto Uprising Continues with Clashes in Johannesburg', week: 4 },
  { headline: 'Concorde Supersonic Jet Completes Successful Transatlantic Test', week: 4 },
  { headline: 'US Bicentennial Preparations Ramp Up for July Celebrations', week: 4 },
  { headline: 'Chicago Cubs Fire Manager Jim Hickman After Slump', week: 4 },
  { headline: 'UN Debates Arms Control Measures in Geneva', week: 4 },
  { headline: 'Billboard Hot 100: "Love Hangover" by Diana Ross Stays at #1', week: 4 },
  { headline: 'Box Office: <i>The Missouri Breaks</i> Stays at #1', week: 4 },
  
  // Week 5 - Jun 15, 1976
  { headline: 'Soweto Death Toll Rises as Protests Spread Across South Africa', week: 5 },
  { headline: 'PGA Tour Hosts US Open Golf at Pebble Beach', week: 5 },
  { headline: 'US Inflation Rate Holds Steady at 5.7 Percent', week: 5 },
  { headline: 'New York Yankees Acquire Slugger Willie Randolph', week: 5 },
  { headline: 'International Tennis Federation Announces Wimbledon Draw', week: 5 },
  { headline: 'Billboard Hot 100: "Silly Love Songs" by Wings Returns to #1', week: 5 },
  { headline: 'Box Office: <i>Mother, Jugs & Speed</i> Reaches #1', week: 5 },
  
  // Week 6 - Jun 22, 1976
  { headline: 'South African Government Declares State of Emergency in Soweto', week: 6 },
  { headline: 'US Approves $2 Bill for Bicentennial Circulation', week: 6 },
  { headline: 'NASA Viking 1 Orbiter Captures First Close-Ups of Mars', week: 6 },
  { headline: 'Montreal Prepares for Summer Olympics Amid Boycott Threats', week: 6 },
  { headline: 'Boxing Champ Muhammad Ali Trains for Upcoming Bout', week: 6 },
  { headline: 'Billboard Hot 100: "Silly Love Songs" by Wings Stays at #1', week: 6 },
  { headline: 'Box Office: <i>Midway</i> Reaches #1', week: 6 },
  
  // Week 7 - Jun 29, 1976
  { headline: 'Viking 1 Lander Touches Down on Martian Surface Successfully', week: 7 },
  { headline: 'US Heat Wave Grips Midwest with Record Temperatures', week: 7 },
  { headline: 'International Olympic Committee Addresses African Boycott', week: 7 },
  { headline: 'New York Mets Struggling in NL East Standings', week: 7 },
  { headline: 'UK Punk Rock Scene Explodes with Sex Pistols Concert Chaos', week: 7 },
  { headline: 'Billboard Hot 100: "Silly Love Songs" by Wings Stays at #1', week: 7 },
  { headline: 'Box Office: <i>The Omen</i> Reaches #1', week: 7 },
  
  // Week 8 - Jul 06, 1976
  { headline: 'Viking 1 Transmits First Images from Mars Surface', week: 8 },
  { headline: 'US Celebrates Independence Day with Massive Bicentennial Parades', week: 8 },
  { headline: 'Queen Elizabeth II Arrives for Official US Bicentennial Visit', week: 8 },
  { headline: 'Montreal Olympics Open Amid Global Tensions', week: 8 },
  { headline: 'Fireworks Displays Light Up Skies Across American Cities', week: 8 },
  { headline: 'Billboard Hot 100: "Silly Love Songs" by Wings Stays at #1', week: 8 },
  { headline: 'Box Office: <i>The Omen</i> Stays at #1', week: 8 },
  
  // Week 9 - Jul 13, 1976
  { headline: 'Montreal Olympics Underway with Swimming and Track Events', week: 9 },
  { headline: 'US Swimmer John Naber Wins Gold in 100m Backstroke', week: 9 },
  { headline: 'Canadian Bruce Jenner Sets Decathlon World Record', week: 9 },
  { headline: 'Nadia Comaneci Scores Perfect 10 in Gymnastics Uneven Bars', week: 9 },
  { headline: 'Olympic Boycotts by African Nations Disrupt Events', week: 9 },
  { headline: 'Billboard Hot 100: "Afternoon Delight" by Starland Vocal Band Reaches #1', week: 9 },
  { headline: 'Box Office: <i>The Omen</i> Stays at #1', week: 9 },
  
  // Week 10 - Jul 20, 1976
  { headline: 'Tangshan Earthquake Devastates China, Thousands Feared Dead', week: 10 },
  { headline: 'Nadia Comaneci Makes History with Multiple Perfect Scores', week: 10 },
  { headline: 'US Boxer Sugar Ray Leonard Wins Olympic Gold', week: 10 },
  { headline: 'Montreal Olympics Feature Record TV Viewership', week: 10 },
  { headline: 'International Aid Pledges Pour in for Chinese Quake Victims', week: 10 },
  { headline: 'Billboard Hot 100: "Afternoon Delight" by Starland Vocal Band Stays at #1', week: 10 },
  { headline: 'Box Office: <i>The Omen</i> Stays at #1', week: 10 },
  
  // Week 11 - Jul 27, 1976
  { headline: 'Legionnaires\' Disease Outbreak Hits Philadelphia Convention', week: 11 },
  { headline: 'Montreal Olympics Close with East Germany Topping Medals', week: 11 },
  { headline: 'Death Toll from Tangshan Quake Rises to Over 240,000', week: 11 },
  { headline: 'US Economy Grows 4.1 Percent in Second Quarter', week: 11 },
  { headline: 'Bob Marley Shot in Assassination Attempt in Jamaica', week: 11 },
  { headline: 'Billboard Hot 100: "Kiss and Say Goodbye" by The Manhattans Reaches #1', week: 11 },
  { headline: 'Box Office: <i>The Omen</i> Stays at #1', week: 11 },
  
  // Week 12 - Aug 03, 1976
  { headline: 'Viking 2 Launches Toward Mars for Second Landing Mission', week: 12 },
  { headline: 'US Reports First Cases of Mysterious Legionnaires\' Illness', week: 12 },
  { headline: 'China Begins Massive Recovery Efforts After Tangshan Quake', week: 12 },
  { headline: 'New York Yankees Fire Billy Martin as Manager', week: 12 },
  { headline: 'International Space Experts Praise Viking Photos of Mars', week: 12 },
  { headline: 'Billboard Hot 100: "Kiss and Say Goodbye" by The Manhattans Stays at #1', week: 12 },
  { headline: 'Box Office: <i>The Exorcist (reissue)</i> Reaches #1', week: 12 },
  
  // Week 13 - Aug 10, 1976
  { headline: 'Elvis Presley Announces Final Concert Tour Dates', week: 13 },
  { headline: 'US Heat Dome Causes Power Outages in Northeast', week: 13 },
  { headline: 'Viking 2 En Route to Mars, Expected Landing in September', week: 13 },
  { headline: 'Philadelphia Investigates Deadly Convention Illness', week: 13 },
  { headline: 'UK Heat Wave Breaks Temperature Records in London', week: 13 },
  { headline: 'Billboard Hot 100: "Don\'t Go Breaking My Heart" by Elton John and Kiki Dee Reaches #1', week: 13 },
  { headline: 'Box Office: <i>Silent Movie</i> Reaches #1', week: 13 },
  
  // Week 14 - Aug 17, 1976
  { headline: 'Tsunami Hits Mindanao in Philippines, Causing Widespread Damage', week: 14 },
  { headline: 'Viking 2 Orbiter Begins Maneuvers Near Mars', week: 14 },
  { headline: 'US Inflation Concerns Ease with Lower July Figures', week: 14 },
  { headline: 'New York Times Publishes Exposé on Corporate Corruption', week: 14 },
  { headline: 'Olympic Aftermath: Doping Scandals Emerge in Track', week: 14 },
  { headline: 'Billboard Hot 100: "Don\'t Go Breaking My Heart" by Elton John and Kiki Dee Stays at #1', week: 14 },
  { headline: 'Box Office: <i>Silent Movie</i> Stays at #1', week: 14 },
  
  // Week 15 - Aug 24, 1976
  { headline: 'US GDP Growth Accelerates to 2.6 Percent in Third Quarter', week: 15 },
  { headline: 'Philadelphia Legionnaires\' Cases Climb to 150', week: 15 },
  { headline: 'China Reveals Partial Tangshan Quake Death Toll', week: 15 },
  { headline: 'NASA Analyzes Viking Data for Signs of Martian Life', week: 15 },
  { headline: 'Box Office Hit: \'Rocky\' Premieres in Los Angeles', week: 15 },
  { headline: 'Billboard Hot 100: "Don\'t Go Breaking My Heart" by Elton John and Kiki Dee Stays at #1', week: 15 },
  { headline: 'Box Office: <i>Silent Movie</i> Stays at #1', week: 15 },
  
  // Week 16 - Aug 31, 1976
  { headline: 'US Labor Day Weekend Sees Record Travel Despite Fuel Costs', week: 16 },
  { headline: 'Viking 2 Lander Prepares for September Mars Touchdown', week: 16 },
  { headline: 'Philadelphia Quarantines Legion Convention Site', week: 16 },
  { headline: 'International Whaling Ban Debated at Tokyo Summit', week: 16 },
  { headline: 'Chicago Bears Open NFL Season with New Roster', week: 16 },
  { headline: 'Billboard Hot 100: "Don\'t Go Breaking My Heart" by Elton John and Kiki Dee Stays at #1', week: 16 },
  { headline: 'Box Office: <i>Silent Movie</i> Stays at #1', week: 16 },
  
  // Week 17 - Sep 07, 1976
  { headline: 'Viking 2 Lander Successfully Deploys on Mars Utopia Planitia', week: 17 },
  { headline: 'Mao Zedong\'s Health Rumors Spark Global Speculation', week: 17 },
  { headline: 'US Unemployment Falls to 7.3 Percent in August', week: 17 },
  { headline: 'New York Yankees Rehire Billy Martin as Manager', week: 17 },
  { headline: 'UN General Assembly Opens with Focus on Developing Nations', week: 17 },
  { headline: 'Billboard Hot 100: "You Should Be Dancing" by Bee Gees Reaches #1', week: 17 },
  { headline: 'Box Office: <i>Survive!</i> Reaches #1', week: 17 },
  
  // Week 18 - Sep 14, 1976
  { headline: 'Mao Zedong Dies at 82, Ending Era in Chinese Politics', week: 18 },
  { headline: 'Viking 2 Sends Back Stunning Images of Martian Landscape', week: 18 },
  { headline: 'US Stock Market Hits New Highs Amid Economic Optimism', week: 18 },
  { headline: 'Philadelphia Legion Disease Linked to Bacteria in Water', week: 18 },
  { headline: 'International Aid Flows to China After Mao\'s Death', week: 18 },
  { headline: 'Billboard Hot 100: "(Shake, Shake, Shake) Shake Your Booty" by KC and the Sunshine Band Reaches #1', week: 18 },
  { headline: 'Box Office: <i>Obsession</i> Reaches #1', week: 18 },
  
  // Week 19 - Sep 21, 1976
  { headline: 'US Reports Over 200 Legionnaires\' Cases, 29 Fatalities', week: 19 },
  { headline: 'China Mourns Mao with Nationwide Week of Silence', week: 19 },
  { headline: 'NASA Viking Missions Detect Possible Organic Traces on Mars', week: 19 },
  { headline: 'New York Mets Clinch NL East Title in Dramatic Finish', week: 19 },
  { headline: 'UK InterCity 125 High-Speed Train Debuts on Tracks', week: 19 },
  { headline: 'Billboard Hot 100: "(Shake, Shake, Shake) Shake Your Booty" by KC and the Sunshine Band Stays at #1', week: 19 },
  { headline: 'Box Office: <i>Obsession</i> Stays at #1', week: 19 },
  
  // Week 20 - Sep 28, 1976
  { headline: 'US Economy Posts Strongest Growth in Two Years', week: 20 },
  { headline: 'Philadelphia Declares Legion Outbreak Under Control', week: 20 },
  { headline: 'China Appoints Hua Guofeng as New Communist Leader', week: 20 },
  { headline: 'Viking 2 Arm Fails, But Lander Continues Operations', week: 20 },
  { headline: 'World Series Preview: Yankees Favored Over Royals', week: 20 },
  { headline: 'Billboard Hot 100: "Play That Funky Music" by Wild Cherry Reaches #1', week: 20 },
  { headline: 'Box Office: <i>Alice in Wonderland</i> Reaches #1', week: 20 },
  
  // Week 21 - Oct 05, 1976
  { headline: 'InterCity 125 Sets Speed Record in UK Rail Trials', week: 21 },
  { headline: 'US Jobless Rate Drops to 7.0 Percent in September', week: 21 },
  { headline: 'China Begins Political Transition After Mao\'s Death', week: 21 },
  { headline: 'New York Yankees Advance in AL Playoffs', week: 21 },
  { headline: 'International Monetary Fund Meets on Global Currency Issues', week: 21 },
  { headline: 'Billboard Hot 100: "Play That Funky Music" by Wild Cherry Stays at #1', week: 21 },
  { headline: 'Box Office: <i>Burnt Offerings</i> Reaches #1', week: 21 },
  
  // Week 22 - Oct 12, 1976
  { headline: 'Cincinnati Reds Sweep Yankees to Win World Series', week: 22 },
  { headline: 'US Inflation Dips to 5.5 Percent in Latest Report', week: 22 },
  { headline: 'Viking Missions Extended for Additional Martian Data', week: 22 },
  { headline: 'UN Condemns South African Apartheid Policies', week: 22 },
  { headline: 'Hollywood Buzz: \'Network\' Film Premieres to Oscar Buzz', week: 22 },
  { headline: 'Billboard Hot 100: "A Fifth of Beethoven" by Walter Murphy and the Big Apple Band Reaches #1', week: 22 },
  { headline: 'Box Office: <i>Alice in Wonderland</i> Returns to #1', week: 22 },
  
  // Week 23 - Oct 19, 1976
  { headline: 'US GDP Surges 4.0 Percent in Third Quarter Final Figures', week: 23 },
  { headline: 'Philadelphia Legion Probe Points to Cooling Tower Bacteria', week: 23 },
  { headline: 'China\'s Gang of Four Arrested in Power Struggle', week: 23 },
  { headline: 'Kansas City Royals Fall Short in World Series Rematch', week: 23 },
  { headline: 'International Space Station Concept Discussed at NASA', week: 23 },
  { headline: 'Billboard Hot 100: "Disco Duck" by Rick Dees and His Cast of Idiots Reaches #1', week: 23 },
  { headline: 'Box Office: <i>Marathon Man</i> Reaches #1', week: 23 },
  
  // Week 24 - Oct 26, 1976
  { headline: 'US Prepares for Daylight Saving Time End with Clock Changes', week: 24 },
  { headline: 'Viking 1 Enters Extended Mission on Mars Surface', week: 24 },
  { headline: 'China Stabilizes Leadership Under Hua Guofeng', week: 24 },
  { headline: 'New York Knicks Open NBA Season with Revamped Lineup', week: 24 },
  { headline: 'Global Oil Prices Stabilize After OPEC Meeting', week: 24 },
  { headline: 'Billboard Hot 100: "If You Leave Me Now" by Chicago Reaches #1', week: 24 },
  { headline: 'Box Office: <i>Marathon Man</i> Stays at #1', week: 24 },
  
  // Week 25 - Nov 02, 1976 (Election Day)
  { headline: 'Viking 2 Extended Mission Approved for Mars Exploration', week: 25 },
  { headline: 'US Unemployment Hits 6.7 Percent Low for the Year', week: 25 },
  { headline: 'China Cracks Down on Political Dissent Post-Mao', week: 25 },
  { headline: 'NFL Midseason: Dallas Cowboys Lead NFC East', week: 25 },
  { headline: 'Stock Market Rally Continues Amid Holiday Optimism', week: 25 },
  { headline: 'Billboard Hot 100: "If You Leave Me Now" by Chicago Stays at #1', week: 25 },
  { headline: 'Box Office: <i>Marathon Man</i> Stays at #1', week: 25 },
];

/**
 * Get news headlines for a specific week
 */
export function getHeadlinesForWeek(week: number): string[] {
  return NEWS_HEADLINES
    .filter(item => item.week === week)
    .map(item => item.headline);
}

/**
 * Get random headlines for a week (up to 5 headlines)
 */
export function getRandomHeadlinesForWeek(week: number, count: number = 5): string[] {
  const weekHeadlines = getHeadlinesForWeek(week);
  if (weekHeadlines.length === 0) {
    // Fallback to generic headlines if no specific headlines for this week
    return [
      'Campaign Trail Continues',
      'Election Season Heats Up',
      'Candidates Make Final Push',
      'Voters Prepare to Decide',
      '1976 Election Campaign Intensifies',
    ];
  }
  
  // Shuffle and return up to count headlines
  const shuffled = [...weekHeadlines].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

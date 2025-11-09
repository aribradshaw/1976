import csv
import re
from pathlib import Path

# Parse statepops_1976.csv
state_pops = {}
with open('voterdata/statepops_1976.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        state_name = row['State'].strip()
        state_pops[state_name] = {
            '1970': int(row['Population_1970']),
            '1980': int(row['Population_1980']),
            '1976': int(row['Population_1976_Estimated'])
        }

# Parse actualresults.txt
actual_results = {}
with open('voterdata/actualresults.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('TOTALS') or line.startswith('Maine allowed'):
            continue
        
        # Parse the tab-separated data
        parts = line.split('\t')
        if len(parts) < 10:
            continue
        
        state_name = parts[0].strip()
        # Remove † symbol if present
        state_name = state_name.replace('†', '').strip()
        # Skip Maine-1 and Maine-2 (we'll use Maine)
        if 'Maine-' in state_name:
            continue
        
        try:
            def safe_int(s):
                if not s or s == '—' or s == '–' or s.strip() == '':
                    return 0
                # Remove commas and special characters
                s = s.replace(',', '').replace('−', '-').replace('–', '-').replace('—', '')
                try:
                    return int(s)
                except:
                    return 0
            
            def safe_float(s):
                if not s or s == '—' or s == '–' or s.strip() == '':
                    return 0.0
                # Remove commas and handle special minus signs
                s = s.replace(',', '').replace('−', '-').replace('–', '-').replace('—', '')
                try:
                    return float(s)
                except:
                    return 0.0
            
            # Column structure: State, CarterEV, CarterVotes, Carter%, FordEV, FordVotes, Ford%, 
            # Other1EV, Other1Votes, Other1%, Other2EV, Other2Votes, Other2%, MarginVotes, Margin%, Turnout%, TotalVotes, Abbrev
            ev = safe_int(parts[1])  # Carter EV (winner gets all)
            carter_votes = safe_int(parts[2])
            carter_pct = safe_float(parts[3])
            ford_ev = safe_int(parts[4])
            ford_votes = safe_int(parts[5])
            ford_pct = safe_float(parts[6])
            # Other votes are in parts[11] (after 4 dashes)
            other_votes = safe_int(parts[11]) if len(parts) > 11 else 0
            other_pct = safe_float(parts[12]) if len(parts) > 12 else 0
            margin = safe_float(parts[14]) if len(parts) > 14 else 0  # Margin votes is in parts[14]
            margin_pct = safe_float(parts[15]) if len(parts) > 15 else 0  # Margin % is in parts[15]
            turnout_pct = safe_float(parts[16]) if len(parts) > 16 else 0  # Turnout % is in parts[16]
            total_votes = safe_int(parts[17]) if len(parts) > 17 else (carter_votes + ford_votes + other_votes)  # Total votes is in parts[17]
            abbrev = parts[-1].strip() if len(parts) > 0 else ''  # Abbreviation is the last column
            
            if abbrev:
                actual_results[abbrev] = {
                    'name': state_name,
                    'ev': ev,
                    'carter_votes': carter_votes,
                    'carter_pct': carter_pct,
                    'ford_votes': ford_votes,
                    'ford_pct': ford_pct,
                    'other_votes': other_votes,
                    'other_pct': other_pct,
                    'margin': margin,
                    'turnout_pct': turnout_pct,
                    'total_votes': total_votes,
                    'abbrev': abbrev
                }
                print(f"Parsed {abbrev}: {state_name} - Carter: {carter_pct:.1f}%, Ford: {ford_pct:.1f}%")
        except (ValueError, IndexError) as e:
            print(f"Error parsing line: {line[:80]}... Error: {e}")
            continue

print(f"\nParsed {len(actual_results)} states from actualresults.txt")

# State name mapping (actualresults.txt to statepops.csv)
state_name_map = {
    'Alabama': 'Alabama',
    'Alaska': 'Alaska',
    'Arizona': 'Arizona',
    'Arkansas': 'Arkansas',
    'California': 'California',
    'Colorado': 'Colorado',
    'Connecticut': 'Connecticut',
    'Delaware': 'Delaware',
    'D.C.': 'District of Columbia',
    'Florida': 'Florida',
    'Georgia': 'Georgia',
    'Hawaii': 'Hawaii',
    'Idaho': 'Idaho',
    'Illinois': 'Illinois',
    'Indiana': 'Indiana',
    'Iowa': 'Iowa',
    'Kansas': 'Kansas',
    'Kentucky': 'Kentucky',
    'Louisiana': 'Louisiana',
    'Maine': 'Maine',
    'Maryland': 'Maryland',
    'Massachusetts': 'Massachusetts',
    'Michigan': 'Michigan',
    'Minnesota': 'Minnesota',
    'Mississippi': 'Mississippi',
    'Missouri': 'Missouri',
    'Montana': 'Montana',
    'Nebraska': 'Nebraska',
    'Nevada': 'Nevada',
    'New Hampshire': 'New Hampshire',
    'New Jersey': 'New Jersey',
    'New Mexico': 'New Mexico',
    'New York': 'New York',
    'North Carolina': 'North Carolina',
    'North Dakota': 'North Dakota',
    'Ohio': 'Ohio',
    'Oklahoma': 'Oklahoma',
    'Oregon': 'Oregon',
    'Pennsylvania': 'Pennsylvania',
    'Rhode Island': 'Rhode Island',
    'South Carolina': 'South Carolina',
    'South Dakota': 'South Dakota',
    'Tennessee': 'Tennessee',
    'Texas': 'Texas',
    'Utah': 'Utah',
    'Vermont': 'Vermont',
    'Virginia': 'Virginia',
    'Washington': 'Washington',
    'West Virginia': 'West Virginia',
    'Wisconsin': 'Wisconsin',
    'Wyoming': 'Wyoming',
}

# Read roper table for national demographics (used as baseline)
roper_data = {}
with open('voterdata/roper_1976_table_1.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        category = row.get('1976', '') or row.get('Group', '')
        if category and category.strip():
            carter_val = row.get('Carter', '') or ''
            ford_val = row.get('Ford', '') or ''
            if carter_val or ford_val:
                roper_data[category.strip()] = {
                    'carter': carter_val.strip() if carter_val else '',
                    'ford': ford_val.strip() if ford_val else ''
                }

# Get all state files
state_files = list(Path('src/states').glob('*.ts'))
state_files = [f for f in state_files if f.name != 'StateData.ts' and f.name != 'index.ts']

print(f"Found {len(state_files)} state files to update")

# Update each state file
for state_file in state_files:
    state_name_from_file = state_file.stem
    # Convert filename to abbreviation (e.g., "Alabama.ts" -> "AL")
    # We need to map from filename to abbreviation
    
    # Read the current file to get the abbreviation
    with open(state_file, 'r', encoding='utf-8') as f:
        content = f.read()
        # Extract abbreviation from the file
        abbrev_match = re.search(r"abbreviation:\s*['\"]([A-Z]{2})['\"]", content)
        if not abbrev_match:
            print(f"Could not find abbreviation in {state_file.name}")
            continue
        
        abbrev = abbrev_match.group(1)
        
        # Get data for this state
        result = actual_results.get(abbrev)
        if not result:
            print(f"No results found for {abbrev}")
            continue
        
        # Get population data
        state_name = result['name']
        pop_key = state_name_map.get(state_name, state_name)
        pop_data = state_pops.get(pop_key)
        
        if not pop_data:
            print(f"No population data for {state_name} ({pop_key})")
            continue
        
        # Calculate demographics based on actual results
        # Democratic base = Carter percentage
        # Republican base = Ford percentage
        # Independent/undecided = remaining
        dem_base = result['carter_pct']
        rep_base = result['ford_pct']
        other_base = result['other_pct']
        undecided = max(0, 100 - dem_base - rep_base - other_base)
        
        # Calculate voting eligible and turnout
        # Estimate: about 70% of population is voting eligible (18+)
        voting_eligible = int(pop_data['1976'] * 0.70)
        
        # Calculate actual turnout percentage from total votes
        actual_turnout_pct = (result['total_votes'] / voting_eligible * 100) if voting_eligible > 0 else 0
        
        # Use the calculated turnout if it's reasonable (between 30-80%), otherwise use provided value
        if 30 <= actual_turnout_pct <= 80:
            turnout_pct = actual_turnout_pct
        elif result['turnout_pct'] > 30 and result['turnout_pct'] < 80:
            turnout_pct = result['turnout_pct']
        else:
            # Default to a reasonable turnout for 1976
            turnout_pct = 55.0
        
        registered_voters = int(voting_eligible * 0.85)  # Estimate 85% registration rate
        
        # Regional factors (rough estimates based on state characteristics)
        # These would ideally come from census data, but we'll use reasonable defaults
        urban_pct = 70 if result['ev'] >= 20 else (60 if result['ev'] >= 10 else 50)
        rural_pct = 100 - urban_pct
        # Swing voters based on margin percentage (not votes)
        swing_pct = min(20, abs(result['margin']) / 2)  # Cap at 20%
        
        # Campaign modifiers (based on state size and competitiveness)
        media_cost = 1.0 if result['ev'] >= 20 else (0.9 if result['ev'] >= 10 else 0.8)
        event_effectiveness = 1.0 if result['ev'] < 10 else 0.9
        fundraising = 1.0 if result['ev'] >= 20 else 0.9
        
        # Build the updated state data
        new_content = f"""import {{ createStateData }} from './StateData';

export const {state_name_from_file} = createStateData({{
  name: '{result['name']}',
  abbreviation: '{abbrev}',
  electoralVotes: {result['ev']},
  population: {{
    total: {pop_data['1976']},
    votingEligible: {voting_eligible},
    registeredVoters: {registered_voters},
  }},
  demographics: {{
    democraticBase: {dem_base:.1f},
    republicanBase: {rep_base:.1f},
    independent: {other_base:.1f},
    undecided: {undecided:.1f},
  }},
  historicalData: {{
    previousElectionResults: {{
      dem: {dem_base:.2f},
      rep: {rep_base:.2f},
      other: {other_base:.2f},
    }},
    turnoutRate: {turnout_pct:.2f},
  }},
  campaignModifiers: {{
    mediaMarketCost: {media_cost:.1f},
    eventEffectiveness: {event_effectiveness:.1f},
    fundraisingPotential: {fundraising:.1f},
  }},
  regionalFactors: {{
    urbanPercentage: {urban_pct},
    ruralPercentage: {rural_pct},
    swingVoterPercentage: {swing_pct:.1f},
  }},
}});
"""
        
        # Write the updated file
        with open(state_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Updated {state_file.name} ({abbrev})")

print("\nAll state files updated!")


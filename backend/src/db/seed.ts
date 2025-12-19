import { db, providers, bookings, type NewProvider, type WorkingHours, type ProviderGeo } from './index';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// ============================================================================
// WORKING HOURS TEMPLATES
// ============================================================================

const standardHours: WorkingHours = {
  monday: { open: '09:00', close: '17:00' },
  tuesday: { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday: { open: '09:00', close: '17:00' },
  friday: { open: '09:00', close: '17:00' },
  saturday: null,
  sunday: null,
};

const extendedHours: WorkingHours = {
  monday: { open: '08:00', close: '20:00' },
  tuesday: { open: '08:00', close: '20:00' },
  wednesday: { open: '08:00', close: '20:00' },
  thursday: { open: '08:00', close: '20:00' },
  friday: { open: '08:00', close: '20:00' },
  saturday: { open: '09:00', close: '17:00' },
  sunday: null,
};

const weekendHours: WorkingHours = {
  monday: { open: '10:00', close: '18:00' },
  tuesday: { open: '10:00', close: '18:00' },
  wednesday: { open: '10:00', close: '18:00' },
  thursday: { open: '10:00', close: '18:00' },
  friday: { open: '10:00', close: '18:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: { open: '12:00', close: '16:00' },
};

const earlyBirdHours: WorkingHours = {
  monday: { open: '07:00', close: '15:00' },
  tuesday: { open: '07:00', close: '15:00' },
  wednesday: { open: '07:00', close: '15:00' },
  thursday: { open: '07:00', close: '15:00' },
  friday: { open: '07:00', close: '15:00' },
  saturday: { open: '08:00', close: '12:00' },
  sunday: null,
};

const lateNightHours: WorkingHours = {
  monday: { open: '12:00', close: '21:00' },
  tuesday: { open: '12:00', close: '21:00' },
  wednesday: { open: '12:00', close: '21:00' },
  thursday: { open: '12:00', close: '21:00' },
  friday: { open: '12:00', close: '22:00' },
  saturday: { open: '10:00', close: '22:00' },
  sunday: { open: '12:00', close: '18:00' },
};

const allHoursTemplates = [standardHours, extendedHours, weekendHours, earlyBirdHours, lateNightHours];

// ============================================================================
// LOCATION DATA
// ============================================================================

interface LocationData {
  city: string;
  state: string;
  country: string;
  geo: ProviderGeo;
  baseLat: number;
  baseLng: number;
  streets: string[];
  neighborhoods: string[];
}

const locations: LocationData[] = [
  {
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    geo: 'seattle',
    baseLat: 47.6062,
    baseLng: -122.3321,
    streets: [
      'Pike Street', 'Pine Street', 'Madison Street', 'Union Street', 'University Street',
      'Seneca Street', 'Spring Street', 'Marion Street', 'Columbia Street', 'Cherry Street',
      'James Street', 'Jefferson Street', 'Yesler Way', 'Jackson Street', 'King Street',
      'Denny Way', 'Mercer Street', 'Republican Street', 'Harrison Street', 'Thomas Street',
      'Broadway', 'First Avenue', 'Second Avenue', 'Third Avenue', 'Fourth Avenue',
      'Fifth Avenue', 'Sixth Avenue', 'Western Avenue', 'Alaskan Way', 'Aurora Avenue N',
      'Eastlake Avenue', 'Fairview Avenue', 'Westlake Avenue', 'Dexter Avenue', 'Queen Anne Ave'
    ],
    neighborhoods: ['Capitol Hill', 'Ballard', 'Fremont', 'Queen Anne', 'Wallingford', 'University District', 'Downtown', 'Pioneer Square', 'South Lake Union', 'Belltown', 'Madison Park', 'Green Lake', 'Ravenna', 'Columbia City', 'Georgetown']
  },
  {
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    geo: 'san_francisco',
    baseLat: 37.7749,
    baseLng: -122.4194,
    streets: [
      'Market Street', 'Mission Street', 'Valencia Street', 'Folsom Street', 'Howard Street',
      'Brannan Street', 'Bryant Street', 'Harrison Street', 'Townsend Street', 'King Street',
      'Geary Street', 'Post Street', 'Sutter Street', 'Bush Street', 'Pine Street',
      'California Street', 'Sacramento Street', 'Clay Street', 'Washington Street', 'Jackson Street',
      'Pacific Avenue', 'Broadway', 'Vallejo Street', 'Green Street', 'Union Street',
      'Filbert Street', 'Greenwich Street', 'Lombard Street', 'Chestnut Street', 'Bay Street',
      'Columbus Avenue', 'Grant Avenue', 'Stockton Street', 'Powell Street', 'Mason Street',
      'Van Ness Avenue', 'Divisadero Street', 'Fillmore Street', 'Haight Street', 'Castro Street'
    ],
    neighborhoods: ['Mission District', 'Castro', 'Noe Valley', 'Marina', 'Pacific Heights', 'Hayes Valley', 'SOMA', 'Financial District', 'North Beach', 'Chinatown', 'Russian Hill', 'Nob Hill', 'Sunset', 'Richmond', 'Haight-Ashbury']
  },
  {
    city: 'Mountain View',
    state: 'CA',
    country: 'USA',
    geo: 'south_bay',
    baseLat: 37.3861,
    baseLng: -122.0839,
    streets: [
      'Castro Street', 'California Street', 'Dana Street', 'Hope Street', 'View Street',
      'Villa Street', 'Bryant Street', 'Franklin Street', 'Church Street', 'Mercy Street',
      'El Camino Real', 'San Antonio Road', 'Shoreline Boulevard', 'Rengstorff Avenue', 'Middlefield Road',
      'Central Expressway', 'Moffett Boulevard', 'Charleston Road', 'Alma Street', 'Grant Road',
      'University Avenue', 'Hamilton Avenue', 'Forest Avenue', 'Waverley Street', 'Cowper Street',
      'Lytton Avenue', 'High Street', 'Emerson Street', 'Ramona Street', 'Bryant Avenue',
      'Page Mill Road', 'Oregon Expressway', 'Embarcadero Road', 'Sand Hill Road', 'Alpine Road',
      'Arastradero Road', 'Foothill Expressway', 'Sunnyvale-Saratoga Road', 'Stevens Creek Boulevard', 'De Anza Boulevard'
    ],
    neighborhoods: ['Downtown Mountain View', 'Old Mountain View', 'Waverly Park', 'Sylvan Park', 'Rex Manor', 'Cuesta Park', 'Downtown Palo Alto', 'College Terrace', 'Professorville', 'Barron Park', 'Sunnyvale', 'Cupertino', 'Los Altos', 'Campbell', 'Santa Clara']
  },
  {
    city: 'Princeton',
    state: 'NJ',
    country: 'USA',
    geo: 'princeton',
    baseLat: 40.3573,
    baseLng: -74.6672,
    streets: [
      'Nassau Street', 'Witherspoon Street', 'Palmer Square', 'Chambers Street', 'Hulfish Street',
      'Spring Street', 'Paul Robeson Place', 'Vandeventer Avenue', 'Harrison Street', 'John Street',
      'Mercer Street', 'Stockton Street', 'Library Place', 'University Place', 'Washington Road',
      'Alexander Street', 'Bank Street', 'Moore Street', 'Prospect Avenue', 'William Street',
      'Bayard Lane', 'Hodge Road', 'Faculty Road', 'Western Way', 'Elm Road',
      'Broadmead Street', 'Linden Lane', 'Pine Street', 'Cherry Hill Road', 'Bunn Drive',
      'Route 206', 'Route 27', 'Carnegie Center Boulevard', 'College Road', 'Lover\'s Lane',
      'Terhune Road', 'Herrontown Road', 'Mt Lucas Road', 'Snowden Lane', 'Province Line Road'
    ],
    neighborhoods: ['Downtown Princeton', 'Palmer Square', 'Riverside', 'Littlebrook', 'Western Section', 'Riverside', 'Princeton Junction', 'West Windsor', 'Plainsboro', 'Lawrenceville', 'Pennington', 'Hopewell', 'Rocky Hill', 'Kingston', 'Montgomery']
  },
  {
    city: 'Vancouver',
    state: 'BC',
    country: 'Canada',
    geo: 'vancouver',
    baseLat: 49.2827,
    baseLng: -123.1207,
    streets: [
      'Robson Street', 'Granville Street', 'Davie Street', 'Denman Street', 'Georgia Street',
      'Hastings Street', 'Cordova Street', 'Water Street', 'Cambie Street', 'Main Street',
      'Commercial Drive', 'Broadway', 'Fourth Avenue', 'Tenth Avenue', 'King Edward Avenue',
      'Kingsway', 'Fraser Street', 'Victoria Drive', 'Knight Street', 'Oak Street',
      'Arbutus Street', 'Burrard Street', 'Hornby Street', 'Howe Street', 'Seymour Street',
      'Richards Street', 'Homer Street', 'Hamilton Street', 'Beatty Street', 'Pacific Boulevard',
      'Beach Avenue', 'Cornwall Avenue', 'Point Grey Road', 'Marine Drive', 'Dunbar Street',
      'Alma Street', 'MacDonald Street', 'Blenheim Street', 'Trafalgar Street', 'Larch Street'
    ],
    neighborhoods: ['Downtown', 'Gastown', 'Yaletown', 'West End', 'Coal Harbour', 'Kitsilano', 'Fairview', 'Mount Pleasant', 'Commercial Drive', 'Strathcona', 'Chinatown', 'Kerrisdale', 'Point Grey', 'Dunbar', 'Shaughnessy']
  },
  {
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    geo: 'toronto',
    baseLat: 43.6532,
    baseLng: -79.3832,
    streets: [
      'Queen Street', 'King Street', 'Dundas Street', 'College Street', 'Bloor Street',
      'Yonge Street', 'Bay Street', 'University Avenue', 'Spadina Avenue', 'Bathurst Street',
      'Ossington Avenue', 'Dovercourt Road', 'Dufferin Street', 'Lansdowne Avenue', 'Roncesvalles Avenue',
      'Queen Street West', 'King Street West', 'Adelaide Street', 'Richmond Street', 'Wellington Street',
      'Front Street', 'Harbourfront', 'Lakeshore Boulevard', 'Eastern Avenue', 'Broadview Avenue',
      'Parliament Street', 'Jarvis Street', 'Church Street', 'Sherbourne Street', 'Gerrard Street',
      'Carlton Street', 'Wellesley Street', 'St Clair Avenue', 'Eglinton Avenue', 'Lawrence Avenue',
      'Danforth Avenue', 'Pape Avenue', 'Coxwell Avenue', 'Woodbine Avenue', 'Kingston Road'
    ],
    neighborhoods: ['Downtown Core', 'Entertainment District', 'Financial District', 'Yorkville', 'The Annex', 'Kensington Market', 'Queen West', 'Liberty Village', 'King West', 'Leslieville', 'The Beaches', 'Riverdale', 'Roncesvalles', 'High Park', 'Parkdale']
  },
  {
    city: 'New York',
    state: 'NY',
    country: 'USA',
    geo: 'new_york',
    baseLat: 40.7128,
    baseLng: -74.0060,
    streets: [
      'Broadway', 'Fifth Avenue', 'Madison Avenue', 'Park Avenue', 'Lexington Avenue',
      'Third Avenue', 'Second Avenue', 'First Avenue', 'Avenue A', 'Avenue B',
      'Seventh Avenue', 'Eighth Avenue', 'Ninth Avenue', 'Tenth Avenue', 'Eleventh Avenue',
      'West Street', 'Greenwich Street', 'Hudson Street', 'Varick Street', 'Sixth Avenue',
      'Lafayette Street', 'Bowery', 'Canal Street', 'Houston Street', 'Bleecker Street',
      'Christopher Street', 'West 4th Street', '14th Street', '23rd Street', '34th Street',
      '42nd Street', '57th Street', '72nd Street', '86th Street', '96th Street',
      'Amsterdam Avenue', 'Columbus Avenue', 'Central Park West', 'Riverside Drive', 'West End Avenue'
    ],
    neighborhoods: ['Midtown', 'Times Square', 'Chelsea', 'Greenwich Village', 'East Village', 'SoHo', 'Tribeca', 'Lower East Side', 'Upper East Side', 'Upper West Side', 'Harlem', 'Financial District', 'Battery Park', 'Hell\'s Kitchen', 'Gramercy']
  }
];

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

interface CategoryTemplate {
  category: string;
  namePatterns: string[];
  descriptions: string[];
  services: string[];
  targetCount: number;
}

const categoryTemplates: CategoryTemplate[] = [
  {
    category: 'Salon',
    namePatterns: [
      '{adj} Hair Studio', '{adj} Salon', '{adj} Cuts', '{name}\'s Hair Studio', '{name}\'s Barbershop',
      'The {adj} Chair', '{neighborhood} Hair Co', '{adj} Style Lounge', '{name} & Co Hair',
      '{adj} Tress', 'Studio {name}', '{adj} Mane', 'Hair by {name}', '{neighborhood} Cuts',
      'The {adj} Look', '{adj} Hair Lab', '{name} Hair Design', '{adj} Styling Co',
      'Shear {adj}', '{adj} Locks', 'The {adj} Strand', '{name}\'s Shears', 'Clipper {adj}'
    ],
    descriptions: [
      'Premier hair salon offering cuts, coloring, and styling in a welcoming atmosphere.',
      'Full-service salon specializing in precision cuts and vibrant color treatments.',
      'Modern salon focused on personalized styling and hair care excellence.',
      'Boutique hair studio known for creative color work and trendy styles.',
      'Traditional barbershop with modern techniques for all hair types.',
      'Relaxed salon environment with expert stylists and quality products.',
      'Award-winning salon delivering exceptional cuts and treatments.',
      'Family-friendly salon with experienced stylists for all ages.'
    ],
    services: ['Haircut', 'Coloring', 'Highlights', 'Balayage', 'Blowout', 'Styling', 'Treatment', 'Beard Trim', 'Hot Towel Shave', 'Hair Extensions', 'Keratin Treatment', 'Perm', 'Updo', 'Men\'s Cut', 'Women\'s Cut', 'Kids Cut'],
    targetCount: 10
  },
  {
    category: 'Nail Salon',
    namePatterns: [
      '{adj} Nails', '{adj} Nail Bar', '{name}\'s Nails & Spa', '{neighborhood} Nail Studio',
      'The {adj} Polish', '{adj} Nail Lounge', 'Nail {adj}', '{name} Nails',
      '{adj} Tips', 'Polish by {name}', '{adj} Nail Co', 'The Nail {adj}',
      '{neighborhood} Nails', 'Lacquer {adj}', '{adj} Nail Art'
    ],
    descriptions: [
      'Upscale nail salon offering manicures, pedicures, and nail art.',
      'Clean, relaxing nail spa with premium polish brands and treatments.',
      'Full-service nail studio specializing in gel, acrylics, and nail design.',
      'Modern nail bar with skilled technicians and sanitary practices.',
      'Boutique nail salon known for creative designs and quality service.'
    ],
    services: ['Manicure', 'Pedicure', 'Gel Nails', 'Acrylic Nails', 'Nail Art', 'Dip Powder', 'Shellac', 'Paraffin Treatment', 'Nail Repair', 'French Manicure', 'Spa Pedicure', 'Nail Extensions'],
    targetCount: 6
  },
  {
    category: 'Mechanic',
    namePatterns: [
      '{adj} Auto Repair', '{name}\'s Garage', '{neighborhood} Auto Service', '{adj} Motors',
      'Auto {adj}', '{name} Automotive', '{adj} Car Care', 'The {adj} Mechanic',
      '{neighborhood} Automotive', '{adj} Auto Works', '{name}\'s Auto Shop', 'Precision {adj} Auto',
      '{adj} Tire & Auto', 'Express {adj} Auto', '{adj} Auto Center', '{name} & Sons Auto',
      '{neighborhood} Quick Lube', '{adj} Transmission', 'Elite {adj} Auto', '{adj} Auto Body'
    ],
    descriptions: [
      'Full-service auto repair shop with ASE-certified technicians.',
      'Trusted neighborhood garage for all makes and models.',
      'Expert automotive service with honest pricing and quality work.',
      'Family-owned auto shop specializing in diagnostics and repair.',
      'Quick and reliable auto service for maintenance and repairs.',
      'Professional mechanics offering comprehensive vehicle care.',
      'Specialty auto repair with expertise in foreign and domestic vehicles.'
    ],
    services: ['Oil Change', 'Brake Repair', 'Tire Rotation', 'Engine Diagnostic', 'Transmission Repair', 'AC Repair', 'Battery Replacement', 'Alignment', 'Tune-Up', 'Exhaust Repair', 'Suspension', 'Electrical Repair', 'Smog Check', 'Fluid Flush', 'Timing Belt', 'Clutch Repair'],
    targetCount: 10
  },
  {
    category: 'Dentist',
    namePatterns: [
      '{adj} Dental Care', '{neighborhood} Dental', 'Dr. {name} DDS', '{adj} Smiles',
      '{neighborhood} Family Dentistry', '{adj} Dental Group', 'Smile {adj}', '{name} Dental Associates',
      '{adj} Dental Studio', 'The {adj} Dentist', '{neighborhood} Dental Arts', 'Gentle {adj} Dental',
      '{adj} Dental Wellness', 'Premier {adj} Dental', '{name} Family Dental'
    ],
    descriptions: [
      'Family-friendly dental practice offering comprehensive oral care.',
      'Modern dental office with state-of-the-art equipment and gentle care.',
      'Experienced dental team providing general and cosmetic dentistry.',
      'Welcoming dental practice focused on patient comfort and health.',
      'Full-service dentistry from cleanings to complex procedures.',
      'Caring dental professionals using the latest techniques.'
    ],
    services: ['Cleaning', 'Checkup', 'Fillings', 'Root Canal', 'Crowns', 'Teeth Whitening', 'Braces', 'Invisalign', 'Extractions', 'Implants', 'Veneers', 'Emergency Care', 'Periodontal Care', 'Pediatric Dentistry', 'Dentures', 'Night Guards'],
    targetCount: 8
  },
  {
    category: 'Spa',
    namePatterns: [
      '{adj} Spa', '{adj} Wellness', '{name}\'s Day Spa', '{neighborhood} Spa & Wellness',
      'The {adj} Retreat', '{adj} Relaxation', 'Serenity {adj}', '{adj} Healing Arts',
      '{neighborhood} Massage', 'Zen {adj}', '{adj} Body & Soul', 'The {adj} Escape',
      '{adj} Wellness Center', 'Tranquil {adj}', '{name} Therapeutic Massage'
    ],
    descriptions: [
      'Luxurious day spa offering massage, facials, and body treatments.',
      'Holistic wellness center focused on relaxation and rejuvenation.',
      'Tranquil spa environment with skilled massage therapists.',
      'Full-service spa featuring therapeutic treatments and aromatherapy.',
      'Peaceful retreat offering customized wellness experiences.'
    ],
    services: ['Swedish Massage', 'Deep Tissue Massage', 'Hot Stone Massage', 'Facial', 'Body Wrap', 'Aromatherapy', 'Reflexology', 'Couples Massage', 'Prenatal Massage', 'Sports Massage', 'Lymphatic Drainage', 'Microdermabrasion', 'Chemical Peel', 'Hydrotherapy'],
    targetCount: 7
  },
  {
    category: 'Pet Grooming',
    namePatterns: [
      '{adj} Pet Grooming', '{name}\'s Pet Spa', 'Paws & {adj}', '{neighborhood} Pet Salon',
      'The {adj} Groomer', '{adj} Paws', 'Fur {adj}', '{name}\'s Dog Grooming',
      '{adj} Pet Care', 'Happy {adj} Pets', 'Bark & {adj}', 'The {adj} Pup',
      '{neighborhood} Dog Spa', 'Fluffy {adj}', 'Pampered {adj} Pets'
    ],
    descriptions: [
      'Professional pet grooming services for dogs and cats.',
      'Loving pet spa offering baths, cuts, and nail care.',
      'Expert groomers providing stress-free grooming experiences.',
      'Full-service pet salon with gentle handling techniques.',
      'Quality pet grooming in a calm, clean environment.'
    ],
    services: ['Bath', 'Haircut', 'Nail Trim', 'Ear Cleaning', 'Teeth Brushing', 'Flea Treatment', 'De-Shedding', 'Breed-Specific Cut', 'Puppy Grooming', 'Cat Grooming', 'Sanitary Trim', 'Paw Pad Trim', 'Cologne Spray', 'Medicated Bath'],
    targetCount: 5
  },
  {
    category: 'Veterinarian',
    namePatterns: [
      '{adj} Veterinary Clinic', '{neighborhood} Animal Hospital', '{name} Vet Care',
      '{adj} Pet Hospital', 'The {adj} Vet', '{neighborhood} Veterinary', '{adj} Animal Care',
      '{name} Animal Clinic', '{adj} Pet Wellness', 'Compassionate {adj} Vet'
    ],
    descriptions: [
      'Comprehensive veterinary care for pets of all sizes.',
      'Trusted animal hospital with experienced veterinarians.',
      'Full-service vet clinic offering preventive and emergency care.',
      'Compassionate pet healthcare with modern facilities.'
    ],
    services: ['Wellness Exam', 'Vaccinations', 'Spay/Neuter', 'Dental Cleaning', 'Surgery', 'X-Rays', 'Blood Work', 'Microchipping', 'Flea Prevention', 'Heartworm Prevention', 'Emergency Care', 'Senior Pet Care', 'Nutrition Counseling'],
    targetCount: 4
  },
  {
    category: 'Fitness',
    namePatterns: [
      '{adj} Fitness', '{adj} Gym', '{neighborhood} CrossFit', '{name}\'s Training',
      'The {adj} Gym', '{adj} Strength', 'Fit {adj}', '{neighborhood} Fitness Center',
      '{adj} Athletics', 'Iron {adj}', '{name} Personal Training', '{adj} Performance',
      'Peak {adj} Fitness', '{adj} Body', 'Sweat {adj}'
    ],
    descriptions: [
      'Full-service gym with cardio, weights, and group classes.',
      'Personal training studio focused on results and motivation.',
      'Modern fitness center with state-of-the-art equipment.',
      'Community-focused gym offering diverse workout options.',
      'Elite training facility for all fitness levels.'
    ],
    services: ['Personal Training', 'Group Classes', 'Weight Training', 'Cardio', 'HIIT', 'Spinning', 'CrossFit', 'Boxing', 'Kickboxing', 'Pilates', 'Circuit Training', 'Nutrition Coaching', 'Body Composition', 'Strength Training'],
    targetCount: 6
  },
  {
    category: 'Yoga',
    namePatterns: [
      '{adj} Yoga', '{adj} Yoga Studio', '{neighborhood} Yoga', '{name}\'s Yoga',
      'The {adj} Mat', '{adj} Flow', 'Zen {adj} Yoga', '{adj} Yoga Center',
      'Namaste {adj}', '{adj} Yoga Space', 'Inner {adj} Yoga', '{adj} Asana',
      '{neighborhood} Yoga Co', 'Om {adj}', '{adj} Yoga & Wellness'
    ],
    descriptions: [
      'Welcoming yoga studio offering classes for all levels.',
      'Hot yoga studio with experienced instructors.',
      'Peaceful yoga space focused on mind-body connection.',
      'Full-service yoga center with diverse class offerings.',
      'Community yoga studio promoting wellness and balance.'
    ],
    services: ['Vinyasa', 'Hot Yoga', 'Yin Yoga', 'Restorative Yoga', 'Power Yoga', 'Beginner Yoga', 'Prenatal Yoga', 'Meditation', 'Breathwork', 'Yoga Therapy', 'Private Sessions', 'Workshops', 'Teacher Training'],
    targetCount: 5
  },
  {
    category: 'Chiropractor',
    namePatterns: [
      '{adj} Chiropractic', '{neighborhood} Chiropractic', 'Dr. {name} Chiropractic',
      '{adj} Spine Center', '{adj} Back & Neck', '{name} Chiropractic Care',
      '{adj} Wellness Chiropractic', 'Align {adj}', '{neighborhood} Spine & Wellness'
    ],
    descriptions: [
      'Experienced chiropractor providing spinal adjustments and pain relief.',
      'Comprehensive chiropractic care for back, neck, and joint issues.',
      'Holistic chiropractic office focused on whole-body wellness.',
      'Modern chiropractic clinic using evidence-based techniques.'
    ],
    services: ['Spinal Adjustment', 'Neck Adjustment', 'Back Pain Treatment', 'Sciatica Treatment', 'Posture Correction', 'Sports Injury', 'Headache Relief', 'Prenatal Chiropractic', 'Pediatric Chiropractic', 'Massage Therapy', 'Rehabilitation'],
    targetCount: 4
  },
  {
    category: 'Physical Therapy',
    namePatterns: [
      '{adj} Physical Therapy', '{neighborhood} PT', '{name} Rehabilitation',
      '{adj} Rehab Center', 'Motion {adj}', '{adj} Sports PT', '{name} PT & Wellness',
      '{neighborhood} Physical Medicine', 'Restore {adj}'
    ],
    descriptions: [
      'Expert physical therapy for injury recovery and pain management.',
      'Comprehensive rehabilitation services with licensed therapists.',
      'Sports-focused physical therapy for athletes of all levels.',
      'Patient-centered PT clinic with individualized treatment plans.'
    ],
    services: ['Injury Rehabilitation', 'Post-Surgery Recovery', 'Sports Therapy', 'Manual Therapy', 'Dry Needling', 'Cupping', 'Electrical Stimulation', 'Ultrasound Therapy', 'Exercise Prescription', 'Balance Training', 'Gait Analysis'],
    targetCount: 3
  },
  {
    category: 'Optometrist',
    namePatterns: [
      '{adj} Eye Care', '{neighborhood} Vision', 'Dr. {name} Optometry', '{adj} Eyewear',
      '{neighborhood} Eye Center', '{adj} Vision Care', 'Clear {adj} Optometry',
      '{name} Eye Associates', '{adj} Optical', 'See {adj}'
    ],
    descriptions: [
      'Comprehensive eye exams and premium eyewear selection.',
      'Full-service optometry with the latest diagnostic technology.',
      'Family eye care with stylish frames and contact lenses.',
      'Expert vision care from experienced optometrists.'
    ],
    services: ['Eye Exam', 'Contact Lens Fitting', 'Glasses Prescription', 'Glaucoma Screening', 'Diabetic Eye Exam', 'Dry Eye Treatment', 'Pediatric Eye Care', 'LASIK Consultation', 'Designer Frames', 'Sunglasses'],
    targetCount: 4
  },
  {
    category: 'Dermatologist',
    namePatterns: [
      '{adj} Dermatology', '{neighborhood} Skin Care', 'Dr. {name} Dermatology',
      '{adj} Skin Center', '{name} Skin & Laser', '{adj} Skin Clinic',
      '{neighborhood} Dermatology Associates', 'Glow {adj}'
    ],
    descriptions: [
      'Expert dermatological care for skin, hair, and nail conditions.',
      'Medical and cosmetic dermatology with advanced treatments.',
      'Comprehensive skin care from board-certified dermatologists.',
      'Specialized dermatology for all ages and skin types.'
    ],
    services: ['Skin Exam', 'Acne Treatment', 'Eczema Treatment', 'Psoriasis Treatment', 'Mole Removal', 'Skin Cancer Screening', 'Botox', 'Fillers', 'Laser Treatment', 'Chemical Peel', 'Microneedling', 'Rosacea Treatment'],
    targetCount: 3
  },
  {
    category: 'Plumber',
    namePatterns: [
      '{adj} Plumbing', '{name}\'s Plumbing', '{neighborhood} Plumbing Co', '{adj} Pipe',
      '{name} & Sons Plumbing', 'Reliable {adj} Plumbing', '{adj} Drain Services',
      '{neighborhood} Plumbers', 'Quick {adj} Plumbing', 'Pro {adj} Plumbing'
    ],
    descriptions: [
      'Licensed plumbers providing residential and commercial services.',
      'Fast, reliable plumbing repairs and installations.',
      '24/7 emergency plumbing with honest pricing.',
      'Expert plumbing solutions for any problem.'
    ],
    services: ['Drain Cleaning', 'Leak Repair', 'Pipe Repair', 'Water Heater Installation', 'Toilet Repair', 'Faucet Installation', 'Garbage Disposal', 'Sump Pump', 'Water Line Repair', 'Sewer Line', 'Bathroom Remodel', 'Emergency Service'],
    targetCount: 5
  },
  {
    category: 'Electrician',
    namePatterns: [
      '{adj} Electric', '{name}\'s Electrical', '{neighborhood} Electric Co', '{adj} Power',
      '{name} Electrical Services', 'Bright {adj}', '{adj} Wiring', '{neighborhood} Electricians',
      'Current {adj}', 'Spark {adj}'
    ],
    descriptions: [
      'Licensed electricians for residential and commercial projects.',
      'Expert electrical repairs, installations, and upgrades.',
      'Safe, reliable electrical services with quality workmanship.',
      'Full-service electrical contractor for all your needs.'
    ],
    services: ['Electrical Repair', 'Panel Upgrade', 'Outlet Installation', 'Lighting Installation', 'Ceiling Fan Installation', 'EV Charger Installation', 'Generator Installation', 'Rewiring', 'Code Compliance', 'Electrical Inspection', 'Smart Home Wiring'],
    targetCount: 5
  },
  {
    category: 'HVAC',
    namePatterns: [
      '{adj} Heating & Cooling', '{name}\'s HVAC', '{neighborhood} Climate Control',
      '{adj} Air', '{name} Heating', 'Comfort {adj}', '{adj} Temperature',
      '{neighborhood} AC & Heating', 'Cool {adj}'
    ],
    descriptions: [
      'Expert HVAC services for heating, cooling, and ventilation.',
      'Reliable AC repair and furnace maintenance.',
      'Full-service climate control for home and business.',
      'Energy-efficient HVAC solutions and repairs.'
    ],
    services: ['AC Repair', 'Furnace Repair', 'AC Installation', 'Furnace Installation', 'Duct Cleaning', 'Thermostat Installation', 'Heat Pump Service', 'Maintenance Plan', 'Air Quality Testing', 'Ductwork', 'Emergency Service'],
    targetCount: 4
  },
  {
    category: 'Cleaning',
    namePatterns: [
      '{adj} Cleaning', '{name}\'s Cleaning Service', '{neighborhood} Cleaners', 'Sparkling {adj}',
      '{adj} Maids', 'Pristine {adj}', '{name} House Cleaning', '{adj} Home Care',
      'Fresh {adj} Cleaning', 'Tidy {adj}'
    ],
    descriptions: [
      'Professional house cleaning services you can trust.',
      'Thorough, reliable residential and commercial cleaning.',
      'Eco-friendly cleaning with attention to detail.',
      'Customized cleaning services for your home or office.'
    ],
    services: ['House Cleaning', 'Deep Cleaning', 'Move-In Cleaning', 'Move-Out Cleaning', 'Office Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'Laundry Service', 'Organizing', 'Post-Construction Cleaning', 'Recurring Cleaning'],
    targetCount: 5
  },
  {
    category: 'Tutor',
    namePatterns: [
      '{adj} Tutoring', '{name}\'s Learning Center', '{neighborhood} Academy', '{adj} Education',
      '{name} Test Prep', 'Bright {adj} Tutoring', '{adj} Scholars', '{neighborhood} Learning',
      'Academic {adj}', '{adj} Minds'
    ],
    descriptions: [
      'Expert tutoring for K-12 students in all subjects.',
      'Personalized test prep and academic coaching.',
      'Experienced tutors helping students achieve their goals.',
      'One-on-one and group tutoring for academic success.'
    ],
    services: ['Math Tutoring', 'Science Tutoring', 'English Tutoring', 'SAT Prep', 'ACT Prep', 'College Counseling', 'Homework Help', 'Study Skills', 'Writing Coaching', 'Reading Comprehension', 'Foreign Language', 'AP Courses'],
    targetCount: 4
  },
  {
    category: 'Photography',
    namePatterns: [
      '{adj} Photography', '{name} Studios', '{neighborhood} Photo', 'Capture {adj}',
      '{name}\'s Photography', '{adj} Images', 'Moments by {name}', '{adj} Lens',
      'Picture {adj}', '{adj} Shots'
    ],
    descriptions: [
      'Professional photography for portraits, events, and more.',
      'Creative photography capturing your special moments.',
      'Expert photographer specializing in weddings and portraits.',
      'High-quality photography with artistic vision.'
    ],
    services: ['Portrait Photography', 'Wedding Photography', 'Event Photography', 'Headshots', 'Family Portraits', 'Newborn Photography', 'Product Photography', 'Real Estate Photography', 'Photo Editing', 'Prints', 'Photo Books'],
    targetCount: 4
  },
  {
    category: 'Tattoo',
    namePatterns: [
      '{adj} Tattoo', '{name}\'s Ink', '{neighborhood} Tattoo Parlor', 'Ink {adj}',
      '{adj} Body Art', 'Black {adj} Tattoo', '{name} Tattoo Studio', 'Sacred {adj}',
      '{adj} Needle', 'True {adj} Tattoo'
    ],
    descriptions: [
      'Custom tattoo studio with experienced artists.',
      'Professional tattooing in a clean, welcoming environment.',
      'Award-winning tattoo artists specializing in all styles.',
      'Quality tattoo work from skilled professionals.'
    ],
    services: ['Custom Tattoo', 'Cover-Up Tattoo', 'Fine Line Tattoo', 'Traditional Tattoo', 'Realism Tattoo', 'Watercolor Tattoo', 'Geometric Tattoo', 'Portrait Tattoo', 'Touch-Up', 'Piercing', 'Consultation'],
    targetCount: 4
  }
];

// ============================================================================
// NAME GENERATORS
// ============================================================================

const adjectives = [
  'Premier', 'Elite', 'Golden', 'Silver', 'Classic', 'Modern', 'Urban', 'Royal',
  'Coastal', 'Pacific', 'Atlantic', 'Summit', 'Valley', 'Metro', 'Central', 'Grand',
  'First', 'Prime', 'Top', 'Best', 'Quality', 'Superior', 'Express', 'Pro',
  'Bright', 'Clear', 'Pure', 'Fresh', 'Clean', 'New', 'True', 'Real',
  'Blue', 'Green', 'Red', 'White', 'Black', 'Crystal', 'Diamond', 'Pearl',
  'Sunrise', 'Sunset', 'Horizon', 'Skyline', 'Harbor', 'Bay', 'River', 'Lake',
  'Oak', 'Pine', 'Maple', 'Cedar', 'Willow', 'Rose', 'Lily', 'Orchid'
];

const firstNames = [
  'James', 'John', 'Michael', 'David', 'Robert', 'William', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven',
  'Maria', 'Jennifer', 'Linda', 'Patricia', 'Elizabeth', 'Barbara', 'Susan', 'Jessica',
  'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley',
  'Emily', 'Michelle', 'Amanda', 'Melissa', 'Stephanie', 'Nicole', 'Angela', 'Samantha',
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn',
  'Carlos', 'Miguel', 'Jose', 'Wei', 'Jun', 'Min', 'Yuki', 'Kenji',
  'Raj', 'Priya', 'Amir', 'Fatima', 'Omar', 'Leila', 'Ivan', 'Natasha'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 1): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function generatePhoneNumber(areaCode: string): string {
  const exchange = randomInt(200, 999);
  const subscriber = randomInt(1000, 9999);
  return `(${areaCode}) ${exchange}-${subscriber}`;
}

function generateEmail(businessName: string): string {
  const cleanName = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 20);
  return `info@${cleanName}.${randomElement(['com', 'net', 'co'])}`;
}

function generateWebsite(businessName: string): string {
  const cleanName = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '');
  return `https://www.${cleanName.substring(0, 25)}.com`;
}

function generateAddress(location: LocationData): string {
  const streetNumber = randomInt(100, 9999);
  const street = randomElement(location.streets);
  return `${streetNumber} ${street}, ${location.city}, ${location.state}`;
}

function generateCoordinates(location: LocationData): { lat: number; lng: number } {
  // Add random offset (roughly within ~10km of city center)
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  return {
    lat: parseFloat((location.baseLat + latOffset).toFixed(6)),
    lng: parseFloat((location.baseLng + lngOffset).toFixed(6))
  };
}

function generateBusinessName(pattern: string, location: LocationData): string {
  return pattern
    .replace('{adj}', randomElement(adjectives))
    .replace('{name}', randomElement(firstNames))
    .replace('{neighborhood}', randomElement(location.neighborhoods));
}

function selectRandomServices(allServices: string[], min: number, max: number): string[] {
  const count = randomInt(min, max);
  const shuffled = [...allServices].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, allServices.length));
}

function generateRating(): { rating: number; reviewCount: number } {
  // Weighted distribution: more providers in 3.8-4.8 range
  const ratingDistribution = Math.random();
  let rating: number;

  if (ratingDistribution < 0.05) {
    // 5% have low ratings (2.5-3.5)
    rating = randomFloat(2.5, 3.5, 1);
  } else if (ratingDistribution < 0.20) {
    // 15% have okay ratings (3.5-4.0)
    rating = randomFloat(3.5, 4.0, 1);
  } else if (ratingDistribution < 0.70) {
    // 50% have good ratings (4.0-4.5)
    rating = randomFloat(4.0, 4.5, 1);
  } else if (ratingDistribution < 0.95) {
    // 25% have great ratings (4.5-4.9)
    rating = randomFloat(4.5, 4.9, 1);
  } else {
    // 5% have perfect ratings (4.9-5.0)
    rating = randomFloat(4.9, 5.0, 1);
  }

  // Review count somewhat correlated with rating (established places tend to have more reviews)
  let reviewCount: number;
  if (rating >= 4.5) {
    reviewCount = randomInt(50, 500);
  } else if (rating >= 4.0) {
    reviewCount = randomInt(20, 300);
  } else {
    reviewCount = randomInt(5, 100);
  }

  return { rating, reviewCount };
}

const areaCodes: Record<string, string> = {
  'Seattle': '206',
  'San Francisco': '415',
  'Mountain View': '650',
  'Princeton': '609',
  'Vancouver': '604',
  'Toronto': '416',
  'New York': '212'
};

// ============================================================================
// PROVIDER GENERATION
// ============================================================================

function generateProvider(
  category: CategoryTemplate,
  location: LocationData,
  usedNames: Set<string>
): Omit<NewProvider, 'id' | 'createdAt' | 'updatedAt'> | null {
  // Try to generate a unique name
  let name: string;
  let attempts = 0;
  do {
    name = generateBusinessName(randomElement(category.namePatterns), location);
    attempts++;
  } while (usedNames.has(name) && attempts < 20);

  if (usedNames.has(name)) {
    return null; // Couldn't generate unique name
  }
  usedNames.add(name);

  const coords = generateCoordinates(location);
  const { rating, reviewCount } = generateRating();
  const areaCode = areaCodes[location.city] || '555';

  return {
    name,
    category: category.category,
    description: randomElement(category.descriptions),
    address: generateAddress(location),
    geo: location.geo,
    latitude: coords.lat,
    longitude: coords.lng,
    rating,
    reviewCount,
    phoneNumber: generatePhoneNumber(areaCode),
    email: generateEmail(name),
    website: generateWebsite(name),
    workingHours: randomElement(allHoursTemplates),
    services: selectRandomServices(category.services, 4, 8)
  };
}

function generateAllProviders(): Omit<NewProvider, 'id' | 'createdAt' | 'updatedAt'>[] {
  const allProviders: Omit<NewProvider, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const usedNames = new Set<string>();

  for (const location of locations) {
    logger.info(`Generating providers for ${location.city}...`);
    let locationCount = 0;

    for (const category of categoryTemplates) {
      for (let i = 0; i < category.targetCount; i++) {
        const provider = generateProvider(category, location, usedNames);
        if (provider) {
          allProviders.push(provider);
          locationCount++;
        }
      }
    }

    logger.info(`Generated ${locationCount} providers for ${location.city}`);
  }

  return allProviders;
}

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seed(): Promise<void> {
  logger.info('Seeding database with expanded provider data...');

  const now = new Date();

  // Clear existing data (bookings first due to foreign key constraint)
  logger.info('Clearing existing bookings...');
  db.delete(bookings).run();
  logger.info('Clearing existing providers...');
  db.delete(providers).run();

  // Generate all providers
  const mockProviders = generateAllProviders();

  // Insert providers
  logger.info(`Inserting ${mockProviders.length} providers...`);

  let insertedCount = 0;
  for (const provider of mockProviders) {
    const newProvider: NewProvider = {
      id: uuidv4(),
      ...provider,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(providers).values(newProvider).run();
    insertedCount++;

    // Log progress every 100 providers
    if (insertedCount % 100 === 0) {
      logger.info(`Inserted ${insertedCount}/${mockProviders.length} providers...`);
    }
  }

  // Count by category
  const categoryCounts: Record<string, number> = {};
  for (const provider of mockProviders) {
    categoryCounts[provider.category] = (categoryCounts[provider.category] || 0) + 1;
  }

  // Count by location
  const locationCounts: Record<string, number> = {};
  for (const provider of mockProviders) {
    const city = provider.address.split(', ').slice(-2)[0];
    locationCounts[city] = (locationCounts[city] || 0) + 1;
  }

  logger.info('Seed completed successfully!', {
    totalProviders: mockProviders.length,
    byCategory: categoryCounts,
    byLocation: locationCounts
  });
}

// Run seed if executed directly
seed().catch((error) => {
  logger.error('Seed failed', { error: String(error) });
  process.exit(1);
});

import { db, providers, type NewProvider, type WorkingHours } from './index';
import { v4 as uuidv4 } from 'uuid';

// Standard working hours templates
const weekdayHours: WorkingHours = {
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

const weekendIncludedHours: WorkingHours = {
  monday: { open: '10:00', close: '18:00' },
  tuesday: { open: '10:00', close: '18:00' },
  wednesday: { open: '10:00', close: '18:00' },
  thursday: { open: '10:00', close: '18:00' },
  friday: { open: '10:00', close: '18:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: { open: '12:00', close: '16:00' },
};

// Mock provider data - 10 providers with varied categories
const mockProviders: Omit<NewProvider, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Salons (3)
  {
    name: 'Luxe Hair Studio',
    category: 'salon',
    description: 'Premium hair salon offering cuts, coloring, and styling services in a relaxing atmosphere.',
    address: '123 Main Street, Downtown',
    latitude: 37.7749,
    longitude: -122.4194,
    rating: 4.8,
    reviewCount: 156,
    phoneNumber: '(555) 123-4567',
    email: 'info@luxehairstudio.com',
    website: 'https://luxehairstudio.com',
    workingHours: extendedHours,
    services: ['haircut', 'coloring', 'highlights', 'styling', 'blowout', 'treatment'],
  },
  {
    name: 'Classic Cuts Barbershop',
    category: 'salon',
    description: 'Traditional barbershop with modern techniques. Specializing in men\'s grooming.',
    address: '456 Oak Avenue, Midtown',
    latitude: 37.7849,
    longitude: -122.4094,
    rating: 4.5,
    reviewCount: 89,
    phoneNumber: '(555) 234-5678',
    email: 'appointments@classiccuts.com',
    website: 'https://classiccuts.com',
    workingHours: weekdayHours,
    services: ['haircut', 'beard trim', 'hot towel shave', 'facial'],
  },
  {
    name: 'Bella Nails & Spa',
    category: 'salon',
    description: 'Full-service nail salon and spa offering manicures, pedicures, and relaxation treatments.',
    address: '789 Elm Boulevard, Uptown',
    latitude: 37.7649,
    longitude: -122.4294,
    rating: 4.6,
    reviewCount: 203,
    phoneNumber: '(555) 345-6789',
    email: 'book@bellanails.com',
    website: 'https://bellanails.com',
    workingHours: weekendIncludedHours,
    services: ['manicure', 'pedicure', 'gel nails', 'acrylic nails', 'massage', 'waxing'],
  },

  // Mechanics (3)
  {
    name: 'AutoCare Plus',
    category: 'mechanic',
    description: 'Full-service auto repair shop with certified technicians. All makes and models.',
    address: '1000 Industrial Way, East Side',
    latitude: 37.7949,
    longitude: -122.3994,
    rating: 4.7,
    reviewCount: 312,
    phoneNumber: '(555) 456-7890',
    email: 'service@autocareplus.com',
    website: 'https://autocareplus.com',
    workingHours: weekdayHours,
    services: ['oil change', 'brake repair', 'tire rotation', 'engine diagnostic', 'transmission', 'AC repair'],
  },
  {
    name: 'Quick Lube Express',
    category: 'mechanic',
    description: 'Fast and affordable oil changes and basic maintenance. No appointment necessary.',
    address: '2500 Highway 101, North District',
    latitude: 37.8049,
    longitude: -122.4394,
    rating: 4.2,
    reviewCount: 178,
    phoneNumber: '(555) 567-8901',
    email: 'info@quicklubeexpress.com',
    website: 'https://quicklubeexpress.com',
    workingHours: extendedHours,
    services: ['oil change', 'filter replacement', 'fluid top-off', 'tire pressure check', 'wiper replacement'],
  },
  {
    name: 'Premier Auto Body',
    category: 'mechanic',
    description: 'Expert collision repair and auto body work. Insurance claims welcome.',
    address: '3200 Commerce Drive, Industrial Park',
    latitude: 37.7549,
    longitude: -122.4494,
    rating: 4.4,
    reviewCount: 94,
    phoneNumber: '(555) 678-9012',
    email: 'estimates@premierautobody.com',
    website: 'https://premierautobody.com',
    workingHours: weekdayHours,
    services: ['collision repair', 'dent removal', 'paint touch-up', 'full paint job', 'frame straightening'],
  },

  // Dentists (2)
  {
    name: 'Smile Dental Care',
    category: 'dentist',
    description: 'Family-friendly dental practice offering comprehensive oral care for all ages.',
    address: '500 Medical Plaza, Suite 200',
    latitude: 37.7699,
    longitude: -122.4144,
    rating: 4.9,
    reviewCount: 267,
    phoneNumber: '(555) 789-0123',
    email: 'appointments@smiledentalcare.com',
    website: 'https://smiledentalcare.com',
    workingHours: weekdayHours,
    services: ['cleaning', 'checkup', 'fillings', 'root canal', 'crowns', 'teeth whitening', 'braces'],
  },
  {
    name: 'Downtown Dental Associates',
    category: 'dentist',
    description: 'Modern dental office with state-of-the-art equipment. Emergency services available.',
    address: '750 Financial District, Floor 3',
    latitude: 37.7899,
    longitude: -122.4044,
    rating: 4.6,
    reviewCount: 145,
    phoneNumber: '(555) 890-1234',
    email: 'info@downtowndental.com',
    website: 'https://downtowndental.com',
    workingHours: extendedHours,
    services: ['cleaning', 'checkup', 'fillings', 'extractions', 'implants', 'cosmetic dentistry', 'emergency care'],
  },

  // Other services (2)
  {
    name: 'Zen Wellness Center',
    category: 'spa',
    description: 'Holistic wellness center offering massage therapy, acupuncture, and meditation classes.',
    address: '1200 Serenity Lane, Wellness District',
    latitude: 37.7799,
    longitude: -122.4244,
    rating: 4.8,
    reviewCount: 189,
    phoneNumber: '(555) 901-2345',
    email: 'relax@zenwellness.com',
    website: 'https://zenwellness.com',
    workingHours: weekendIncludedHours,
    services: ['swedish massage', 'deep tissue massage', 'hot stone massage', 'acupuncture', 'meditation', 'yoga'],
  },
  {
    name: 'Pet Paradise Grooming',
    category: 'pet_grooming',
    description: 'Professional pet grooming services for dogs and cats. Loving care for your furry friends.',
    address: '850 Pet Avenue, Animal District',
    latitude: 37.7599,
    longitude: -122.4344,
    rating: 4.7,
    reviewCount: 231,
    phoneNumber: '(555) 012-3456',
    email: 'appointments@petparadise.com',
    website: 'https://petparadise.com',
    workingHours: extendedHours,
    services: ['bath', 'haircut', 'nail trim', 'ear cleaning', 'teeth brushing', 'flea treatment', 'de-shedding'],
  },
];

async function seed(): Promise<void> {
  console.log('Seeding database...');

  const now = new Date();

  // Clear existing providers (idempotent - safe to run multiple times)
  console.log('Clearing existing providers...');
  db.delete(providers).run();

  // Insert mock providers
  console.log(`Inserting ${mockProviders.length} providers...`);

  for (const provider of mockProviders) {
    const newProvider: NewProvider = {
      id: uuidv4(),
      ...provider,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(providers).values(newProvider).run();
    console.log(`  - Added: ${provider.name} (${provider.category})`);
  }

  console.log('\nSeed completed successfully!');
  console.log(`Total providers: ${mockProviders.length}`);
  console.log('Categories:');
  console.log('  - Salons: 3');
  console.log('  - Mechanics: 3');
  console.log('  - Dentists: 2');
  console.log('  - Other (Spa, Pet Grooming): 2');
}

// Run seed if executed directly
seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

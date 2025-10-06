const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sampleListings = [
  {
    title: '2020 BMW X5 xDrive40i',
    description: 'Beautiful BMW X5 in excellent condition. Full service history, premium package included.',
    price: 4590000, // Price in cents (€45,900)
    make: 'BMW',
    model: 'X5',
    year: 2020,
    mileage: 32000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    bodyType: 'SUV',
    color: 'Black',
    city: 'Berlin',
    country: 'DE',
    featured: true,
    images: ['/placeholder-car-1.jpg'],
  },
  {
    title: '2019 Audi A4 Avant',
    description: 'Sporty Audi A4 Avant with S-Line package. Perfect family car with excellent fuel economy.',
    price: 2850000, // €28,500
    make: 'Audi',
    model: 'A4',
    year: 2019,
    mileage: 45000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'Wagon',
    color: 'White',
    city: 'Munich',
    country: 'DE',
    featured: true,
    images: ['/placeholder-car-2.jpg'],
  },
  {
    title: '2021 Mercedes C-Class',
    description: 'Luxury Mercedes C-Class with hybrid technology. Low mileage, single owner.',
    price: 3890000, // €38,900
    make: 'Mercedes',
    model: 'C-Class',
    year: 2021,
    mileage: 28000,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    bodyType: 'Sedan',
    color: 'Silver',
    city: 'Hamburg',
    country: 'DE',
    featured: true,
    images: ['/placeholder-car-3.jpg'],
  },
  {
    title: '2018 Volkswagen Golf GTI',
    description: 'Fun and reliable Golf GTI. Perfect for city driving with sporty performance.',
    price: 2390000, // €23,900
    make: 'Volkswagen',
    model: 'Golf',
    year: 2018,
    mileage: 52000,
    fuelType: 'Petrol',
    transmission: 'Manual',
    bodyType: 'Hatchback',
    color: 'Red',
    city: 'Cologne',
    country: 'DE',
    featured: false,
    images: ['/placeholder-car-4.jpg'],
  },
  {
    title: '2020 Tesla Model 3',
    description: 'Electric Tesla Model 3 with autopilot. Zero emissions, incredible technology.',
    price: 3490000, // €34,900
    make: 'Tesla',
    model: 'Model 3',
    year: 2020,
    mileage: 25000,
    fuelType: 'Electric',
    transmission: 'Automatic',
    bodyType: 'Sedan',
    color: 'Blue',
    city: 'Frankfurt',
    country: 'DE',
    featured: false,
    images: ['/placeholder-car-5.jpg'],
  }
]

async function main() {
  console.log('Starting database seed...')

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@automarket.com' },
    update: {},
    create: {
      email: 'demo@automarket.com',
      name: 'Demo User',
      phone: '+49 123 456 7890',
      role: 'user',
      plan: 'free'
    },
  })

  console.log(`Created user: ${user.email}`)

  // Create an admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@automarket.com' },
    update: {},
    create: {
      email: 'admin@automarket.com',
      name: 'Admin User',
      phone: '+49 123 456 7891',
      role: 'admin',
      plan: 'dealer'
    },
  })

  console.log(`Created admin: ${admin.email}`)

  // Create sample listings
  for (const listing of sampleListings) {
    const created = await prisma.listing.create({
      data: {
        ...listing,
        userId: user.id,
      },
    })
    console.log(`Created listing: ${created.title}`)
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
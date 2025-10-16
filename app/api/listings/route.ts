import { NextRequest, NextResponse } from 'next/server'

// Simple fake car data - no database needed!
const cars = [
  {
    id: 'bmw-x5-2020',
    title: 'BMW X5 2020 - Gjendje e shkëlqyer',
    description: 'BMW X5 në gjendje të shkëlqyer, vetëm 25,000 km. I importuar nga Gjermania.',
    price: 45000,
    currency: 'EUR',
    make: 'BMW',
    model: 'X5',
    year: 2020,
    mileage: 25000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    bodyType: 'SUV',
    city: 'Tiranë',
    country: 'AL',
    color: 'E zezë',
    status: 'active',
    featured: true,
    images: '/api/placeholder/400/300?text=BMW+X5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'audi-a4-2019',
    title: 'Audi A4 2019 - Kilometerazh i ulët',
    description: 'Audi A4 me kilometerazh të ulët, mirëmbajtur shumë mirë. Servisi i kompletuar.',
    price: 32000,
    currency: 'EUR',
    make: 'Audi',
    model: 'A4',
    year: 2019,
    mileage: 18000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'Sedan',
    city: 'Durrës',
    country: 'AL',
    color: 'E bardhë',
    status: 'active',
    featured: true,
    images: '/api/placeholder/400/300?text=Audi+A4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mercedes-c-class-2021',
    title: 'Mercedes C-Class 2021 - Luksoze',
    description: 'Mercedes C-Class në gjendje perfekte, vetëm 12,000 km. Garancion e plotë.',
    price: 55000,
    currency: 'EUR',
    make: 'Mercedes',
    model: 'C-Class',
    year: 2021,
    mileage: 12000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    bodyType: 'Sedan',
    city: 'Vlorë',
    country: 'AL',
    color: 'Argjendi',
    status: 'active',
    featured: true,
    images: '/api/placeholder/400/300?text=Mercedes+C-Class',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vw-golf-2018',
    title: 'Volkswagen Golf 2018 - Ekonomike',
    description: 'VW Golf në gjendje të mirë, ideale për qytet. Konsum i ulët.',
    price: 18500,
    currency: 'EUR',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2018,
    mileage: 45000,
    fuelType: 'Diesel',
    transmission: 'Manual',
    bodyType: 'Hatchback',
    city: 'Shkodër',
    country: 'AL',
    color: 'E kuqe',
    status: 'active',
    featured: false,
    images: '/api/placeholder/400/300?text=VW+Golf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ford-focus-2017',
    title: 'Ford Focus 2017 - I besueshëm',
    description: 'Ford Focus me histori të plotë servisi. Makine shumë e besueshme.',
    price: 15800,
    currency: 'EUR',
    make: 'Ford',
    model: 'Focus',
    year: 2017,
    mileage: 38000,
    fuelType: 'Petrol',
    transmission: 'Manual',
    bodyType: 'Hatchback',
    city: 'Korçë',
    country: 'AL',
    color: 'Blu',
    status: 'active',
    featured: false,
    images: '/api/placeholder/400/300?text=Ford+Focus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

// GET /api/listings - Get all listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const search = searchParams.get('search') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const make = searchParams.get('make')
    const fuelType = searchParams.get('fuelType')
    const location = searchParams.get('location')

    let filteredCars = [...cars]

    // Apply search filter
    if (search) {
      filteredCars = filteredCars.filter(car =>
        car.title.toLowerCase().includes(search.toLowerCase()) ||
        car.make.toLowerCase().includes(search.toLowerCase()) ||
        car.model.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply filters
    if (make) {
      filteredCars = filteredCars.filter(car =>
        car.make.toLowerCase().includes(make.toLowerCase())
      )
    }

    if (fuelType) {
      filteredCars = filteredCars.filter(car =>
        car.fuelType.toLowerCase().includes(fuelType.toLowerCase())
      )
    }

    if (location) {
      filteredCars = filteredCars.filter(car =>
        car.city.toLowerCase().includes(location.toLowerCase())
      )
    }

    if (minPrice) {
      filteredCars = filteredCars.filter(car => car.price >= parseInt(minPrice))
    }

    if (maxPrice) {
      filteredCars = filteredCars.filter(car => car.price <= parseInt(maxPrice))
    }

    // Return in the format the frontend expects
    return NextResponse.json({
      listings: filteredCars,
      pagination: {
        page: 1,
        limit: 12,
        total: filteredCars.length,
        pages: 1
      }
    })

  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST endpoint - simplified for now
export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Creating new listings is temporarily disabled while we improve the system.',
    success: false
  }, { status: 503 })
}
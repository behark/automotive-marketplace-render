import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();

    // Try to create some sample data
    const sampleUser = await prisma.user.upsert({
      where: { email: 'admin@automarket.al' },
      update: {},
      create: {
        id: 'admin-user-123',
        email: 'admin@automarket.al',
        name: 'Admin User',
        role: 'admin',
      },
    });

    // Create sample car listings
    const sampleListings = await Promise.all([
      prisma.listing.upsert({
        where: { id: 'bmw-x5-2020' },
        update: {},
        create: {
          id: 'bmw-x5-2020',
          title: 'BMW X5 2020 - Gjendje e shkëlqyer',
          description: 'BMW X5 në gjendje të shkëlqyer, vetëm 25,000 km',
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
          userId: sampleUser.id,
          status: 'active',
          condition: 'excellent',
        },
      }),

      prisma.listing.upsert({
        where: { id: 'audi-a4-2019' },
        update: {},
        create: {
          id: 'audi-a4-2019',
          title: 'Audi A4 2019 - Kilometerazh i ulët',
          description: 'Audi A4 me kilometerazh të ulët, mirëmbajtur shumë mirë',
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
          userId: sampleUser.id,
          status: 'active',
          condition: 'very_good',
        },
      }),

      prisma.listing.upsert({
        where: { id: 'mercedes-c-class-2021' },
        update: {},
        create: {
          id: 'mercedes-c-class-2021',
          title: 'Mercedes C-Class 2021 - Luksoze',
          description: 'Mercedes C-Class në gjendje perfekte, vetëm 12,000 km',
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
          userId: sampleUser.id,
          status: 'active',
          condition: 'excellent',
        },
      }),
    ]);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      data: {
        user: sampleUser,
        listings: sampleListings,
      },
    });

  } catch (error) {
    console.error('Database initialization error:', error);

    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
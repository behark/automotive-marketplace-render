import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Simple in-memory user storage (replace with database later)
const users: Map<string, {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  name: string
  role: string
  createdAt: string
}> = new Map()

// Add a demo admin user
const adminPassword = bcrypt.hashSync('admin123', 10)
users.set('admin@automarket.al', {
  id: 'admin-user-123',
  email: 'admin@automarket.al',
  password: adminPassword,
  firstName: 'Admin',
  lastName: 'User',
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date().toISOString()
})

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret-key'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: string
  createdAt: string
}

export async function createUser(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
}): Promise<User> {
  // Check if user exists
  if (users.has(userData.email)) {
    throw new Error('User already exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  // Create user
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: `${userData.firstName} ${userData.lastName}`,
    role: 'user',
    createdAt: new Date().toISOString()
  }

  // Store user
  users.set(userData.email, user)

  // Return user without password
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = users.get(email)
  if (!user) {
    return null
  }

  // Check password
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return null
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

export function generateJWT(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyJWT(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName || decoded.name.split(' ')[0],
      lastName: decoded.lastName || decoded.name.split(' ')[1],
      name: decoded.name,
      role: decoded.role,
      createdAt: decoded.createdAt || new Date().toISOString()
    }
  } catch (error) {
    return null
  }
}

export function getAllUsers(): User[] {
  return Array.from(users.values()).map(({ password, ...user }) => user)
}
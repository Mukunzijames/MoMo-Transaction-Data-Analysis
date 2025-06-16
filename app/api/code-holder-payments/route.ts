import { NextResponse } from 'next/server'
import { sql, and, count, ilike } from 'drizzle-orm'
import db from '@/app/db/index'
import { contacts } from '@/app/db/schema'

export async function GET(request: Request) {
  try {
    // Get query params from URL
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 10
    const name = url.searchParams.get('name')
    const phone = url.searchParams.get('phone')
    const sortBy = url.searchParams.get('sortBy') || 'lastTransactionDate'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build filters
    const whereConditions = []

    // Name filter
    if (name) {
      whereConditions.push(ilike(contacts.name, `%${name}%`))
    }

    // Phone filter
    if (phone) {
      whereConditions.push(ilike(contacts.phoneNumber, `%${phone}%`))
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(contacts)
      .where(whereClause || sql`1=1`)

    // Determine sort field
    const sortField = sortBy === 'name'
      ? contacts.name
      : sortBy === 'transactionCount'
        ? contacts.transactionCount
        : contacts.lastTransactionDate

    // Get paginated results
    const transactions = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        phoneNumber: contacts.phoneNumber,
        transactionCount: contacts.transactionCount,
        totalSent: contacts.totalSent,
        totalReceived: contacts.totalReceived,
        lastTransactionDate: contacts.lastTransactionDate
      })
      .from(contacts)
      .where(whereClause || sql`1=1`)
      .orderBy(sortOrder === 'asc' ? sql`${sortField} ASC` : sql`${sortField} DESC`)
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data: transactions,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
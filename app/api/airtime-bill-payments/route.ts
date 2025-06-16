import { NextResponse } from 'next/server'
import { sql, and, or, count, ilike } from 'drizzle-orm'
import db from '@/app/db/index'
import { transactions } from '@/app/db/schema'

export async function GET(request: Request) {
  try {
    // Get query params from URL
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 10
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const minAmount = Number(url.searchParams.get('minAmount'))
    const maxAmount = Number(url.searchParams.get('maxAmount'))
    const provider = url.searchParams.get('provider')
    const category = url.searchParams.get('category')
    const sortBy = url.searchParams.get('sortBy') || 'transactionDate'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build filters
    let whereConditions = []

    // Transaction type filter
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%PAYMENT%'),
        ilike(transactions.transactionType, '%AIRTIME%'),
        ilike(transactions.transactionType, '%BILL%'),
        ilike(transactions.description, '%AIRTIME%'),
        ilike(transactions.description, '%BILL%'),
        ilike(transactions.category, '%AIRTIME%'),
        ilike(transactions.category, '%BILL%'),
        ilike(transactions.category, '%PAYMENT%')
      )
    )

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        and(
          sql`${transactions.transactionDate} >= ${startDate}`,
          sql`${transactions.transactionDate} <= ${endDate}`
        )
      )
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      if (minAmount) whereConditions.push(sql`${transactions.amount} >= ${minAmount}`)
      if (maxAmount) whereConditions.push(sql`${transactions.amount} <= ${maxAmount}`)
    }

    // Provider filter
    if (provider) {
      whereConditions.push(sql`${transactions.recipient} ILIKE ${`%${provider}%`}`)
    }

    // Category filter
    if (category) {
      whereConditions.push(sql`${transactions.category} ILIKE ${`%${category}%`}`)
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(transactions)
      .where(whereClause || sql`1=1`)

    // Get paginated results
    const payments = await db
      .select({
        id: transactions.id,
        transactionId: transactions.transactionId,
        transactionType: transactions.transactionType,
        recipient: transactions.recipient,
        amount: transactions.amount,
        category: transactions.category,
        transactionDate: transactions.transactionDate,
        fee: transactions.fee,
        balance: transactions.balanceAfter,
        description: transactions.description,
        externalId: transactions.externalId,
      })
      .from(transactions)
      .where(whereClause || sql`1=1`)
      .orderBy(sortBy === 'amount' 
        ? sql`${transactions.amount} ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}`
        : sql`${transactions.transactionDate} ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}`
      )
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data: payments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
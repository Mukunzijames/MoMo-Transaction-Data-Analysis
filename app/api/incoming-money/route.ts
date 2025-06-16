import { NextResponse } from 'next/server'
import { sql, and, count } from 'drizzle-orm'
import { incomingMoneyTransactions } from '@/app/db/schema'
import db from '@/app/db/index'

export const runtime = 'edge'

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
    const sender = url.searchParams.get('sender')
    const sortBy = url.searchParams.get('sortBy') || 'transactionDate'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build filters
    const whereConditions = []

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        and(
          sql`${incomingMoneyTransactions.transactionDate} >= ${startDate}`,
          sql`${incomingMoneyTransactions.transactionDate} <= ${endDate}`
        )
      )
    }

    // Amount range filter
    if (minAmount) whereConditions.push(sql`${incomingMoneyTransactions.amount} >= ${minAmount}`)
    if (maxAmount) whereConditions.push(sql`${incomingMoneyTransactions.amount} <= ${maxAmount}`)

    // Sender filter
    if (sender) {
      whereConditions.push(sql`${incomingMoneyTransactions.sender} ILIKE ${`%${sender}%`}`)
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(incomingMoneyTransactions)
      .where(whereClause || sql`1=1`)

    // Determine sort field
    const sortField = sortBy === 'amount'
      ? incomingMoneyTransactions.amount
      : incomingMoneyTransactions.transactionDate

    // Get paginated results
    const transactions = await db
      .select({
        id: incomingMoneyTransactions.id,
        transactionId: incomingMoneyTransactions.transactionId,
        sender: incomingMoneyTransactions.sender,
        amount: incomingMoneyTransactions.amount,
        transactionDate: incomingMoneyTransactions.transactionDate,
        balance: incomingMoneyTransactions.balance
      })
      .from(incomingMoneyTransactions)
      .where(whereClause || sql`1=1`)
      .orderBy(sortOrder === 'asc' ? sql`${sortField} ASC` : sql`${sortField} DESC`)
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data: transactions,
      meta: {
        total: totalCount,
        page,
        limit
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
import { NextResponse } from 'next/server'
import { sql, and, count } from 'drizzle-orm'
import db from '@/app/db/index'
import { withdrawalTransactions } from '@/app/db/schema'

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
    const agent = url.searchParams.get('agent')
    const sortBy = url.searchParams.get('sortBy') || 'transactionDate'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build filters
    const whereConditions = []

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        and(
          sql`${withdrawalTransactions.transactionDate} >= ${startDate}`,
          sql`${withdrawalTransactions.transactionDate} <= ${endDate}`
        )
      )
    }

    // Amount range filter
    if (minAmount) whereConditions.push(sql`${withdrawalTransactions.amount} >= ${minAmount}`)
    if (maxAmount) whereConditions.push(sql`${withdrawalTransactions.amount} <= ${maxAmount}`)

    // Agent filter
    if (agent) {
      whereConditions.push(sql`${withdrawalTransactions.agentName} ILIKE ${`%${agent}%`}`)
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(withdrawalTransactions)
      .where(whereClause || sql`1=1`)

    // Determine sort field
    const sortField = sortBy === 'amount'
      ? withdrawalTransactions.amount
      : withdrawalTransactions.transactionDate

    // Get paginated results
    const transactions = await db
      .select({
        id: withdrawalTransactions.id,
        transactionId: withdrawalTransactions.transactionId,
        agentName: withdrawalTransactions.agentName,
        agentPhone: withdrawalTransactions.agentPhone,
        amount: withdrawalTransactions.amount,
        transactionDate: withdrawalTransactions.transactionDate,
        fee: withdrawalTransactions.fee,
        balance: withdrawalTransactions.balance
      })
      .from(withdrawalTransactions)
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
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { sql, and, count } from 'drizzle-orm'
import db from '@/app/db/index'
import { thirdPartyTransactions } from '@/app/db/schema'

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
    const vendor = url.searchParams.get('vendor')
    const sortBy = url.searchParams.get('sortBy') || 'transactionDate'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build filters
    const whereConditions = []

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        and(
          sql`${thirdPartyTransactions.transactionDate} >= ${startDate}`,
          sql`${thirdPartyTransactions.transactionDate} <= ${endDate}`
        )
      )
    }

    // Amount range filter
    if (minAmount) whereConditions.push(sql`${thirdPartyTransactions.amount} >= ${minAmount}`)
    if (maxAmount) whereConditions.push(sql`${thirdPartyTransactions.amount} <= ${maxAmount}`)

    // Vendor filter
    if (vendor) {
      whereConditions.push(sql`${thirdPartyTransactions.vendor} ILIKE ${`%${vendor}%`}`)
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(thirdPartyTransactions)
      .where(whereClause || sql`1=1`)

    // Determine sort field
    const sortField = sortBy === 'amount'
      ? thirdPartyTransactions.amount
      : thirdPartyTransactions.transactionDate

    // Get paginated results
    const transactions = await db
      .select({
        id: thirdPartyTransactions.id,
        transactionId: thirdPartyTransactions.transactionId,
        vendor: thirdPartyTransactions.vendor,
        amount: thirdPartyTransactions.amount,
        transactionDate: thirdPartyTransactions.transactionDate,
        externalId: thirdPartyTransactions.externalId,
        fee: thirdPartyTransactions.fee,
        balance: thirdPartyTransactions.balance
      })
      .from(thirdPartyTransactions)
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
    console.error('Error fetching third party transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
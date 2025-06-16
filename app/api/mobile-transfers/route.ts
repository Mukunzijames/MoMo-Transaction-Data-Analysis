import { NextResponse } from 'next/server'
import { sql, and, count } from 'drizzle-orm'
import db from '@/app/db/index'
import { mobileTransferTransactions } from '@/app/db/schema'

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
    const recipient = url.searchParams.get('recipient')
    const phone = url.searchParams.get('phone')
    const sortBy = url.searchParams.get('sortBy') || 'transactionDate'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build filters
    const whereConditions = []

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        and(
          sql`${mobileTransferTransactions.transactionDate} >= ${startDate}`,
          sql`${mobileTransferTransactions.transactionDate} <= ${endDate}`
        )
      )
    }

    // Amount range filter
    if (minAmount) whereConditions.push(sql`${mobileTransferTransactions.amount} >= ${minAmount}`)
    if (maxAmount) whereConditions.push(sql`${mobileTransferTransactions.amount} <= ${maxAmount}`)

    // Recipient filter
    if (recipient) {
      whereConditions.push(sql`${mobileTransferTransactions.recipient} ILIKE ${`%${recipient}%`}`)
    }

    // Phone filter
    if (phone) {
      whereConditions.push(sql`${mobileTransferTransactions.recipientPhone} ILIKE ${`%${phone}%`}`)
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(mobileTransferTransactions)
      .where(whereClause || sql`1=1`)

    // Determine sort field
    const sortField = sortBy === 'amount'
      ? mobileTransferTransactions.amount
      : mobileTransferTransactions.transactionDate

    // Get paginated results
    const transactions = await db
      .select({
        id: mobileTransferTransactions.id,
        recipient: mobileTransferTransactions.recipient,
        recipientPhone: mobileTransferTransactions.recipientPhone,
        amount: mobileTransferTransactions.amount,
        transactionDate: mobileTransferTransactions.transactionDate,
        fee: mobileTransferTransactions.fee,
        balance: mobileTransferTransactions.balance
      })
      .from(mobileTransferTransactions)
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
    console.error('Error fetching mobile transfers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
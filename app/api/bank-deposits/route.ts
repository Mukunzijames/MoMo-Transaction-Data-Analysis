import { NextResponse } from 'next/server'
import { sql, and, count, ilike } from 'drizzle-orm'
import db from '@/app/db/index'
import { bankTransactions } from '@/app/db/schema'

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
    const bank = url.searchParams.get('bank')
    const accountNumber = url.searchParams.get('accountNumber')
    const sortBy = url.searchParams.get('sortBy') || 'transactionDate'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build filters
    const whereConditions = []

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        and(
          sql`${bankTransactions.transactionDate} >= ${startDate}`,
          sql`${bankTransactions.transactionDate} <= ${endDate}`
        )
      )
    }

    // Amount range filter
    if (minAmount) whereConditions.push(sql`${bankTransactions.amount} >= ${minAmount}`)
    if (maxAmount) whereConditions.push(sql`${bankTransactions.amount} <= ${maxAmount}`)

    // Bank filter
    if (bank) {
      whereConditions.push(ilike(bankTransactions.bankName, `%${bank}%`))
    }

    // Account number filter
    if (accountNumber) {
      whereConditions.push(ilike(bankTransactions.accountNumber, `%${accountNumber}%`))
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(bankTransactions)
      .where(whereClause || sql`1=1`)

    // Determine sort field
    const sortField = sortBy === 'amount'
      ? bankTransactions.amount
      : bankTransactions.transactionDate

    // Get paginated results
    const transactions = await db
      .select({
        id: bankTransactions.id,
        transactionId: bankTransactions.transactionId,
        bankName: bankTransactions.bankName,
        accountNumber: bankTransactions.accountNumber,
        amount: bankTransactions.amount,
        transactionType: bankTransactions.transactionType,
        transactionDate: bankTransactions.transactionDate,
        fee: bankTransactions.fee,
        balance: bankTransactions.balance
      })
      .from(bankTransactions)
      .where(whereClause || sql`1=1`)
      .orderBy(sortOrder === 'asc' ? sql`${sortField} ASC` : sql`${sortField} DESC`)
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data: transactions,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching bank transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
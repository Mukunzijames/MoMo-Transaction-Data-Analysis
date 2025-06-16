import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { eq } from 'drizzle-orm'
import { incomingMoneyTransactions } from '@/app/db/schema'
import db from '@/app/db/index'

export const runtime = 'edge'

// Create Hono app WITHOUT any base path - Next.js already handles the /api part
const app = new Hono().basePath('/api')

// Add CORS middleware to all routes
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))

// Root handler
app.get('/', (c) => {
  return c.json({
    message: 'API root',
    endpoints: ['/hello', '/incoming-money', '/cash-power', '/bank-transfers']
  })
})

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono!'
  })
})

app.get('/cash-power', (c) => {
  return c.json({
    status: 'success',
    message: 'Cash power transaction processed'
  })
})

app.get('/third-party-withdrawals', (c) => {
  return c.json({
    status: 'success',
    message: 'Third party withdrawal processed'
  })
})

app.get('/mobile-transfers', (c) => {
  return c.json({
    status: 'success',
    message: 'Mobile transfer completed'
  })
})

app.get('/bank-transfers', (c) => {
  return c.json({
    status: 'success',
    message: 'Bank transfer initiated'
  })
})

app.get('/bundles', (c) => {
  return c.json({
    status: 'success',
    message: 'Bundle purchase successful'
  })
})

app.get('/code-holder-payments', (c) => {
  return c.json({
    status: 'success',
    message: 'Code holder payment processed'
  })
})

app.get('/bank-deposits', (c) => {
  return c.json({
    status: 'success',
    message: 'Bank deposit recorded'
  })
})

app.get('/airtime-bill-payments', (c) => {
  return c.json({
    status: 'success',
    message: 'Airtime or bill payment completed'
  })
})

// Export handlers for Next.js
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)

export type PaymentsBody = {
  correlationId: string
  amount: string
}

export type FullPayment = PaymentsBody & {
  requestedAt: string
}

export type PaymentProcessorHealthBody = {
  failing: boolean,
  minResponseTime: number
}

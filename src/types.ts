export type PaymentsBody = {
  correlationId: string
  amount: string
}

export type PaymentProcessorHealthBody = {
  failing: string,
  minResponseTime: string
}

import type { PaymentProcessorHealthBody } from "./types"

export let payment_processor = 'default'
export let payment_processor_url = process.env.PROCESSOR_DEFAULT_URL

export async function runHealthChecker() {
  while (true) {
    const responseDf = await fetch(`${process.env.PROCESSOR_DEFAULT_URL}/payments/service-health`)
    const dataDf = await responseDf.json() as PaymentProcessorHealthBody
    const responseFb = await fetch(`${process.env.PROCESSOR_FALLBACK_URL}/payments/service-health`)
    const dataFb = await responseFb.json() as PaymentProcessorHealthBody

    setPaymentProcessorUrl(dataDf, dataFb)
    await new Promise((r) => setTimeout(r, 5000))
  }
}

function setPaymentProcessorUrl(dataDf: PaymentProcessorHealthBody, dataFb: PaymentProcessorHealthBody) {
  if (dataDf.failing && !dataFb.failing) {
    payment_processor_url = process.env.PROCESSOR_FALLBACK_URL
    payment_processor = 'fallback'
    return
  }
  payment_processor_url = process.env.PROCESSOR_DEFAULT_URL
  payment_processor = 'default'
}
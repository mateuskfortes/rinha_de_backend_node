import pool from "./db"
import type { FullPayment, PaymentProcessorHealthBody } from "./types"
import { redis } from "bun"

export let payment_processor = 'default'
export let payment_processor_url = process.env.PROCESSOR_DEFAULT_URL

export async function runHealthChecker(workers: Worker[]) {
  while (true) {
    try {
      const responseDf = await fetch(`${process.env.PROCESSOR_DEFAULT_URL}/payments/service-health`)
      const dataDf = await responseDf.json() as PaymentProcessorHealthBody
      const responseFb = await fetch(`${process.env.PROCESSOR_FALLBACK_URL}/payments/service-health`)
      const dataFb = await responseFb.json() as PaymentProcessorHealthBody

      setPaymentProcessorUrl(dataDf, dataFb)
      workers.forEach((w) => w.postMessage({ payment_processor, payment_processor_url }))

      await Bun.sleep(5000)
    } catch (e) {
      console.error(e)
    }
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


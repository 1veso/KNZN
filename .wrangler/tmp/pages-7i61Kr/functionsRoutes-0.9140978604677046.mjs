import { onRequestOptions as __create_checkout_js_onRequestOptions } from "C:\\Users\\benja\\WebstormProjects\\KNZN\\functions\\create-checkout.js"
import { onRequestPost as __create_checkout_js_onRequestPost } from "C:\\Users\\benja\\WebstormProjects\\KNZN\\functions\\create-checkout.js"
import { onRequestPost as __stripe_webhook_js_onRequestPost } from "C:\\Users\\benja\\WebstormProjects\\KNZN\\functions\\stripe-webhook.js"

export const routes = [
    {
      routePath: "/create-checkout",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__create_checkout_js_onRequestOptions],
    },
  {
      routePath: "/create-checkout",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__create_checkout_js_onRequestPost],
    },
  {
      routePath: "/stripe-webhook",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__stripe_webhook_js_onRequestPost],
    },
  ]
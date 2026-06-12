import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return Response.json({ error: "Razorpay credentials not configured", keyId: !!keyId, keySecret: !!keySecret }, { status: 500 });
    }

    const credentials = btoa(`${keyId}:${keySecret}`);

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 14900,
        currency: "INR",
        receipt: `reg_${Date.now()}`,
      }),
    });

    const order = await orderRes.json();

    if (!orderRes.ok) {
      return Response.json({ error: order.error?.description || "Failed to create order", razorpay_error: order.error }, { status: 400 });
    }

    return Response.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { registration_id, email, name } = await req.json();

    if (!email || !name) {
      return Response.json({ error: 'Missing email or name' }, { status: 400 });
    }

    // Send confirmation email via service role (allows sending to non-app users)
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Registration Confirmation - Genda Phool Break-A-Thon',
      body: `
Hi ${name},

Thank you for registering for the Genda Phool Break-A-Thon!

We've received your registration and payment reference. Our team will verify your payment shortly, and you'll receive your Participant ID via email once confirmed.

**What happens next:**
1. We verify your payment (usually within a few hours)
2. You'll receive your unique Participant ID
3. Show up on event day, check in, and start hunting bugs!

If you have any questions, feel free to reach out to us.

See you at the Break-A-Thon! 🎉

---
Genda Phool Break-A-Thon Team
      `.trim(),
    });

    return Response.json({ success: true, message: 'Confirmation email sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
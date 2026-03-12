/**
 * Batch Email Sending
 * Implementation for email campaign functionality
 */

export interface EmailRecipient {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface BatchEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Send emails in batches using the sendEmail function
 * This is a simplified version that works with the existing sendEmail
 */
export async function sendBatchEmails(
  emails: EmailRecipient[]
): Promise<BatchEmailResult> {
  // Import sendEmail from the existing module
  const { sendEmail } = await import("@/lib/email/send");
  
  const BATCH_SIZE = 100;
  const results: BatchEmailResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(email =>
        sendEmail({
          to: email.to,
          subject: email.subject,
          html: email.html,
        }).then(
          (result) => ({ status: "fulfilled", value: result }),
          (error) => ({ status: "rejected", reason: error })
        )
      )
    );

    // Count successes and failures
    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const emailResult = result.value as unknown as { success: boolean; messageId?: string; error?: string };
        if (emailResult?.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            email: batch[index].to,
            error: emailResult?.error || "Unknown error",
          });
        }
      } else {
        results.failed++;
        results.errors.push({
          email: batch[index].to,
          error: result.reason || "Batch send failed",
        });
      }
    });

    // Rate limit: wait between batches
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  results.success = results.failed === 0;
  results.sent = results.sent;
  return results;
}

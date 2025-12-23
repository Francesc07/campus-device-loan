// src/API/functions/check-overdue-loans-timer.ts
import { app, InvocationContext, Timer } from "@azure/functions";
import { appServices } from "../../appServices";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

/**
 * Timer-triggered function to check for overdue loans
 * Runs every hour to update Active loans that have passed their due date
 * Schedule: 0 0 * * * * (every hour at minute 0)
 */
export async function checkOverdueLoansTimer(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const now = new Date();
  context.log(`⏰ Checking for overdue loans at ${now.toISOString()}`);

  try {
    // Get all Active loans
    const activeLoans = await appServices.loanRepo.listByStatus(LoanStatus.Active);
    context.log(`📋 Found ${activeLoans.length} active loans to check`);

    let overdueCount = 0;

    for (const loan of activeLoans) {
      const dueDate = new Date(loan.dueDate);
      
      // Check if loan is past due date
      if (now > dueDate) {
        context.log(`⚠️ Loan ${loan.id} is overdue (due: ${loan.dueDate})`);
        
        // Update status to Overdue
        loan.status = LoanStatus.Overdue;
        loan.updatedAt = now.toISOString();
        
        await appServices.loanRepo.update(loan);
        overdueCount++;
        
        context.log(`✅ Updated loan ${loan.id} status: Active → Overdue`);
        
        // Optionally publish an event or send notification
        // await appServices.loanEventPublisher.publishLoanOverdue(loan);
      }
    }

    context.log(`✅ Overdue check complete. Updated ${overdueCount} loans to Overdue status`);
    
  } catch (error: any) {
    context.error(`❌ Error checking overdue loans:`, error);
    throw error;
  }
}

app.timer("check-overdue-loans-timer", {
  // Run every hour at minute 0
  schedule: "0 0 * * * *",
  handler: checkOverdueLoansTimer,
});

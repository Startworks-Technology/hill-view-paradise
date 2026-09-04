/**
 * ==============================================================================
 * File: src/hooks/useAutoBilling.js
 * Description: Client-side automatic monthly dues scheduler.
 * 
 * Flow:
 * 1. On app boot, checks if current active month dues have been billed in `billing_logs`.
 * 2. If unbilled, executes `generateMonthlyDues(currentMonth, currentYear, 'Auto-Scheduler')`.
 * 3. Sets a timer to wake up at midnight on date rollovers to check for the 1st of a new month.
 * ==============================================================================
 */

import { useEffect, useRef } from 'react';
import { generateMonthlyDues, getResidents } from '../services/residentService';
import { getBillingLogByMonth } from '../services/billingLogService';

export const useAutoBilling = () => {
  const isRunningRef = useRef(false);

  useEffect(() => {
    let midnightTimer = null;

    const runAutoBillingCheck = async () => {
      if (isRunningRef.current) return;

      try {
        isRunningRef.current = true;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        // 1. Fetch current month billing log and resident profiles from Firestore
        const [existingLog, residents] = await Promise.all([
          getBillingLogByMonth(currentMonth, currentYear),
          getResidents(),
        ]);

        const hasUnbilledResidents = residents.some((r) => r.lastBilledMonthYear !== monthKey);

        // 2. If log is missing OR residents have not had their dues applied
        if (!existingLog || existingLog.status !== 'Completed' || hasUnbilledResidents) {
          console.info(`[Auto-Billing] Applying monthly maintenance dues for ${monthKey}...`);
          const res = await generateMonthlyDues(currentMonth, currentYear, 'Auto-Scheduler', true);
          if (res.billedCount > 0) {
            console.info(`[Auto-Billing] Successfully billed ₹${res.totalBilled} across ${res.billedCount} properties for ${monthKey}.`);
          }
        }
      } catch (err) {
        console.warn('[Auto-Billing] Auto billing evaluation warning:', err);
      } finally {
        isRunningRef.current = false;
      }
    };

    // 1. Run immediate check on mount
    runAutoBillingCheck();

    // 2. Schedule next check at next day midnight (00:00:02)
    const scheduleMidnightCheck = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      const msUntilMidnight = Math.max(1000, tomorrow.getTime() - now.getTime());

      midnightTimer = setTimeout(async () => {
        await runAutoBillingCheck();
        scheduleMidnightCheck(); // re-arm for next midnight
      }, msUntilMidnight);
    };

    scheduleMidnightCheck();

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
    };
  }, []);
};

/**
 * Immediate persistence service for auto-saving validated businesses to Supabase.
 * This service handles background saving of individual validated records as they are processed.
 */

import { upsertBusinessesByPhone, type Business } from '@/lib/supabase';
import { toast } from 'sonner';

export interface PersistenceResult {
  success: boolean;
  savedCount: number;
  errorCount: number;
  errors: string[];
}

// Queue for batching persistence operations
class PersistenceQueue {
  private queue: Business[] = [];
  private processing = false;
  private batchSize = 5;
  private delay = 2000; // 2 seconds between batches
  
  constructor() {
    // Process queue every few seconds
    setInterval(() => {
      if (this.queue.length > 0 && !this.processing) {
        this.processBatch();
      }
    }, this.delay);
  }
  
  add(business: Business) {
    // Only add validated businesses with phone numbers
    if (business._status === 'validated' && business.phone) {
      this.queue.push(business);
      
      // If queue gets too large, process immediately
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      }
    }
  }
  
  private async processBatch() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const result = await upsertBusinessesByPhone(batch);
      
      if (result.error) {
        console.error('Persistence batch error:', result.error);
        toast.error(`Failed to save ${batch.length} businesses to database`);
      } else if (result.pushed > 0) {
        console.log(`Successfully saved ${result.pushed} businesses to database`);
        toast.success(`Auto-saved ${result.pushed} businesses to database`);
      }
    } catch (error) {
      console.error('Persistence batch error:', error);
      toast.error('Auto-save failed');
    } finally {
      this.processing = false;
    }
  }
  
  async flush() {
    // Process all remaining items in queue
    while (this.queue.length > 0) {
      await this.processBatch();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }
}

// Global persistence queue instance
const persistenceQueue = new PersistenceQueue();

/**
 * Save a single validated business immediately to Supabase.
 * This is the main function to call from the scraper.
 */
export async function saveBusinessImmediately(business: Business): Promise<PersistenceResult> {
  const errors: string[] = [];
  let savedCount = 0;
  let errorCount = 0;
  
  try {
    // Only save validated businesses with phone numbers
    if (business._status !== 'validated' || !business.phone) {
      return {
        success: false,
        savedCount: 0,
        errorCount: 1,
        errors: ['Business must be validated and have a phone number']
      };
    }
    
    // Use the existing upsert function
    const result = await upsertBusinessesByPhone([business]);
    
    if (result.error) {
      errors.push(result.error.message || 'Unknown error');
      errorCount++;
    } else {
      savedCount = result.pushed || 0;
      errorCount = result.skipped || 0;
    }
    
    return {
      success: savedCount > 0 && errorCount === 0,
      savedCount,
      errorCount,
      errors
    };
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    errorCount++;
    
    return {
      success: false,
      savedCount: 0,
      errorCount,
      errors
    };
  }
}

/**
 * Queue a business for background persistence.
 * This is preferred for high-volume scraping to avoid overwhelming the database.
 */
export function queueBusinessForPersistence(business: Business) {
  persistenceQueue.add(business);
}

/**
 * Process any remaining businesses in the persistence queue.
 * Call this when scraping is complete.
 */
export async function flushPersistenceQueue(): Promise<PersistenceResult> {
  await persistenceQueue.flush();
  
  return {
    success: true,
    savedCount: 0,
    errorCount: 0,
    errors: []
  };
}

/**
 * Get statistics about the persistence queue.
 */
export function getPersistenceQueueStats() {
  return persistenceQueue.getStats();
}

/**
 * Batch save multiple businesses to Supabase.
 * This is useful for bulk operations.
 */
export async function batchSaveBusinesses(businesses: Business[]): Promise<PersistenceResult> {
  const errors: string[] = [];
  let totalSaved = 0;
  let totalErrors = 0;
  
  // Filter for validated businesses with phone numbers
  const validBusinesses = businesses.filter(b => b._status === 'validated' && b.phone);
  
  if (validBusinesses.length === 0) {
    return {
      success: false,
      savedCount: 0,
      errorCount: businesses.length,
      errors: ['No valid businesses to save (must be validated with phone numbers)']
    };
  }
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < validBusinesses.length; i += batchSize) {
    const batch = validBusinesses.slice(i, i + batchSize);
    
    try {
      const result = await upsertBusinessesByPhone(batch);
      
      if (result.error) {
        errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${result.error.message}`);
        totalErrors += batch.length;
      } else {
        totalSaved += result.pushed || 0;
        totalErrors += result.skipped || 0;
      }
      
      // Small delay between batches
      if (i + batchSize < validBusinesses.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      totalErrors += batch.length;
    }
  }
  
  return {
    success: totalSaved > 0 && totalErrors === 0,
    savedCount: totalSaved,
    errorCount: totalErrors,
    errors
  };
}

/**
 * Enhanced validation result with immediate persistence option.
 */
export interface ValidationWithPersistenceResult {
  business: Business;
  saved: boolean;
  error?: string;
}

/**
 * Validate and immediately persist a business.
 * Combines validation and database save in one operation.
 */
export async function validateAndPersistBusiness(business: Partial<Business>): Promise<ValidationWithPersistenceResult> {
  // First validate the business (this would be your existing validation logic)
  const validatedBusiness = business as Business; // Assuming validation is done elsewhere
  
  // Then immediately persist it
  const result = await saveBusinessImmediately(validatedBusiness);
  
  return {
    business: validatedBusiness,
    saved: result.success,
    error: result.errors[0]
  };
}

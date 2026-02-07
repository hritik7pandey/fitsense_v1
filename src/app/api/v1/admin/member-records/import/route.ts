import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest, requireAdmin } from '@/lib/auth';

// Helper to parse CSV content
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header - handle various formats
  const headerLine = lines[0].replace(/\r/g, '');
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, '').trim();
    if (!line) continue;
    
    // Handle quoted values with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));
    
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      // Map common header variations
      let key = header;
      if (header.includes('name') && !header.includes('plan')) key = 'name';
      else if (header.includes('email')) key = 'email';
      else if (header.includes('phone') || header.includes('mobile')) key = 'phone';
      else if (header.includes('plan') && header.includes('name')) key = 'planname';
      else if (header.includes('plan')) key = 'planname';
      else if (header.includes('total') || header.includes('amount')) key = 'plantotalamount';
      else if (header.includes('paid')) key = 'paidamount';
      else if (header.includes('start')) key = 'membershipstartdate';
      else if (header.includes('end')) key = 'membershipenddate';
      else if (header.includes('note')) key = 'notes';
      
      record[key] = values[index] || '';
    });
    
    if (record.name || record.email || record.phone) {
      records.push(record);
    }
  }
  
  return records;
}

// POST /api/v1/admin/member-records/import - Import records from CSV file or JSON
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    let records: Record<string, any>[] = [];
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
      const content = await file.text();
      
      if (file.name.endsWith('.csv')) {
        records = parseCSV(content);
      } else if (file.name.endsWith('.json')) {
        records = JSON.parse(content);
        if (!Array.isArray(records)) {
          records = [records];
        }
      } else {
        // Try to parse as CSV by default
        records = parseCSV(content);
      }
    } else {
      // Handle JSON body
      const body = await request.json();
      records = body.records || body;
      if (!Array.isArray(records)) {
        records = [records];
      }
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'No records found in file' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        // Normalize field names (case insensitive)
        const normalizedRecord: Record<string, any> = {};
        for (const [key, value] of Object.entries(record)) {
          normalizedRecord[key.toLowerCase().replace(/\s+/g, '')] = value;
        }
        
        const name = normalizedRecord.name?.toString().trim();
        const email = normalizedRecord.email?.toString().trim() || null;
        const phone = normalizedRecord.phone?.toString().trim() || null;
        
        if (!name) {
          skipped++;
          continue;
        }

        // Check if member already exists by email or phone
        let existingRecord = null;
        if (email) {
          existingRecord = await queryOne(`SELECT id FROM member_records WHERE email = $1`, [email]);
        }
        if (!existingRecord && phone) {
          existingRecord = await queryOne(`SELECT id FROM member_records WHERE phone = $1`, [phone]);
        }

        // Parse dates
        let startDate = null;
        let endDate = null;

        const startDateStr = normalizedRecord.membershipstartdate || normalizedRecord.startdate;
        const endDateStr = normalizedRecord.membershipenddate || normalizedRecord.enddate;

        if (startDateStr) {
          const parsed = new Date(startDateStr);
          if (!isNaN(parsed.getTime())) {
            startDate = parsed.toISOString();
          }
        }

        if (endDateStr) {
          const parsed = new Date(endDateStr);
          if (!isNaN(parsed.getTime())) {
            endDate = parsed.toISOString();
          }
        }

        const planTotalAmount = parseFloat(normalizedRecord.plantotalamount || normalizedRecord.total || 0) || 0;
        const paidAmount = parseFloat(normalizedRecord.paidamount || normalizedRecord.paid || 0) || 0;
        const planName = normalizedRecord.planname?.toString().trim() || null;
        const notes = normalizedRecord.notes?.toString().trim() || null;

        // Create payment installment if paid amount > 0
        const paymentInstallments = paidAmount > 0 ? [{
          id: Date.now(),
          amount: paidAmount,
          paymentMode: 'CASH',
          notes: 'Imported from file',
          paidAt: startDate || new Date().toISOString()
        }] : [];

        if (existingRecord) {
          // Update existing record
          await query(`
            UPDATE member_records SET
              name = $2,
              phone = COALESCE(NULLIF($3, ''), phone),
              "planName" = COALESCE(NULLIF($4, ''), "planName"),
              "planTotalAmount" = CASE WHEN $5 > 0 THEN $5 ELSE "planTotalAmount" END,
              "paidAmount" = CASE WHEN $6 > 0 THEN $6 ELSE "paidAmount" END,
              "membershipStartDate" = COALESCE($7, "membershipStartDate"),
              "membershipEndDate" = COALESCE($8, "membershipEndDate"),
              notes = COALESCE(NULLIF($9, ''), notes),
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [
            existingRecord.id,
            name,
            phone,
            planName,
            planTotalAmount,
            paidAmount,
            startDate,
            endDate,
            notes
          ]);
        } else {
          // Insert new record
          await query(`
            INSERT INTO member_records (
              name, email, phone, "planName", "planTotalAmount", "paidAmount",
              "paymentInstallments", "membershipStartDate", "membershipEndDate", 
              notes, "isSignedUp", "createdAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, CURRENT_TIMESTAMP)
          `, [
            name,
            email,
            phone,
            planName,
            planTotalAmount,
            paidAmount,
            JSON.stringify(paymentInstallments),
            startDate,
            endDate,
            notes
          ]);
        }

        imported++;
      } catch (err: any) {
        errors.push(`Row ${record.name || 'unknown'}: ${err.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: records.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined
    });
  } catch (error: any) {
    console.error('Failed to import member records:', error);
    return NextResponse.json(
      { error: 'Failed to import records: ' + error.message },
      { status: 500 }
    );
  }
}

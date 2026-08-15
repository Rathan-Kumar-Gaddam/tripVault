/**
 * Utility functions for exporting TripVault data to CSV/Excel and PDF/Printable statements.
 * Supports both Full Group Passbook Reports and Individual/Personal Expense Tracking Reports.
 */

// Helper to escape CSV fields safely
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Computes individual user share for an expense transaction.
 */
export const computeUserShare = (tx, userId, members = []) => {
  if (!tx || tx.type !== 'expense' || !userId) return 0;
  const uid = userId.toString();

  // If splits exist
  if (tx.splits && tx.splits.length > 0) {
    const mySplit = tx.splits.find((s) => {
      const sUid = (s.user?._id || s.user)?.toString();
      return sUid === uid;
    });
    return mySplit ? (mySplit.amount || 0) : 0;
  }

  // If sharedBy exists
  if (tx.sharedBy && tx.sharedBy.length > 0) {
    const isShared = tx.sharedBy.some((u) => {
      const sUid = (u?._id || u)?.toString();
      return sUid === uid;
    });
    return isShared ? (tx.amount / tx.sharedBy.length) : 0;
  }

  // Fallback to all members
  const memberCount = members.length > 0 ? members.length : 1;
  return tx.amount / memberCount;
};

/**
 * Exports complete trip data, passbook, and ledger to a multi-section CSV file.
 */
export const exportTripToCSV = (trip, transactions = [], companionDebts = [], user = null) => {
  if (!trip) return;

  const currency = trip.currency || '₹';
  const totalSpent = (transactions || [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const budget = trip.budget || 0;
  const remainingBudget = budget > 0 ? budget - totalSpent : null;
  const budgetUsagePercent = budget > 0 ? ((totalSpent / budget) * 100).toFixed(1) : 'N/A';

  // Category breakdown calculations
  const categoryMap = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, total: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].total += t.amount || 0;
    });

  const lines = [];

  // UTF-8 BOM for Excel to open Unicode characters (₹, €, emojis) properly
  lines.push('\ufeff');

  // ===================== SECTION 1: TRIP SUMMARY =====================
  lines.push('=== TRIPVAULT GROUP TRIP SUMMARY REPORT ===');
  lines.push(`Trip Name,${escapeCSV(trip.name)}`);
  lines.push(`Destination,${escapeCSV(trip.destination || 'N/A')}`);
  lines.push(`Currency,${escapeCSV(currency)}`);
  lines.push(`Total Expenses,${escapeCSV(`${currency}${totalSpent.toFixed(2)}`)}`);
  lines.push(`Trip Budget Target,${escapeCSV(budget > 0 ? `${currency}${budget.toFixed(2)}` : 'Not Set')}`);
  if (budget > 0) {
    lines.push(`Remaining Budget,${escapeCSV(`${currency}${remainingBudget.toFixed(2)}`)}`);
    lines.push(`Budget Consumed,${escapeCSV(`${budgetUsagePercent}%`)}`);
  }
  lines.push(`Total Transactions,${escapeCSV(transactions.length)}`);
  lines.push(`Generated On,${escapeCSV(new Date().toLocaleString())}`);
  lines.push('');

  // ===================== SECTION 2: PERSONAL PASSBOOK =====================
  lines.push('=== PERSONAL PASSBOOK (WHO OWES WHO) ===');
  lines.push('Companion Name,Phone / Contact,Status,Direct Balance');
  companionDebts.forEach((debt) => {
    const compName = debt.user?.name || 'Unknown';
    const compPhone = debt.user?.phone || debt.user?.email || 'N/A';
    let statusText = 'Settled Up';
    if (debt.status === 'owes_you') statusText = 'Owes You';
    if (debt.status === 'you_owe') statusText = 'You Owe';

    lines.push([
      escapeCSV(compName),
      escapeCSV(compPhone),
      escapeCSV(statusText),
      escapeCSV(`${currency}${debt.amount.toFixed(2)}`),
    ].join(','));
  });
  lines.push('');

  // ===================== SECTION 3: GROUP LEDGER STANDINGS =====================
  lines.push('=== GROUP STANDINGS ===');
  lines.push('Member Name,Role,Phone / Contact,Overall Net Balance');
  (trip.members || []).forEach((m) => {
    const mUser = m.user || m;
    const name = mUser?.name || 'Unknown';
    const role = m.role === 'admin' ? 'Admin' : 'Member';
    const phone = mUser?.phone || mUser?.email || 'N/A';
    const balance = m.balance || 0;
    const balanceFormatted = `${balance > 0 ? '+' : ''}${currency}${balance.toFixed(2)}`;

    lines.push([
      escapeCSV(name),
      escapeCSV(role),
      escapeCSV(phone),
      escapeCSV(balanceFormatted),
    ].join(','));
  });
  lines.push('');

  // ===================== SECTION 4: CATEGORY SPEND BREAKDOWN =====================
  lines.push('=== CATEGORY SPEND BREAKDOWN ===');
  lines.push('Category,Number of Expenses,Total Spent,Percentage of Spend');
  Object.entries(categoryMap).forEach(([cat, data]) => {
    const pct = totalSpent > 0 ? ((data.total / totalSpent) * 100).toFixed(1) : '0.0';
    lines.push([
      escapeCSV(cat),
      escapeCSV(data.count),
      escapeCSV(`${currency}${data.total.toFixed(2)}`),
      escapeCSV(`${pct}%`),
    ].join(','));
  });
  lines.push('');

  // ===================== SECTION 5: ITEMIZED TRANSACTIONS LEDGER =====================
  lines.push('=== ITEMIZED TRANSACTIONS LEDGER ===');
  lines.push('Date,Type,Category,Description,Paid By,Split With / Recipient,Total Bill,My Share');
  transactions.forEach((tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    const type = tx.type === 'settlement' ? 'Settlement' : 'Expense';
    const cat = tx.category || (type === 'Settlement' ? 'Settlement' : 'General');
    const desc = tx.description || '';
    const payerName = tx.payer?.name || tx.createdBy?.name || 'Unknown';

    let splitWith = 'All Members';
    if (tx.type === 'settlement') {
      const recipient = tx.splits?.[0]?.user || tx.sharedBy?.[0];
      splitWith = recipient?.name || 'Recipient';
    } else if (tx.splitType === 'self') {
      splitWith = `${payerName} (Personal / Self)`;
    } else if (tx.splitType === 'individual') {
      splitWith = tx.splits?.[0]?.user?.name || '1 Person';
    } else if (tx.splitType === 'custom') {
      splitWith = (tx.splits || []).map((s) => s.user?.name || 'Member').join('; ');
    }

    const myShare = user ? computeUserShare(tx, user._id, trip.members) : 0;
    const amountFormatted = `${tx.type === 'settlement' ? '+' : '-'}${currency}${(tx.amount || 0).toFixed(2)}`;
    const myShareFormatted = tx.type === 'expense' ? `-${currency}${myShare.toFixed(2)}` : 'N/A';

    lines.push([
      escapeCSV(date),
      escapeCSV(type),
      escapeCSV(cat),
      escapeCSV(desc),
      escapeCSV(payerName),
      escapeCSV(splitWith),
      escapeCSV(amountFormatted),
      escapeCSV(myShareFormatted),
    ].join(','));
  });

  downloadCSV(lines.join('\r\n'), `${trip.name}_Group_Passbook_${new Date().toISOString().slice(0, 10)}.csv`);
};

/**
 * Exports INDIVIDUAL / PERSONAL Expense Report to CSV for personal expense tracking.
 */
export const exportPersonalExpenseToCSV = (trip, transactions = [], user = null) => {
  if (!trip || !user) return;

  const currency = trip.currency || '₹';
  const myUserId = user._id?.toString();

  // Filter expenses where user is either in split (consumed) or is the payer
  const myExpenses = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
    const isPayer = payerId === myUserId;
    const share = computeUserShare(tx, myUserId, trip.members);
    return isPayer || share > 0;
  });

  let totalMyConsumption = 0; // Total money user consumed
  let totalMyPaid = 0; // Total money user paid upfront

  const myCategoryMap = {};

  myExpenses.forEach((tx) => {
    const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
    const isPayer = payerId === myUserId;
    const share = computeUserShare(tx, myUserId, trip.members);

    totalMyConsumption += share;
    if (isPayer) totalMyPaid += (tx.amount || 0);

    const cat = tx.category || 'Other';
    if (!myCategoryMap[cat]) myCategoryMap[cat] = { count: 0, myShareTotal: 0, totalBill: 0 };
    myCategoryMap[cat].count += 1;
    myCategoryMap[cat].myShareTotal += share;
    myCategoryMap[cat].totalBill += tx.amount || 0;
  });

  const netBalance = totalMyPaid - totalMyConsumption;

  const lines = [];
  lines.push('\ufeff'); // UTF-8 BOM

  // ===================== SECTION 1: PERSONAL SUMMARY =====================
  lines.push('=== INDIVIDUAL PERSONAL EXPENSE TRACKING STATEMENT ===');
  lines.push(`User Name,${escapeCSV(user.name)}`);
  lines.push(`Trip Name,${escapeCSV(trip.name)}`);
  lines.push(`Destination,${escapeCSV(trip.destination || 'N/A')}`);
  lines.push(`Currency,${escapeCSV(currency)}`);
  lines.push(`My True Expense (Consumed Share),${escapeCSV(`${currency}${totalMyConsumption.toFixed(2)}`)}`);
  lines.push(`Total Amount Paid Upfront by Me,${escapeCSV(`${currency}${totalMyPaid.toFixed(2)}`)}`);
  lines.push(`Net Reimbursement Standing,${escapeCSV(`${netBalance >= 0 ? '+' : ''}${currency}${netBalance.toFixed(2)}`)}`);
  lines.push(`Total Expenses Involved,${escapeCSV(myExpenses.length)}`);
  lines.push(`Generated On,${escapeCSV(new Date().toLocaleString())}`);
  lines.push('');

  // ===================== SECTION 2: PERSONAL CATEGORY BREAKDOWN =====================
  lines.push('=== MY PERSONAL SPEND BY CATEGORY ===');
  lines.push('Category,Activities Count,My Personal Share,Percentage of My Spend');
  Object.entries(myCategoryMap).forEach(([cat, data]) => {
    const pct = totalMyConsumption > 0 ? ((data.myShareTotal / totalMyConsumption) * 100).toFixed(1) : '0.0';
    lines.push([
      escapeCSV(cat),
      escapeCSV(data.count),
      escapeCSV(`${currency}${data.myShareTotal.toFixed(2)}`),
      escapeCSV(`${pct}%`),
    ].join(','));
  });
  lines.push('');

  // ===================== SECTION 3: ITEMIZED PERSONAL EXPENSES =====================
  lines.push('=== MY ITEMIZED EXPENSE ENTRIES ===');
  lines.push('Date,Category,Description,Paid By,Total Bill,My Exact Share,I Paid Upfront,Net Impact (+/-)');
  myExpenses.forEach((tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    const cat = tx.category || 'General';
    const desc = tx.description || '';
    const payer = tx.payer || tx.createdBy;
    const isPayer = (payer?._id || payer)?.toString() === myUserId;
    const payerName = isPayer ? 'You' : (payer?.name || 'Companion');

    const totalBill = tx.amount || 0;
    const myShare = computeUserShare(tx, myUserId, trip.members);
    const paidByMe = isPayer ? totalBill : 0;
    const netImpact = paidByMe - myShare;

    lines.push([
      escapeCSV(date),
      escapeCSV(cat),
      escapeCSV(desc),
      escapeCSV(payerName),
      escapeCSV(`${currency}${totalBill.toFixed(2)}`),
      escapeCSV(`-${currency}${myShare.toFixed(2)}`),
      escapeCSV(isPayer ? `${currency}${paidByMe.toFixed(2)}` : '₹0.00'),
      escapeCSV(`${netImpact >= 0 ? '+' : ''}${currency}${netImpact.toFixed(2)}`),
    ].join(','));
  });

  downloadCSV(lines.join('\r\n'), `${trip.name}_My_Personal_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
};

/**
 * Triggers file download for CSV content.
 */
const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', cleanName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a clean browser print preview / PDF save statement.
 */
export const printTripReport = (trip, transactions = [], companionDebts = [], user = null) => {
  if (!trip) return;

  const currency = trip.currency || '₹';
  const totalSpent = (transactions || [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const budget = trip.budget || 0;
  const remainingBudget = budget > 0 ? budget - totalSpent : null;

  // Individual user stats
  let myTotalShare = 0;
  if (user) {
    transactions.filter(t => t.type === 'expense').forEach(t => {
      myTotalShare += computeUserShare(t, user._id, trip.members);
    });
  }

  // Category breakdown
  const categoryMap = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, total: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].total += t.amount || 0;
    });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable statement.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${trip.name} - TripVault Statement</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { padding: 40px; color: #1e293b; background: #ffffff; font-size: 13px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
        .brand { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
        .trip-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 5px; }
        .meta { color: #64748b; font-size: 12px; }
        
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
        .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .card-val { font-size: 18px; font-weight: 800; color: #0f172a; }
        .card-val.expense { color: #e11d48; }
        .card-val.settled { color: #059669; }

        h2 { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
        tr:last-child td { border-bottom: none; }
        
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
        .badge-expense { background: #ffe4e6; color: #e11d48; }
        .badge-settle { background: #d1fae5; color: #059669; }
        .badge-owes { background: #fee2e2; color: #991b1b; }
        .badge-owed { background: #dcfce7; color: #166534; }

        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
        
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">TripVault</div>
          <div class="trip-title">${trip.name}</div>
          <div class="meta">Destination: ${trip.destination || 'N/A'} • Currency: ${currency}</div>
        </div>
        <div style="text-align: right;">
          <div class="meta">Statement Date: ${new Date().toLocaleDateString()}</div>
          <div class="meta">Member: <strong>${user?.name || 'All Members'}</strong></div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-label">Total Trip Expenses</div>
          <div class="card-val expense">${currency}${totalSpent.toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="card-label">My Consumed Share</div>
          <div class="card-val expense">${currency}${myTotalShare.toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="card-label">Trip Budget</div>
          <div class="card-val">${budget > 0 ? `${currency}${budget.toFixed(2)}` : 'No Limit'}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Activities</div>
          <div class="card-val">${transactions.length}</div>
        </div>
      </div>

      <h2>Personal Passbook Balances</h2>
      <table>
        <thead>
          <tr>
            <th>Companion</th>
            <th>Contact</th>
            <th>Status</th>
            <th style="text-align: right;">Direct Balance</th>
          </tr>
        </thead>
        <tbody>
          ${companionDebts.map(d => `
            <tr>
              <td><strong>${d.user?.name || 'Companion'}</strong></td>
              <td>${d.user?.phone || d.user?.email || '—'}</td>
              <td>
                <span class="badge ${d.status === 'owes_you' ? 'badge-owed' : d.status === 'you_owe' ? 'badge-owes' : ''}">
                  ${d.status === 'owes_you' ? 'Owes you' : d.status === 'you_owe' ? 'You owe' : 'Settled'}
                </span>
              </td>
              <td style="text-align: right; font-weight: 800; color: ${d.status === 'owes_you' ? '#059669' : d.status === 'you_owe' ? '#e11d48' : '#64748b'};">
                ${currency}${d.amount.toFixed(2)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Category Spend Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Expenses Count</th>
            <th>Total Amount</th>
            <th style="text-align: right;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(categoryMap).map(([cat, d]) => `
            <tr>
              <td><strong>${cat}</strong></td>
              <td>${d.count}</td>
              <td style="font-weight: 700;">${currency}${d.total.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700;">
                ${totalSpent > 0 ? ((d.total / totalSpent) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Itemized Activity Ledger (With Individual Share)</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th>Paid By</th>
            <th>Total Amount</th>
            <th style="text-align: right;">My Share</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(tx => {
            const isSettlement = tx.type === 'settlement';
            const myShare = user ? computeUserShare(tx, user._id, trip.members) : 0;
            return `
              <tr>
                <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
                <td><span class="badge ${isSettlement ? 'badge-settle' : 'badge-expense'}">${isSettlement ? 'Settlement' : 'Expense'}</span></td>
                <td><strong>${tx.description}</strong></td>
                <td>${tx.payer?.name || tx.createdBy?.name || 'Member'}</td>
                <td style="font-weight: 800; color: ${isSettlement ? '#059669' : '#e11d48'};">
                  ${isSettlement ? '+' : '-'}${currency}${(tx.amount || 0).toFixed(2)}
                </td>
                <td style="text-align: right; font-weight: 800; color: ${isSettlement ? '#64748b' : '#e11d48'};">
                  ${isSettlement ? '—' : `-${currency}${myShare.toFixed(2)}`}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        Generated by TripVault • Smart Group & Individual Travel Expense Sharing • All amounts in ${currency}
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Triggers a clean print preview for INDIVIDUAL PERSONAL EXPENSES.
 */
export const printPersonalExpenseReport = (trip, transactions = [], user = null) => {
  if (!trip || !user) return;

  const currency = trip.currency || '₹';
  const myUserId = user._id?.toString();

  const myExpenses = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
    const isPayer = payerId === myUserId;
    const share = computeUserShare(tx, myUserId, trip.members);
    return isPayer || share > 0;
  });

  let totalMyConsumption = 0;
  let totalMyPaid = 0;
  const myCategoryMap = {};

  myExpenses.forEach((tx) => {
    const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
    const isPayer = payerId === myUserId;
    const share = computeUserShare(tx, myUserId, trip.members);

    totalMyConsumption += share;
    if (isPayer) totalMyPaid += (tx.amount || 0);

    const cat = tx.category || 'Other';
    if (!myCategoryMap[cat]) myCategoryMap[cat] = { count: 0, myShareTotal: 0 };
    myCategoryMap[cat].count += 1;
    myCategoryMap[cat].myShareTotal += share;
  });

  const netBalance = totalMyPaid - totalMyConsumption;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable statement.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${user.name} - Personal Expense Statement - ${trip.name}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { padding: 40px; color: #1e293b; background: #ffffff; font-size: 13px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
        .brand { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
        .title { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 5px; }
        .meta { color: #64748b; font-size: 12px; }
        
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
        .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .card-val { font-size: 20px; font-weight: 900; color: #0f172a; }
        .card-val.expense { color: #e11d48; }
        .card-val.positive { color: #059669; }

        h2 { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
        tr:last-child td { border-bottom: none; }
        
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; background: #e0e7ff; color: #4338ca; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
        
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">TripVault</div>
          <div class="title">Personal Expense Statement: ${user.name}</div>
          <div class="meta">Trip: <strong>${trip.name}</strong> • Destination: ${trip.destination || 'N/A'} • Currency: ${currency}</div>
        </div>
        <div style="text-align: right;">
          <div class="meta">Generated: ${new Date().toLocaleDateString()}</div>
          <div class="meta">Total Entries: ${myExpenses.length} Expenses</div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-label">My True Consumption (My Share)</div>
          <div class="card-val expense">-${currency}${totalMyConsumption.toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="card-label">Paid Upfront by Me</div>
          <div class="card-val">${currency}${totalMyPaid.toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="card-label">Net Standing / Reimbursement</div>
          <div class="card-val ${netBalance >= 0 ? 'positive' : 'expense'}">
            ${netBalance >= 0 ? '+' : ''}${currency}${netBalance.toFixed(2)}
          </div>
        </div>
      </div>

      <h2>Personal Spend by Category</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Entries</th>
            <th>My Consumed Share</th>
            <th style="text-align: right;">% of My Spend</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(myCategoryMap).map(([cat, d]) => `
            <tr>
              <td><strong>${cat}</strong></td>
              <td>${d.count}</td>
              <td style="font-weight: 800; color: #e11d48;">${currency}${d.myShareTotal.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700;">
                ${totalMyConsumption > 0 ? ((d.myShareTotal / totalMyConsumption) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Itemized Personal Expenses</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Paid By</th>
            <th>Total Bill</th>
            <th>Paid Upfront</th>
            <th style="text-align: right;">My Share (Consumed)</th>
          </tr>
        </thead>
        <tbody>
          ${myExpenses.map((tx) => {
            const payer = tx.payer || tx.createdBy;
            const isPayer = (payer?._id || payer)?.toString() === myUserId;
            const myShare = computeUserShare(tx, myUserId, trip.members);
            return `
              <tr>
                <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
                <td><span class="badge">${tx.category || 'General'}</span></td>
                <td><strong>${tx.description}</strong></td>
                <td>${isPayer ? '<strong>You</strong>' : (payer?.name || 'Companion')}</td>
                <td>${currency}${(tx.amount || 0).toFixed(2)}</td>
                <td>${isPayer ? `${currency}${(tx.amount || 0).toFixed(2)}` : '—'}</td>
                <td style="text-align: right; font-weight: 800; color: #e11d48;">
                  -${currency}${myShare.toFixed(2)}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        Generated by TripVault for Personal Expense Tracking & Reimbursements • ${currency}
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

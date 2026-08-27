import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  User, 
  Users, 
  Printer, 
  Download 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  exportTripToCSV, 
  exportPersonalExpenseToCSV, 
  printTripReport, 
  printPersonalExpenseReport 
} from '../utils/exportUtils';

export default function ExportModal({ 
  isOpen, 
  onClose, 
  trip, 
  transactions = [], 
  companionDebts = [], 
  user = null 
}) {
  if (!isOpen || !trip) return null;

  const handleExport = (type) => {
    try {
      if (type === 'group-pdf') {
        printTripReport(trip, transactions, companionDebts, user);
        toast.success('Generating Group PDF Statement... 📄');
      } else if (type === 'personal-pdf') {
        printPersonalExpenseReport(trip, transactions, user);
        toast.success('Generating Personal Expense PDF Statement... 👤');
      } else if (type === 'group-csv') {
        exportTripToCSV(trip, transactions, companionDebts, user);
        toast.success('Group Passbook CSV downloaded! 📊');
      } else if (type === 'personal-csv') {
        exportPersonalExpenseToCSV(trip, transactions, user);
        toast.success('Personal Expenses CSV downloaded! 📊');
      }
      onClose();
    } catch {
      toast.error('Failed to export statement.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.2rem] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 relative space-y-5">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div>
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
            <Download size={22} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">
            Export Statements & Reports
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Download PDF reports or CSV spreadsheets for <strong>{trip.name}</strong>
          </p>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-4">
          
          {/* Group Reports Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <Users size={13} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Full Group Trip Vault
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleExport('group-pdf')}
                className="p-3.5 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 rounded-2xl text-left transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 mb-2 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Printer size={15} />
                </div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-950">Group PDF</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Print / Save Statement</p>
              </button>

              <button
                type="button"
                onClick={() => handleExport('group-csv')}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-200 rounded-2xl text-left transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-emerald-600 mb-2 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet size={15} />
                </div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">Group CSV</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Excel & Sheets</p>
              </button>
            </div>
          </div>

          {/* Personal Expenses Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <User size={13} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Personal Individual Expenses ({user?.name?.split(' ')[0] || 'You'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleExport('personal-pdf')}
                className="p-3.5 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 rounded-2xl text-left transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-purple-600 mb-2 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <FileText size={15} />
                </div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-purple-950">Personal PDF</p>
                <p className="text-[10px] text-slate-400 mt-0.5">My Share & Receipts</p>
              </button>

              <button
                type="button"
                onClick={() => handleExport('personal-csv')}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-200 rounded-2xl text-left transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-teal-600 mb-2 shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet size={15} />
                </div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-teal-950">Personal CSV</p>
                <p className="text-[10px] text-slate-400 mt-0.5">My Items Spreadsheet</p>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

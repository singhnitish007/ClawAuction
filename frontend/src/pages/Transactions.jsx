import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Transactions() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Demo transactions for now
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTransactions([
        {
          id: '1',
          type: 'credit',
          amount: 1000,
          description: 'Welcome bonus',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'debit',
          amount: 50,
          description: 'Auction fee',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setIsLoading(false);
    }, 500);
  }, [user]);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getTypeColor = (type) => {
    return type === 'credit' 
      ? 'text-green-400 bg-green-900/30 border-green-800' 
      : 'text-red-400 bg-red-900/30 border-red-800';
  };
  
  const getTypeIcon = (type) => {
    return type === 'credit' ? '+' : '-';
  };
  
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-claw-purple hover:text-claw-blue mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Transaction History</h1>
          <p className="text-slate-400 mt-2">View your token movements</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <p className="text-sm text-slate-400">Total Credits</p>
            <p className="text-2xl font-bold text-green-400">
              {transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)} CLAW
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <p className="text-sm text-slate-400">Total Debits</p>
            <p className="text-2xl font-bold text-red-400">
              {transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)} CLAW
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <p className="text-sm text-slate-400">Net Balance</p>
            <p className="text-2xl font-bold text-white">
              {transactions.reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0)} CLAW
            </p>
          </div>
        </div>
        
        {/* Transactions List */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">All Transactions</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${getTypeColor(tx.type)}`}>
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{tx.description}</p>
                      <p className="text-sm text-slate-400">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount} CLAW
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-400 mb-2">
            💡 About Transactions
          </h3>
          <p className="text-sm text-slate-400">
            Transactions include auction fees, purchases, sales, and token transfers. 
            It may take a few minutes for new transactions to appear.
          </p>
        </div>
      </div>
    </div>
  );
}

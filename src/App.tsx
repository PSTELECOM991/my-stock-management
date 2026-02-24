/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Minus, Package, History, AlertCircle, CheckCircle2, 
  Search, Settings, Home, List, Moon, Sun, Languages, 
  Eye, EyeOff, Edit2, X, ChevronRight, MoreVertical,
  ArrowUpRight, ArrowDownLeft, Box, ArrowRight, Menu,
  Trash2, Download, Upload, RefreshCw, Share2,
  TrendingUp, PieChart as PieChartIcon, BarChart3, FileText,
  Bell, Calendar, Share
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { StockItem, Transaction } from './types';

type View = 'HOME' | 'HISTORY' | 'ALL_PRODUCTS' | 'SETTINGS';

export default function App() {
  // State
  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showPurchasePrice, setShowPurchasePrice] = useState(true);
  const [language, setLanguage] = useState<'BN' | 'EN'>('BN');
  const [searchTerm, setSearchTerm] = useState('');
  const [allProductsSearchTerm, setAllProductsSearchTerm] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportType, setReportType] = useState<'GENERAL' | 'SALES' | 'PURCHASE'>('GENERAL');
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('1');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    boxNumber: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.boxNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const allProductsFilteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(allProductsSearchTerm.toLowerCase()) ||
      item.boxNumber.toLowerCase().includes(allProductsSearchTerm.toLowerCase())
    );
  }, [items, allProductsSearchTerm]);

  const totalStockValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
  }, [items]);

  const lowStockAlerts = useMemo(() => {
    return items.filter(item => item.quantity <= 2);
  }, [items]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      const trDate = new Date(tr.timestamp).toISOString().split('T')[0];
      return trDate >= reportStartDate && trDate <= reportEndDate;
    });
  }, [transactions, reportStartDate, reportEndDate]);

  const reportData = useMemo(() => {
    if (reportType === 'SALES') {
      return filteredTransactions.filter(tr => tr.type === 'REMOVE' || (tr.type === 'ADJUST' && tr.amount < 0));
    }
    if (reportType === 'PURCHASE') {
      return filteredTransactions.filter(tr => tr.type === 'ADD' || (tr.type === 'ADJUST' && tr.amount > 0));
    }
    return filteredTransactions;
  }, [filteredTransactions, reportType]);

  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    return last7Days.map(date => {
      const daySales = transactions
        .filter(tr => new Date(tr.timestamp).toDateString() === date && (tr.type === 'REMOVE' || (tr.type === 'ADJUST' && tr.amount < 0)))
        .reduce((sum, tr) => sum + Math.abs(tr.amount), 0);
      
      return {
        name: new Date(date).toLocaleDateString(language === 'BN' ? 'bn-BD' : 'en-US', { weekday: 'short' }),
        sales: daySales
      };
    });
  }, [transactions, language]);

  const stockDistributionData = useMemo(() => {
    return items
      .sort((a, b) => (b.quantity * b.purchasePrice) - (a.quantity * a.purchasePrice))
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        value: item.quantity * item.purchasePrice
      }));
  }, [items]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleAddProduct = () => {
    setError(null);
    if (!formData.name || !formData.quantity || !formData.purchasePrice || !formData.sellingPrice) {
      setError(language === 'BN' ? 'সবগুলো ঘর পূরণ করুন' : 'Please fill all fields');
      return;
    }

    const newItem: StockItem = {
      id: crypto.randomUUID(),
      name: formData.name,
      quantity: parseInt(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      boxNumber: formData.boxNumber || 'N/A',
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    setItems([newItem, ...items]);
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      itemId: newItem.id,
      itemName: newItem.name,
      type: 'ADD',
      amount: newItem.quantity,
      timestamp: new Date()
    };
    setTransactions([newTransaction, ...transactions]);

    setFormData({ name: '', quantity: '', purchasePrice: '', sellingPrice: '', boxNumber: '' });
    setShowAddModal(false);
    setSuccess(language === 'BN' ? 'পণ্য যোগ করা হয়েছে' : 'Product added successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdateProduct = () => {
    if (!editingItem) return;
    setError(null);

    const updatedItems = items.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          name: formData.name,
          quantity: parseInt(formData.quantity),
          purchasePrice: parseFloat(formData.purchasePrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          boxNumber: formData.boxNumber,
          lastUpdated: new Date()
        };
      }
      return item;
    });

    setItems(updatedItems);
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      itemId: editingItem.id,
      itemName: formData.name,
      type: 'EDIT',
      amount: parseInt(formData.quantity),
      timestamp: new Date()
    };
    setTransactions([newTransaction, ...transactions]);

    setEditingItem(null);
    setFormData({ name: '', quantity: '', purchasePrice: '', sellingPrice: '', boxNumber: '' });
    setSuccess(language === 'BN' ? 'পণ্য আপডেট করা হয়েছে' : 'Product updated successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleQuickAdjustment = (item: StockItem, type: 'IN' | 'OUT', customAmount?: number) => {
    const amount = customAmount || parseInt(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError(language === 'BN' ? 'সঠিক সংখ্যা দিন' : 'Enter valid number');
      return;
    }

    if (type === 'OUT' && item.quantity < amount) {
      setError(language === 'BN' ? 'পর্যাপ্ত স্টক নেই!' : 'Insufficient stock!');
      return;
    }

    const updatedItems = items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          quantity: type === 'IN' ? i.quantity + amount : i.quantity - amount,
          lastUpdated: new Date()
        };
      }
      return i;
    });

    setItems(updatedItems);
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      type,
      amount,
      timestamp: new Date()
    };
    setTransactions([newTransaction, ...transactions]);

    // Update selected item view only if it's already open
    if (selectedItem?.id === item.id) {
      setSelectedItem({
        ...item,
        quantity: type === 'IN' ? item.quantity + amount : item.quantity - amount,
        lastUpdated: new Date()
      });
    }

    setSuccess(language === 'BN' ? 'স্টক সমন্বয় সফল হয়েছে' : 'Stock adjustment successful');
    setTimeout(() => setSuccess(null), 3000);
  };

  const startEditing = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      purchasePrice: item.purchasePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      boxNumber: item.boxNumber
    });
    setSelectedItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm(language === 'BN' ? 'আপনি কি নিশ্চিত যে আপনি এই পণ্যটি ডিলিট করতে চান?' : 'Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== id));
      setTransactions(transactions.filter(tr => tr.itemId !== id));
      setSuccess(language === 'BN' ? 'পণ্যটি ডিলিট করা হয়েছে' : 'Item deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleResetAll = () => {
    if (window.confirm(language === 'BN' ? 'আপনি কি নিশ্চিত যে আপনি পুরো স্টক রিসেট করতে চান? এটি আর ফিরে পাওয়া যাবে না!' : 'Are you sure you want to reset all stock? This cannot be undone!')) {
      setItems([]);
      setTransactions([]);
      setSuccess(language === 'BN' ? 'পুরো স্টক রিসেট করা হয়েছে' : 'All stock has been reset');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleExportData = () => {
    const data = JSON.stringify({ items, transactions });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(language === 'BN' ? 'ব্যাকআপ ফাইল ডাউনলোড হয়েছে' : 'Backup file downloaded');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
          if (data.transactions && Array.isArray(data.transactions)) {
            setTransactions(data.transactions);
          }
          setSuccess(language === 'BN' ? 'ডেটা সফলভাবে ইমপোর্ট করা হয়েছে' : 'Data imported successfully');
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        setError(language === 'BN' ? 'ভুল ফাইল ফরম্যাট!' : 'Invalid file format!');
        setTimeout(() => setError(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shop Stock Manager',
          text: 'Check out this Stock Manager app!',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setSuccess(language === 'BN' ? 'লিঙ্ক কপি করা হয়েছে' : 'Link copied to clipboard');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const t = (bn: string, en: string) => language === 'BN' ? bn : en;

  if (showWelcome) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-8 relative overflow-hidden font-sans"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Mobile Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] grid grid-cols-4 sm:grid-cols-8 gap-8 p-8">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <Box size={40} className="text-white transform rotate-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Section */}
        <div className="z-10 text-center mt-16 sm:mt-24">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tight">
              Welcome to <span className="text-indigo-500">PS Telecom</span>
            </h1>
            <div className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <p className="text-indigo-400 text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">
                Combo Management System
              </p>
            </div>
          </motion.div>
        </div>

        {/* Logo Section */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className="z-10 relative group"
        >
          <div className="w-56 h-56 sm:w-72 sm:h-72 bg-white/5 backdrop-blur-2xl rounded-[3.5rem] border border-white/10 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.2)] transition-all duration-500 group-hover:shadow-[0_0_80px_rgba(79,70,229,0.4)] group-hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[3.5rem]" />
            
            <div className="relative flex flex-col items-center gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 transform group-hover:scale-110 transition-transform duration-500">
                <Package size={64} className="sm:size-80" />
              </div>
              <div className="text-center">
                <span className="text-white font-black text-3xl sm:text-4xl tracking-tighter block">PS TELECOM</span>
                <div className="h-1 w-12 bg-indigo-500 mx-auto mt-2 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Decorative Rings */}
          <div className="absolute -inset-4 border border-indigo-500/10 rounded-[4rem] animate-spin-slow pointer-events-none" style={{ animationDuration: '15s' }} />
          <div className="absolute -inset-8 border border-emerald-500/5 rounded-[4.5rem] animate-spin-slow pointer-events-none" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
        </motion.div>

        {/* Bottom Section - Action Button */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="z-10 mb-16 flex flex-col items-center gap-6"
        >
          <button 
            onClick={() => setShowWelcome(false)}
            className="group relative w-24 h-24 flex items-center justify-center outline-none"
          >
            {/* Pulsing Backgrounds */}
            <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-0 bg-indigo-600 rounded-full scale-125 opacity-5 group-hover:scale-150 transition-transform duration-500" />
            
            {/* Main Button Circle */}
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] group-hover:bg-indigo-500 group-hover:scale-110 transition-all duration-300 active:scale-90">
              <ArrowRight size={40} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </button>
          
          <div className="flex flex-col items-center gap-1">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">
              Tap to Enter
            </p>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl transition-all ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <Menu size={24} />
            </button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Package size={22} />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              {t('স্টক ম্যানেজার', 'Stock Manager')}
            </h1>
          </div>

          <div className="flex-1 max-w-md relative group">
            <div className="absolute -top-5 left-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
              {t('কুইক ফাইন্ড', 'Quick Find')}
            </div>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('পণ্য খুঁজুন...', 'Search products...')}
              value={searchTerm}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm outline-none transition-all ${
                isDarkMode 
                ? 'bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500/50' 
                : 'bg-slate-100 border-slate-200 focus:ring-2 focus:ring-indigo-500/20'
              }`}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
              <ArrowRight size={18} />
            </button>

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSearchSuggestions && searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setSearchTerm('');
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                            isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Box size={16} className="text-indigo-500" />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">Box: {item.boxNumber}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                        {t('কোনো পণ্য পাওয়া যায়নি', 'No products found')}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 relative ${
                  isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-indigo-400' : 'bg-slate-100 text-slate-500 hover:text-indigo-600'
                }`}
              >
                <Bell size={20} />
                {lowStockAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                    {lowStockAlerts.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm">{t('নোটিফিকেশন', 'Notifications')}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('স্টক এলার্ট', 'Stock Alerts')}</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                        {lowStockAlerts.length > 0 ? (
                          lowStockAlerts.map(item => (
                            <div 
                              key={item.id}
                              className={`p-3 rounded-xl flex items-center gap-3 ${
                                isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                                <AlertCircle size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{item.name}</p>
                                <p className="text-[10px] text-rose-600 font-medium">
                                  {t(`মাত্র ${item.quantity}টি স্টক আছে!`, `Only ${item.quantity} left in stock!`)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-20" />
                            <p className="text-xs text-slate-500">{t('সব স্টক ঠিক আছে', 'All stock is healthy')}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-6 pb-24">
        <AnimatePresence mode="wait">
          {currentView === 'HOME' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: t('মোট পণ্য', 'Total Items'), value: items.length, color: 'text-blue-500', icon: <Package size={16} /> },
                  { label: t('স্টক কম', 'Low Stock'), value: items.filter(i => i.quantity < 5).length, color: 'text-amber-500', icon: <AlertCircle size={16} /> },
                  { label: t('আজকের লেনদেন', 'Today Trans'), value: transactions.filter(tr => new Date(tr.timestamp).toDateString() === new Date().toDateString()).length, color: 'text-emerald-500', icon: <History size={16} /> },
                  { label: t('স্টক ভ্যালু', 'Stock Value'), value: `₹${totalStockValue.toLocaleString()}`, color: 'text-purple-500', icon: <TrendingUp size={16} /> },
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={stat.color}>{stat.icon}</span>
                      <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick Adjustment Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all active:scale-95 group ${
                    isDarkMode ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/20' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'}`}>
                    <ArrowUpRight size={32} />
                  </div>
                  <div className="text-center">
                    <span className="font-black text-xl block leading-tight">{t('স্টক ইন', 'Stock In')}</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{t('পণ্য যোগ করুন', 'Add Stock')}</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (searchInput) searchInput.focus();
                    setSuccess(language === 'BN' ? 'পণ্যটি খুঁজে বের করুন স্টক আউট করার জন্য' : 'Search for the product to stock out');
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all active:scale-95 group ${
                    isDarkMode ? 'bg-rose-900/10 border-rose-500/20 text-rose-400 hover:bg-rose-900/20' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-rose-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}>
                    <ArrowDownLeft size={32} />
                  </div>
                  <div className="text-center">
                    <span className="font-black text-xl block leading-tight">{t('স্টক আউট', 'Stock Out')}</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{t('পণ্য কমান', 'Reduce Stock')}</span>
                  </div>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('সাম্প্রতিক স্টক', 'Recent Stock')}</h2>
                <button 
                  onClick={() => setCurrentView('ALL_PRODUCTS')}
                  className="text-sm font-medium text-indigo-500 flex items-center gap-1"
                >
                  {t('সব দেখুন', 'See All')} <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.slice(0, 6).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-500">
                        <Box size={20} />
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.quantity < 5 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {item.quantity < 5 ? t('স্টক কম', 'Low') : t('ইন স্টক', 'In Stock')}
                      </span>
                    </div>
                    <h3 className="font-bold truncate mb-1">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-black">{item.quantity}</p>
                      <p className="text-xs text-slate-500">Box: {item.boxNumber}</p>
                    </div>
                    
                    {/* Instant Adjustment Buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleQuickAdjustment(item, 'IN', 1); 
                        }}
                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> {t('ইন', 'IN')}
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleQuickAdjustment(item, 'OUT', 1); 
                        }}
                        className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Minus size={14} /> {t('আউট', 'OUT')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Overview Chart */}
                <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <TrendingUp size={18} />
                    </div>
                    <h3 className="font-bold">{t('সেল ওভারভিউ', 'Sales Overview')}</h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                            border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#6366f1" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: isDarkMode ? '#0f172a' : '#ffffff' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stock Overview Chart */}
                <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <PieChartIcon size={18} />
                    </div>
                    <h3 className="font-bold">{t('স্টক অভারভিউ', 'Stock Overview')}</h3>
                  </div>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stockDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                            border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                          formatter={(value: number) => `₹${value.toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 ml-4">
                      {stockDistributionData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-[10px] font-medium truncate max-w-[80px]">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'HISTORY' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold mb-6">{t('লেনদেনের ইতিহাস', 'Transaction History')}</h2>
              <div className="space-y-3">
                {transactions.map(tr => (
                  <div key={tr.id} className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tr.type === 'IN' || tr.type === 'ADD' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {tr.type === 'IN' || tr.type === 'ADD' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <p className="font-bold">{tr.itemName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(tr.timestamp).toLocaleString(language === 'BN' ? 'bn-BD' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tr.type === 'IN' || tr.type === 'ADD' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tr.type === 'IN' || tr.type === 'ADD' ? '+' : '-'}{tr.amount}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{tr.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'ALL_PRODUCTS' && (
            <motion.div 
              key="all_products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('সব পণ্য', 'All Products')}</h2>
                <button 
                  onClick={() => setShowPurchasePrice(!showPurchasePrice)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {showPurchasePrice ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPurchasePrice ? t('কেনা দাম লুকান', 'Hide Purchase Price') : t('কেনা দাম দেখুন', 'Show Purchase Price')}
                </button>
              </div>

              {/* Dedicated Search Bar for All Products */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder={t('পণ্য বা বক্স নম্বর দিয়ে খুঁজুন...', 'Search by name or box number...')}
                  value={allProductsSearchTerm}
                  onChange={(e) => setAllProductsSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500/50 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                />
                {allProductsSearchTerm && (
                  <button 
                    onClick={() => setAllProductsSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead className={isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}>
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">{t('নাম', 'Name')}</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">{t('পরিমাণ', 'Qty')}</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">{t('বক্স', 'Box')}</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">{t('তারিখ', 'Date')}</th>
                      {showPurchasePrice && (
                        <th className="p-4 text-xs font-bold uppercase text-slate-500">{t('কেনা', 'Buy')}</th>
                      )}
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">{t('বিক্রি', 'Sell')}</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">{t('অ্যাকশন', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {allProductsFilteredItems.map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-slate-900' : 'hover:bg-slate-50'}`}
                      >
                        <td className="p-4 font-bold">{item.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            item.quantity < 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800'
                          }`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{item.boxNumber}</td>
                        <td className="p-4 text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString(language === 'BN' ? 'bn-BD' : 'en-US')}
                        </td>
                        {showPurchasePrice && (
                          <td className="p-4 text-sm font-medium">₹{item.purchasePrice}</td>
                        )}
                        <td className="p-4 text-sm font-bold text-emerald-500">₹{item.sellingPrice}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleQuickAdjustment(item, 'IN', 1); }}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-500 rounded-lg"
                              title={t('স্টক ইন', 'Stock In')}
                            >
                              <Plus size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleQuickAdjustment(item, 'OUT', 1); }}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 rounded-lg"
                              title={t('স্টক আউট', 'Stock Out')}
                            >
                              <Minus size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(item);
                              }}
                              className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 rounded-lg"
                              title={t('এডিট', 'Edit')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 rounded-lg"
                              title={t('ডিলিট', 'Delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {currentView === 'SETTINGS' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto space-y-6"
            >
              <h2 className="text-2xl font-bold mb-6">{t('সেটিংস', 'Settings')}</h2>
              
              <div className={`p-6 rounded-3xl border space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                      {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <p className="font-bold">{t('ডার্ক মোড', 'Dark Mode')}</p>
                      <p className="text-xs text-slate-500">{t('চোখের আরামের জন্য', 'Easier on the eyes')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                      <Languages size={20} />
                    </div>
                    <div>
                      <p className="font-bold">{t('ভাষা', 'Language')}</p>
                      <p className="text-xs text-slate-500">{t('বাংলা বা ইংরেজি', 'Bengali or English')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLanguage(language === 'BN' ? 'EN' : 'BN')}
                    className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold"
                  >
                    {language === 'BN' ? 'ENGLISH' : 'বাংলা'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold">{t('রিপোর্ট', 'Report')}</p>
                      <p className="text-xs text-slate-500">{t('স্টক রিপোর্ট দেখুন', 'View stock report')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20"
                  >
                    {t('দেখুন', 'View')}
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('ডেটা ম্যানেজমেন্ট', 'Data Management')}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleExportData}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Download size={20} className="text-indigo-500" />
                      <span className="text-xs font-bold">{t('এক্সপোর্ট', 'Export')}</span>
                    </button>
                    
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all active:scale-95 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <Upload size={20} className="text-emerald-500" />
                      <span className="text-xs font-bold">{t('ইমপোর্ট', 'Import')}</span>
                      <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                    </label>
                  </div>

                  <button 
                    onClick={handleResetAll}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 font-bold transition-all active:scale-95 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                  >
                    <RefreshCw size={20} />
                    {t('সব রিসেট করুন', 'Reset All Data')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-80 z-50 shadow-2xl flex flex-col ${
                isDarkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-200'
              }`}
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Package size={18} />
                  </div>
                  <span className="font-bold">{t('ড্যাশবোর্ড', 'Dashboard')}</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button
                  onClick={() => { setCurrentView('HOME'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    currentView === 'HOME' 
                    ? 'bg-indigo-600 text-white' 
                    : isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Home size={20} /> {t('হোম', 'Home')}
                </button>
                <button
                  onClick={() => { setCurrentView('SETTINGS'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    currentView === 'SETTINGS' 
                    ? 'bg-indigo-600 text-white' 
                    : isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Settings size={20} /> {t('সেটিংস', 'Settings')}
                </button>
                <button
                  onClick={handleShareApp}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Share2 size={20} /> {t('শেয়ার করুন', 'Share App')}
                </button>

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {t('সেটিংস', 'Settings')}
                  </p>
                  
                  <div className="space-y-4 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
                        <span className="text-sm font-medium">{t('ডার্ক মোড', 'Dark Mode')}</span>
                      </div>
                      <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Languages size={18} className="text-emerald-500" />
                        <span className="text-sm font-medium">{t('ভাষা', 'Language')}</span>
                      </div>
                      <button 
                        onClick={() => setLanguage(language === 'BN' ? 'EN' : 'BN')}
                        className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded"
                      >
                        {language === 'BN' ? 'EN' : 'বাংলা'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-center text-slate-500 font-medium">
                  Shop Stock Manager v2.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <nav className={`fixed bottom-0 left-0 right-0 border-t backdrop-blur-md z-40 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          {[
            { id: 'HOME', icon: Home, label: t('হোম', 'Home') },
            { id: 'ALL_PRODUCTS', icon: List, label: t('সব পণ্য', 'Products') },
            { id: 'HISTORY', icon: History, label: t('হিস্ট্রি', 'History') },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setCurrentView(nav.id as View)}
              className={`flex flex-col items-center gap-1 transition-all ${
                currentView === nav.id 
                ? 'text-indigo-500 scale-110' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <nav.icon size={22} strokeWidth={currentView === nav.id ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setEditingItem(null); }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
                isDarkMode ? 'bg-slate-900' : 'bg-white'
              }`}
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editingItem ? t('পণ্য এডিট করুন', 'Edit Product') : t('নতুন পণ্য যোগ করুন', 'Add New Product')}
                </h3>
                <button 
                  onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('পণ্যের নাম', 'Product Name')}</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('পরিমাণ', 'Quantity')}</label>
                    <input 
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('বক্স নাম্বার', 'Box Number')}</label>
                    <input 
                      type="text"
                      value={formData.boxNumber}
                      onChange={(e) => setFormData({...formData, boxNumber: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('কেনা দাম', 'Purchase Price')}</label>
                    <input 
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('বিক্রি দাম', 'Selling Price')}</label>
                    <input 
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button 
                  onClick={editingItem ? handleUpdateProduct : handleAddProduct}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  {editingItem ? t('আপডেট করুন', 'Update Product') : t('সেভ করুন', 'Save Product')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${
                isDarkMode ? 'bg-slate-900' : 'bg-white'
              }`}
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold">{t('পণ্যের বিস্তারিত', 'Product Details')}</h3>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl flex items-center justify-center">
                    <Box size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black">{selectedItem.name}</h4>
                    <p className="text-sm text-slate-500">Box: {selectedItem.boxNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('বর্তমান স্টক', 'Current Stock')}</p>
                    <p className="text-2xl font-black">{selectedItem.quantity}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('বিক্রি দাম', 'Selling Price')}</p>
                    <p className="text-2xl font-black text-emerald-500">₹{selectedItem.sellingPrice}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('কেনা দাম', 'Purchase Price')}</p>
                    <p className="text-xl font-bold">₹{selectedItem.purchasePrice}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('লাভ (প্রতি পিস)', 'Profit/Unit')}</p>
                    <p className="text-xl font-bold text-indigo-500">₹{selectedItem.sellingPrice - selectedItem.purchasePrice}</p>
                  </div>
                </div>

                {/* Quick Stock Adjustment */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">
                    {t('কুইক স্টক অ্যাডজাস্টমেন্ট', 'Quick Stock Adjustment')}
                  </p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className={`w-20 px-3 py-2 rounded-xl border text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                      }`}
                    />
                    <button 
                      onClick={() => handleQuickAdjustment(selectedItem, 'IN')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Plus size={16} /> {t('ইন', 'IN')}
                    </button>
                    <button 
                      onClick={() => handleQuickAdjustment(selectedItem, 'OUT')}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Minus size={16} /> {t('আউট', 'OUT')}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t('যোগ করা হয়েছে:', 'Created At:')}</span>
                    <span className="font-medium">{new Date(selectedItem.createdAt).toLocaleString(language === 'BN' ? 'bn-BD' : 'en-US')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t('শেষ আপডেট:', 'Last Updated:')}</span>
                    <span className="font-medium">{new Date(selectedItem.lastUpdated).toLocaleString(language === 'BN' ? 'bn-BD' : 'en-US')}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => startEditing(selectedItem)}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} /> {t('এডিট', 'Edit')}
                  </button>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className={`flex-1 py-3 font-bold rounded-xl border ${
                      isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('বন্ধ করুন', 'Close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t('স্টক রিপোর্ট', 'Stock Report')}</h3>
                    <p className="text-xs text-slate-500">{new Date().toLocaleDateString(language === 'BN' ? 'bn-BD' : 'en-US')}</p>
                  </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Report Configuration */}
                <div className="space-y-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('শুরু তারিখ', 'Start Date')}</label>
                      <input 
                        type="date" 
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className={`w-full p-2 rounded-lg text-xs outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('শেষ তারিখ', 'End Date')}</label>
                      <input 
                        type="date" 
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className={`w-full p-2 rounded-lg text-xs outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('রিপোর্ট টাইপ', 'Report Type')}</label>
                    <div className="flex gap-2">
                      {(['GENERAL', 'SALES', 'PURCHASE'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setReportType(type)}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                            reportType === type 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {t(
                            type === 'GENERAL' ? 'সাধারণ' : type === 'SALES' ? 'বিক্রয়' : 'ক্রয়',
                            type === 'GENERAL' ? 'General' : type === 'SALES' ? 'Sales' : 'Purchase'
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('মোট আইটেম', 'Total Items')}</p>
                    <p className="text-2xl font-black">{items.length}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('মোট কোয়ান্টিটি', 'Total Qty')}</p>
                    <p className="text-2xl font-black">{items.reduce((sum, i) => sum + i.quantity, 0)}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('কেনা মূল্য', 'Purchase Value')}</p>
                    <p className="text-2xl font-black text-indigo-500">₹{totalStockValue.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('বিক্রয় মূল্য', 'Selling Value')}</p>
                    <p className="text-2xl font-black text-emerald-500">₹{items.reduce((sum, i) => sum + (i.quantity * i.sellingPrice), 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    {t(
                      reportType === 'GENERAL' ? 'লেনদেনের বিবরণ' : reportType === 'SALES' ? 'বিক্রয় বিবরণ' : 'ক্রয় বিবরণ',
                      reportType === 'GENERAL' ? 'Transaction Details' : reportType === 'SALES' ? 'Sales Details' : 'Purchase Details'
                    )}
                  </h4>
                  <div className="space-y-2">
                    {reportData.length > 0 ? (
                      reportData.map(tr => (
                        <div key={tr.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                          <div>
                            <p className="text-xs font-bold">{tr.itemName}</p>
                            <p className="text-[10px] text-slate-500">{new Date(tr.timestamp).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-bold ${tr.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {tr.amount > 0 ? '+' : ''}{tr.amount}
                            </p>
                            <p className="text-[10px] text-slate-400">₹{(Math.abs(tr.amount) * (tr.type === 'REMOVE' ? items.find(i => i.name === tr.itemName)?.sellingPrice || 0 : items.find(i => i.name === tr.itemName)?.purchasePrice || 0)).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic text-center py-4">{t('কোনো তথ্য পাওয়া যায়নি', 'No data found for this period')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">{t('স্টক কম পণ্য', 'Low Stock Items')}</h4>
                  {items.filter(i => i.quantity < 5).length > 0 ? (
                    <div className="space-y-2">
                      {items.filter(i => i.quantity < 5).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          <span className="font-medium">{item.name}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold">{item.quantity} Left</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">{t('সব পণ্য পর্যাপ্ত আছে', 'All items are in good stock')}</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <Download size={20} /> {t('প্রিন্ট', 'Print')}
                </button>
                <button 
                  onClick={() => {
                    const summary = `Stock Report (${reportStartDate} to ${reportEndDate})\nType: ${reportType}\nTotal Items: ${items.length}\nTotal Value: ₹${totalStockValue.toLocaleString()}`;
                    if (navigator.share) {
                      navigator.share({ title: 'Stock Report', text: summary });
                    } else {
                      navigator.clipboard.writeText(summary);
                      setSuccess(t('রিপোর্ট কপি করা হয়েছে', 'Report summary copied'));
                    }
                  }}
                  className={`flex-1 py-4 font-bold rounded-2xl border flex items-center justify-center gap-2 ${
                    isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Share size={20} /> {t('শেয়ার', 'Share')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-600 text-white font-bold rounded-full shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

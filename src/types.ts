export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  boxNumber: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADD' | 'EDIT';
  amount: number;
  price?: number;
  timestamp: Date;
}

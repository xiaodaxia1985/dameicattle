import { defineStore } from 'pinia'
import type { SalesOrder, Customer } from '@/api/sales'

export const useOrderStore = defineStore('order', {
  state: () => ({
    currentOrder: null as SalesOrder | null,
    currentCustomer: null as Customer | null
  }),
  actions: {
    setCurrentOrder(order: SalesOrder) {
      this.currentOrder = order
    },
    clearCurrentOrder() {
      this.currentOrder = null
    },
    setCurrentCustomer(customer: Customer) {
      this.currentCustomer = customer
    },
    clearCurrentCustomer() {
      this.currentCustomer = null
    }
  }
})

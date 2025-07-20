/**
 * 生成订单编号
 * @param prefix 订单前缀，如 SO (Sales Order), PO (Purchase Order)
 * @returns 生成的订单编号
 */
export async function generateOrderNumber(prefix: string): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2); // 年份后两位
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份，补零
  const day = date.getDate().toString().padStart(2, '0'); // 日期，补零
  
  // 生成6位随机数
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  // 组合订单编号：前缀 + 年月日 + 随机数
  // 例如：SO240101123456
  return `${prefix}${year}${month}${day}${random}`;
}

/**
 * 解析订单编号
 * @param orderNumber 订单编号
 * @returns 解析结果，包含前缀、日期和随机数
 */
export function parseOrderNumber(orderNumber: string): { 
  prefix: string; 
  date: string; 
  random: string;
} | null {
  // 订单编号格式：前缀(2) + 年(2) + 月(2) + 日(2) + 随机数(6)
  // 例如：SO240101123456
  const regex = /^([A-Z]{2})(\d{2})(\d{2})(\d{2})(\d{6})$/;
  const match = orderNumber.match(regex);
  
  if (!match) {
    return null;
  }
  
  const [, prefix, year, month, day, random] = match;
  const date = `20${year}-${month}-${day}`;
  
  return {
    prefix,
    date,
    random
  };
}
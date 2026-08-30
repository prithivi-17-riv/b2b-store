// Indian GST Calculation Engine

export interface LineItemInput {
  productId: string;
  productName: string;
  hsnCode: string;
  uom: string;
  quantity: number;
  unitRate: number;
  discountPercent?: number;
  gstRate: number; // e.g. 5, 12, 18, 28, 0
  cessRate?: number;
}

export interface LineItemCalculated extends LineItemInput {
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;
}

export interface OrderCalculationSummary {
  items: LineItemCalculated[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  roundOff: number;
  grandTotal: number;
  isInterstate: boolean;
  amountInWords: string;
}

export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
};

export function calculateOrderTaxes(
  items: LineItemInput[],
  sellerStateCode: string = '33',
  buyerStateCode: string = '33',
  orderDiscountAmount: number = 0
): OrderCalculationSummary {
  const isInterstate = (sellerStateCode || '33').trim() !== (buyerStateCode || '33').trim();

  let subtotal = 0;
  let totalLineDiscount = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;
  let totalQuantity = 0;

  const calculatedItems: LineItemCalculated[] = items.map((item) => {
    const rawAmount = item.quantity * item.unitRate;
    const discountPercent = item.discountPercent || 0;
    const discountAmount = Number(((rawAmount * discountPercent) / 100).toFixed(2));
    const taxableAmount = Number((rawAmount - discountAmount).toFixed(2));

    const gstRate = item.gstRate || 0;
    const cessRate = item.cessRate || 0;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterstate) {
      igstRate = gstRate;
      igstAmount = Number(((taxableAmount * igstRate) / 100).toFixed(2));
    } else {
      cgstRate = Number((gstRate / 2).toFixed(2));
      sgstRate = Number((gstRate / 2).toFixed(2));
      cgstAmount = Number(((taxableAmount * cgstRate) / 100).toFixed(2));
      sgstAmount = Number(((taxableAmount * sgstRate) / 100).toFixed(2));
    }

    const cessAmount = Number(((taxableAmount * cessRate) / 100).toFixed(2));
    const totalAmount = Number((taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount).toFixed(2));

    subtotal += rawAmount;
    totalLineDiscount += discountAmount;
    totalTaxable += taxableAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;
    totalCess += cessAmount;
    totalQuantity += item.quantity;

    return {
      ...item,
      discountAmount,
      taxableAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      cessAmount,
      totalAmount,
    };
  });

  const totalDiscount = Number((totalLineDiscount + orderDiscountAmount).toFixed(2));
  const preRoundTotal = Number((totalTaxable + totalCgst + totalSgst + totalIgst + totalCess - orderDiscountAmount).toFixed(2));
  const grandTotal = Math.round(preRoundTotal);
  const roundOff = Number((grandTotal - preRoundTotal).toFixed(2));

  return {
    items: calculatedItems,
    itemCount: items.length,
    totalQuantity: Number(totalQuantity.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: totalDiscount,
    taxableAmount: Number(totalTaxable.toFixed(2)),
    cgstAmount: Number(totalCgst.toFixed(2)),
    sgstAmount: Number(totalSgst.toFixed(2)),
    igstAmount: Number(totalIgst.toFixed(2)),
    cessAmount: Number(totalCess.toFixed(2)),
    roundOff,
    grandTotal,
    isInterstate,
    amountInWords: numberToIndianWords(grandTotal),
  };
}

export function formatIndianCurrency(num: number): string {
  const rounded = Number(num || 0).toFixed(2);
  const parts = rounded.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  // Indian numbering grouping (last 3, then groups of 2)
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return (isNegative ? '-₹' : '₹') + formatted + '.' + decimalPart;
}

export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit ? ' ' + units[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred) res += units[hundred] + ' Hundred';
    if (rest) res += (res ? ' and ' : '') + convertTwoDigits(rest);
    return res;
  }

  const integerPart = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - integerPart) * 100);

  let crore = Math.floor(integerPart / 10000000);
  let lakh = Math.floor((integerPart % 10000000) / 100000);
  let thousand = Math.floor((integerPart % 100000) / 1000);
  let remainder = integerPart % 1000;

  let words = '';

  if (crore) {
    words += convertThreeDigits(crore) + ' Crore ';
  }
  if (lakh) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (remainder) {
    words += convertThreeDigits(remainder) + ' ';
  }

  words = words.trim() + ' Rupees';

  if (paise > 0) {
    words += ' and ' + convertTwoDigits(paise) + ' Paise';
  }

  words += ' Only';
  return words;
}

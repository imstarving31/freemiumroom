/**
 * Hàm đọc số nguyên thành chữ Tiếng Việt (hỗ trợ đến hàng tỷ)
 * Ví dụ: 1222222 -> Một triệu hai trăm hai mươi hai nghìn hai trăm hai mươi hai
 */
export default function readNumberVN(num) {
  if (num === null || num === undefined || num === '') return '';
  
  // Loại bỏ các ký tự không phải số
  const cleanStr = num.toString().replace(/\D/g, '');
  if (!cleanStr) return '';
  
  const parsed = parseInt(cleanStr, 10);
  if (isNaN(parsed)) return '';
  if (parsed === 0) return 'không';

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup3(n, showZeroHundred) {
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let unit = n % 10;
    let res = '';

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' trăm ';
    }

    if (ten > 0) {
      if (ten === 1) {
        res += 'mười ';
      } else {
        res += digits[ten] + ' mươi ';
      }
    } else if (hundred > 0 && unit > 0) {
      res += 'lẻ ';
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) {
        res += 'mốt';
      } else if (unit === 5 && ten > 0) {
        res += 'lăm';
      } else if (unit === 4 && ten > 1) {
        res += 'tư';
      } else {
        res += digits[unit];
      }
    }

    return res.trim();
  }

  let str = parsed.toString();
  let groups = [];
  while (str.length > 0) {
    groups.push(str.slice(-3));
    str = str.slice(0, -3);
  }

  let textResult = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    let g = parseInt(groups[i], 10);
    if (g > 0) {
      let showZeroHundred = (i < groups.length - 1);
      let gText = readGroup3(g, showZeroHundred);
      let unitText = units[i];
      textResult += gText + ' ' + unitText + ' ';
    }
  }

  let finalResult = textResult.trim().replace(/\s+/g, ' ');
  return finalResult.charAt(0).toUpperCase() + finalResult.slice(1);
}

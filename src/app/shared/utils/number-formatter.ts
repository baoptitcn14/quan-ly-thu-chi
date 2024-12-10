export class NumberFormatter {
  static formatCurrency(event: Event): number {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value) {
      const number = parseInt(value);
      input.value = number.toLocaleString('vi-VN');
      return number;
    }
    return 0;
  }
} 
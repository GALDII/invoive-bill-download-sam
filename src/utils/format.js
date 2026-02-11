/**
 * Converts a number to words (helper function for parts less than 1000)
 */
const convertBelowThousand = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return '';

    let words = '';

    if (num >= 100) {
        words += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
    }

    if (num >= 20) {
        words += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
    } else if (num >= 10) {
        words += teens[num - 10] + ' ';
        return words.trim();
    }

    if (num > 0) {
        words += ones[num] + ' ';
    }

    return words.trim();
};

/**
 * Helper function for converting rupees part (without "Rupees Only" suffix)
 */
const convertAmountToWordsHelper = (num) => {
    if (num === 0) return '';

    let words = '';

    // Handle Lakhs (100,000)
    if (num >= 100000) {
        words += convertBelowThousand(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }

    // Handle Thousands (1,000)
    if (num >= 1000) {
        words += convertBelowThousand(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }

    // Handle remaining (0-999)
    if (num > 0) {
        words += convertBelowThousand(num);
    }

    return words.trim();
};

/**
 * Converts a number to Indian words format with proper handling of decimals
 * Example: 18427.50 -> "Eighteen Thousand Four Hundred Twenty Seven Rupees and Fifty Paise Only"
 */
export const convertAmountToWords = (amount) => {
    if (amount === 0) return 'Zero Rupees Only';

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let words = '';

    // Handle Crores (10,000,000)
    if (rupees >= 10000000) {
        words += convertBelowThousand(Math.floor(rupees / 10000000)) + ' Crore ';
        const remainder = rupees % 10000000;
        if (remainder > 0) {
            words += convertAmountToWordsHelper(remainder);
        }
    } else {
        words = convertAmountToWordsHelper(rupees);
    }

    words = words.trim() + ' Rupees';

    // Add paise if present
    if (paise > 0) {
        words += ' and ' + convertBelowThousand(paise) + ' Paise';
    }

    words += ' Only';

    return words;
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

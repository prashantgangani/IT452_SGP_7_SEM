import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (value) => {
    if (!value) return 'N/A';

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
};

export const downloadInvoicePDF = (invoice) => {
    if (!invoice?.id) {
        throw new Error('An invoice ID is required to generate the PDF.');
    }

    const document = new jsPDF();
    const invoiceId = String(invoice.id);

    document.setFontSize(20);
    document.text('Invoice Details', 14, 20);
    document.setFontSize(10);
    document.setTextColor(100);
    document.text(`Invoice #${invoiceId}`, 14, 28);

    autoTable(document, {
        startY: 36,
        theme: 'grid',
        head: [['Field', 'Value']],
        body: [
            ['MSME Name', invoice.msmeName || 'N/A'],
            ['Buyer GSTIN', invoice.buyerGstin || 'N/A'],
            ['Amount (INR)', Number(invoice.amount || 0).toLocaleString()],
            ['Status', invoice.status || 'N/A'],
            ['Due Date', formatDate(invoice.dueDate)],
            ['Credit Score', invoice.creditScore ?? 'N/A'],
            ['Risk Level', invoice.riskLevel || 'N/A'],
            ['Fraud Score', invoice.fraudScore ?? 'N/A'],
            ['Expected Return', invoice.expectedReturn ? `${invoice.expectedReturn}%` : 'N/A'],
        ],
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: { 0: { cellWidth: 52 } },
    });

    const safeInvoiceId = invoiceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    document.save(`invoice-${safeInvoiceId}.pdf`);
};

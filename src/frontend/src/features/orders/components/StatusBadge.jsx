// Color-coded badge for the 7 OrderStatus values. data-testid set per status.

const COLORS = {
    PENDING:    { bg: '#fef3c7', fg: '#92400e' },
    CONFIRMED:  { bg: '#dbeafe', fg: '#1e40af' },
    PROCESSING: { bg: '#e0e7ff', fg: '#3730a3' },
    SHIPPED:    { bg: '#bae6fd', fg: '#075985' },
    DELIVERED:  { bg: '#bbf7d0', fg: '#14532d' },
    CANCELLED:  { bg: '#fee2e2', fg: '#7f1d1d' },
    REFUNDED:   { bg: '#f3f4f6', fg: '#374151' },
};

export default function StatusBadge({ status }) {
    const { bg, fg } = COLORS[status] || COLORS.REFUNDED;
    return (
        <span
            className="status-badge"
            style={{ backgroundColor: bg, color: fg }}
            data-testid={`status-${status}`}
        >
            {status}
        </span>
    );
}

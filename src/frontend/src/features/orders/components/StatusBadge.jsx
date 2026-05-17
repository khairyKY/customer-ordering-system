// Color-coded badge for the 7 OrderStatus values. data-testid preserved per status.

const TONE = {
    PENDING:    'bg-amber-100  text-amber-800',
    CONFIRMED:  'bg-blue-100   text-blue-800',
    PROCESSING: 'bg-indigo-100 text-indigo-800',
    SHIPPED:    'bg-sky-100    text-sky-800',
    DELIVERED:  'bg-green-100  text-green-800',
    CANCELLED:  'bg-red-100    text-red-800',
    REFUNDED:   'bg-gray-100   text-gray-800',
};

export default function StatusBadge({ status }) {
    const tone = TONE[status] || TONE.REFUNDED;
    return (
        <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${tone}`}
            data-testid={`status-${status}`}
        >
            {status}
        </span>
    );
}

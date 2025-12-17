import { STAGE_NAMES } from '../../utils/constants';

const StatusBadge = ({ stage }) => {
    const getStatusColor = () => {
        switch (stage) {
            case 'completed':
                return 'badge-completed';
            case 'digital_marketer':
            case 'designer':
                return 'badge-pending';
            default:
                return 'badge-pending';
        }
    };

    return (
        <span className={`badge ${getStatusColor()}`}>
            {STAGE_NAMES[stage] || stage}
        </span>
    );
};

export default StatusBadge;

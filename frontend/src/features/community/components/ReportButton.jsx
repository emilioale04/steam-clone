import { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportModal from './ReportModal';

export default function ReportButton({ 
    targetId, 
    targetType, 
    groupId = null,
    targetTitle = null,
    variant = 'button' // 'button' | 'icon'
}) {
    const [showReportModal, setShowReportModal] = useState(false);

    if (variant === 'icon') {
        return (
            <>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 hover:bg-yellow-500/10 rounded transition-colors"
                    title="Reportar"
                >
                    <Flag size={18} className="text-yellow-400" />
                </button>
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    targetId={targetId}
                    targetType={targetType}
                    groupId={groupId}
                    targetTitle={targetTitle}
                />
            </>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors font-semibold"
            >
                <Flag size={18} />
                <span>Reportar</span>
            </button>
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetId={targetId}
                targetType={targetType}
                groupId={groupId}
                targetTitle={targetTitle}
            />
        </>
    );
}

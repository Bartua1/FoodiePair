import { PairStats } from '../stats/PairStats';

interface StatsViewProps {
    pairId: string;
}

export function StatsView({ pairId }: StatsViewProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 pb-32">
            <PairStats pairId={pairId} />
        </div>
    );
}

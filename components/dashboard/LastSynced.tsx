"use client";

import { useEffect, useState } from "react";

export function LastSynced({ timestamp }: { timestamp: Date | null }) {
    const [timeAgo, setTimeAgo] = useState<string>("");

    useEffect(() => {
        if (!timestamp) {
            setTimeAgo("Never");
            return;
        }

        const updateTime = () => {
            const now = new Date();
            const diffMs = now.getTime() - new Date(timestamp).getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) {
                setTimeAgo("Just now");
            } else if (diffMins === 1) {
                setTimeAgo("1 minute ago");
            } else {
                setTimeAgo(`${diffMins} minutes ago`);
            }
        };

        updateTime();
        // Update the text every minute locally
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, [timestamp]);

    if (!timestamp) return null;

    return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Last synced: {timeAgo}
        </div>
    );
}

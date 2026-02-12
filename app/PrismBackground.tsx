"use client";

import Prism from "@/components/Prism";

export default function PrismBackground() {
    return (
        <Prism
            animationType="rotate"
            noise={0}
            glow={0.8}
            bloom={0.8}
            timeScale={0.3}
        />
    );
}

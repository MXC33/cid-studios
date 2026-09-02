"use client";

import React from "react";
import { BatchQueueHUD } from "@/components/queue/BatchQueueHUD";

export default function BatchQueuePage() {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      <BatchQueueHUD />
    </div>
  );
}

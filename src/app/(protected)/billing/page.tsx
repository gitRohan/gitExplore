'use client'

import { api } from "~/trpc/react"

const BillingPage=()=>{
    const {data:user}=api.project.getMyCredits.useQuery()
    return(
        <div>
            <h1 className="text-xl font-semibold">Billing</h1>
            <div className="h-2"/>
            <p className="text-sm text-gray-500">
                You currently have {user?.credits} credits.
            </p>
        </div>
    )
}

export default BillingPage;
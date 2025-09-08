'use client'
import useProject from "~/hooks/use-project";
import { api } from "~/trpc/react";
import MeetingCard from "../dashboard/meeting-card";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

const MeetingPage=()=>{
    const {projectId} = useProject();
const { data: meetings, isLoading } = api.project.getMeeting.useQuery(
  { projectId },
  {
    refetchInterval: 4000,
    enabled: !!projectId, // Only run the query if projectId is truthy
  }
);
    return(
        <div>
            <MeetingCard/>
            <div className="h-6"/>
            <h1 className="text-xl font-semibold">Meetings</h1>
            {meetings&&meetings.length===0 && <div>No meetings found</div>}
            
            <ul className="divide-y divide-gray-200">
                {meetings?.map(meeting=>(
                    <li key={meeting.id} className="flex items-center justify-between py-5 gap-x-6">
                        <div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Link href={`/meetings/${meeting.id}`} className="text-sm font-semibold">
                                        {meeting.name}
                                    </Link>
                                    {meeting.status==='PROCESSING' && (
                                        <Badge className="bg-yellow-500 text-white">
                                            Processing...
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 gap-x-2"> 
                              <p className="whitespace-nowrap">
                                {meeting.createdAt.toLocaleDateString()}
                              </p>
                              <p className="truncate">{meeting.issue.length} issues</p>
                            </div>
                        </div>
                        <div className="flex items-center flex-none gap-x-4">
                             <Link href={`/meetings/${meeting.id}`}>
                               <Button variant='outline'>
                                    View Meeting
                               </Button>
                             </Link>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default MeetingPage;
'use client'

import { Bot, CreditCard, LayoutDashboard, Plus, Presentation } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { buttonVariants } from "~/components/ui/button"
import { Collapsible } from "~/components/ui/collapsible"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from "~/components/ui/sidebar"
import useProject from "~/hooks/use-project"
import { cn } from "~/lib/utils"

export function AppSidebar(){
    const items=[
        {
            title:"Dashboard",
            url:"/dashboard",
            icon:LayoutDashboard,
        },
        {
            title:"Q&A",
            url:"/qa",
            icon:Bot,
        },
        {
            title:"Meetings",
            url:"/meetins",
            icon:Presentation
        },
        {
            title:"Billing",
            url:"/billing",
            icon:CreditCard
        }
    ]
   
    const pathName=usePathname()
    const {open} = useSidebar()
    const {projects,projectId,setProjectId}=useProject()
    return(
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Image src='/logo.png' alt="logo" height={40} width={40}/>
                    {open &&(
                    <h1 className="text-xl font-bold text-primary/80">GitExplore</h1>
                    )}
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Application
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map(item=>{
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className={cn({
                                                '!bg-primary !text-white':pathName===item.url
                                            })}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Your Projects
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {
                                projects?.map(project=>{
                                    return(
                                        <SidebarMenuItem key={project.name}>
                                            <SidebarMenuButton asChild>
                                                <div onClick={()=>{setProjectId(project.id)}}>
                                                    <div className={cn('rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary',
                                                    {
                                                        'bg-primary text-white':project.id===projectId
                                                    }
                                                    )}>
                                                         {project.name[0]}
                                                    </div>
                                                    {open&&(
                                                    <span>{project.name}</span>
                                                    )}
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })
                            }
                            <div className="h-2"/>
                            <SidebarMenuItem>
                                <Link href='/create' className={buttonVariants({variant:'outline'})}>
                                    <Plus/>
                                    {open&&(
                                    <h1>Create Project</h1>
                                    )}
                                </Link>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
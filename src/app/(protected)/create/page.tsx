'use client'

import Image from "next/image"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import useRefetch from "~/hooks/use-refetch"
import { api } from "~/trpc/react"


type FormInput={
    reportUrl:string
    projectName:string
    githubToken?:string
}

const CreatePage=()=>{
    const {register,handleSubmit,reset}=useForm<FormInput>()
    const createProject=api.project.createProject.useMutation()
    const refetch=useRefetch()

    function onSubmit(data:FormInput){
        createProject.mutate({
            githubUrl:data.reportUrl,
            name:data.projectName,
            githubToken:data.githubToken
        },{
            onSuccess:()=>{
                toast.success('Project created successfully')
                refetch()
                reset()
            },
            onError:()=>{
                toast.error('Failed to create project')
            }
        })
        return true
    }
    return(
        <div className="flex items-center gap-12 h-full justify-center">
            <Image src='/gitexplore.svg' className="h-56 w-auto" alt='gitexplore add project' width={56} height={56}/>
            <div>
                <div>
                    <h1 className="font-semibold text-2xl">
                        Link your Github Repository
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the URL of your repository to link it to GitExplore
                    </p>
                </div>
                <div className="h-4"/>
                <div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Input {...register('projectName',{required:true})} placeholder="Project Name" required/>
                        <div className="h-2"/>
                        <Input {...register('reportUrl',{required:true})} placeholder="Github URL" type='url' required/>
                        <div className="h-2"/>
                        <Input {...register('githubToken')} placeholder="Github Token (Optional)"/>
                        <div className="h-4"/>
                        <Button type="submit" disabled={createProject.isPending}>
                            Create Project
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default CreatePage;
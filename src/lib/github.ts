import { Octokit} from "octokit";
import { db } from "~/server/db";
import { aisummarizeCommit } from "./gemini";

export const octakit=new Octokit({
    auth:process.env.GITHUB_TOKEN
})

export async function getDefaultBranch(githubUrl: string) {
    const [owner, repo] = githubUrl.split('/').slice(-2);
    if(!owner || !repo){
        throw new Error("Invalid github url")
    }
    const { data } = await octakit.rest.repos.get({ owner, repo });
    return data.default_branch;
}
type Response={
    commitHash:string;
    commitMessage:string;
    commitAuthorName:string;
    commitAuthorAvatar:string;
    commitDate:string;
}

export const getCommitHashes=async (githubUrl:string):Promise<Response[]>=>{
    const [owner,repo]=githubUrl.split('/').slice(-2)
    if(!owner || !repo){
        throw new Error("Invalid github url")
    }
    const {data}=await octakit.rest.repos.listCommits({
        owner,
        repo
    })
    const sortedCommits=data.sort((a:any,b:any)=> new Date(b.commit.author.date).getTime()-new Date(a.commit.author.date).getTime()) as any[]

    return sortedCommits.slice(0,5).map((commit:any)=>({
        commitHash:commit.sha as string,
        commitMessage:commit.commit.message ?? "",
        commitAuthorName:commit.commit?.author?.name??"",
        commitAuthorAvatar:commit?.author?.avatar_url??"",
        commitDate:commit.commit.author.date ??""
    }))
}

export const pollCommits=async (projectId:string)=>{
    const {project,githubUrl}=await fetchProjectGithubUrl(projectId)
    const commitHashes=await getCommitHashes(githubUrl)
    const unprocessedCommits=await filterUnprocessedCommits(projectId,commitHashes)
    const summaryResponses=await Promise.allSettled(unprocessedCommits.map(commit=>{
        return summarizeCommit(githubUrl,commit.commitHash)
    }))
    const summaries=summaryResponses.map((response)=>{
        if(response.status==='fulfilled'){
            return response.value as string
        }
        return ""
    })
    const commits = await db.commit.createMany({
        data:summaries.map((summary,index)=>{
            return {
                projectId:projectId,
                commitHash:unprocessedCommits[index]!.commitHash,
                commitMessage:unprocessedCommits[index]!.commitMessage,
                commitAuthorName:unprocessedCommits[index]!.commitAuthorName,
                commitAuthorAvatar:unprocessedCommits[index]!.commitAuthorAvatar,
                commitDate:unprocessedCommits[index]!.commitDate,
                Summary: summary
            }
        })
    })
    return commits
}

async function summarizeCommit(githubUrl:string,commitHash:string){
    const response = await fetch(`${githubUrl}/commits/${commitHash}`, { method: 'GET', headers: { 'Accept': 'application/vnd.github.v3.diff','Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } });
    const data = await response.text();
    return await aisummarizeCommit(data) || "";
}

async function fetchProjectGithubUrl(projectId:string){
    const project=await db.project.findUnique({
        where:{id:projectId},
        select:{
            githubUrl:true
        }
    })
    if(!project?.githubUrl){
        throw new Error("Project has no github url")
    }
    return {project,githubUrl:project.githubUrl}
}

async function filterUnprocessedCommits(projectId:string,commitHashes:Response[]){
    const processedCommits=await db.commit.findMany({
        where:{projectId}
    })
    const unprocessedCommits = commitHashes.filter((commit)=>!processedCommits.some((processedCommits)=>processedCommits.commitHash===commit.commitHash))

    return unprocessedCommits
}
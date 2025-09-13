import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'
import type { Document } from '@langchain/core/documents'
import { generateEmbedding, summarizeCode } from './gemini'
import { db } from '~/server/db'
import { getDefaultBranch } from './github'
import { Octokit } from 'octokit'
import { count, dir } from 'console'

const getFileCount=async(path:string,octokit:Octokit,githubOwner:string,githubRepo:string,acc:number=0)=>{
    const {data}=await octokit.rest.repos.getContent({
        owner:githubOwner,
        repo:githubRepo,
        path
    })
    if(!Array.isArray(data)&&data.type=='file'){
        return acc+1
    }
    if(Array.isArray(data)){
        let fileCount=0
        const directories:string[]=[]
        for(const item of data){
            if(item.type==='dir'){
                directories.push(item.path)
            }else{
                fileCount++;
            }
        }
        if(directories.length>0){
            const directoryCounts=await Promise.all(
                directories.map(dirPath=>getFileCount(dirPath,octokit,githubOwner,githubRepo,0))
            )
            fileCount+=directoryCounts.reduce((acc:number,count):number=>acc+count,0);
        }
        return acc+fileCount
    }
    return acc
}

export const checkCredits=async (githubUrl:string,githubToken?:string)=>{
    const octokit=new Octokit({auth:githubToken})
    const githubOwner=githubUrl.split('/')[3]
    const githubRepo=githubUrl.split('/')[4]
    if(!githubOwner||!githubRepo){
        return 0;
    }
    const fileCount=await getFileCount('',octokit,githubOwner,githubRepo,0)
    return fileCount;
}

export const loadGithubRepo=async(githubUrl:string,githubToken?:string)=>{
    const defaultBranch=await getDefaultBranch(githubUrl)
    const loader = new GithubRepoLoader(githubUrl,{
        accessToken:githubToken||process.env.GITHUB_TOKEN||'',
        branch:defaultBranch, // You might want to fetch the default branch dynamically
        ignoreFiles:['package-lock.json','yarn.lock','pnpm-lock.yaml','bun.lockb','.gitignore','.gitattributes','README.md','LICENSE','LICENSE.md','docs','.github','.vscode','node_modules','.idea','dist','build','.next','out','coverage','.turbo','env.local','.env','.env.production','env.example','requirements.txt',],
        recursive:true,
        unknown:'warn',
    })
    const docs=await loader.load()
    return docs
}

export const indexGithubRepo=async(projectId:string,githubUrl:string,githubToken?:string)=>{
    const docs=await loadGithubRepo(githubUrl,githubToken)
    const allEmbeddings=await generateEmbeddings(docs)
    await Promise.allSettled(allEmbeddings.map(async (embedding,index)=>{
        if(!embedding) return

        const sourceCodeEmbedding=await db.sourceCodeEmbedding.create({
            data:{
                sourceCode:embedding.sourceCode,
                fileName:embedding.fileName,
                projectId,
            }
        })
        console.log(sourceCodeEmbedding)
        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding"=${embedding.embedding}::vector
        WHERE "id"=${sourceCodeEmbedding.id}`
    }))
}

const generateEmbeddings=async (docs:Document[])=>{
    return await Promise.all(docs.map(async doc=>{
        const embedding=await generateEmbedding(JSON.parse(JSON.stringify(doc.pageContent)).slice(0,10000))
        return {
            embedding,
            sourceCode:JSON.parse(JSON.stringify(doc.pageContent)),
            fileName:doc.metadata.source
        }
    }))
}
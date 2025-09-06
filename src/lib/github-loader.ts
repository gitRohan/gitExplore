import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'
import type { Document } from '@langchain/core/documents'
import { generateEmbedding, summarizeCode } from './gemini'
import { db } from '~/server/db'
import { getDefaultBranch } from './github'

export const loadGithubRepo=async(githubUrl:string,githubToken?:string)=>{
    const defaultBranch=await getDefaultBranch(githubUrl)
    const loader = new GithubRepoLoader(githubUrl,{
        accessToken:githubToken||process.env.GITHUB_TOKEN||'',
        branch:defaultBranch, // You might want to fetch the default branch dynamically
        ignoreFiles:['package-lock.json','yarn.lock','pnpm-lock.yaml','bun.lockb'],
        recursive:true,
        unknown:'warn',
        maxConcurrency:5
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
                summary:embedding.summary,
                sourceCode:embedding.sourceCode,
                fileName:embedding.fileName,
                projectId,
            }
        })

        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding"=${embedding.embedding}::vector
        WHERE "id"=${sourceCodeEmbedding.id}`
    }))
}

const generateEmbeddings=async (docs:Document[])=>{
    return await Promise.all(docs.map(async doc=>{
        const summary=await summarizeCode(doc)
        const embedding=await generateEmbedding(summary)
        return {
            summary,
            embedding,
            sourceCode:JSON.parse(JSON.stringify(doc.pageContent)),
            fileName:doc.metadata.source
        }
    }))
}
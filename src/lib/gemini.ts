import {GoogleGenerativeAI} from '@google/generative-ai';
import type { Document } from '@langchain/core/documents';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model1=genAI.getGenerativeModel({
    model:"gemini-2.0-flash-lite"
})

export const aisummarizeCommit = async(diff:string)=>{
    const response=await model1.generateContent([
        `You are an expert programmer, and you are trying to summarize a git diff.`,
        
        `Please summarize in short the following diff file \n\n${diff} `
    ]);
    return response.response.text();
}
const model=genAI.getGenerativeModel({
    model:"gemini-1.5-flash-lite"
})
export async function summarizeCode(doc:Document){
    try{
        const code = doc.pageContent.slice(0,10000)
    const response=await model.generateContent([
        `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects.`,
        `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file 
        Here is the code:
        ---
        ${code}
        ---
        Give a summary no more than 100 words of the code above`,
    ])
    return response.response.text();
    }catch(error){
        return ""
    }
    
}

export async function generateEmbedding(summary:string){
    const model=genAI.getGenerativeModel({
        model:"text-embedding-004"
    })
    const result=await model.embedContent(summary)
    const embedding=result.embedding
    return embedding.values
}

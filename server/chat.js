import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";


// change default filePath to any file path
const chat = async (filePath = "./uploads/hbs-lean-startup.pdf", query) => {
    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;

    // Step 1: load data
    const loader = new PDFLoader(filePath);
    const data = await loader.load();

    // Step 2: split data
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,         // in terms of number of chars, use overlap to fix context chunk
        chunkOverlap: 0,
    })

    const splitDocs = await textSplitter.splitDocuments(data);

    // Step 3: create vector store
    const embeddings = new OpenAIEmbeddings(apiKey ? { apiKey } : {});

    const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
    );

    // Step 4: create retriever
    // const relevantDocs = await vectorStore.similaritySearch(
    //     "what is task decomposition?"
    // )

    // Step 5: qa w/ customize the prompt
    const model = new ChatOpenAI({
        model: "gpt-5",
        ...(apiKey && { apiKey }),
    });

    const template = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.

{context}
Question: {question}
Helpful Answer:`;

    const prompt = PromptTemplate.fromTemplate(template);

    // use retriever to get relevant documents
    const retriever = vectorStore.asRetriever();
    const relevantDocs = await retriever.invoke(query);

    // Format context from retrieved documents
    const context = relevantDocs.map((doc) => doc.pageConent).join("\n\n");

    // Create a simple chain using the prompt template
    const formattedPrompt = await prompt.format({
        context,
        question: query,
    })

    // Get response from the model
    const response = await model.invoke(formattedPrompt);

    return { text: response.content };
}

export default chat;
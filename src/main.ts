import { OpenAI } from "openai";
import { WebCrawlerTool } from "./webCrawler.js";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { UnconstrainedMemory } from "bee-agent-framework/memory/unconstrainedMemory";
import { OpenAIChatLLM } from "bee-agent-framework/adapters/openai/chat";
import { GroqChatLLM } from "bee-agent-framework/adapters/groq/chat";

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || "http://localhost:8080/v1",
  apiKey: process.env.LLM_API_KEY || "sk-key"
});

const llm = new GroqChatLLM({
  modelId: process.env.LLM_MODEL_ID,
  //client,
  parameters: {
    temperature: 0,
    top_p: 1,
  },
  executionOptions: {
    maxRetries: 3  // Add retries for the LLM
  }
});

// Create web crawler tool
const webCrawler = new WebCrawlerTool({
  retryOptions: {
    maxRetries: 3  // Add retries for web requests
  }
});

// Create the agent
const agent = new BeeAgent({
  llm,
  tools: [webCrawler],
  memory: new UnconstrainedMemory(),
  meta: {
    name: "HackerNewsSummary",
    description: "An agent that retrieves and summarizes top news from Hacker News"
  }
});

async function getTopStorySummary() {
  try {
    // Get the HN page using the WebCrawlerTool
    const mainPageResult = await agent.run({
      prompt: "Go to https://news.ycombinator.com/ and get me the content of the top news item (the first item in the list). Format it clearly with the title, URL, and points/comments info.",
      execution: {
        maxRetries: 3,  // Add retries for the agent execution
        maxIterations: 5  // Allow multiple iterations if needed
      }
    });

    if (!mainPageResult?.result?.text) {
      throw new Error("Failed to fetch Hacker News front page");
    }

    // Get a clear summary using the agent
    const summary = await agent.run({
      prompt: `Here's the top Hacker News story: "${mainPageResult.result.text}". Give me a clear, concise summary of this submission's title, metadata, content, and some comments. Format it nicely.`,
      execution: {
        maxRetries: 3,
        maxIterations: 3
      }
    });

    return summary.result.text;
  } catch (error) {
    console.error("Error:", error);
    if (error.errors) {
      console.error("Detailed errors:", error.errors);
    }
    throw error;
  }
}

// Run the agent
getTopStorySummary()
  .then(summary => {
    console.log("\nSummary:");
    console.log(summary);
  })
  .catch(error => {
    console.error("Failed to get summary:", error);
    process.exit(1);
  });

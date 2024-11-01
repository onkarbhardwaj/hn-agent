import { JSONToolOutput, Tool, ToolInput } from "bee-agent-framework/tools/base"
import { z } from "zod";
import { stripHtml } from "string-strip-html";

interface CrawlerOutput {
  url: string;
  statusCode: number;
  statusText: string;
  contentType: string;
  content: string;
}

export class WebCrawlerToolOutput extends JSONToolOutput<CrawlerOutput> {
  getTextContent(): string {
    return [
      `URL: ${this.result.url}`,
      `STATUS: ${this.result.statusCode} (${this.result.statusText})`,
      `CONTENT: ${this.result.content}`
    ].join("\n");
  }
}

export class WebCrawlerTool extends Tool<WebCrawlerToolOutput> {
  name = "WebCrawler";
  description = "Retrieves content from a given URL";

  inputSchema() {
    return z.object({
      url: z.string().url().describe("Website URL"),
    });
  }

  protected async _run({ url }: ToolInput<this>): Promise<WebCrawlerToolOutput> {
    const response = await fetch(url);
    const text = await response.text();
    const content = stripHtml(text).result;

    return new WebCrawlerToolOutput({
      url,
      statusCode: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type") ?? "unknown",
      content,
    });
  }
}

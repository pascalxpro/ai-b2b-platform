import google from 'googlethis';
import { prisma } from '@/lib/db/prisma';

export async function executeSearchTask(taskId: string) {
  try {
    const task = await prisma.searchTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    // Update status to RUNNING
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'RUNNING' }
    });

    // Build the query
    const keywords = (task.criteria as any)?.keywords?.join(' ') || '';
    const query = `${task.queryText} ${keywords}`.trim();

    // Configure search options
    const options = {
      page: 0,
      safe: false,
      additional_params: {
        hl: 'zh-TW',
      }
    };

    // Perform the search
    const response = await google.search(query, options);

    // Save results
    let savedCount = 0;
    const targetCount = Math.min((task.criteria as any)?.targetCount || 10, response.results.length);

    for (let i = 0; i < targetCount; i++) {
      const result = response.results[i];
      if (!result.url || !result.title) continue;

      // Extract a plausible company name from title
      let companyName = result.title.split('-')[0].split('|')[0].trim();
      if (companyName.length > 50) companyName = companyName.substring(0, 50);

      // Check if it already exists to avoid duplicates
      const existing = await prisma.searchResult.findFirst({
        where: { searchTaskId: taskId, website: result.url }
      });

      if (!existing) {
        await prisma.searchResult.create({
          data: {
            searchTaskId: taskId,
            workspaceId: task.workspaceId,
            companyName: companyName,
            website: result.url,
            country: 'Unknown', // Need more advanced scraping/AI to determine
            sourceCount: 1,
            qualityStatus: 'NEW',
            conversionStatus: 'NONE',
            scoreJson: { 
              title: result.title,
              description: result.description 
            } // Storing raw snippet here temporarily for background research
          }
        });
        savedCount++;
      }
    }

    // Update status to COMPLETED
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED' }
    });

    console.log(`Task ${taskId} completed. Saved ${savedCount} results.`);
  } catch (error) {
    console.error(`Error executing search task ${taskId}:`, error);
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'FAILED' }
    });
  }
}

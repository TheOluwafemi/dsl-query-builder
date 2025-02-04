import { OpenSearchClient } from './config'

export async function search(client: OpenSearchClient, query: any) {
  const config = client.getConfig()

  if (!query || Object.keys(query).length === 0) {
    throw new Error('Search Error: Query object cannot be empty.')
  }

  try {
    const response = await fetch(`${config.endpoint}/${config.index}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    })

    if (!response.ok) {
      throw new Error(`Search Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    throw new Error(`Search Request Failed: ${error.message}`)
  }
}

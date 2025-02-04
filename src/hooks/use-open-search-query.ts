import { search } from '../client'
import { OpenSearchClient } from '../config'

export async function useOpenSearchQuery(
  client: OpenSearchClient,
  query: any,
  onUpdate: (results: any, error: string | null, loading: boolean) => void
) {
  if (!client) {
    throw new Error(
      'useOpenSearchQuery Error: OpenSearchClient instance is required.'
    )
  }

  try {
    onUpdate(null, null, true)
    const results = await search(client, query)
    onUpdate(results, null, false)
  } catch (error) {
    onUpdate(null, error.message, false)
  }
}

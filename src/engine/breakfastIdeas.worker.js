import { breakfastIdeas } from './breakfastIdeas'
self.onmessage = ({ data }) => {
  try { self.postMessage({ ideas: breakfastIdeas(data) }) }
  catch (error) { self.postMessage({ error: String(error?.message ?? error) }) }
}

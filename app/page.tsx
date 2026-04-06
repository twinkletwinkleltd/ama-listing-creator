import fs from 'fs'
import path from 'path'
import ListingsClient from './components/ListingsClient'

export default function Home() {
  const dataDir = path.join(process.cwd(), 'data')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listings: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let styles: any[] = []

  try {
    listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'))
    styles   = JSON.parse(fs.readFileSync(path.join(dataDir, 'styles.json'),   'utf-8'))
  } catch (e) {
    console.error('Failed to read data files:', e)
  }

  return <ListingsClient listings={listings} styles={styles} />
}
